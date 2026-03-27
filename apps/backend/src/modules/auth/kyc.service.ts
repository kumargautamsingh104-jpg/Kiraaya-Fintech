import { verifyPAN, initAadhaarKYC } from '@kiraaya/integrations';
import { db } from '../../lib/db';

export class KycService {
  async verifyPan(userId: string, pan: string, name: string) {
    const result = await verifyPAN(pan, name);

    if (result.verified) {
      const { encrypt } = await import('@kiraaya/security');
      await db.user.update({
        where: { id: userId },
        data: {
          kycStatus: 'pan_verified',
          panEncrypted: encrypt(pan),
          panLast4: pan.slice(-4),
        },
      });
    }

    return result;
  }

  async initAadhaar(userId: string, userPhone: string, callbackUrl: string) {
    return initAadhaarKYC(userId, userPhone, callbackUrl);
  }
}
