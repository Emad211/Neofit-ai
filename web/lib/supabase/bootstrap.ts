import { NUTRITION_CORE_SCHEMA_VERSION } from '@neofit/nutrition-core';
import type { SupabaseClient } from '@supabase/supabase-js';
import { dailyTargets } from '@/data/fixtures';
import type { Database, Json } from './database.types';

function asJson(value: unknown): Json {
  return JSON.parse(JSON.stringify(value)) as Json;
}

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

  // First-account writes are idempotent. A single short retry absorbs transient
  // Auth/Data API propagation failures without adding requests to healthy logins.
  await new Promise((resolve) => setTimeout(resolve, 150));
  const second = await operation();
  return second.error;
}

/**
 * Creates only the missing first-account rows.
 *
 * `ignoreDuplicates` is intentional: signing in again must never reset a
 * profile name, user settings, or nutrition goals that the user has edited.
 * Healthy bootstraps still use three parallel writes. Only a failed write is
 * retried once, so normal request cost is unchanged.
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
  const [profileError, settingsError, goalsError] = await Promise.all([
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
    retryBootstrapWrite(() => supabase.from('nutrition_goals').upsert({
      user_id: input.userId,
      daily: asJson(dailyTargets.daily),
      core_schema_version: NUTRITION_CORE_SCHEMA_VERSION,
    }, {
      onConflict: 'user_id',
      ignoreDuplicates: true,
    })),
  ]);

  const error = profileError ?? settingsError ?? goalsError;
  if (error) throw error;
}
