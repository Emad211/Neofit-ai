import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database, Json } from '@/lib/supabase/database.types';
import {
  ONBOARDING_TOTAL_STEPS,
  normalizeOnboardingDraft,
  type OnboardingDraft,
} from './model';

export class OnboardingConflictError extends Error {
  constructor() {
    super('Onboarding was updated by another session.');
    this.name = 'OnboardingConflictError';
  }
}

export interface RemoteOnboardingSnapshot {
  readonly draft: OnboardingDraft | null;
  readonly currentStep: number;
  readonly status: 'draft' | 'completed';
  readonly completedAt: string | null;
  readonly schemaVersion: number;
  readonly migratedFromVersion: number | null;
  readonly databaseUpdatedAt: string;
}

type RemoteWriteResult = {
  readonly databaseUpdatedAt: string;
};

export async function loadRemoteOnboarding(
  supabase: SupabaseClient<Database>,
  userId: string,
): Promise<RemoteOnboardingSnapshot | null> {
  const { data, error } = await supabase
    .from('user_onboarding')
    .select('draft,current_step,status,completed_at,schema_version,updated_at')
    .eq('user_id', userId)
    .maybeSingle();
  if (error) throw error;
  if (!data) return null;
  const normalized = normalizeOnboardingDraft(data.draft);
  return {
    draft: normalized?.draft ?? null,
    currentStep: data.current_step,
    status: data.status === 'completed' ? 'completed' : 'draft',
    completedAt: data.completed_at,
    schemaVersion: data.schema_version,
    migratedFromVersion: normalized?.migratedFromVersion ?? null,
    databaseUpdatedAt: data.updated_at,
  };
}

async function writeRemoteOnboarding(
  supabase: SupabaseClient<Database>,
  input: {
    readonly userId: string;
    readonly draft: OnboardingDraft;
    readonly currentStep: number;
    readonly status: 'draft' | 'completed';
    readonly completedAt: string | null;
    readonly expectedDatabaseUpdatedAt: string | null;
  },
): Promise<RemoteWriteResult> {
  const payload = {
    user_id: input.userId,
    status: input.status,
    current_step: Math.max(1, Math.min(ONBOARDING_TOTAL_STEPS, input.currentStep)),
    draft: input.draft as unknown as Json,
    schema_version: input.draft.version,
    completed_at: input.completedAt,
  };

  if (input.expectedDatabaseUpdatedAt) {
    const { data, error } = await supabase
      .from('user_onboarding')
      .update(payload)
      .eq('user_id', input.userId)
      .eq('updated_at', input.expectedDatabaseUpdatedAt)
      .select('updated_at')
      .maybeSingle();
    if (error) throw error;
    if (!data) throw new OnboardingConflictError();
    return { databaseUpdatedAt: data.updated_at };
  }

  const { data, error } = await supabase
    .from('user_onboarding')
    .insert(payload)
    .select('updated_at')
    .single();
  if (error) {
    if (error.code === '23505') throw new OnboardingConflictError();
    throw error;
  }
  return { databaseUpdatedAt: data.updated_at };
}

export async function saveRemoteOnboarding(
  supabase: SupabaseClient<Database>,
  userId: string,
  draft: OnboardingDraft,
  currentStep: number,
  expectedDatabaseUpdatedAt: string | null,
): Promise<RemoteWriteResult> {
  return writeRemoteOnboarding(supabase, {
    userId,
    draft,
    currentStep,
    status: 'draft',
    completedAt: null,
    expectedDatabaseUpdatedAt,
  });
}

export async function completeRemoteOnboarding(
  supabase: SupabaseClient<Database>,
  userId: string,
  draft: OnboardingDraft,
  expectedDatabaseUpdatedAt: string | null,
) {
  const completedAt = draft.confirmation.completedAt ?? new Date().toISOString();
  const completedDraft: OnboardingDraft = {
    ...draft,
    updatedAt: completedAt,
    confirmation: { ...draft.confirmation, completedAt },
  };

  const write = await writeRemoteOnboarding(supabase, {
    userId,
    draft: completedDraft,
    currentStep: ONBOARDING_TOTAL_STEPS,
    status: 'completed',
    completedAt,
    expectedDatabaseUpdatedAt,
  });

  const [profileResult, settingsResult] = await Promise.all([
    supabase.from('profiles').upsert({ id: userId, display_name: completedDraft.basics.name.trim() || null }, { onConflict: 'id' }),
    supabase.from('user_settings').upsert({ user_id: userId, units: completedDraft.basics.unitSystem }, { onConflict: 'user_id' }),
  ]);

  return {
    draft: completedDraft,
    databaseUpdatedAt: write.databaseUpdatedAt,
    metadataSyncWarning: Boolean(profileResult.error || settingsResult.error),
  };
}
