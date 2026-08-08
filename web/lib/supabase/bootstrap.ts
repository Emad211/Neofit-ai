import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from './database.types';

export function safeDisplayName(
  value: string | null | undefined,
  email: string,
): string {
  const candidate = value?.trim() || email.split('@')[0] || 'کاربر نئوفیت';
  return candidate.slice(0, 80);
}

type BootstrapWriteError = { readonly message: string } | null;
type BootstrapWriteResult = { readonly error: BootstrapWriteError };

async function retryBootstrapWrite(
  operation: () => PromiseLike<BootstrapWriteResult>,
): Promise<BootstrapWriteError> {
  const first = await operation();
  if (!first.error) return null;

  await new Promise((resolve) => setTimeout(resolve, 150));
  const second = await operation();
  return second.error;
}

/**
 * Creates only identity/settings rows that have universally safe defaults.
 *
 * Nutrition goals are intentionally NOT bootstrapped. A real account must not
 * receive fabricated calorie/macronutrient targets. Goal creation belongs to a
 * later deterministic personalization contract with an explicit source.
 */
export async function bootstrapAccount(
  supabase: SupabaseClient<Database>,
  input: {
    readonly userId: string;
    readonly email: string;
    readonly displayName?: string | null;
  },
): Promise<void> {
  const displayName = safeDisplayName(input.displayName, input.email);
  const [profileError, settingsError] = await Promise.all([
    retryBootstrapWrite(() => supabase.from('profiles').upsert({
      id: input.userId,
      display_name: displayName,
      locale: 'fa',
      timezone: 'Asia/Tehran',
    }, {
      onConflict: 'id',
      ignoreDuplicates: true,
    })),
    retryBootstrapWrite(() => supabase.from('user_settings').upsert({
      user_id: input.userId,
      theme: 'system',
      units: 'metric',
    }, {
      onConflict: 'user_id',
      ignoreDuplicates: true,
    })),
  ]);

  const error = profileError ?? settingsError;
  if (error) throw error;
}
