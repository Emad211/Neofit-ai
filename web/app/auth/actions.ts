'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { publicAppUrl } from '@/lib/environment';
import { bootstrapAccount } from '@/lib/supabase/account';
import { hasSupabasePublicEnv } from '@/lib/supabase/env';
import { createClient } from '@/lib/supabase/server';

function value(formData: FormData, name: string): string {
  return String(formData.get(name) ?? '').trim();
}

function validEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) && email.length <= 254;
}

function authError(code: 'config' | 'input' | 'credentials' | 'signup' | 'resend'): never {
  redirect(`/auth?error=${code}`);
}

function confirmationRedirect(): string {
  return `${publicAppUrl}/auth/confirm?next=/onboarding`;
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
  if (!validEmail(email) || password.length < 8 || password.length > 128) authError('input');

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
    password.length < 8 ||
    password.length > 128
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

  const supabase = await createClient();
  const { error } = await supabase.auth.resend({
    type: 'signup',
    email,
    options: { emailRedirectTo: confirmationRedirect() },
  });
  if (error) authError('resend');
  redirect('/auth?message=resent');
}
