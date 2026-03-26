import { NextRequest, NextResponse } from 'next/server';
import { verifyJWT } from '@kiraaya/security';
import { UserRole } from '@kiraaya/types';

export interface AuthenticatedRequest extends NextRequest {
  userId: string;
  userRole: UserRole;
  userPhone: string;
}

// ─────────────────────────────────────────────
// Auth Middleware
// Validates Bearer JWT and attaches user info
// ─────────────────────────────────────────────

export async function withAuth(
  req: NextRequest,
  handler: (req: AuthenticatedRequest) => Promise<NextResponse>,
  allowedRoles?: UserRole[]
): Promise<NextResponse> {
  const authorization = req.headers.get('authorization');
  if (!authorization?.startsWith('Bearer ')) {
    return NextResponse.json(
      { success: false, error: { code: 'UNAUTHORIZED', message: 'Missing authorization token' } },
      { status: 401 }
    );
  }

  const token = authorization.slice(7);
  let payload: { sub: string; role: string; phone: string };
  try {
    payload = await verifyJWT(token);
  } catch {
    return NextResponse.json(
      { success: false, error: { code: 'UNAUTHORIZED', message: 'Invalid or expired token' } },
      { status: 401 }
    );
  }

  if (allowedRoles && !allowedRoles.includes(payload.role as UserRole)) {
    return NextResponse.json(
      { success: false, error: { code: 'FORBIDDEN', message: 'Insufficient permissions' } },
      { status: 403 }
    );
  }

  // Attach user info to the request object
  const authedReq = req as AuthenticatedRequest;
  authedReq.userId = payload.sub;
  authedReq.userRole = payload.role as UserRole;
  authedReq.userPhone = payload.phone;

  return handler(authedReq);
}

// ─────────────────────────────────────────────
// HMAC Partner Auth Middleware (PRD §12.1)
// For NBFC / insurer partner API endpoints
// ─────────────────────────────────────────────

export async function withPartnerAuth(
  req: NextRequest,
  handler: (req: NextRequest, partnerId: string) => Promise<NextResponse>
): Promise<NextResponse> {
  const apiKey = req.headers.get('x-api-key');
  const signature = req.headers.get('x-signature');
  const timestamp = req.headers.get('x-timestamp');

  if (!apiKey || !signature || !timestamp) {
    return NextResponse.json(
      { success: false, error: { code: 'UNAUTHORIZED', message: 'Missing partner auth headers' } },
      { status: 401 }
    );
  }

  // Replay attack protection: reject requests older than 5 minutes
  const tsNum = parseInt(timestamp, 10);
  if (Math.abs(Date.now() - tsNum) > 5 * 60 * 1000) {
    return NextResponse.json(
      { success: false, error: { code: 'UNAUTHORIZED', message: 'Request timestamp expired' } },
      { status: 401 }
    );
  }

  const { db } = await import('../lib/db');
  const { verifyApiKey, verifyHMAC } = await import('@kiraaya/security');

  // Find partner by api key prefix (first 8 chars as identifier)
  const partner = await db.partner.findFirst({
    where: { active: true },
  });

  if (!partner) {
    return NextResponse.json(
      { success: false, error: { code: 'UNAUTHORIZED', message: 'Invalid API key' } },
      { status: 401 }
    );
  }

  // Verify the raw API key against stored hash
  const keyValid = await verifyApiKey(apiKey, partner.apiKeyHash);
  if (!keyValid) {
    return NextResponse.json(
      { success: false, error: { code: 'UNAUTHORIZED', message: 'Invalid API key' } },
      { status: 401 }
    );
  }

  // Verify HMAC signature (payload = method + url + timestamp)
  const payload = `${req.method}${req.url}${timestamp}`;
  const hmacValid = verifyHMAC(payload, signature, apiKey);
  if (!hmacValid) {
    return NextResponse.json(
      { success: false, error: { code: 'UNAUTHORIZED', message: 'Invalid HMAC signature' } },
      { status: 401 }
    );
  }

  return handler(req, partner.id);
}
