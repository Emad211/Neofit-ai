import 'server-only';

import { createHmac, timingSafeEqual } from 'node:crypto';
import { cookies } from 'next/headers';

const COOKIE_NAME = 'neofit-recovery-intent';
const MAX_AGE_SECONDS = 15 * 60;

function cookieOptions() {
  return { httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'lax' as const, path: '/auth/update-password', maxAge: MAX_AGE_SECONDS };
}
function recoveryIntentKey(): Buffer {
  const encoded = process.env.AUTH_RECOVERY_INTENT_KEY?.trim();
  if (!encoded) throw new Error('AUTH_RECOVERY_INTENT_KEY is required for password recovery.');
  const key = Buffer.from(encoded, 'base64');
  if (key.length !== 32) throw new Error('AUTH_RECOVERY_INTENT_KEY must decode to exactly 32 bytes.');
  return key;
}
function payloadFor(userId: string, sessionId: string, issuedAtSeconds: number): string { return `${userId}.${sessionId}.${issuedAtSeconds}`; }
function signatureFor(payload: string): string { return createHmac('sha256', recoveryIntentKey()).update(payload).digest('base64url'); }
function signedValueFor(userId: string, sessionId: string, issuedAtSeconds: number): string {
  const payload = payloadFor(userId, sessionId, issuedAtSeconds);
  return `${payload}.${signatureFor(payload)}`;
}
function signaturesMatch(actual: string, expected: string): boolean {
  const left = Buffer.from(actual, 'utf8');
  const right = Buffer.from(expected, 'utf8');
  return left.length === right.length && timingSafeEqual(left, right);
}

export async function setRecoveryIntent(userId: string, sessionId: string): Promise<void> {
  const store = await cookies();
  store.set(COOKIE_NAME, signedValueFor(userId, sessionId, Math.floor(Date.now() / 1000)), cookieOptions());
}

export async function hasValidRecoveryIntent(userId: string, sessionId: string): Promise<boolean> {
  const store = await cookies();
  const raw = store.get(COOKIE_NAME)?.value ?? '';
  const parts = raw.split('.');
  if (parts.length !== 4) return false;
  const [storedUserId, storedSessionId, issuedAtRaw, actualSignature] = parts;
  const issuedAtSeconds = Number(issuedAtRaw);
  if (storedUserId !== userId || storedSessionId !== sessionId || !Number.isSafeInteger(issuedAtSeconds) || !actualSignature) return false;
  const age = Math.floor(Date.now() / 1000) - issuedAtSeconds;
  if (age < 0 || age > MAX_AGE_SECONDS) return false;
  try {
    const payload = payloadFor(storedUserId, storedSessionId, issuedAtSeconds);
    return signaturesMatch(actualSignature, signatureFor(payload));
  } catch {
    return false;
  }
}

export async function clearRecoveryIntent(): Promise<void> {
  const store = await cookies();
  store.set(COOKIE_NAME, '', { ...cookieOptions(), maxAge: 0 });
}
