'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { passwordsMatch, validNewPassword, validSignInPassword } from '@/lib/auth/password';
import { createClient } from '@/lib/supabase/server';

function value(formData: FormData, name: string): string {
  return String(formData.get(name) ?? '').trim();
}

async function authenticatedClient() {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.getClaims();
  if (error || !data?.claims?.sub) redirect('/auth');
  return supabase;
}

export async function changePassword(formData: FormData): Promise<void> {
  const currentPassword = value(formData, 'current_password');
  const password = value(formData, 'password');
  const confirmation = value(formData, 'password_confirmation');
  if (!validSignInPassword(currentPassword) || !validNewPassword(password) || !passwordsMatch(password, confirmation)) {
    redirect('/profile/security?error=input');
  }

  const supabase = await authenticatedClient();
  const { error } = await supabase.auth.updateUser({ password, current_password: currentPassword });
  if (error) redirect('/profile/security?error=password');

  const { error: revokeError } = await supabase.auth.signOut({ scope: 'others' });
  if (revokeError) console.warn('NeoFit could not revoke all other sessions after password change.');

  revalidatePath('/', 'layout');
  redirect('/profile/security?message=password-updated');
}

export async function signOutOtherSessions(): Promise<void> {
  const supabase = await authenticatedClient();
  const { error } = await supabase.auth.signOut({ scope: 'others' });
  if (error) redirect('/profile/security?error=sessions');
  redirect('/profile/security?message=other-sessions-revoked');
}
