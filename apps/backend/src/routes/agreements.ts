import { NextRequest, NextResponse } from 'next/server';
import { withAuth, AuthenticatedRequest } from '../middleware/auth';
import { AgreementsController } from '../modules/agreements/agreements.controller';

export async function createAgreement(req: NextRequest): Promise<NextResponse> {
  return withAuth(req, async (authed: AuthenticatedRequest) => {
    return AgreementsController.createDraft(req, authed);
  }, ['landlord']);
}

export async function getAgreement(req: NextRequest): Promise<NextResponse> {
  return withAuth(req, async (authed: AuthenticatedRequest) => {
    return AgreementsController.getAgreement(req, authed);
  }, ['tenant', 'landlord']);
}

export async function initiateSign(req: NextRequest): Promise<NextResponse> {
  return withAuth(req, async (authed: AuthenticatedRequest) => {
    return AgreementsController.initiateSign(req, authed);
  }, ['tenant', 'landlord']);
}
