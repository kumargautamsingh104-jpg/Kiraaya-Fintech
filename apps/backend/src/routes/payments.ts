import { NextRequest, NextResponse } from 'next/server';
import { withAuth, AuthenticatedRequest } from '../middleware/auth';
import { PaymentsController } from '../modules/payments/payments.controller';

// ─────────────────────────────────────────────
// POST /api/v1/payments/cash/log
// ─────────────────────────────────────────────
export async function logCashPayment(req: NextRequest): Promise<NextResponse> {
  return withAuth(req, async (authed: AuthenticatedRequest) => {
    return PaymentsController.logCashPayment(req, authed);
  }, ['landlord']);
}

// ─────────────────────────────────────────────
// POST /api/v1/payments/collect/initiate
// ─────────────────────────────────────────────
export async function initiateCollect(req: NextRequest): Promise<NextResponse> {
  return withAuth(req, async (authed: AuthenticatedRequest) => {
    return PaymentsController.initiateCollect(req, authed);
  }, ['tenant', 'landlord']);
}

// ─────────────────────────────────────────────
// POST /api/v1/payments/webhooks/razorpay
// ─────────────────────────────────────────────
export async function razorpayWebhook(req: NextRequest): Promise<NextResponse> {
  return PaymentsController.razorpayWebhook(req);
}
