import { db } from '../../lib/db';
import { Tenancy, RentPayment, PaymentDispute } from '@prisma/client';

export class ScoringService {
  /**
   * Calculates the RentScore following the Phase 1 MVP PRD rules.
   * Scale: 300 to 900.
   */
  async computeScore(tenancyId: string): Promise<any> {
    const tenancy = await db.tenancy.findUnique({
      where: { id: tenancyId },
      include: {
        rentPayments: { orderBy: { dueDate: 'asc' } },
        disputes: { where: { status: 'open' } },
      },
    });

    if (!tenancy) throw new Error('Tenancy not found');

    // RULE: Disputes freeze score
    if (tenancy.disputes.length > 0) {
      // Look up the last computed score
      const lastScore = await db.rentScore.findFirst({
        where: { tenancyId: tenancy.id },
        orderBy: { computedAt: 'desc' },
      });
      if (lastScore) {
        return {
          ...lastScore,
          frozen: true,
          disclaimer: 'Score frozen due to active payment dispute.',
        };
      }
    }

    const { rentPayments } = tenancy;
    const paidPayments = rentPayments.filter(p => ['paid', 'missed'].includes(p.status));

    // RULE: Minimum 3 payments
    if (paidPayments.length < 3) {
      return {
        score: 0,
        tier: 'building',
        totalPayments: rentPayments.length,
        onTimePayments: 0,
        isLimitedData: true,
        disclaimer: `Need ${3 - paidPayments.length} more payments to generate a valid RentScore.`,
      };
    }

    let baseScore = 300;
    const maxScore = 900;
    let computedScore = baseScore;

    let onTimeCount = 0;
    let cashPayments = 0;
    let verifiedUpiPayments = 0;
    let penaltyPoints = 0;

    for (const payment of paidPayments) {
      // RULE: Missed payments heavily penalized
      if (payment.status === 'missed' || (payment.daysLate !== null && payment.daysLate > 30)) {
        penaltyPoints += 150;
        continue;
      }

      let paymentWeight = 1.0;

      // RULE: Cash = lower weight (0.6x)
      if (payment.paymentMethod === 'cash') {
        paymentWeight = 0.6;
        cashPayments++;
      } else {
        // UPI / Bank Transfer
        if (payment.aaVerified) {
          paymentWeight = 1.2; // Bonus for AA verified
          verifiedUpiPayments++;
        } else if (payment.landlordConfirmed) {
          paymentWeight = 1.0;
          verifiedUpiPayments++;
        }
      }

      // RULE: On-time vs Late
      if (payment.paidAt && payment.dueDate) {
        const daysLate = Math.floor((payment.paidAt.getTime() - payment.dueDate.getTime()) / (1000 * 3600 * 24));
        if (daysLate <= 0) {
          onTimeCount++;
          computedScore += (50 * paymentWeight); // Add points for on-time
        } else if (daysLate <= 5) {
          // Grace period
          computedScore += (20 * paymentWeight);
        } else {
          // Penalty applies, late payment
          penaltyPoints += (daysLate * 2);
        }
      }
    }

    // Apply penalties and clamp
    computedScore -= penaltyPoints;

    // RULE: Tenure multiplier (caps at 1.5x after 24 months)
    const tenureMonths = rentPayments.length;
    const tenureMultiplier = Math.min(1.5, 1.0 + (tenureMonths * 0.02));
    computedScore = Math.floor(computedScore * tenureMultiplier);

    // Final boundaries
    computedScore = Math.max(300, Math.min(maxScore, computedScore));

    // Determine Tier
    let tier = 'building';
    if (computedScore >= 781) tier = 'prime';
    else if (computedScore >= 651) tier = 'strong';
    else if (computedScore >= 551) tier = 'established';
    else tier = 'emerging'; // 300-550 is considered coral/emerging

    // Check if Data Completeness is too cash heavy
    const isLimitedData = (cashPayments / paidPayments.length) > 0.5;

    // Save Score Record
    const scoreRecord = await db.rentScore.create({
      data: {
        tenantId: tenancy.tenantId,
        tenancyId: tenancy.id,
        score: computedScore,
        tier: tier,
        consistencyPct: (onTimeCount / paidPayments.length) * 100,
        tenureMonths,
        paymentMethodQuality: (verifiedUpiPayments / paidPayments.length) * 100,
        dataCompletenessPct: isLimitedData ? 50.0 : 100.0,
        totalPaymentsDue: rentPayments.length,
        onTimePayments: onTimeCount,
        verifiedUpiPayments,
        cashPayments,
        isLimitedData,
        version: 'v1.1-prd-rules'
      }
    });

    return {
      ...scoreRecord,
      disclaimer: isLimitedData ? 'Limited data scope due to high cash transaction volume.' : 'Verified RentScore.',
    };
  }
}
