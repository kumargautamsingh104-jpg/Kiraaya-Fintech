import axios from 'axios';
import { DigioKycResult } from '@kiraaya/types';

const DIGIO_BASE = process.env.DIGIO_BASE_URL ?? 'https://api.digio.in';
const DIGIO_CLIENT_ID = process.env.DIGIO_CLIENT_ID ?? '';
const DIGIO_CLIENT_SECRET = process.env.DIGIO_CLIENT_SECRET ?? '';

const digioClient = axios.create({
  baseURL: DIGIO_BASE,
  auth: { username: DIGIO_CLIENT_ID, password: DIGIO_CLIENT_SECRET },
  headers: { 'Content-Type': 'application/json' },
  timeout: 15000,
});

// ─────────────────────────────────────────────
// PAN Verification
// ─────────────────────────────────────────────

export async function verifyPAN(
  pan: string,
  name: string
): Promise<{ verified: boolean; nameMatch: boolean; error?: string }> {
  try {
    const resp = await digioClient.post('/v2/client/pan/verify', {
      pan,
      name,
    });
    return {
      verified: resp.data.status === 'valid',
      nameMatch: resp.data.name_match === true,
    };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'PAN verification failed';
    return { verified: false, nameMatch: false, error: message };
  }
}

// ─────────────────────────────────────────────
// Aadhaar e-KYC
// Returns a redirect URL — Kiraaya NEVER sees the Aadhaar number
// ─────────────────────────────────────────────

export async function initAadhaarKYC(
  userId: string,
  phone: string,
  callbackUrl: string
): Promise<{ redirectUrl: string; requestId: string }> {
  const resp = await digioClient.post('/v2/client/kyc/init', {
    reference_id: userId,
    customer_identifier: phone,
    kyc_type: 'aadhaar',
    callback_url: callbackUrl,
  });
  return {
    redirectUrl: resp.data.redirect_url,
    requestId: resp.data.request_id,
  };
}

// ─────────────────────────────────────────────
// Process KYC callback from Digio webhook
// CRITICAL: Only the Digio reference token is extracted. Aadhaar is NEVER touched.
// ─────────────────────────────────────────────

export function processKYCCallback(webhookPayload: Record<string, unknown>): DigioKycResult {
  const status = webhookPayload['status'] as string;
  const reference = webhookPayload['id'] as string; // Digio's internal reference — NOT Aadhaar

  return {
    reference,                                      // Store only this in DB
    status: status === 'completed' ? 'success' : status === 'failed' ? 'failed' : 'pending',
    faceMatchScore: webhookPayload['face_match_score'] as number | undefined,
  };
}

// ─────────────────────────────────────────────
// e-Stamp (rental agreement)
// ─────────────────────────────────────────────

export async function generateEStamp(agreementData: {
  state: string;
  parties: Array<{ name: string; type: string }>;
  stampDutyPaise: number;
  documentDescription: string;
}): Promise<{ stampReference: string; stampDutyPaise: number }> {
  const resp = await digioClient.post('/v2/client/estamp/create', {
    state: agreementData.state,
    stamp_duty_amount: agreementData.stampDutyPaise / 100,
    document_description: agreementData.documentDescription,
    parties: agreementData.parties,
  });
  return {
    stampReference: resp.data.id,
    stampDutyPaise: resp.data.stamp_duty_amount * 100,
  };
}

// ─────────────────────────────────────────────
// e-Sign request
// ─────────────────────────────────────────────

export async function requestESign(
  documentId: string,
  signerPhone: string,
  signerName: string
): Promise<{ signUrl: string }> {
  const resp = await digioClient.post(`/v2/client/document/${documentId}/sign_request`, {
    signers: [
      {
        identifier: signerPhone,
        name: signerName,
        sign_type: 'aadhaar',
      },
    ],
  });
  return { signUrl: resp.data.action_required?.redirect_url ?? '' };
}

// ─────────────────────────────────────────────
// Check sign status (polling / webhook fallback)
// ─────────────────────────────────────────────

export async function checkSignStatus(
  documentId: string
): Promise<{ allSigned: boolean; pendingSigners: string[] }> {
  const resp = await digioClient.get(`/v2/client/document/${documentId}`);
  const signers = resp.data.signing_parties ?? [];
  const pending = signers
    .filter((s: Record<string, string>) => s.status !== 'signed')
    .map((s: Record<string, string>) => s.identifier as string);
  return { allSigned: pending.length === 0, pendingSigners: pending };
}
