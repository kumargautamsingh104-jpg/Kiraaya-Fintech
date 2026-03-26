import axios from 'axios';
import crypto from 'node:crypto';
import { AADebitMatch } from '@kiraaya/types';

const SETU_BASE = process.env.SETU_AA_BASE_URL ?? 'https://fiu.setu.co';
const SETU_CLIENT_ID = process.env.SETU_CLIENT_ID ?? '';
const SETU_CLIENT_SECRET = process.env.SETU_CLIENT_SECRET ?? '';

const setuClient = axios.create({
  baseURL: SETU_BASE,
  headers: {
    'Content-Type': 'application/json',
    'x-client-id': SETU_CLIENT_ID,
    'x-client-secret': SETU_CLIENT_SECRET,
  },
  timeout: 30000,
});

// ─────────────────────────────────────────────
// CRITICAL COMPLIANCE NOTE
// Raw bank statement data is NEVER persisted to the Kiraaya database.
// Statements are fetched, processed in-memory, and immediately discarded.
// Only the derived outputs are stored: { matched: boolean, debitAmountPaise, debitDate }
// ─────────────────────────────────────────────

export async function initConsentRequest(
  userId: string,
  phone: string,
  returnUrl: string
): Promise<{ consentId: string; redirectUrl: string }> {
  const resp = await setuClient.post('/v2/consents', {
    Detail: {
      consentStart: new Date().toISOString(),
      consentExpiry: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
      consentMode: 'STORE',
      fetchType: 'PERIODIC',
      vua: `${phone}@setu`,
      purpose: {
        code: '105',
        text: 'Rent payment verification for RentScore computation',
      },
      fiTypes: ['DEPOSIT'],
      DataRange: {
        from: new Date(Date.now() - 2 * 365 * 24 * 60 * 60 * 1000).toISOString(),
        to: new Date().toISOString(),
      },
      redirectUrl,
    },
    redirectUrl,
  });

  return {
    consentId: resp.data.id,
    redirectUrl: resp.data.url,
  };
}

// ─────────────────────────────────────────────
// Debit match check
// Fetches statements IN-MEMORY, checks for debit, discards raw data
// ─────────────────────────────────────────────

export async function checkDebitMatch(params: {
  consentId: string;
  sessionId: string;
  targetAmountPaise: number;
  targetDate: Date;
  toleranceDays?: number;
  tolerancePct?: number;
}): Promise<AADebitMatch> {
  const {
    consentId,
    sessionId,
    targetAmountPaise,
    targetDate,
    toleranceDays = 3,
    tolerancePct = 0.05, // ±5% amount tolerance per PRD §19.1
  } = params;

  let rawStatements: unknown;
  try {
    const resp = await setuClient.get(`/v2/sessions/${sessionId}/data`);
    rawStatements = resp.data;
  } catch {
    return { matched: false, confidence: 'none' };
  }

  // Process in memory — type-safe traversal
  const transactions: Array<{
    type: string;
    amount: number;
    transactionTimestamp: string;
  }> = [];

  try {
    const data = rawStatements as Record<string, unknown>;
    const accounts = (data['FI'] as Record<string, unknown>[]) ?? [];
    for (const account of accounts) {
      const txns = (account['Transactions'] as Record<string, unknown>[]) ?? [];
      for (const txn of txns) {
        transactions.push({
          type: txn['type'] as string,
          amount: Number(txn['amount']),
          transactionTimestamp: txn['transactionTimestamp'] as string,
        });
      }
    }
  } catch {
    // Parsing failed — treat as inconclusive
    return { matched: false, confidence: 'none' };
  }

  // Find matching debit
  const targetAmount = targetAmountPaise / 100;
  const targetTime = targetDate.getTime();
  const dayMs = 24 * 60 * 60 * 1000;

  for (const txn of transactions) {
    if (txn.type !== 'DEBIT') continue;

    const txnTime = new Date(txn.transactionTimestamp).getTime();
    const timeDiff = Math.abs(txnTime - targetTime) / dayMs;
    const amountDiff = Math.abs(txn.amount - targetAmount) / targetAmount;

    if (timeDiff <= toleranceDays && amountDiff <= tolerancePct) {
      const debitDate = new Date(txn.transactionTimestamp);
      const debitAmountPaise = Math.round(txn.amount * 100);

      // Raw data is immediately discarded after this return
      return {
        matched: true,
        debitAmountPaise,
        debitDate,
        confidence: timeDiff <= 1 && amountDiff <= 0.01 ? 'high' : 'medium',
      };
    }
  }

  // No match found — raw data discarded here (never returned, never stored)
  return { matched: false, confidence: 'low' };
}

// ─────────────────────────────────────────────
// Initiate data session for debit check
// ─────────────────────────────────────────────

export async function initDataSession(consentId: string): Promise<string> {
  const resp = await setuClient.post('/v2/sessions', {
    consentId,
    DataRange: {
      from: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString(),
      to: new Date().toISOString(),
    },
    format: 'json',
  });
  return resp.data.id as string;
}
