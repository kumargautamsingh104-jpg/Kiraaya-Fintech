/**
 * Kiraaya Shared Config (Step 0)
 */
export const CONFIG = {
  MIN_PAYMENTS_FOR_SCORE: 3,
  CASH_PAYMENT_WEIGHT: 0.6,
  UPI_PAYMENT_WEIGHT: 1.0,
  AA_VERIFIED_BONUS: 0.1,
  DISPUTE_SCORE_PENALTY: -50,
  
  TIERS: {
    BUILDING: { min: 300, max: 550, label: 'Building' },
    EMERGING: { min: 551, max: 650, label: 'Emerging' },
    ESTABLISHED: { min: 651, max: 780, label: 'Established' },
    STRONG: { min: 781, max: 850, label: 'Strong' },
    PRIME: { min: 851, max: 900, label: 'Prime' },
  }
};

export const MESSAGES = {
  SCORE_FROZEN_DISPUTE: 'Your RentScore is currently frozen due to an active dispute. Resolve it to resume scoring.',
  LOAN_DISCLAIMER: 'RentScore is a verified credit signal. Final loan approval is at the NBFC partner\'s discretion.',
};
