import { AuditRepository } from '../../repositories/audit.repository';
import { TenancyRepository } from '../../repositories/tenancy.repository';

const tenancyRepository = new TenancyRepository();

export class DisputeService {
  async raiseDispute(userId: string, tenancyId: string, paymentId: string, proofS3Keys: string[]) {
    // 1. Log the dispute
    // 2. FREEZE score for the tenure (handled in ScoreService)
    // 3. Update tenancy status
    await tenancyRepository.updateStatus(tenancyId, 'disputed');
    
    await AuditRepository.log(userId, 'dispute.raised', 'payment', paymentId, { proofS3Keys });
    
    return { success: true, message: 'Dispute raised. Scoring frozen.' };
  }
}
