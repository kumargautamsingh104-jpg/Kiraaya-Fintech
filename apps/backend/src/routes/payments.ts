import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { db } from '../lib/db';
import { withAuth, AuthenticatedRequest } from '../middleware/auth';
import { logEvent } from '../middleware/consent';

// ─────────────────────────────────────────────
// POST /api/v1/payments/cash/log
// ─────────────────────────────────────────────

const cashLogSchema = z.object({
  tenancyId: z.string().uuid(),
  amountPaise: z.number().int().positive(),
  receiptUrl: z.string().url().optional(),
  notes: z.string().optional(),
});

export async function logCashPayment(req: NextRequest): Promise<NextResponse> {
  return withAuth(req, async (authed: AuthenticatedRequest) => {
    const body = cashLogSchema.safeParse(await req.json());
    if (!body.success) {
      return NextResponse.json({ success: false, error: 'Invalid input' }, { status: 400 });
    }

    const { tenancyId, amountPaise, receiptUrl, notes } = body.data;

    const tenancy = await db.tenancy.findUnique({ where: { id: tenancyId } });
    if (!tenancy || tenancy.landlordId !== authed.userId) {
      return NextResponse.json({ success: false, error: 'Tenancy not found' }, { status: 404 });
    }

    const payment = await db.rentPayment.create({
      data: {
        tenancyId,
        tenantId: tenancy.tenantId,
        landlordId: tenancy.landlordId,
        amountPaise,
        method: 'cash',
        status: 'paid',
        receiptUrl: receiptUrl ?? null,
        notes: notes ?? null,
        paidAt: new Date(),
      },
    });

    await logEvent({
      entityType: 'rent_payment',
      entityId: payment.id,
      actorId: authed.userId,
      actorRole: authed.userRole,
      action: 'payment.cash_logged',
    });

    return NextResponse.json({ success: true, data: payment });
  }, ['landlord']);
}

// ─────────────────────────────────────────────
// POST /api/v1/payments/collect/initiate
// ─────────────────────────────────────────────

const collectSchema = z.object({
  tenancyId: z.string().uuid(),
  amountPaise: z.number().int().positive(),
});

export async function initiateCollect(req: NextRequest): Promise<NextResponse> {
  return withAuth(req, async (authed: AuthenticatedRequest) => {
    const body = collectSchema.safeParse(await req.json());
    if (!body.success) {
      return NextResponse.json({ success: false, error: 'Invalid input' }, { status: 400 });
    }

    const { tenancyId, amountPaise } = body.data;

    const tenancy = await db.tenancy.findUnique({ where: { id: tenancyId } });
    if (!tenancy) {
      return NextResponse.json({ success: false, error: 'Tenancy not found' }, { status: 404 });
    }

    // Initiate Razorpay UPI Collect
    const Razorpay = (await import('razorpay')).default;
    const razorpay = new Razorpay({
      key_id: process.env.RAZORPAY_KEY_ID!,
      key_secret: process.env.RAZORPAY_KEY_SECRET!,
    });

    const order = await razorpay.orders.create({
      amount: amountPaise,
      currency: 'INR',
      receipt: `rent-${tenancyId}-${Date.now()}`,
    });

    return NextResponse.json({ success: true, data: { orderId: order.id, status: order.status } });
  }, ['tenant', 'landlord']);
}

// ─────────────────────────────────────────────
// POST /api/v1/payments/webhooks/razorpay
// ─────────────────────────────────────────────

export async function razorpayWebhook(req: NextRequest): Promise<NextResponse> {
  const signature = req.headers.get('x-razorpay-signature') ?? '';
  const rawBody = await req.text();

  const crypto = await import('crypto');
  const expectedSig = crypto
    .createHmac('sha256', process.env.RAZORPAY_WEBHOOK_SECRET!)
    .update(rawBody)
    .digest('hex');

  if (signature !== expectedSig) {
    return NextResponse.json({ success: false, error: 'Invalid signature' }, { status: 400 });
  }

  const payload = JSON.parse(rawBody);
  const event = payload.event;

  if (event === 'payment.captured') {
    const razorpayPaymentId = payload.payload.payment.entity.id;
    await db.rentPayment.updateMany({
      where: { razorpayPaymentId },
      data: { status: 'paid', paidAt: new Date() },
    });
  }

  return NextResponse.json({ success: true });
}
