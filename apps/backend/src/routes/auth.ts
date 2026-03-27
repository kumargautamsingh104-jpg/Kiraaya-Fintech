import { NextRequest, NextResponse } from 'next/server';
import { AuthController } from '../modules/auth/auth.controller';

// ─────────────────────────────────────────────
// POST /api/v1/auth/otp/request
// ─────────────────────────────────────────────
export async function requestOTP(req: NextRequest): Promise<NextResponse> {
  return AuthController.requestOTP(req);
}

// ─────────────────────────────────────────────
// POST /api/v1/auth/otp/verify
// ─────────────────────────────────────────────
export async function verifyOTPAndLogin(req: NextRequest): Promise<NextResponse> {
  return AuthController.verifyOTPAndLogin(req);
}
