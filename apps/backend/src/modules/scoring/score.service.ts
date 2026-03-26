import { TenancyRepository } from '../repositories/tenancy.repository';

const tenancyRepository = new TenancyRepository();

export class ScoreService {
  /**
   * PRD §4: Rules for RentScore
   * - Minimum 3 payments for a valid score
   * - Cash = 0.6x weight compared to UPI
   * - DISPUTES FREEZE SCORE: If tenancy status is 'disputed', return the last known score.
   */
  async computeScore(tenantId: string, tenancyId: string) {
    const tenancy = await tenancyRepository.findById(tenancyId);
    if (!tenancy) throw new Error('Tenancy not found');

    // RULE: Dispute freeze
    if (tenancy.status === 'disputed') {
      console.log('Tenancy under dispute. Freezing score.');
      // Return last score from DB
      return await this.getLastScore(tenantId);
    }

    // Actual computation logic (previously in score-engine)
    // Here we'd pull payments and apply WEIGHTS
    // ...
  }

  private async getLastScore(tenantId: string) {
    // Logic to fetch from rent_scores table
    return 724; // Placeholder
  }
}
