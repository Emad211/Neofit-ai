'use server';

import type { EmailOtpType } from '@supabase/supabase-js';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { safeInternalPath } from '@/lib/auth/redirect';
import { setRecoveryIntent } from '@/lib/auth/recovery-intent';
import { bootstrapAccount } from '@/lib/supabase/account';
import { hasSupabasePublicEnv } from '@/lib/supabase/env';
import { createClient } from '@/lib/supabase/server';

function value(formData: FormData, name: string): string {
  return String(formData.get(name) ?? '').trim();
}

function supportedType(value: string): value is Extract<EmailOtpType, 'email' | 'recovery'> {
  return value === 'email' || value === 'recovery';
}

export async function verifyEmailLink(formData: FormData): Promise<void> {
  if (!hasSupabasePublicEnv()) redirect('/auth?error=config');

  const tokenHash = value(formData, 'token_hash');
  const typeValue = value(formData, 'type');
  const next = safeInternalPath(value(formData, 'next'), '/onboarding');
  if (!tokenHash || tokenHash.length > 4096 || !supportedType(typeValue)) {
    redirect('/auth?error=callback');
  }

  const type: EmailOtpType = typeValue;
  const supabase = await createClient();
  const { data, error } = await supabase.auth.verifyOtp({ token_hash: tokenHash, type });
  if (error || !data.user) {
    redirect(type === 'recovery' ? '/auth/recover?error=invalid-link' : '/auth?error=callback');
  }

  try {
    await bootstrapAccount(supabase, {
      userId: data.user.id,
      email: data.user.email ?? '',
      displayName: typeof data.user.user_metadata?.display_name === 'string'
        ? data.user.user_metadata.display_name
        : null,
    });
  } catch {
    console.error('NeoFit verified-email bootstrap remained incomplete after retry.');
  }

  if (type === 'recovery') {
    await setRecoveryIntent(data.user.id);
    revalidatePath('/', 'layout');
    redirect('/auth/update-password');
  }

  revalidatePath('/', 'layout');
  redirect(next);
}
