import { NextRequest, NextResponse } from 'next/server';
import { withAuth, AuthenticatedRequest } from '../middleware/auth';
import { db } from '../lib/db';

// ─────────────────────────────────────────────
// GET /api/v1/score?tenancyId=...
// ─────────────────────────────────────────────

export async function getScore(req: NextRequest): Promise<NextResponse> {
  return withAuth(req, async (authed: AuthenticatedRequest) => {
    const { searchParams } = new URL(req.url);
    const tenancyId = searchParams.get('tenancyId');

    if (!tenancyId) {
      return NextResponse.json({ success: false, error: 'tenancyId is required' }, { status: 400 });
    }

    const tenancy = await db.tenancy.findUnique({
      where: { id: tenancyId },
      include: { payments: true },
    });

    if (!tenancy) {
      return NextResponse.json({ success: false, error: 'Tenancy not found' }, { status: 404 });
    }

    // Check access: only tenant or landlord of this tenancy can view score
    if (tenancy.tenantId !== authed.userId && tenancy.landlordId !== authed.userId) {
      return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });
    }

    const paidPayments = tenancy.payments.filter((p: any) => p.status === 'paid');
    const totalPayments = tenancy.payments.length;
    const onTimeCount = paidPayments.filter((p: any) => {
      if (!p.dueDate || !p.paidAt) return false;
      return p.paidAt <= p.dueDate;
    }).length;

    const score = totalPayments === 0
      ? 0
      : Math.min(100, Math.round((onTimeCount / totalPayments) * 100));

    const tier = score >= 80 ? 'strong' : score >= 60 ? 'moderate' : 'weak';

    return NextResponse.json({
      success: true,
      data: {
        score,
        tier,
        totalPayments,
        onTimePayments: onTimeCount,
        disclaimer: 'This is an internal credit signal for Kiraaya partners only. RBI Regulated Data.',
      },
    });
  }, ['tenant', 'landlord']);
}
