import { db } from '../../lib/db';
import { generateJWT } from '@kiraaya/security';

export class AuthService {
  async requestOtp(phone: string): Promise<boolean> {
    // Register or touch the user record
    await db.user.upsert({
      where: { phone },
      update: { updatedAt: new Date() },
      create: { phone, role: 'tenant' }, // Defaulting to tenant on first creation
    });

    const otp = process.env.NODE_ENV === 'production'
      ? Math.floor(100000 + Math.random() * 900000).toString()
      : '123456';

    // Store OTP in database OTP session (or user directly for MVP Phase 1)
    await db.user.update({
      where: { phone },
      data: { otpHash: otp, otpExpiresAt: new Date(Date.now() + 10 * 60 * 1000) },
    });

    return true;
  }

  async verifyOtpAndLogin(phone: string, otp: string) {
    const user = await db.user.findUnique({ where: { phone } });
    if (!user || !user.otpHash || !user.otpExpiresAt) {
      throw new Error('No OTP found');
    }

    if (user.otpExpiresAt < new Date()) {
      throw new Error('OTP expired');
    }

    if (user.otpHash !== otp) {
      throw new Error('Invalid OTP');
    }

    // Clear OTP hash and issue standard JWT
    await db.user.update({
      where: { phone },
      data: { otpHash: null, otpExpiresAt: null },
    });

    const token = await generateJWT({ sub: user.id, role: user.role, phone: user.phone });
    
    return { token, user: { id: user.id, role: user.role, phone: user.phone } };
  }
}
