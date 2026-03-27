import { NextRequest, NextResponse } from 'next/server';
import { withAuth, AuthenticatedRequest } from '../middleware/auth';
import { ScoringService } from '../modules/scoring/scoring.service';

export async function getScore(req: NextRequest): Promise<NextResponse> {
  return withAuth(req, async (authed: AuthenticatedRequest) => {
    const { searchParams } = new URL(req.url);
    const tenancyId = searchParams.get('tenancyId');

    if (!tenancyId) {
      return NextResponse.json({ success: false, error: 'tenancyId is required' }, { status: 400 });
    }

    try {
      const scoringService = new ScoringService();
      const scoreData = await scoringService.computeScore(tenancyId);
      return NextResponse.json({ success: true, data: scoreData });
    } catch (error: any) {
      if (error.message === 'Tenancy not found') {
        return NextResponse.json({ success: false, error: 'Tenancy not found or access denied' }, { status: 404 });
      }
      console.error('[ScoreEngine Error]', error);
      return NextResponse.json({ success: false, error: 'Internal Server Error' }, { status: 500 });
    }
  }, ['tenant', 'landlord']);
}
