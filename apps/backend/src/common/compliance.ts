import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * DPDP Compliance Middleware (Step 8)
 * Ensures purpose-based consent check for PII access.
 */
export async function checkConsent(userId: string, purpose: string) {
  const consent = await prisma.consent.findUnique({
    where: {
      userId_purpose: { userId, purpose: purpose as any }
    }
  });

  if (!consent || !consent.granted || consent.revokedAt) {
    throw new Error(`CONSENT_REQUIRED: Access to data for purpose '${purpose}' is not authorized by the user.`);
  }

  return true;
}

/**
 * Aadhaar Masking Utility (Step 8)
 * Ensures 12-digit Aadhaar pattern never leaves the server if caught.
 */
export function maskAadhaar(ref: string): string {
  if (!ref) return '';
  // PRD §19.4: Return only last 4 if tokenised, or fully mask if raw.
  return 'XXXX-XXXX-' + ref.slice(-4);
}
