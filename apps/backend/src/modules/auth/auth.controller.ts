import { UserService } from './user.service';

const userService = new UserService();

export default async function handler(req: any, res: any) {
  const { method, body } = req;

  if (method === 'POST') {
    try {
      const { phone, role } = body;
      const user = await userService.registerUser(phone, role);
      return res.status(200).json({ success: true, data: user });
    } catch (error: any) {
      return res.status(500).json({ success: false, message: error.message });
    }
  }

  return res.status(405).end();
}
