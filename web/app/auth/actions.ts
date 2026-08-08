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

function authError(code: 'config' | 'input' | 'credentials' | 'signup' | 'bootstrap'): never {
  redirect(`/auth?error=${code}`);
}

export async function signIn(formData: FormData): Promise<void> {
  if (!hasSupabasePublicEnv()) authError('config');

  const email = value(formData, 'email').toLowerCase();
  const password = value(formData, 'password');
  if (!validEmail(email) || password.length < 8 || password.length > 128) authError('input');

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error || !data.user) authError('credentials');

  try {
    await bootstrapAccount(supabase, {
      userId: data.user.id,
      email: data.user.email ?? email,
      displayName: typeof data.user.user_metadata?.display_name === 'string'
        ? data.user.user_metadata.display_name
        : null,
    });
  } catch {
    await supabase.auth.signOut();
    authError('bootstrap');
  }

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
      emailRedirectTo: `${publicAppUrl}/auth/callback`,
    },
  });
  if (error || !data.user) authError('signup');

  if (data.session) {
    try {
      await bootstrapAccount(supabase, {
        userId: data.user.id,
        email: data.user.email ?? email,
        displayName,
      });
    } catch {
      await supabase.auth.signOut();
      authError('bootstrap');
    }
    revalidatePath('/', 'layout');
    redirect('/today');
  }

  redirect('/auth?message=confirm');
}
