import axios from 'axios';

const WHATSAPP_API_URL = process.env.WHATSAPP_API_URL ?? 'https://api.gupshup.io/sm/api/v1/msg';
const WHATSAPP_API_KEY = process.env.WHATSAPP_API_KEY ?? '';
const WHATSAPP_APP_NAME = process.env.WHATSAPP_APP_NAME ?? 'kiraaya';

// ─────────────────────────────────────────────
// Template Payloads
// All critical flows have WhatsApp-first fallback
// ─────────────────────────────────────────────

export type WhatsAppTemplate =
  | 'rent_due_reminder'
  | 'rent_paid_tenant'
  | 'rent_paid_landlord'
  | 'agreement_initiation_tenant'
  | 'agreement_signed_both'
  | 'score_updated'
  | 'dispute_update'
  | 'insurance_purchased'
  | 'payment_overdue_landlord';

interface TemplateParams {
  rent_due_reminder: {
    tenantName: string;
    amount: string;
    dueDate: string;
    paymentLink: string;
  };
  rent_paid_tenant: {
    tenantName: string;
    amount: string;
    landlordName: string;
  };
  rent_paid_landlord: {
    landlordName: string;
    tenantName: string;
    amount: string;
  };
  agreement_initiation_tenant: {
    tenantName: string;
    landlordName: string;
    kycLink: string;
  };
  agreement_signed_both: {
    recipientName: string;
    downloadLink: string;
  };
  score_updated: {
    tenantName: string;
    newScore: string;
    tier: string;
  };
  dispute_update: {
    recipientName: string;
    status: string;
    message: string;
  };
  insurance_purchased: {
    landlordName: string;
    policyNumber: string;
    units: string;
    pdfLink: string;
  };
  payment_overdue_landlord: {
    landlordName: string;
    tenantName: string;
    daysOverdue: string;
  };
}

// ─────────────────────────────────────────────
// Gupshup template message sender
// ─────────────────────────────────────────────

async function sendTemplate<T extends WhatsAppTemplate>(
  to: string,
  template: T,
  params: TemplateParams[T]
): Promise<void> {
  try {
    await axios.post(
      WHATSAPP_API_URL,
      new URLSearchParams({
        channel: 'whatsapp',
        source: WHATSAPP_APP_NAME,
        destination: `91${to}`,
        'src.name': WHATSAPP_APP_NAME,
        template: JSON.stringify({
          id: template,
          params: Object.values(params as Record<string, string>),
        }),
      }),
      { headers: { apikey: WHATSAPP_API_KEY } }
    );
  } catch (err) {
    // WhatsApp failure must never break the main flow
    console.error('[WhatsApp] Template send failed:', { template, to, err });
  }
}

// ─────────────────────────────────────────────
// Public notification functions
// ─────────────────────────────────────────────

export function sendRentDueReminder(params: {
  phone: string;
  tenantName: string;
  amountPaise: number;
  dueDate: Date;
  paymentLink: string;
}): Promise<void> {
  return sendTemplate(params.phone, 'rent_due_reminder', {
    tenantName: params.tenantName,
    amount: `₹${(params.amountPaise / 100).toLocaleString('en-IN')}`,
    dueDate: params.dueDate.toLocaleDateString('en-IN'),
    paymentLink: params.paymentLink,
  });
}

export function sendRentPaidToLandlord(params: {
  phone: string;
  landlordName: string;
  tenantName: string;
  amountPaise: number;
}): Promise<void> {
  return sendTemplate(params.phone, 'rent_paid_landlord', {
    landlordName: params.landlordName,
    tenantName: params.tenantName,
    amount: `₹${(params.amountPaise / 100).toLocaleString('en-IN')}`,
  });
}

export function sendAgreementInitiation(params: {
  phone: string;
  tenantName: string;
  landlordName: string;
  kycLink: string;
}): Promise<void> {
  return sendTemplate(params.phone, 'agreement_initiation_tenant', {
    tenantName: params.tenantName,
    landlordName: params.landlordName,
    kycLink: params.kycLink,
  });
}

export function sendAgreementSigned(params: {
  phone: string;
  recipientName: string;
  downloadLink: string;
}): Promise<void> {
  return sendTemplate(params.phone, 'agreement_signed_both', {
    recipientName: params.recipientName,
    downloadLink: params.downloadLink,
  });
}

export function sendPaymentOverduaAlert(params: {
  phone: string;
  landlordName: string;
  tenantName: string;
  daysOverdue: number;
}): Promise<void> {
  return sendTemplate(params.phone, 'payment_overdue_landlord', {
    landlordName: params.landlordName,
    tenantName: params.tenantName,
    daysOverdue: String(params.daysOverdue),
  });
}
