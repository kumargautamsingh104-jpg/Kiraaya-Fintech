import {
  PaymentMethod,
  PaymentRecord,
  PaymentStatus,
  ScoreInput,
  ScoreOutput,
  ScoreTier,
  SCORE_CONFIG,
} from '@kiraaya/types';

// ─────────────────────────────────────────────
// Payment method quality scores
// Higher = more trustworthy data signal
// ─────────────────────────────────────────────

const METHOD_QUALITY: Record<string, number> = {
  upi_verified_aa: 1.00,       // UPI + AA cross-validated (best)
  upi_verified_only: 0.85,     // UPI only (Razorpay confirmed)
  landlord_confirmed: 0.60,    // Landlord tap only (no digital trail)
  cash_logged: 0.60,           // PRD §19.1: cash at 60% weight
  cash_unconfirmed: 0.30,      // Tenant logged, unconfirmed
};

// ─────────────────────────────────────────────
// Payment quality resolver
// ─────────────────────────────────────────────

function resolveMethodQualityKey(payment: PaymentRecord): string {
  if (payment.paymentMethod === 'upi' && payment.aaVerified) return 'upi_verified_aa';
  if (payment.paymentMethod === 'upi') return 'upi_verified_only';
  if (payment.paymentMethod === 'cash' && payment.landlordConfirmed) return 'cash_logged';
  if (payment.paymentMethod === 'cash') return 'cash_unconfirmed';
  if (payment.landlordConfirmed) return 'landlord_confirmed';
  return 'cash_unconfirmed';
}

// ─────────────────────────────────────────────
// Timing multiplier
// PRD: emphasise early payment, penalise late
// ─────────────────────────────────────────────

function timingMultiplier(daysLate: number | null): number {
  if (daysLate === null) return 0;         // payment missed entirely
  if (daysLate <= -3) return 1.10;         // 3+ days early (bonus)
  if (daysLate <= 0) return 1.00;          // on time
  if (daysLate <= 3) return 0.90;          // 1–3 days late (grace period)
  if (daysLate <= 7) return 0.70;          // 4–7 days late
  return 0.40;                             // >7 days late (severe)
}

// ─────────────────────────────────────────────
// Tenure factor (months on platform → score)
// Caps at 36 months
// ─────────────────────────────────────────────

function tenureFactor(months: number): number {
  if (months <= 3) return 0.30;
  if (months <= 6) return 0.50;
  if (months <= 12) return 0.70;
  if (months <= 24) return 0.85;
  return 1.00; // 24+ months = full score
}

// ─────────────────────────────────────────────
// Tier mapping
// ─────────────────────────────────────────────

function scoreToTier(score: number): ScoreTier {
  if (score <= 550) return 'building';
  if (score <= 650) return 'emerging';
  if (score <= 780) return 'established';
  if (score <= 850) return 'strong';
  return 'prime';
}

// ─────────────────────────────────────────────
// Map raw [0,1] to [300,900] range
// ─────────────────────────────────────────────

function scaleToRange(raw: number): number {
  const { MIN_SCORE, MAX_SCORE } = SCORE_CONFIG;
  const clamped = Math.max(0, Math.min(1, raw));
  return Math.round(MIN_SCORE + clamped * (MAX_SCORE - MIN_SCORE));
}

// ─────────────────────────────────────────────
// Main computation function
// ─────────────────────────────────────────────

export class InsufficientDataError extends Error {
  constructor(paymentsFound: number, required: number) {
    super(
      `Insufficient data: ${paymentsFound} payments found, ${required} required. ` +
        `Continue building your rent history.`
    );
    this.name = 'InsufficientDataError';
  }
}

