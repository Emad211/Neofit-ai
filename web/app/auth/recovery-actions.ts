'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { authRedirectUrl } from '@/lib/auth/origin';
import { passwordsMatch, validNewPassword } from '@/lib/auth/password';
import { clearRecoveryIntent, hasValidRecoveryIntent } from '@/lib/auth/recovery-intent';
import { hasSupabasePublicEnv } from '@/lib/supabase/env';
import { createClient } from '@/lib/supabase/server';

function value(formData: FormData, name: string): string {
  return String(formData.get(name) ?? '').trim();
}

function validEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) && email.length <= 254;
}

export async function requestPasswordReset(formData: FormData): Promise<void> {
  if (!hasSupabasePublicEnv()) redirect('/auth/recover?error=config');

  const email = value(formData, 'email').toLowerCase();
  if (!validEmail(email)) redirect('/auth/recover?error=input');

  try {
    const supabase = await createClient();
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: authRedirectUrl('/auth/confirm?next=/auth/update-password'),
    });
    if (error) console.warn('NeoFit password recovery email was not dispatched.');
  } catch {
    console.warn('NeoFit password recovery email was not dispatched.');
  }

  // Always use the same response to avoid disclosing account existence.
  redirect('/auth/recover?message=sent');
}

export async function updateRecoveredPassword(formData: FormData): Promise<void> {
  if (!hasSupabasePublicEnv()) redirect('/auth/update-password?error=config');

  const password = value(formData, 'password');
  const confirmation = value(formData, 'password_confirmation');
  if (!validNewPassword(password) || !passwordsMatch(password, confirmation)) {
    redirect('/auth/update-password?error=input');
  }

  const supabase = await createClient();
  const { data: claimsData, error: claimsError } = await supabase.auth.getClaims();
  const userId = typeof claimsData?.claims?.sub === 'string' ? claimsData.claims.sub : null;
  if (claimsError || !userId) {
    await clearRecoveryIntent();
    redirect('/auth/recover?error=session');
  }

  if (!(await hasValidRecoveryIntent(userId))) {
    await clearRecoveryIntent();
    redirect('/auth/recover?error=session');
  }

  const { error } = await supabase.auth.updateUser({ password });
  if (error) redirect('/auth/update-password?error=provider');

  // A successful recovery should invalidate refresh tokens on other devices
  // while keeping this just-recovered session active.
  const { error: revokeError } = await supabase.auth.signOut({ scope: 'others' });
  if (revokeError) console.warn('NeoFit could not revoke all other sessions after password recovery.');

  await clearRecoveryIntent();
  revalidatePath('/', 'layout');
  redirect('/profile?message=password-updated');
}
