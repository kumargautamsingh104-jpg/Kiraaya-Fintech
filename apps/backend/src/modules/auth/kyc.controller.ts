import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { KycService } from './kyc.service';
import { AuthenticatedRequest } from '../../middleware/auth';

const kycService = new KycService();

const panSchema = z.object({
  pan: z.string().length(10),
  name: z.string().min(3),
});

export class KycController {
  static async verifyPanRoute(req: NextRequest, authed: AuthenticatedRequest): Promise<NextResponse> {
    try {
      const body = panSchema.safeParse(await req.json());
      if (!body.success) return NextResponse.json({ success: false, error: 'Invalid input' }, { status: 400 });

      const result = await kycService.verifyPan(authed.userId, body.data.pan, body.data.name);
      return NextResponse.json({ success: true, data: result });
    } catch (err: any) {
      return NextResponse.json({ success: false, error: 'Server error' }, { status: 500 });
    }
  }

  static async initAadhaarRoute(req: NextRequest, authed: AuthenticatedRequest): Promise<NextResponse> {
    try {
      const callbackUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/kyc/callback`;
      const result = await kycService.initAadhaar(authed.userId, authed.userPhone ?? '', callbackUrl);
      return NextResponse.json({ success: true, data: result });
    } catch (err: any) {
      return NextResponse.json({ success: false, error: 'Server error' }, { status: 500 });
    }
  }
}

