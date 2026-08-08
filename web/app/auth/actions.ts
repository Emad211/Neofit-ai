'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { authRedirectUrl } from '@/lib/auth/origin';
import { validNewPassword, validSignInPassword } from '@/lib/auth/password';
import { bootstrapAccount } from '@/lib/supabase/account';
import { hasSupabasePublicEnv } from '@/lib/supabase/env';
import { createClient } from '@/lib/supabase/server';

function value(formData: FormData, name: string): string {
  return String(formData.get(name) ?? '').trim();
}

function validEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) && email.length <= 254;
}

function authError(code: 'config' | 'input' | 'credentials' | 'signup'): never {
  redirect(`/auth?error=${code}`);
}

function confirmationRedirect(): string {
  try {
    return authRedirectUrl('/auth/confirm?next=/onboarding');
  } catch {
    authError('config');
  }
}

async function bootstrapWithoutDestroyingSession(
  supabase: Awaited<ReturnType<typeof createClient>>,
  input: { userId: string; email: string; displayName?: string | null },
): Promise<void> {
  try {
    await bootstrapAccount(supabase, input);
  } catch {
    // Authentication already succeeded. A partial first-account bootstrap is
    // recoverable and idempotent, so never destroy a valid user session here.
    console.error('NeoFit account bootstrap remained incomplete after retry.');
  }
}

export async function signIn(formData: FormData): Promise<void> {
  if (!hasSupabasePublicEnv()) authError('config');

  const email = value(formData, 'email').toLowerCase();
  const password = value(formData, 'password');
  if (!validEmail(email) || !validSignInPassword(password)) authError('input');

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error || !data.user) authError('credentials');

  await bootstrapWithoutDestroyingSession(supabase, {
    userId: data.user.id,
    email: data.user.email ?? email,
    displayName: typeof data.user.user_metadata?.display_name === 'string'
      ? data.user.user_metadata.display_name
      : null,
  });

  revalidatePath('/', 'layout');
  redirect('/today');
}

export async function signUp(formData: FormData): Promise<void> {
  if (!hasSupabasePublicEnv()) authError('config');

  const displayName = value(formData, 'display_name');
  const email = value(formData, 'email').toLowerCase();
  const password = value(formData, 'password');
  if (
    displayName.length < 1 ||
    displayName.length > 80 ||
    !validEmail(email) ||
    !validNewPassword(password)
  ) {
    authError('input');
  }

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { display_name: displayName },
      emailRedirectTo: confirmationRedirect(),
    },
  });
  if (error || !data.user) authError('signup');

  if (data.session) {
    await bootstrapWithoutDestroyingSession(supabase, {
      userId: data.user.id,
      email: data.user.email ?? email,
      displayName,
    });
    revalidatePath('/', 'layout');
    redirect('/onboarding');
  }

  redirect('/auth?message=confirm');
}

export async function resendConfirmation(formData: FormData): Promise<void> {
  if (!hasSupabasePublicEnv()) authError('config');

  const email = value(formData, 'email').toLowerCase();
  if (!validEmail(email)) authError('input');

  try {
    const supabase = await createClient();
    const { error } = await supabase.auth.resend({
      type: 'signup',
      email,
      options: { emailRedirectTo: confirmationRedirect() },
    });
    if (error) console.warn('NeoFit confirmation resend was not dispatched.');
  } catch {
    console.warn('NeoFit confirmation resend was not dispatched.');
  }

  // Do not reveal whether an address exists or is currently unconfirmed.
  redirect('/auth?message=resent-generic');
}
