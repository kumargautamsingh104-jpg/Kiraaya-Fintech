import { NextRequest, NextResponse } from 'next/server';
import { withAuth, AuthenticatedRequest } from '../middleware/auth';
import { TenancyController } from '../modules/tenancies/tenancy.controller';

export async function createTenancy(req: NextRequest): Promise<NextResponse> {
  return withAuth(req, async (authed: AuthenticatedRequest) => {
    return TenancyController.createTenancy(req, authed);
  }, ['landlord']);
}

export async function listTenancies(req: NextRequest): Promise<NextResponse> {
  return withAuth(req, async (authed: AuthenticatedRequest) => {
    return TenancyController.listTenancies(req, authed);
  }, ['landlord']);
}

export async function getTenancy(req: NextRequest): Promise<NextResponse> {
  return withAuth(req, async (authed: AuthenticatedRequest) => {
    return TenancyController.getTenancy(req, authed);
  }, ['tenant', 'landlord']);
}
