import { ScoreService } from './score.service';

const scoreService = new ScoreService();

export default async function handler(req: any, res: any) {
  const { tenantId, tenancyId } = req.query;

  try {
    const score = await scoreService.computeScore(tenantId, tenancyId);
    return res.status(200).json({
      success: true,
      data: {
        score,
        tier: 'strong',
        disclaimer: 'This is an internal credit signal for Kiraaya partners only.'
      }
    });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
}
