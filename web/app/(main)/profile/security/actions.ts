'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { activeAuthSession } from '@/lib/auth/active-session';
import { passwordsMatch, validNewPassword, validSignInPassword } from '@/lib/auth/password';
import { createClient } from '@/lib/supabase/server';

function value(formData: FormData, name: string): string {
  return String(formData.get(name) ?? '').trim();
}

function validEmail(email: string): boolean {
  if (!email || email.length > 254 || /[\s\\]/.test(email)) return false;
  const at = email.lastIndexOf('@');
  if (at <= 0 || at === email.length - 1) return false;
  const local = email.slice(0, at);
  const domain = email.slice(at + 1);
  return local.length <= 64
    && domain.length <= 253
    && domain.includes('.')
    && !domain.startsWith('.')
    && !domain.endsWith('.');
}

async function authenticatedClient() {
  const supabase = await createClient();
  const active = await activeAuthSession(supabase);
  if (!active) redirect('/auth?error=session');
  return { supabase, active };
}

export async function changePassword(formData: FormData): Promise<void> {
  const currentPassword = value(formData, 'current_password');
  const password = value(formData, 'password');
  const confirmation = value(formData, 'password_confirmation');
  if (!validSignInPassword(currentPassword) || !validNewPassword(password) || !passwordsMatch(password, confirmation)) {
    redirect('/profile/security?error=input');
  }

  const { supabase } = await authenticatedClient();
  const { error } = await supabase.auth.updateUser({ password, current_password: currentPassword });
  if (error) redirect('/profile/security?error=password');

  const { error: revokeError } = await supabase.auth.signOut({ scope: 'others' });
  if (revokeError) console.warn('NeoFit could not revoke all other sessions after password change.');

  revalidatePath('/', 'layout');
  redirect('/profile/security?message=password-updated');
}

export async function requestEmailChange(formData: FormData): Promise<void> {
  const email = value(formData, 'email').toLowerCase();
  if (!validEmail(email)) redirect('/profile/security?error=email-input');

  const { supabase, active } = await authenticatedClient();
  const currentEmail = active.user.email?.trim().toLowerCase() ?? '';
  if (!currentEmail) redirect('/profile/security?error=email-current');
  if (email === currentEmail) redirect('/profile/security?error=email-same');

  const { error } = await supabase.auth.updateUser({ email });
  if (error) redirect('/profile/security?error=email-change');
  redirect('/profile/security?message=email-change-sent');
}

export async function signOutOtherSessions(): Promise<void> {
  const { supabase } = await authenticatedClient();
  const { error } = await supabase.auth.signOut({ scope: 'others' });
  if (error) redirect('/profile/security?error=sessions');
  redirect('/profile/security?message=other-sessions-revoked');
}