export function computeScore(input: ScoreInput): ScoreOutput {
  const { tenancyId, tenancyStartDate, payments } = input;
  const { WEIGHTS, MIN_PAYMENTS, CASH_THRESHOLD_PCT, VERSION } = SCORE_CONFIG;

  // Filter to paid or missed — exclude pending/under_review for scoring
  const scorablePayments = payments.filter(
    (p) => p.status === 'paid' || p.status === 'missed'
  );

  // UPI-verified payments count for minimum threshold
  const verifiedUpiPayments = scorablePayments.filter(
    (p) => p.paymentMethod === 'upi'
  );

  if (verifiedUpiPayments.length < MIN_PAYMENTS) {
    throw new InsufficientDataError(verifiedUpiPayments.length, MIN_PAYMENTS);
  }

  // Cash payment ratio check
  const cashPayments = scorablePayments.filter((p) => p.paymentMethod === 'cash');
  const cashPct = cashPayments.length / scorablePayments.length;
  const isLimitedData = cashPct > CASH_THRESHOLD_PCT;

  // ── Factor 1: Consistency (on-time rate weighted by timing) ──
  const paidPayments = scorablePayments.filter((p) => p.status === 'paid');
  const onTimePayments = paidPayments.filter(
    (p) => p.daysLate !== null && p.daysLate <= 0
  );

  let consistencyScore = 0;
  if (scorablePayments.length > 0) {
    const weightedConsistency = scorablePayments.reduce((sum, p) => {
      return sum + timingMultiplier(p.daysLate);
    }, 0);
    consistencyScore = weightedConsistency / scorablePayments.length;
  }
  const consistencyPct = Math.round(consistencyScore * 100);

  // ── Factor 2: Payment method quality ──
  let qualityScore = 0;
  if (paidPayments.length > 0) {
    const totalQuality = paidPayments.reduce((sum, p) => {
      const key = resolveMethodQualityKey(p);
      return sum + (METHOD_QUALITY[key] ?? 0.30);
    }, 0);
    qualityScore = totalQuality / paidPayments.length;
  }

  // ── Factor 3: Tenure ──
  const tenureMonths = Math.floor(
    (Date.now() - tenancyStartDate.getTime()) / (1000 * 60 * 60 * 24 * 30)
  );
  const tenureScore = tenureFactor(tenureMonths);

  // ── Factor 4: Data completeness ──
  // How many months have any record vs expected months
  const expectedMonths = Math.max(1, tenureMonths);
  const dataCompletenessPct = Math.min(100, Math.round((scorablePayments.length / expectedMonths) * 100));
  const dataCompletenessScore = dataCompletenessPct / 100;

  // ── Weighted raw score ──
  const rawScore =
    consistencyScore * WEIGHTS.consistency +
    qualityScore * WEIGHTS.paymentQuality +
    tenureScore * WEIGHTS.tenure +
    dataCompletenessScore * WEIGHTS.dataCompleteness;

  // Apply limited data penalty
  const adjustedScore = isLimitedData ? rawScore * 0.85 : rawScore;

  const finalScore = scaleToRange(adjustedScore);
  const tier = scoreToTier(finalScore);

  return {
    tenancyId,
    score: finalScore,
    tier,
    factors: {
      consistencyPct,
      tenureMonths,
      paymentMethodQuality: Math.round(qualityScore * 100),
      dataCompletenessPct,
    },
    isLimitedData,
    totalPaymentsDue: scorablePayments.length,
    onTimePayments: onTimePayments.length,
    verifiedUpiPayments: verifiedUpiPayments.length,
    cashPayments: cashPayments.length,
    computedAt: new Date(),
    version: VERSION,
  };
}

// ─────────────────────────────────────────────
// Score tier human labels (bilingual)
// ─────────────────────────────────────────────

export const TIER_LABELS: Record<ScoreTier, { en: string; hi: string }> = {
  building: { en: 'Building', hi: 'निर्माणाधीन' },
  emerging: { en: 'Emerging', hi: 'उभरता हुआ' },
  established: { en: 'Established', hi: 'स्थापित' },
  strong: { en: 'Strong', hi: 'मजबूत' },
  prime: { en: 'Prime', hi: 'प्राइम' },
};

export const TIER_COLORS: Record<ScoreTier, string> = {
  building: '#D85A30',    // Coral
  emerging: '#EF9F27',    // Amber
  established: '#0F6E56', // Teal
  strong: '#1A8B4A',      // Green
  prime: '#1A8B4A',       // Green
};

export const NEXT_MILESTONE: Record<ScoreTier, { threshold: number; label: string }> = {
  building: { threshold: 551, label: 'Emerging' },
  emerging: { threshold: 651, label: 'Established' },
  established: { threshold: 781, label: 'Strong' },
  strong: { threshold: 851, label: 'Prime' },
  prime: { threshold: 900, label: 'Prime (max)' },
};

export { computeScore as default };
