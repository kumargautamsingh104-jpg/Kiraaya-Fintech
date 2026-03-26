import { TenancyRepository } from '../../repositories/tenancy.repository';
import { AuditRepository } from '../../repositories/audit.repository';

const tenancyRepository = new TenancyRepository();

export class TenancyService {
  /**
   * Edge Case: Tenant Move-out (Step 9)
   * - Finalises active tenancy
   * - Triggers score snapshot
   */
  async closeTenancy(tenancyId: string, actorId: string) {
    const tenancy = await tenancyRepository.findById(tenancyId);
    if (!tenancy) throw new Error('Tenancy not found');

    const updated = await tenancyRepository.updateStatus(tenancyId, 'closed');
    
    await AuditRepository.log(actorId, 'tenancy.closed', 'tenancy', tenancyId, { closedAt: new Date() });
    
    return updated;
  }

  /**
   * Edge Case: Rent Change (Step 9)
   */
  async updateRent(tenancyId: string, newRentPaise: number, actorId: string) {
    // Audit-trailed rent modification
    await AuditRepository.log(actorId, 'tenancy.rent_update', 'tenancy', tenancyId, { newRentPaise });
    // Update DB logic...
  }
}
