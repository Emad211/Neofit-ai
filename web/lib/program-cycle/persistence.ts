import 'server-only';

import { createHash } from 'node:crypto';
import type { SupabaseClient } from '@supabase/supabase-js';
import {
  ONBOARDING_SCHEMA_VERSION,
  ONBOARDING_TOTAL_STEPS,
  validateOnboardingStep,
  type OnboardingDraft,
} from '@/lib/onboarding/model';
import type { Database } from '@/lib/supabase/database.types';
import {
  PROGRAM_CYCLE_SCHEMA_VERSION,
  parseProgramCycleStatus,
  type ProgramCycleStatus,
} from './core';

export class ProgramCyclePersistenceError extends Error {
  constructor() {
    super('Program Cycle could not be created or reused.');
    this.name = 'ProgramCyclePersistenceError';
  }
}

function sha256(value: string): string {
  return createHash('sha256').update(value).digest('hex');
}

// The single source of truth for a Program Cycle's onboarding provenance hash.
// Creation pins it; generation must recompute it from the live draft with the
// exact same function and refuse when it no longer matches — otherwise a plan
// could be materialized from a draft the immutable cycle row does not record.
// parseOnboardingDraft returns the validated object unchanged, so stringifying
// an unchanged `user_onboarding.draft` column is byte-stable across reads.
export function onboardingSnapshotSha256(draft: OnboardingDraft): string {
  return sha256(JSON.stringify(draft));
}

export async function ensureProgramCycle(input: {
  readonly supabase: SupabaseClient<Database>;
  readonly userId: string;
  readonly draft: OnboardingDraft;
  readonly onboardingUpdatedAt: string;
}): Promise<{ readonly id: string; readonly status: ProgramCycleStatus; readonly revision: number; readonly created: boolean }> {
  const startDate = input.draft.confirmation.startDate;
  const durationDays = input.draft.confirmation.programDurationDays;
  const validationErrors = Array.from(
    { length: ONBOARDING_TOTAL_STEPS },
    (_, index) => validateOnboardingStep(input.draft, index + 1),
  ).flat();
  const allStepsCompleted = Array.from(
    { length: ONBOARDING_TOTAL_STEPS },
    (_, index) => input.draft.completedSteps.includes(index + 1),
  ).every(Boolean);
  if (
    !startDate
    || durationDays === null
    || input.draft.version !== ONBOARDING_SCHEMA_VERSION
    || input.draft.confirmation.completedAt === null
    || validationErrors.length > 0
    || !allStepsCompleted
  ) {
    throw new ProgramCyclePersistenceError();
  }

  const snapshotSha256 = onboardingSnapshotSha256(input.draft);
  const idempotencyKey = sha256([
    `program-cycle-v${PROGRAM_CYCLE_SCHEMA_VERSION}`,
    input.userId,
    input.onboardingUpdatedAt,
    String(input.draft.version),
    startDate,
    String(durationDays),
    snapshotSha256,
  ].join('|'));

  const { data, error } = await input.supabase.rpc('ensure_program_cycle', {
    p_requested_duration_days: durationDays,
    p_start_date: startDate,
    p_onboarding_schema_version: input.draft.version,
    p_onboarding_updated_at: input.onboardingUpdatedAt,
    p_onboarding_snapshot_sha256: snapshotSha256,
    p_generation_idempotency_key: idempotencyKey,
  });
  const row = data?.[0];
  const status = parseProgramCycleStatus(row?.cycle_status);
  if (error || !row || !status) {
    throw new ProgramCyclePersistenceError();
  }
  return {
    id: row.cycle_id,
    status,
    revision: row.cycle_revision,
    created: row.created,
  };
}
