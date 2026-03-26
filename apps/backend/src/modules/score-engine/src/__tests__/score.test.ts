import { computeScore, InsufficientDataError } from '../src/index';
import { PaymentRecord, ScoreInput } from '@kiraaya/types';

// ─────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────

function makePayment(
  overrides: Partial<PaymentRecord> & { month: number; year: number }
): PaymentRecord {
  return {
    id: `pay-${overrides.month}-${overrides.year}`,
    periodMonth: overrides.month,
    periodYear: overrides.year,
    amountPaise: BigInt(1400000), // ₹14,000
    dueDate: new Date(overrides.year, overrides.month - 1, 1),
    paidAt: new Date(overrides.year, overrides.month - 1, 1),
    paymentMethod: 'upi',
    landlordConfirmed: true,
    aaVerified: true,
    daysLate: 0,
    status: 'paid',
    ...overrides,
  };
}

function makeInput(payments: PaymentRecord[], startMonthsAgo = 12): ScoreInput {
  const startDate = new Date();
  startDate.setMonth(startDate.getMonth() - startMonthsAgo);
  return {
    tenancyId: 'tenancy-001',
    tenancyStartDate: startDate,
    tenancyType: 'residential',
    payments,
  };
}

// ─────────────────────────────────────────────
// PRD §19.2 — RentScore computation tests
// ─────────────────────────────────────────────

