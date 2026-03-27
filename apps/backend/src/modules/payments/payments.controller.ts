import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { PaymentService } from './payments.service';
import { AuthenticatedRequest } from '../../middleware/auth';

const paymentService = new PaymentService();

const cashLogSchema = z.object({
  tenancyId: z.string().uuid(),
  amountPaise: z.number().int().positive(),
  receiptUrl: z.string().url().optional(),
  notes: z.string().optional(),
});

const collectSchema = z.object({
  tenancyId: z.string().uuid(),
  amountPaise: z.number().int().positive(),
});

export class PaymentsController {
  static async logCashPayment(req: NextRequest, authed: AuthenticatedRequest): Promise<NextResponse> {
    try {
      const body = cashLogSchema.safeParse(await req.json());
      if (!body.success) return NextResponse.json({ success: false, error: 'Invalid input' }, { status: 400 });

      const result = await paymentService.logCash(
        body.data.tenancyId,
        authed.userId,
        body.data.amountPaise,
        body.data.receiptUrl,
        body.data.notes
      );
      return NextResponse.json({ success: true, data: result });
    } catch (err: any) {
      if (err.message === 'Tenancy not found or access denied') return NextResponse.json({ success: false, error: err.message }, { status: 404 });
      return NextResponse.json({ success: false, error: 'Server error' }, { status: 500 });
    }
  }

  static async initiateCollect(req: NextRequest, authed: AuthenticatedRequest): Promise<NextResponse> {
    try {
      const body = collectSchema.safeParse(await req.json());
      if (!body.success) return NextResponse.json({ success: false, error: 'Invalid input' }, { status: 400 });

      const result = await paymentService.initiateUPICollect(body.data.tenancyId, body.data.amountPaise);
      return NextResponse.json({ success: true, data: result });
    } catch (err: any) {
      if (err.message === 'Tenancy not found') return NextResponse.json({ success: false, error: err.message }, { status: 404 });
      return NextResponse.json({ success: false, error: 'Server error' }, { status: 500 });
    }
  }

  static async razorpayWebhook(req: NextRequest): Promise<NextResponse> {
    try {
      const signature = req.headers.get('x-razorpay-signature') ?? '';
      const rawBody = await req.text();
      await paymentService.processWebhook(rawBody, signature);
      return NextResponse.json({ success: true });
    } catch (err: any) {
      if (err.message === 'Invalid Razorpay signature') return NextResponse.json({ success: false, error: err.message }, { status: 400 });
      return NextResponse.json({ success: false, error: 'Server error' }, { status: 500 });
    }
  }
}
