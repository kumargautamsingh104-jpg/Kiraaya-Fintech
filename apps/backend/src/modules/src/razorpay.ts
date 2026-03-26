import Razorpay from 'razorpay';

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID ?? '',
  key_secret: process.env.RAZORPAY_KEY_SECRET ?? '',
});

// ─────────────────────────────────────────────
// UPI Collect Request
// Sends a collect request to tenant's UPI VPA / linked bank account
// ─────────────────────────────────────────────

export async function createUPICollect(params: {
  tenantPhone: string;
  amountPaise: number;
  tenancyId: string;
  periodMonth: number;
  periodYear: number;
  landlordName: string;
}): Promise<{ orderId: string; razorpayOrderId: string }> {
  const order = await razorpay.orders.create({
    amount: params.amountPaise,
    currency: 'INR',
    receipt: `rent-${params.tenancyId}-${params.periodYear}-${params.periodMonth}`,
    notes: {
      tenancy_id: params.tenancyId,
      period_month: String(params.periodMonth),
      period_year: String(params.periodYear),
      landlord_name: params.landlordName,
      payment_type: 'rent',
    },
  });

  return {
    orderId: order.id,
    razorpayOrderId: order.id,
  };
}

// ─────────────────────────────────────────────
// Generic payment order (for agreements, insurance)
// ─────────────────────────────────────────────

export async function createPaymentOrder(params: {
  amountPaise: number;
  description: string;
  receipt: string;
  notes?: Record<string, string>;
}): Promise<{ orderId: string }> {
  const order = await razorpay.orders.create({
    amount: params.amountPaise,
    currency: 'INR',
    receipt: params.receipt,
    notes: params.notes ?? {},
  });
  return { orderId: order.id };
}

// ─────────────────────────────────────────────
// Fetch payment details
// ─────────────────────────────────────────────

export async function fetchPayment(paymentId: string) {
  return razorpay.payments.fetch(paymentId);
}

// Export razorpay instance for server actions that need it
export { razorpay };
