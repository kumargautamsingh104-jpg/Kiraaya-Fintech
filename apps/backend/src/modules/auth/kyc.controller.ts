import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { withAuth, AuthenticatedRequest } from '../../middleware/auth';
import { verifyPAN, initAadhaarKYC } from '@kiraaya/integrations';
import { db } from '../../lib/db';

// ─────────────────────────────────────────────
// POST /api/v1/kyc/pan/verify
// ─────────────────────────────────────────────

const panSchema = z.object({
  pan: z.string().length(10),
  name: z.string().min(3),
});

export async function verifyPanRoute(req: NextRequest): Promise<NextResponse> {
  return withAuth(req, async (authed: AuthenticatedRequest) => {
    const body = panSchema.safeParse(await req.json());
    if (!body.success) return NextResponse.json({ success: false, error: 'Invalid input' }, { status: 400 });

    const { pan, name } = body.data;
    const result = await verifyPAN(pan, name);

    if (result.verified) {
      const { encrypt } = await import('@kiraaya/security');
      await db.user.update({
        where: { id: authed.userId },
        data: {
          kycStatus: 'pan_verified',
          panEncrypted: encrypt(pan),
          panLast4: pan.slice(-4),
        },
      });
    }

    return NextResponse.json({ success: true, data: result });
  }, ['tenant', 'landlord']);
}

// ─────────────────────────────────────────────
// POST /api/v1/kyc/aadhaar/init
// ─────────────────────────────────────────────

export async function initAadhaarRoute(req: NextRequest): Promise<NextResponse> {
  return withAuth(req, async (authed: AuthenticatedRequest) => {
    const result = await initAadhaarKYC(
      authed.userId,
      authed.userPhone,
      `${process.env.NEXT_PUBLIC_APP_URL}/kyc/callback`
    );
    return NextResponse.json({ success: true, data: result });
  }, ['tenant', 'landlord']);
}
