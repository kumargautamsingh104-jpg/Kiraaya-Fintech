import axios from 'axios';

const MSG91_AUTH_KEY = process.env.MSG91_AUTH_KEY ?? '';
const MSG91_TEMPLATE_ID = process.env.MSG91_TEMPLATE_ID ?? '';

const msg91 = axios.create({
  baseURL: 'https://api.msg91.com/api/v5',
  headers: {
    authkey: MSG91_AUTH_KEY,
    'Content-Type': 'application/json',
  },
});

export async function sendOTP(phone: string, otp: string): Promise<boolean> {
  try {
    // MSG91 OTP API
    await msg91.post('/otp', {
      template_id: MSG91_TEMPLATE_ID,
      mobile: `91${phone}`,
      otp: otp,
    });
    return true;
  } catch (err) {
    console.error('[MSG91] Failed to send OTP:', err);
    return false;
  }
}

export async function verifyOTP(phone: string, otp: string): Promise<boolean> {
  try {
    const resp = await msg91.get('/otp/verify', {
      params: {
        mobile: `91${phone}`,
        otp: otp,
      },
    });
    return resp.data.type === 'success';
  } catch (err) {
    console.error('[MSG91] Failed to verify OTP:', err);
    return false;
  }
}
