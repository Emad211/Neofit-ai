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

/**
 * Creates only the missing first-account rows.
 *
 * `ignoreDuplicates` is intentional: signing in again must never reset a
 * profile name, user settings, or nutrition goals that the user has edited.
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
  const [profile, settings, goals] = await Promise.all([
    supabase.from('profiles').upsert({
      id: input.userId,
      display_name: displayName,
      locale: 'fa',
      timezone: 'Asia/Tehran',
    }, {
      onConflict: 'id',
      ignoreDuplicates: true,
    }),
    supabase.from('user_settings').upsert({
      user_id: input.userId,
      theme: 'system',
      units: 'metric',
    }, {
      onConflict: 'user_id',
      ignoreDuplicates: true,
    }),
    supabase.from('nutrition_goals').upsert({
      user_id: input.userId,
      daily: asJson(dailyTargets.daily),
      core_schema_version: NUTRITION_CORE_SCHEMA_VERSION,
    }, {
      onConflict: 'user_id',
      ignoreDuplicates: true,
    }),
  ]);

  const error = profile.error ?? settings.error ?? goals.error;
  if (error) throw error;
}
