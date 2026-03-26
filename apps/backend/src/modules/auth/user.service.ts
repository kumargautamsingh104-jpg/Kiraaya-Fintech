import { UserRepository } from './user.repository';
import { encrypt } from '../common/security';

const userRepository = new UserRepository();

export class UserService {
  async registerUser(phone: string, role: 'tenant' | 'landlord') {
    const existing = await userRepository.findByPhone(phone);
    if (existing) return existing;

    return await userRepository.create({
      phone,
      role,
      kycStatus: 'none',
    });
  }

  async verifyPAN(userId: string, pan: string, name: string) {
    // In a real app, this would call Digio API
    // Then we update the user with the masked last 4
    return await userRepository.update(userId, {
      nameEncrypted: name,
      panEncrypted: pan,
      panLast4: pan.slice(-4),
      kycStatus: 'pan_verified',
    });
  }
}
