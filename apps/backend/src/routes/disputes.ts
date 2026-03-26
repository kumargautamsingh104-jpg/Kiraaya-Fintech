import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { db } from '../lib/db';
import { withAuth, AuthenticatedRequest } from '../middleware/auth';
import { logEvent } from '../middleware/consent';

// ─────────────────────────────────────────────
// POST /api/v1/payments/:id/dispute
// ─────────────────────────────────────────────

const disputeSchema = z.object({
  paymentId: z.string().uuid(),
  notes: z.string().min(10),
});

export async function raiseDispute(req: NextRequest): Promise<NextResponse> {
  return withAuth(req, async (authed: AuthenticatedRequest) => {
    const body = disputeSchema.safeParse(await req.json());
    if (!body.success) return NextResponse.json({ success: false }, { status: 400 });

    const { paymentId, notes } = body.data;

    // Verify payment belongs to user
    const payment = await db.rentPayment.findUnique({
      where: { id: paymentId },
    });

    if (!payment || (payment.tenantId !== authed.userId && payment.landlordId !== authed.userId)) {
      return NextResponse.json({ success: false, error: 'Payment not found' }, { status: 404 });
    }

    const dispute = await db.paymentDispute.create({
      data: {
        paymentId,
        raisedBy: authed.userId,
        resolutionNotes: notes,
        status: 'open',
      },
    });

    // Update payment status
    await db.$executeRaw`SET LOCAL app.bypass_payment_trigger = 'true'`;
    await db.rentPayment.update({
      where: { id: paymentId },
      data: { status: 'disputed' },
    });

    await logEvent({
      entityType: 'payment_dispute',
      entityId: dispute.id,
      actorId: authed.userId,
      actorRole: authed.userRole,
      action: 'dispute.raised',
    });

    return NextResponse.json({ success: true, data: dispute });
  }, ['tenant', 'landlord']);
}
