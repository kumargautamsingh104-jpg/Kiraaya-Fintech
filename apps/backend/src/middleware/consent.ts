import { NextRequest, NextResponse } from 'next/server';
import { ConsentPurpose } from '@kiraaya/types';
import { db } from '../lib/db';

// ─────────────────────────────────────────────
// DPDP Consent Middleware (PRD §12.2)
// Every API route accessing PII must check consent
// Revocation propagates within 1hr (via cache TTL)
// ─────────────────────────────────────────────

export async function requireConsent(
  userId: string,
  purpose: ConsentPurpose
): Promise<void> {
  const consent = await db.consent.findFirst({
    where: {
      userId,
      purpose,
      granted: true,
      revokedAt: null,
    },
  });

  if (!consent) {
    throw new ConsentError(purpose);
  }
}

export class ConsentError extends Error {
  constructor(public purpose: ConsentPurpose) {
    super(`Consent not granted for purpose: ${purpose}. User must grant consent before this data can be accessed.`);
    this.name = 'ConsentError';
  }
}

// ─────────────────────────────────────────────
// Grant consent
// ─────────────────────────────────────────────

export async function grantConsent(params: {
  userId: string;
  purpose: ConsentPurpose;
  ipAddress?: string;
  userAgent?: string;
}): Promise<void> {
  await db.consent.upsert({
    where: { userId_purpose: { userId: params.userId, purpose: params.purpose } },
    create: {
      userId: params.userId,
      purpose: params.purpose,
      granted: true,
      grantedAt: new Date(),
      ipAddress: params.ipAddress,
      userAgent: params.userAgent,
    },
    update: {
      granted: true,
      grantedAt: new Date(),
      revokedAt: null, // re-grant after revocation
      ipAddress: params.ipAddress,
      userAgent: params.userAgent,
    },
  });

  await logEvent({
    entityType: 'consent',
    entityId: params.userId,
    actorId: params.userId,
    actorRole: 'user',
    action: 'consent.granted',
    payload: { purpose: params.purpose },
  });
}

// ─────────────────────────────────────────────
// Revoke consent (DPDP: immediate effect)
// Partner API will get 403 within 1hr (cache TTL)
// ─────────────────────────────────────────────

export async function revokeConsent(userId: string, purpose: ConsentPurpose): Promise<void> {
  await db.consent.update({
    where: { userId_purpose: { userId, purpose } },
    data: { revokedAt: new Date(), granted: false },
  });

  await logEvent({
    entityType: 'consent',
    entityId: userId,
    actorId: userId,
    actorRole: 'user',
    action: 'consent.revoked',
    payload: { purpose },
  });
}

// ─────────────────────────────────────────────
// Event log writer (used across all modules)
// ─────────────────────────────────────────────

export async function logEvent(params: {
  entityType: string;
  entityId?: string;
  actorId?: string;
  actorRole?: string;
  action: string;
  payload?: Record<string, unknown>;
}): Promise<void> {
  try {
    await db.eventsLog.create({
      data: {
        entityType: params.entityType,
        entityId: params.entityId,
        actorId: params.actorId,
        actorRole: params.actorRole,
        action: params.action,
        payload: params.payload ?? {},
      },
    });
  } catch (err) {
    // Event log must never crash the main flow
    console.error('[EventLog] Failed to write:', err);
  }
}

// ─────────────────────────────────────────────
// Consent error → HTTP 403 response
// ─────────────────────────────────────────────

export function handleConsentError(err: unknown): NextResponse {
  if (err instanceof ConsentError) {
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'CONSENT_REQUIRED',
          message: err.message,
          purpose: err.purpose,
        },
      },
      { status: 403 }
    );
  }
  return NextResponse.json(
    { success: false, error: { code: 'INTERNAL_ERROR', message: 'An unexpected error occurred' } },
    { status: 500 }
  );
}
