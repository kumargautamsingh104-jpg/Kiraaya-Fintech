import { db } from '../../lib/db';
import { logEvent } from '../../middleware/consent';
import crypto from 'node:crypto';
import Razorpay from 'razorpay';

export class PaymentService {
  async logCash(tenancyId: string, landlordId: string, amountPaise: number, receiptUrl?: string, notes?: string) {
    const tenancy = await db.tenancy.findUnique({ where: { id: tenancyId } });
    if (!tenancy || tenancy.landlordId !== landlordId) throw new Error('Tenancy not found or access denied');

    const payment = await db.rentPayment.create({
      data: {
        tenancyId,
        tenantId: tenancy.tenantId,
        landlordId: tenancy.landlordId,
        periodMonth: new Date().getMonth() + 1,
        periodYear: new Date().getFullYear(),
        amountPaise,
        method: 'cash',
        status: 'paid',
        receiptUrl: receiptUrl ?? null,
        notes: notes ?? null,
        paidAt: new Date(),
        // PRD RULE: Cash payments get Landlord Confirmed true, AA Verified false
        landlordConfirmed: true,
        aaVerified: false,
        verificationScore: 60, // Limited weight
        dueDate: tenancy.moveInDate, // Simplified for MVP
      },
    });

    await logEvent({
      entityType: 'rent_payment',
      entityId: payment.id,
      actorId: landlordId,
      actorRole: 'landlord',
      action: 'payment.cash_logged',
    });

    return payment;
  }

  async initiateUPICollect(tenancyId: string, amountPaise: number) {
    const tenancy = await db.tenancy.findUnique({ where: { id: tenancyId } });
    if (!tenancy) throw new Error('Tenancy not found');

    const razorpay = new Razorpay({
      key_id: process.env.RAZORPAY_KEY_ID || 'rzp_test_mock',
      key_secret: process.env.RAZORPAY_KEY_SECRET || 'mock_secret',
    });

    const order = await razorpay.orders.create({
      amount: amountPaise,
      currency: 'INR',
      receipt: `rent-${tenancyId}-${Date.now()}`,
    });

    return { orderId: order.id, status: order.status };
  }

  async processWebhook(rawBody: string, signature: string) {
    const secret = process.env.RAZORPAY_WEBHOOK_SECRET || 'mock_secret';
    const expectedSig = crypto.createHmac('sha256', secret).update(rawBody).digest('hex');

    if (signature !== expectedSig) throw new Error('Invalid Razorpay signature');

    const payload = JSON.parse(rawBody);
    if (payload.event === 'payment.captured') {
      const razorpayPaymentId = payload.payload.payment.entity.id;
      // PRD RULE: UPI Webhooks are automatically marked paid but AA-verification is separate
      await db.rentPayment.updateMany({
        where: { razorpayPaymentId },
        data: { 
          status: 'paid', 
          paidAt: new Date(),
          landlordConfirmed: true, // Assuming via Kiraaya app automatically confirms for landlord
        },
      });
    }
  }
}

