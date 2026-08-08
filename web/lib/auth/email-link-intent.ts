import 'server-only';

import { cookies } from 'next/headers';

export const EMAIL_LINK_TOKEN_COOKIE = 'neofit-email-link-token';
export const EMAIL_LINK_TOKEN_MAX_AGE_SECONDS = 10 * 60;

export function emailLinkTokenCookieOptions() {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax' as const,
    path: '/auth/verify',
    maxAge: EMAIL_LINK_TOKEN_MAX_AGE_SECONDS,
  };
}

export async function pendingEmailLinkToken(): Promise<string | null> {
  const store = await cookies();
  const token = store.get(EMAIL_LINK_TOKEN_COOKIE)?.value?.trim();
  return token && token.length <= 4096 ? token : null;
}

export async function clearPendingEmailLinkToken(): Promise<void> {
  const store = await cookies();
  store.set(EMAIL_LINK_TOKEN_COOKIE, '', {
    ...emailLinkTokenCookieOptions(),
    maxAge: 0,
  });
}
