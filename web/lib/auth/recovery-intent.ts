import 'server-only';

import { cookies } from 'next/headers';

const COOKIE_NAME = 'neofit-recovery-intent';
const MAX_AGE_SECONDS = 15 * 60;

function valueFor(userId: string, issuedAtSeconds: number): string {
  return `${userId}.${issuedAtSeconds}`;
}

export async function setRecoveryIntent(userId: string): Promise<void> {
  const store = await cookies();
  const issuedAtSeconds = Math.floor(Date.now() / 1000);
  store.set(COOKIE_NAME, valueFor(userId, issuedAtSeconds), {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/auth/update-password',
    maxAge: MAX_AGE_SECONDS,
  });
}

export async function hasValidRecoveryIntent(userId: string): Promise<boolean> {
  const store = await cookies();
  const raw = store.get(COOKIE_NAME)?.value ?? '';
  const separator = raw.lastIndexOf('.');
  if (separator <= 0) return false;

  const storedUserId = raw.slice(0, separator);
  const issuedAtSeconds = Number(raw.slice(separator + 1));
  if (storedUserId !== userId || !Number.isSafeInteger(issuedAtSeconds)) return false;

  const age = Math.floor(Date.now() / 1000) - issuedAtSeconds;
  return age >= 0 && age <= MAX_AGE_SECONDS;
}

export async function clearRecoveryIntent(): Promise<void> {
  const store = await cookies();
  store.delete(COOKIE_NAME);
}
