import { NextRequest, NextResponse } from 'next/server';
import { withAuth, AuthenticatedRequest } from '../middleware/auth';
import { KycController } from '../modules/auth/kyc.controller';

export async function verifyPanRoute(req: NextRequest): Promise<NextResponse> {
  return withAuth(req, async (authed: AuthenticatedRequest) => {
    return KycController.verifyPanRoute(req, authed);
  }, ['tenant', 'landlord']);
}

export async function initAadhaarRoute(req: NextRequest): Promise<NextResponse> {
  return withAuth(req, async (authed: AuthenticatedRequest) => {
    return KycController.initAadhaarRoute(req, authed);
  }, ['tenant', 'landlord']);
}
