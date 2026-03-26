import { PaymentService } from './payments.service';

const paymentService = new PaymentService();

export default async function handler(req: any, res: any) {
  const { method, body } = req;

  if (method === 'POST') {
    try {
      const { tenancyId, amountPaise } = body;
      const result = await paymentService.initiateUPICollect(tenancyId, amountPaise);
      return res.status(200).json({ success: true, data: result });
    } catch (error: any) {
      return res.status(500).json({ success: false, message: error.message });
    }
  }

  return res.status(405).end();
}
