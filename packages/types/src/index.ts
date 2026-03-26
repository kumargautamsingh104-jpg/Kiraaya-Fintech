// ─────────────────────────────────────────────
// Kiraaya Shared Types
// ─────────────────────────────────────────────

export type UserRole = 'tenant' | 'landlord' | 'admin';
export type KycStatus = 'none' | 'pan_verified' | 'full_kyc';
export type Language = 'en' | 'hi';
export type City = 'bengaluru' | 'delhi_ncr';
export type TenancyType = 'residential' | 'commercial' | 'pg';
export type TenancyStatus = 'active' | 'closed' | 'disputed';
export type AgreementStatus =
  | 'draft'
  | 'pending_sign_landlord'
  | 'pending_sign_tenant'
  | 'executed'
  | 'expired';
export type PaymentMethod = 'upi' | 'cash' | 'bank_transfer' | 'other';
export type PaymentStatus = 'pending' | 'paid' | 'missed' | 'disputed' | 'under_review';
export type ScoreTier = 'building' | 'emerging' | 'established' | 'strong' | 'prime';
export type InsurancePlan = 'standard' | 'premium';
export type PolicyStatus = 'active' | 'expired' | 'claimed' | 'cancelled';
export type ClaimStatus = 'initiated' | 'under_review' | 'approved' | 'rejected' | 'paid';
export type DisputeStatus =
  | 'open'
  | 'aa_resolving'
  | 'human_review'
  | 'resolved_tenant_favour'
  | 'resolved_landlord_favour';
export type PartnerType = 'nbfc' | 'insurer';
export type ConsentPurpose =
  | 'rent_data_collection'
  | 'score_computation'
  | 'nbfc_data_share'
  | 'insurer_data_share'
  | 'aa_pull'
  | 'marketing';

// ─────────────────────────────────────────────
// Score types
// ─────────────────────────────────────────────

export interface ScoreFactors {
  consistencyPct: number;        // 0–100
  tenureMonths: number;
  paymentMethodQuality: number;  // 0–100
  dataCompletenessPct: number;   // 0–100
}

export interface ScoreInput {
  tenancyId: string;
  tenancyStartDate: Date;
  tenancyType: TenancyType;
  payments: PaymentRecord[];
}

export interface PaymentRecord {
  id: string;
  periodMonth: number;
  periodYear: number;
  amountPaise: bigint;
  dueDate: Date;
  paidAt: Date | null;
  paymentMethod: PaymentMethod | null;
  landlordConfirmed: boolean;
  aaVerified: boolean;
  daysLate: number | null;
  status: PaymentStatus;
}

export interface ScoreOutput {
  tenancyId: string;
  score: number;
  tier: ScoreTier;
  factors: ScoreFactors;
  isLimitedData: boolean;
  totalPaymentsDue: number;
  onTimePayments: number;
  verifiedUpiPayments: number;
  cashPayments: number;
  computedAt: Date;
  version: string;
}

// ─────────────────────────────────────────────
// API response types
// ─────────────────────────────────────────────

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: unknown;
  };
}

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  pagination: {
    page: number;
    perPage: number;
    total: number;
    totalPages: number;
  };
}

// ─────────────────────────────────────────────
// Razorpay webhook types
// ─────────────────────────────────────────────

export interface RazorpayPaymentWebhookPayload {
  event: string;
  payload: {
    payment: {
      entity: {
        id: string;
        order_id: string;
        amount: number; // in paise
        currency: string;
        status: string;
        method: string;
        vpa?: string;
        notes?: Record<string, string>;
        created_at: number;
      };
    };
  };
}

// ─────────────────────────────────────────────
// Digio types
// ─────────────────────────────────────────────

export interface DigioKycResult {
  reference: string; // Digio token — store this, NOT Aadhaar
  status: 'success' | 'failed' | 'pending';
  panVerified?: boolean;
  faceMatchScore?: number;
}

// ─────────────────────────────────────────────
// Setu AA types
// ─────────────────────────────────────────────

export interface AADebitMatch {
  matched: boolean;
  debitAmountPaise?: number;
  debitDate?: Date;
  confidence: 'high' | 'medium' | 'low' | 'none';
}

// ─────────────────────────────────────────────
// Insurance types
// ─────────────────────────────────────────────

export const INSURANCE_PRICING = {
  standard: {
    premiumPerUnitPaise: 30000, // ₹300
    coverageMonths: 1,
  },
  premium: {
    premiumPerUnitPaise: 50000, // ₹500
    coverageMonths: 2,
  },
} as const;

// ─────────────────────────────────────────────
// Agreement fee by state
// ─────────────────────────────────────────────

export const AGREEMENT_FEES = {
  KA: 49900,  // ₹499 — Karnataka
  DL: 59900,  // ₹599 — Delhi/NCR
} as const;

export type AgreementState = keyof typeof AGREEMENT_FEES;

// ─────────────────────────────────────────────
// Score config (tune without code changes)
// ─────────────────────────────────────────────

export const SCORE_CONFIG = {
  MIN_PAYMENTS: 3,              // minimum verified payments before score is shown
  CASH_THRESHOLD_PCT: 0.5,      // >50% cash → isLimitedData = true
  MIN_SCORE: 300,
  MAX_SCORE: 900,
  VERSION: 'v1',
  WEIGHTS: {
    consistency: 0.40,
    paymentQuality: 0.25,
    tenure: 0.20,
    dataCompleteness: 0.15,
  },
  SHARE_LINK_VALIDITY_DAYS: 30,
} as const;
