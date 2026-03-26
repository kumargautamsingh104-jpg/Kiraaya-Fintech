import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { db } from '../lib/db';
import { withAuth, AuthenticatedRequest } from '../middleware/auth';

// ─────────────────────────────────────────────
// POST /api/v1/auth/otp/request
// ─────────────────────────────────────────────

const requestSchema = z.object({ phone: z.string().min(10).max(13) });

export async function requestOTP(req: NextRequest): Promise<NextResponse> {
  const body = requestSchema.safeParse(await req.json());
  if (!body.success) {
    return NextResponse.json({ success: false, error: 'Invalid phone number' }, { status: 400 });
  }

  const { phone } = body.data;

  // Upsert user record on OTP request
  await db.user.upsert({
    where: { phone },
    update: { updatedAt: new Date() },
    create: { phone, role: 'tenant' },
  });

  // In production, fire MSG91 / Gupshup OTP here.
  // For now, we use a fixed OTP for sandbox mode.
  const otp = process.env.NODE_ENV === 'production'
    ? Math.floor(100000 + Math.random() * 900000).toString()
    : '123456';

  // Store OTP hash in DB or Redis (simplified: store raw for now)
  await db.user.update({
    where: { phone },
    data: { otpHash: otp, otpExpiresAt: new Date(Date.now() + 10 * 60 * 1000) },
  });

  return NextResponse.json({ success: true, message: 'OTP sent' });
}

// ─────────────────────────────────────────────
// POST /api/v1/auth/otp/verify
// ─────────────────────────────────────────────

const verifySchema = z.object({
  phone: z.string().min(10).max(13),
  otp: z.string().length(6),
});

export async function verifyOTPAndLogin(req: NextRequest): Promise<NextResponse> {
  const body = verifySchema.safeParse(await req.json());
  if (!body.success) {
    return NextResponse.json({ success: false, error: 'Invalid input' }, { status: 400 });
  }

  const { phone, otp } = body.data;

  const user = await db.user.findUnique({ where: { phone } });
  if (!user || !user.otpHash || !user.otpExpiresAt) {
    return NextResponse.json({ success: false, error: 'No OTP found' }, { status: 400 });
  }

  if (user.otpExpiresAt < new Date()) {
    return NextResponse.json({ success: false, error: 'OTP expired' }, { status: 400 });
  }

  if (user.otpHash !== otp) {
    return NextResponse.json({ success: false, error: 'Invalid OTP' }, { status: 400 });
  }

  // Clear OTP and issue JWT
  await db.user.update({
    where: { phone },
    data: { otpHash: null, otpExpiresAt: null },
  });

  const { generateJWT } = await import('@kiraaya/security');
  const token = await generateJWT({ sub: user.id, role: user.role, phone: user.phone });

  return NextResponse.json({ success: true, data: { token, user: { id: user.id, role: user.role, phone: user.phone } } });
}
