import { UserRepository } from '../../repositories/user.repository';
import { generateJWT } from '../../common/security';

const userRepository = new UserRepository();

export class GoogleAuthService {
  /**
   * Google Auth Implementation (Step 11)
   * UX Goal: Minimal Friction
   */
  async handleGoogleCallback(googleProfile: any, role: 'tenant' | 'landlord') {
    const { email, sub: googleId, name, picture } = googleProfile;
    
    // 1. Check if user exists by email/googleId
    let user = await userRepository.findByEmail(email);
    
    if (!user) {
      // 2. Create new user with Google signal
      user = await userRepository.create({
        phone: 'GOOGLE_' + googleId.slice(-6), // Placeholder phone, user must verify later
        role,
        nameEncrypted: name,
        kycStatus: 'none',
        // In a real database, we'd add a 'googleId' field too
      });
    }

    // 3. Generate session token
    const token = generateJWT(user.id, user.role);
    
    return { user, token };
  }
}
