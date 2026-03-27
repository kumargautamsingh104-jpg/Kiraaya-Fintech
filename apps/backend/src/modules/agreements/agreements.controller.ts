import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { AgreementsService } from './agreements.service';
import { AuthenticatedRequest } from '../../middleware/auth';

const agreementsService = new AgreementsService();

const createDraftSchema = z.object({
  tenancyId: z.string().uuid(),
  templateVersion: z.string(),
  customClauses: z.string().optional(),
});

export class AgreementsController {
  static async createDraft(req: NextRequest, authed: AuthenticatedRequest): Promise<NextResponse> {
    try {
      const body = createDraftSchema.safeParse(await req.json());
      if (!body.success) return NextResponse.json({ success: false, error: 'Invalid input' }, { status: 400 });

      const result = await agreementsService.createDraft(
        body.data.tenancyId,
        body.data.templateVersion,
        body.data.customClauses
      );
      return NextResponse.json({ success: true, data: result });
    } catch (err: any) {
      return NextResponse.json({ success: false, error: err.message }, { status: 500 });
    }
  }

  static async getAgreement(req: NextRequest, authed: AuthenticatedRequest): Promise<NextResponse> {
    try {
      const { searchParams } = new URL(req.url);
      const tenancyId = searchParams.get('tenancyId');
      if (!tenancyId) return NextResponse.json({ success: false, error: 'tenancyId is required' }, { status: 400 });

      const result = await agreementsService.getAgreementByTenancy(tenancyId);
      if (!result) return NextResponse.json({ success: false, error: 'Agreement not found' }, { status: 404 });
      
      return NextResponse.json({ success: true, data: result });
    } catch (err: any) {
      return NextResponse.json({ success: false, error: err.message }, { status: 500 });
    }
  }

  static async initiateSign(req: NextRequest, authed: AuthenticatedRequest): Promise<NextResponse> {
    try {
      const { agreementId } = await req.json();
      if (!agreementId) return NextResponse.json({ success: false, error: 'agreementId is required' }, { status: 400 });

      const result = await agreementsService.initiateDigio(agreementId);
      return NextResponse.json({ success: true, data: result });
    } catch (err: any) {
      return NextResponse.json({ success: false, error: err.message }, { status: 500 });
    }
  }
}
