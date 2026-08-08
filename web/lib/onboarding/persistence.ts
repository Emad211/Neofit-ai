import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database, Json } from '@/lib/supabase/database.types';
import { parseOnboardingDraft, type OnboardingDraft } from './model';

export interface RemoteOnboardingSnapshot {
  readonly draft: OnboardingDraft | null;
  readonly currentStep: number;
  readonly status: 'draft' | 'completed';
  readonly completedAt: string | null;
}

export async function loadRemoteOnboarding(
  supabase: SupabaseClient<Database>,
  userId: string,
): Promise<RemoteOnboardingSnapshot | null> {
  const { data, error } = await supabase
    .from('user_onboarding')
    .select('draft,current_step,status,completed_at')
    .eq('user_id', userId)
    .maybeSingle();
  if (error) throw error;
  if (!data) return null;
  return {
    draft: parseOnboardingDraft(data.draft),
    currentStep: data.current_step,
    status: data.status === 'completed' ? 'completed' : 'draft',
    completedAt: data.completed_at,
  };
}

export async function saveRemoteOnboarding(
  supabase: SupabaseClient<Database>,
  userId: string,
  draft: OnboardingDraft,
  currentStep: number,
) {
  const { error } = await supabase.from('user_onboarding').upsert({
    user_id: userId,
    status: 'draft',
    current_step: Math.max(1, Math.min(15, currentStep)),
    draft: draft as unknown as Json,
    schema_version: draft.version,
    completed_at: null,
  }, { onConflict: 'user_id' });
  if (error) throw error;
}

export async function completeRemoteOnboarding(
  supabase: SupabaseClient<Database>,
  userId: string,
  draft: OnboardingDraft,
) {
  const completedAt = draft.confirmation.completedAt ?? new Date().toISOString();
  const completedDraft: OnboardingDraft = {
    ...draft,
    updatedAt: completedAt,
    confirmation: { ...draft.confirmation, completedAt },
  };

  const { error: onboardingError } = await supabase.from('user_onboarding').upsert({
    user_id: userId,
    status: 'completed',
    current_step: 15,
    draft: completedDraft as unknown as Json,
    schema_version: completedDraft.version,
    completed_at: completedAt,
  }, { onConflict: 'user_id' });
  if (onboardingError) throw onboardingError;

  const [profileResult, settingsResult] = await Promise.all([
    supabase.from('profiles').upsert({ id: userId, display_name: completedDraft.basics.name.trim() || null }, { onConflict: 'id' }),
    supabase.from('user_settings').upsert({ user_id: userId, units: completedDraft.basics.unitSystem }, { onConflict: 'user_id' }),
  ]);

  return {
    draft: completedDraft,
    metadataSyncWarning: Boolean(profileResult.error || settingsResult.error),
  };
}
