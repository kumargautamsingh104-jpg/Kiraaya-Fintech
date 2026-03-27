import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { AuthService } from './auth.service';

const authService = new AuthService();

const requestSchema = z.object({ phone: z.string().min(10).max(13) });
const verifySchema = z.object({
  phone: z.string().min(10).max(13),
  otp: z.string().length(6),
});

export class AuthController {
  static async requestOTP(req: NextRequest): Promise<NextResponse> {
    try {
      const body = requestSchema.safeParse(await req.json());
      if (!body.success) {
        return NextResponse.json({ success: false, error: 'Invalid phone number' }, { status: 400 });
      }

      await authService.requestOtp(body.data.phone);
      return NextResponse.json({ success: true, message: 'OTP sent' });
    } catch (err: any) {
      return NextResponse.json({ success: false, error: err.message }, { status: 500 });
    }
  }

  static async verifyOTPAndLogin(req: NextRequest): Promise<NextResponse> {
    try {
      const body = verifySchema.safeParse(await req.json());
      if (!body.success) {
        return NextResponse.json({ success: false, error: 'Invalid input' }, { status: 400 });
      }

      const result = await authService.verifyOtpAndLogin(body.data.phone, body.data.otp);
      return NextResponse.json({ success: true, data: result });
    } catch (err: any) {
      return NextResponse.json({ success: false, error: err.message }, { status: 400 });
    }
  }
}
