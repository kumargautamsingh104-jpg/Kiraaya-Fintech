import { NextRequest, NextResponse } from 'next/server';
import { withAuth, AuthenticatedRequest } from '../middleware/auth';
import { PropertyController } from '../modules/properties/property.controller';

export async function createProperty(req: NextRequest): Promise<NextResponse> {
  return withAuth(req, async (authed: AuthenticatedRequest) => {
    return PropertyController.createProperty(req, authed);
  }, ['landlord']);
}

export async function listProperties(req: NextRequest): Promise<NextResponse> {
  return withAuth(req, async (authed: AuthenticatedRequest) => {
    return PropertyController.listProperties(req, authed);
  }, ['landlord']);
}
