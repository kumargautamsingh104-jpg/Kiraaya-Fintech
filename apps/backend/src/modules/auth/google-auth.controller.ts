import { GoogleAuthService } from './google-auth.service';

const googleAuthService = new GoogleAuthService();

export default async function handler(req: any, res: any) {
  const { method, body } = req;

  if (method === 'POST') {
    try {
      // In a real prod app, the frontend sends the Google ID Token
      const { idToken, role } = body;
      
      // Mock validation for MVP
      const mockProfile = { email: 'user@gmail.com', sub: '123456789', name: 'Gautam' };
      const result = await googleAuthService.handleGoogleCallback(mockProfile, role);
      
      return res.status(200).json({ success: true, data: result });
    } catch (error: any) {
      return res.status(500).json({ success: false, message: error.message });
    }
  }

  return res.status(405).end();
}
