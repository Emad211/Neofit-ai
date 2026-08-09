'use server';

import type { EmailOtpType } from '@supabase/supabase-js';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { clearPendingEmailLinkToken, pendingEmailLinkToken } from '@/lib/auth/email-link-intent';
import { safeInternalPath } from '@/lib/auth/redirect';
import { hasRecoveryIntentKey, setRecoveryIntent } from '@/lib/auth/recovery-intent';
import { bootstrapAccount } from '@/lib/supabase/account';
import { hasSupabasePublicEnv } from '@/lib/supabase/env';
import { createClient } from '@/lib/supabase/server';

function value(formData: FormData, name: string): string { return String(formData.get(name) ?? '').trim(); }
function supportedType(value: string): value is Extract<EmailOtpType, 'email' | 'recovery' | 'email_change'> {
  return value === 'email' || value === 'recovery' || value === 'email_change';
}

function invalidLinkDestination(type: string): string {
  if (type === 'recovery') return '/auth/recover?error=invalid-link';
  if (type === 'email_change') return '/profile/security?error=email-change-link';
  return '/auth?error=callback';
}

export async function verifyEmailLink(formData: FormData): Promise<void> {
  if (!hasSupabasePublicEnv()) redirect('/auth?error=config');

  const tokenHash = await pendingEmailLinkToken();
  const typeValue = value(formData, 'type');
  const defaultNext = typeValue === 'email_change' ? '/profile/security' : '/onboarding';
  const next = safeInternalPath(value(formData, 'next'), defaultNext);
  if (!tokenHash || !supportedType(typeValue)) {
    await clearPendingEmailLinkToken();
    redirect(invalidLinkDestination(typeValue));
  }

  // Recovery needs a server signing key after verification. Refuse before
  // consuming the one-time Supabase token if that local contract is not ready.
  if (typeValue === 'recovery' && !hasRecoveryIntentKey()) {
    redirect('/auth/recover?error=config');
  }

  const type: EmailOtpType = typeValue;
  const supabase = await createClient();
  const { data, error } = await supabase.auth.verifyOtp({ token_hash: tokenHash, type });
  await clearPendingEmailLinkToken();
  if (error || !data.user) redirect(invalidLinkDestination(type));

  try {
    await bootstrapAccount(supabase, {
      userId: data.user.id,
      email: data.user.email ?? '',
      displayName: typeof data.user.user_metadata?.display_name === 'string' ? data.user.user_metadata.display_name : null,
    });
  } catch {
    console.error('NeoFit verified-email bootstrap remained incomplete after retry.');
  }

  if (type === 'recovery') {
    const { data: claimsData, error: claimsError } = await supabase.auth.getClaims();
    const sessionId = typeof claimsData?.claims?.session_id === 'string' ? claimsData.claims.session_id : null;
    if (claimsError || !sessionId) {
      await supabase.auth.signOut({ scope: 'local' });
      redirect('/auth/recover?error=session');
    }
    await setRecoveryIntent(data.user.id, sessionId);
    revalidatePath('/', 'layout');
    redirect('/auth/update-password');
  }

  revalidatePath('/', 'layout');
  if (type === 'email_change') redirect('/profile/security?message=email-changed');
  redirect(next);
}
