import crypto from 'node:crypto';
import bcrypt from 'bcryptjs';
import { SignJWT, jwtVerify } from 'jose';

// ─────────────────────────────────────────────
// AES-256-GCM Field Encryption
// ─────────────────────────────────────────────
// Key is loaded from env — never hardcoded
// Per-field IV (12 bytes) prepended to ciphertext

const ALGO = 'aes-256-gcm';
const IV_LENGTH = 12;  // 96-bit IV for GCM
const TAG_LENGTH = 16;

function getEncryptionKey(): Buffer {
  const key = process.env.FIELD_ENCRYPTION_KEY;
  if (!key || key.length !== 64) {
    throw new Error('FIELD_ENCRYPTION_KEY must be a 64-char hex string (32 bytes)');
  }
  return Buffer.from(key, 'hex');
}

export function encrypt(plaintext: string): string {
  const key = getEncryptionKey();
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv(ALGO, key, iv, { authTagLength: TAG_LENGTH });
  const encrypted = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()]);
  const tag = cipher.getAuthTag();
  // Format: iv(12) + tag(16) + ciphertext
  return Buffer.concat([iv, tag, encrypted]).toString('base64');
}

export function decrypt(ciphertext: string): string {
  const key = getEncryptionKey();
  const buf = Buffer.from(ciphertext, 'base64');
  const iv = buf.subarray(0, IV_LENGTH);
  const tag = buf.subarray(IV_LENGTH, IV_LENGTH + TAG_LENGTH);
  const encrypted = buf.subarray(IV_LENGTH + TAG_LENGTH);
  const decipher = crypto.createDecipheriv(ALGO, key, iv, { authTagLength: TAG_LENGTH });
  decipher.setAuthTag(tag);
  return decipher.update(encrypted) + decipher.final('utf8');
}

// ─────────────────────────────────────────────
// Partner API Key — bcrypt hash
// ─────────────────────────────────────────────

const BCRYPT_ROUNDS = 12;

export async function hashApiKey(rawKey: string): Promise<string> {
  return bcrypt.hash(rawKey, BCRYPT_ROUNDS);
}

export async function verifyApiKey(rawKey: string, hash: string): Promise<boolean> {
  return bcrypt.compare(rawKey, hash);
}

// ─────────────────────────────────────────────
// HMAC — Partner Request Signing
// ─────────────────────────────────────────────

export function signHMAC(payload: string, secret: string): string {
  return crypto.createHmac('sha256', secret).update(payload).digest('hex');
}

export function verifyHMAC(payload: string, signature: string, secret: string): boolean {
  const expected = signHMAC(payload, secret);
  // Constant-time comparison to prevent timing attacks
  return crypto.timingSafeEqual(Buffer.from(signature, 'hex'), Buffer.from(expected, 'hex'));
}

// ─────────────────────────────────────────────
// JWT — User Sessions
// ─────────────────────────────────────────────

export interface JwtPayload {
  sub: string;      // userId
  role: string;
  phone: string;
}

function getJwtSecret(): Uint8Array {
  const secret = process.env.JWT_SECRET;
  if (!secret || secret.length < 32) {
    throw new Error('JWT_SECRET must be at least 32 characters');
  }
  return new TextEncoder().encode(secret);
}

export async function generateJWT(payload: JwtPayload): Promise<string> {
  return new SignJWT({ role: payload.role, phone: payload.phone })
    .setProtectedHeader({ alg: 'HS256' })
    .setSubject(payload.sub)
    .setIssuedAt()
    .setExpirationTime('24h')
    .sign(getJwtSecret());
}

export async function generateRefreshToken(userId: string): Promise<string> {
  return new SignJWT({ type: 'refresh' })
    .setProtectedHeader({ alg: 'HS256' })
    .setSubject(userId)
    .setIssuedAt()
    .setExpirationTime('30d')
    .sign(getJwtSecret());
}

export async function verifyJWT(token: string): Promise<JwtPayload> {
  const { payload } = await jwtVerify(token, getJwtSecret());
  return {
    sub: payload.sub as string,
    role: payload['role'] as string,
    phone: payload['phone'] as string,
  };
}

// ─────────────────────────────────────────────
// OTP
// ─────────────────────────────────────────────

export function generateOtp(): string {
  // Cryptographically random 6-digit OTP
  const num = crypto.randomInt(100000, 999999);
  return num.toString();
}

export async function hashOtp(otp: string): Promise<string> {
  return bcrypt.hash(otp, 10);
}

export async function verifyOtp(otp: string, hash: string): Promise<boolean> {
  return bcrypt.compare(otp, hash);
}

// ─────────────────────────────────────────────
// Token generation (share links, certificates)
// ─────────────────────────────────────────────

export function generateSecureToken(length = 32): string {
  return crypto.randomBytes(length).toString('hex');
}

// ─────────────────────────────────────────────
// Razorpay webhook signature verification
// ─────────────────────────────────────────────

export function verifyRazorpayWebhook(
  rawBody: string,
  signature: string,
  secret: string
): boolean {
  const expected = crypto
    .createHmac('sha256', secret)
    .update(rawBody)
    .digest('hex');
  try {
    return crypto.timingSafeEqual(
      Buffer.from(signature, 'hex'),
      Buffer.from(expected, 'hex')
    );
  } catch {
    return false;
  }
}
