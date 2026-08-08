'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { activeAuthSession } from '@/lib/auth/active-session';
import { authRedirectUrl } from '@/lib/auth/origin';
import { passwordsMatch, validNewPassword } from '@/lib/auth/password';
import { clearRecoveryIntent, hasValidRecoveryIntent } from '@/lib/auth/recovery-intent';
import { hasSupabasePublicEnv } from '@/lib/supabase/env';
import { createClient } from '@/lib/supabase/server';

function value(formData: FormData, name: string): string { return String(formData.get(name) ?? '').trim(); }
function validEmail(email: string): boolean { return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) && email.length <= 254; }

export async function requestPasswordReset(formData: FormData): Promise<void> {
  if (!hasSupabasePublicEnv()) redirect('/auth/recover?error=config');
  const email = value(formData, 'email').toLowerCase();
  if (!validEmail(email)) redirect('/auth/recover?error=input');
  try {
    const supabase = await createClient();
    const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo: authRedirectUrl('/auth/confirm?next=/auth/update-password') });
    if (error) console.warn('NeoFit password recovery email was not dispatched.');
  } catch {
    console.warn('NeoFit password recovery email was not dispatched.');
  }
  redirect('/auth/recover?message=sent');
}

export async function updateRecoveredPassword(formData: FormData): Promise<void> {
  if (!hasSupabasePublicEnv()) redirect('/auth/update-password?error=config');
  const password = value(formData, 'password');
  const confirmation = value(formData, 'password_confirmation');
  if (!validNewPassword(password) || !passwordsMatch(password, confirmation)) redirect('/auth/update-password?error=input');

  const supabase = await createClient();
  const active = await activeAuthSession(supabase);
  if (!active) {
    await clearRecoveryIntent();
    redirect('/auth/recover?error=session');
  }

  if (!(await hasValidRecoveryIntent(active.userId, active.sessionId))) {
    await clearRecoveryIntent();
    redirect('/auth/recover?error=session');
  }

  const { error } = await supabase.auth.updateUser({ password });
  if (error) redirect('/auth/update-password?error=provider');
  const { error: revokeError } = await supabase.auth.signOut({ scope: 'others' });
  if (revokeError) console.warn('NeoFit could not revoke all other sessions after password recovery.');
  await clearRecoveryIntent();
  revalidatePath('/', 'layout');
  redirect('/profile/security?message=password-updated');
}