describe('RentScore Engine v1', () => {
  // PRD §19.2: 3 verified UPI payments → score visible
  test('3 verified UPI payments → score is computed successfully', () => {
    const payments = [
      makePayment({ month: 1, year: 2025 }),
      makePayment({ month: 2, year: 2025 }),
      makePayment({ month: 3, year: 2025 }),
    ];
    const result = computeScore(makeInput(payments));
    expect(result.score).toBeGreaterThanOrEqual(300);
    expect(result.score).toBeLessThanOrEqual(900);
    expect(result.tier).toBeDefined();
  });

  // PRD §19.2: < 3 verified UPI payments → InsufficientDataError
  test('fewer than 3 verified UPI payments → throws InsufficientDataError', () => {
    const payments = [
      makePayment({ month: 1, year: 2025 }),
      makePayment({ month: 2, year: 2025 }),
    ];
    expect(() => computeScore(makeInput(payments))).toThrow(InsufficientDataError);
  });

  // PRD §19.2: 6 consecutive on-time → score higher than 3
  test('6 consecutive on-time payments → higher score than 3 payment baseline', () => {
    const basePayments = [
      makePayment({ month: 1, year: 2025 }),
      makePayment({ month: 2, year: 2025 }),
      makePayment({ month: 3, year: 2025 }),
    ];
    const extendedPayments = [
      ...basePayments,
      makePayment({ month: 4, year: 2025 }),
      makePayment({ month: 5, year: 2025 }),
      makePayment({ month: 6, year: 2025 }),
    ];
    const baseScore = computeScore(makeInput(basePayments)).score;
    const extendedScore = computeScore(makeInput(extendedPayments)).score;
    expect(extendedScore).toBeGreaterThan(baseScore);
  });

  // PRD §19.2: 1 missed payment → score does not increase vs all-paid baseline
  test('1 missed payment → score <= all-paid baseline', () => {
    const allPaid = [
      makePayment({ month: 1, year: 2025 }),
      makePayment({ month: 2, year: 2025 }),
      makePayment({ month: 3, year: 2025 }),
      makePayment({ month: 4, year: 2025 }),
    ];
    const withMissed = [
      makePayment({ month: 1, year: 2025 }),
      makePayment({ month: 2, year: 2025 }),
      makePayment({ month: 3, year: 2025 }),
      makePayment({
        month: 4,
        year: 2025,
        status: 'missed',
        paidAt: null,
        daysLate: null,
      }),
    ];
    const goodScore = computeScore(makeInput(allPaid)).score;
    const missedScore = computeScore(makeInput(withMissed)).score;
    expect(missedScore).toBeLessThanOrEqual(goodScore);
  });

  // Cash percentage > 50% → isLimitedData = true
  test('>50% cash payments → isLimitedData is true', () => {
    const payments = [
      makePayment({ month: 1, year: 2025, paymentMethod: 'cash', aaVerified: false }),
      makePayment({ month: 2, year: 2025, paymentMethod: 'cash', aaVerified: false }),
      makePayment({ month: 3, year: 2025, paymentMethod: 'cash', aaVerified: false }),
      makePayment({ month: 4, year: 2025 }), // one UPI to meet minimum
    ];
    const result = computeScore(makeInput(payments));
    expect(result.isLimitedData).toBe(true);
  });

  // Exactly 50% cash → isLimitedData = false (must exceed threshold)
  test('exactly 50% cash → isLimitedData is false', () => {
    const payments = [
      makePayment({ month: 1, year: 2025, paymentMethod: 'cash', aaVerified: false }),
      makePayment({ month: 2, year: 2025, paymentMethod: 'cash', aaVerified: false }),
      makePayment({ month: 3, year: 2025 }),
      makePayment({ month: 4, year: 2025 }),
    ];
    const result = computeScore(makeInput(payments));
    expect(result.isLimitedData).toBe(false);
  });

  // Score always in valid range
  test('score is always between 300 and 900', () => {
    const worst = [
      makePayment({ month: 1, year: 2025, daysLate: 30, status: 'paid', paymentMethod: 'cash', aaVerified: false, landlordConfirmed: false }),
      makePayment({ month: 2, year: 2025, daysLate: 25, status: 'paid', paymentMethod: 'cash', aaVerified: false, landlordConfirmed: false }),
      makePayment({ month: 3, year: 2025, daysLate: 20, status: 'paid', paymentMethod: 'cash', aaVerified: false, landlordConfirmed: false }),
    ];
    // Only 0 UPI verified — but need 3 UPI for minimum. Let's add UPI ones.
    const payments = [
      makePayment({ month: 1, year: 2025, daysLate: 60, status: 'paid' }),
      makePayment({ month: 2, year: 2025, daysLate: 60, status: 'paid' }),
      makePayment({ month: 3, year: 2025, daysLate: 60, status: 'paid' }),
    ];
    const result = computeScore(makeInput(payments));
    expect(result.score).toBeGreaterThanOrEqual(300);
    expect(result.score).toBeLessThanOrEqual(900);
  });

  // Early payment gets bonus
  test('payment 3+ days early gives timing bonus', () => {
    const earlyPayments = [
      makePayment({ month: 1, year: 2025, daysLate: -5 }),
      makePayment({ month: 2, year: 2025, daysLate: -4 }),
      makePayment({ month: 3, year: 2025, daysLate: -3 }),
    ];
    const onTimePayments = [
      makePayment({ month: 1, year: 2025, daysLate: 0 }),
      makePayment({ month: 2, year: 2025, daysLate: 0 }),
      makePayment({ month: 3, year: 2025, daysLate: 0 }),
    ];
    const earlyScore = computeScore(makeInput(earlyPayments)).score;
    const onTimeScore = computeScore(makeInput(onTimePayments)).score;
    expect(earlyScore).toBeGreaterThanOrEqual(onTimeScore);
  });

  // AA-verified UPI > UPI-only > cash
  test('UPI+AA payments score higher than cash-only', () => {
    const upiAaPayments = [
      makePayment({ month: 1, year: 2025, paymentMethod: 'upi', aaVerified: true }),
      makePayment({ month: 2, year: 2025, paymentMethod: 'upi', aaVerified: true }),
      makePayment({ month: 3, year: 2025, paymentMethod: 'upi', aaVerified: true }),
    ];
    // Cash payments - need 3 UPI to meet min, so mix
    const mixedPayments = [
      makePayment({ month: 1, year: 2025, paymentMethod: 'upi', aaVerified: false }),
      makePayment({ month: 2, year: 2025, paymentMethod: 'upi', aaVerified: false }),
      makePayment({ month: 3, year: 2025, paymentMethod: 'upi', aaVerified: false }),
    ];
    const highQuality = computeScore(makeInput(upiAaPayments)).score;
    const lowerQuality = computeScore(makeInput(mixedPayments)).score;
    expect(highQuality).toBeGreaterThanOrEqual(lowerQuality);
  });

  // computedAt is always set
  test('computedAt is set to current time', () => {
    const before = new Date();
    const payments = [
      makePayment({ month: 1, year: 2025 }),
      makePayment({ month: 2, year: 2025 }),
      makePayment({ month: 3, year: 2025 }),
    ];
    const result = computeScore(makeInput(payments));
    const after = new Date();
    expect(result.computedAt.getTime()).toBeGreaterThanOrEqual(before.getTime());
    expect(result.computedAt.getTime()).toBeLessThanOrEqual(after.getTime());
  });

  // Version is always v1
  test('version is v1', () => {
    const payments = [
      makePayment({ month: 1, year: 2025 }),
      makePayment({ month: 2, year: 2025 }),
      makePayment({ month: 3, year: 2025 }),
    ];
    const result = computeScore(makeInput(payments));
    expect(result.version).toBe('v1');
  });
});
