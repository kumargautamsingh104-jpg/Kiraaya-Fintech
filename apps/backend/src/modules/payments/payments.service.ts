import { AuditRepository } from '../../repositories/audit.repository';
import { TenancyRepository } from '../../repositories/tenancy.repository';

const tenancyRepository = new TenancyRepository();

export class PaymentService {
  async initiateUPICollect(tenancyId: string, amountPaise: number) {
    const tenancy = await tenancyRepository.findById(tenancyId);
    if (!tenancy) throw new Error('Tenancy not found');

    // Razorpay Integration Logic (PRD §5)
    // 1. Create Razorpay Order
    // 2. Trigger UPI Intent / Collect
    console.log(`Initiating UPI Collect for Tenancy ${tenancyId}: ₹${amountPaise/100}`);
    
    await AuditRepository.log(tenancy.landlordId, 'payment.initiated', 'tenancy', tenancyId, { amountPaise });
    
    return { orderId: 'rzp_test_123', status: 'pending' };
  }

  async processWebhook(payload: any, signature: string) {
    // 1. Verify HMAC Signature
    // 2. Map payload to RentPayment
    // 3. Update DB
    // 4. Trigger Score Engine Recompute
    console.log('Processing Razorpay Webhook:', payload.id);
  }
}
