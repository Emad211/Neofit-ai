'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { activeAuthSession } from '@/lib/auth/active-session';
import { parseOnboardingDraft } from '@/lib/onboarding/model';
import { materializeProgramPlans, ProgramMaterializationError } from '@/lib/program-generation/materializer';
import {
  generateProgramPlannerSelections,
  ProgramPlannerError,
  type ProgramPlannerEvidence,
} from '@/lib/program-generation/planners';
import { discardProgramCycle, ensureProgramCycle, onboardingSnapshotSha256 } from '@/lib/program-cycle/persistence';
import { createClient } from '@/lib/supabase/server';

const GENERATION_STALE_MS = 5 * 60_000;
const RECENT_ABNORMAL_PAIN_REVIEW_THRESHOLD = 4;

function text(formData: FormData, key: string): string {
  const value = formData.get(key);
  return typeof value === 'string' ? value.trim() : '';
}

function revisionValue(value: string): number | null {
  const parsed = Number.parseInt(value, 10);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : null;
}

function generationErrorCode(error: unknown): string {
  if (error instanceof ProgramMaterializationError || error instanceof ProgramPlannerError) return error.code;
  return 'generation_failed';
}

async function recentPlannerEvidence(
  supabase: Awaited<ReturnType<typeof createClient>>,
  userId: string,
): Promise<ProgramPlannerEvidence> {
  const sessionsResult = await supabase
    .from('workout_sessions')
    .select('id,completed_at,duration_minutes,rpe,pain_scale')
    .eq('user_id', userId)
    .eq('status', 'completed')
    .order('started_at', { ascending: false })
    .limit(6);
  if (sessionsResult.error || !sessionsResult.data?.length) return {};

  const latestPainScale = sessionsResult.data[0]?.pain_scale;
  if (
    typeof latestPainScale === 'number'
    && Number.isFinite(latestPainScale)
    && latestPainScale >= RECENT_ABNORMAL_PAIN_REVIEW_THRESHOLD
  ) {
    // The workout completion form explicitly labels this as abnormal pain or
    // discomfort. Without a current body-part/restriction update we cannot
    // deterministically map that feedback to safe substitutions, so fail
    // closed before either planner request is sent.
    throw new ProgramMaterializationError('clinical_review_required');
  }

  const sessionIds = sessionsResult.data.map((session) => session.id);
  const setsResult = await supabase
    .from('workout_sets')
    .select('exercise_id')
    .eq('user_id', userId)
    .in('session_id', sessionIds)
    .not('completed_at', 'is', null)
    .limit(120);

  return {
    training: {
      completedSessions: sessionsResult.data.map((session) => ({
        completedAt: session.completed_at,
        durationMinutes: session.duration_minutes,
        rpe: session.rpe,
        painScale: session.pain_scale,
      })),
      recentExerciseIds: setsResult.error
        ? []
        : Array.from(new Set((setsResult.data ?? []).map((set) => set.exercise_id))).slice(0, 24),
    },
  };
}

export async function generateProgramCycle(formData: FormData): Promise<void> {
  const cycleId = text(formData, 'cycleId');
  const expectedRevision = revisionValue(text(formData, 'revision'));
  if (!cycleId || expectedRevision === null) redirect('/program?error=invalid_request');

  const supabase = await createClient();
  const active = await activeAuthSession(supabase);
  if (!active) redirect('/auth');

  const [cycleResult, onboardingResult] = await Promise.all([
    supabase.from('program_cycles').select('id,status,revision,onboarding_snapshot_sha256').eq('id', cycleId).eq('user_id', active.userId).maybeSingle(),
    supabase.from('user_onboarding').select('draft,status').eq('user_id', active.userId).maybeSingle(),
  ]);
  const cycle = cycleResult.data;
  const draft = parseOnboardingDraft(onboardingResult.data?.draft ?? null);
  if (
    cycleResult.error
    || onboardingResult.error
    || !cycle
    || cycle.revision !== expectedRevision
    || !['draft', 'failed'].includes(cycle.status)
    || onboardingResult.data?.status !== 'completed'
    || !draft
  ) {
    redirect('/program?error=stale_or_incomplete');
  }

  // The cycle pins the onboarding provenance hash at creation and that row is
  // immutable. If the user edited and re-completed onboarding after the cycle
  // was opened, the live draft no longer matches — building a plan from it would
  // silently misattribute its provenance (invariant 6). Recompute with the same
  // helper the cycle was created with and refuse rather than persist a lie.
  if (onboardingSnapshotSha256(draft) !== cycle.onboarding_snapshot_sha256) {
    redirect('/program?error=onboarding_snapshot_changed');
  }

  // Claim the generation revision before spending provider budget. A concurrent
  // request must lose the revision race before either planner is invoked.
  const transition = await supabase.rpc('transition_program_cycle', {
    p_cycle_id: cycle.id,
    p_expected_revision: cycle.revision,
    p_target_status: 'generating',
  });
  const generating = transition.data?.[0];
  if (transition.error || !generating) redirect('/program?error=generation_start_failed');

  let plans;
  try {
    const evidence = await recentPlannerEvidence(supabase, active.userId);
    const selections = await generateProgramPlannerSelections(draft, evidence);
    plans = materializeProgramPlans(draft, selections);
  } catch (error) {
    const failureCode = generationErrorCode(error);
    const failed = await supabase.rpc('transition_program_cycle', {
      p_cycle_id: cycle.id,
      p_expected_revision: generating.cycle_revision,
      p_target_status: 'failed',
      p_failure_code: failureCode,
    });
    // If we could not even record the failure, the cycle is still 'generating'.
    // Surface that truthfully — stale-recovery will reopen it — instead of a
    // failure banner whose retry/review actions do not match the persisted state.
    if (failed.error || !failed.data?.[0]) redirect('/program?error=generation_still_running');
    redirect(`/program?error=${encodeURIComponent(failureCode)}`);
  }

  const finalized = await supabase.rpc('finalize_program_cycle_generation', {
    p_cycle_id: cycle.id,
    p_expected_revision: generating.cycle_revision,
    p_workout_title: plans.workoutTitle,
    p_workout_plan: plans.workoutPlan,
    p_nutrition_title: plans.nutritionTitle,
    p_nutrition_plan: plans.nutritionPlan,
  });
  if (finalized.error || !finalized.data?.[0]) {
    await supabase.rpc('transition_program_cycle', {
      p_cycle_id: cycle.id,
      p_expected_revision: generating.cycle_revision,
      p_target_status: 'failed',
      p_failure_code: 'materialization_persist_failed',
    });
    redirect('/program?error=generation_persist_failed');
  }

  revalidatePath('/program');
  redirect('/program?message=plans-ready');
}

// Diverged-onboarding recovery. A draft/failed cycle pins the onboarding
// provenance hash at creation; if the user re-completes onboarding afterwards,
// generation fails closed on the mismatch and the single-open-cycle rule forbids
// opening a second cycle — the classic dead end. This discards the stale cycle
// (only draft/failed are discardable) and immediately pins a fresh one to the
// current draft, so the user leaves with a generatable cycle rather than a trap.
export async function discardAndRebuildProgramCycle(formData: FormData): Promise<void> {
  const cycleId = text(formData, 'cycleId');
  const expectedRevision = revisionValue(text(formData, 'revision'));
  if (!cycleId || expectedRevision === null) redirect('/program?error=invalid_request');

  const supabase = await createClient();
  const active = await activeAuthSession(supabase);
  if (!active) redirect('/auth');

  const [cycleResult, onboardingResult] = await Promise.all([
    supabase.from('program_cycles').select('id,status,revision').eq('id', cycleId).eq('user_id', active.userId).maybeSingle(),
    supabase.from('user_onboarding').select('draft,status,updated_at').eq('user_id', active.userId).maybeSingle(),
  ]);
  const cycle = cycleResult.data;
  const draft = parseOnboardingDraft(onboardingResult.data?.draft ?? null);
  if (
    cycleResult.error
    || onboardingResult.error
    || !cycle
    || cycle.revision !== expectedRevision
    || !['draft', 'failed'].includes(cycle.status)
    || onboardingResult.data?.status !== 'completed'
    || !draft
  ) {
    redirect('/program?error=stale_or_incomplete');
  }

  // Free the single-open slot first. The RPC refuses anything but draft/failed,
  // so this can never touch a generated or live cycle even under a forged form.
  try {
    await discardProgramCycle({ supabase, cycleId: cycle.id, expectedRevision: cycle.revision });
  } catch {
    redirect('/program?error=cycle_rebuild_failed');
  }

  // Pin a fresh cycle to the current draft. If this second step fails the user
  // simply has no open cycle; Ready is the natural place to create one, and it
  // no longer counts the just-abandoned cycle as open.
  try {
    await ensureProgramCycle({
      supabase,
      userId: active.userId,
      draft,
      onboardingUpdatedAt: onboardingResult.data.updated_at,
    });
  } catch {
    redirect('/onboarding/ready?error=cycle');
  }

  revalidatePath('/program');
  revalidatePath('/');
  redirect('/program?message=cycle-rebuilt');
}

export async function recoverProgramCycleGeneration(formData: FormData): Promise<void> {
  const cycleId = text(formData, 'cycleId');
  const expectedRevision = revisionValue(text(formData, 'revision'));
  if (!cycleId || expectedRevision === null) redirect('/program?error=invalid_request');

  const supabase = await createClient();
  const active = await activeAuthSession(supabase);
  if (!active) redirect('/auth');

  const { data: cycle, error } = await supabase
    .from('program_cycles')
    .select('id,status,revision,updated_at')
    .eq('id', cycleId)
    .eq('user_id', active.userId)
    .maybeSingle();
  if (error || !cycle || cycle.status !== 'generating' || cycle.revision !== expectedRevision) {
    redirect('/program?error=stale_or_incomplete');
  }

  const updatedAt = Date.parse(cycle.updated_at);
  if (!Number.isFinite(updatedAt) || Date.now() - updatedAt < GENERATION_STALE_MS) {
    redirect('/program?error=generation_still_running');
  }

  const result = await supabase.rpc('transition_program_cycle', {
    p_cycle_id: cycle.id,
    p_expected_revision: cycle.revision,
    p_target_status: 'failed',
    p_failure_code: 'generation_stale_recovered',
  });
  if (result.error || !result.data?.[0]) redirect('/program?error=generation_recovery_failed');

  revalidatePath('/program');
  redirect('/program?message=generation-recovered');
}

export async function activateProgramCycle(formData: FormData): Promise<void> {
  const cycleId = text(formData, 'cycleId');
  const expectedRevision = revisionValue(text(formData, 'revision'));
  if (!cycleId || expectedRevision === null) redirect('/program?error=invalid_request');

  const supabase = await createClient();
  const active = await activeAuthSession(supabase);
  if (!active) redirect('/auth');

  const result = await supabase.rpc('activate_program_cycle_plans', {
    p_cycle_id: cycleId,
    p_expected_revision: expectedRevision,
  });
  if (result.error || !result.data?.[0]) redirect('/program?error=activation_failed');

  revalidatePath('/program');
  revalidatePath('/workout');
  revalidatePath('/nutrition/plan');
  redirect('/program?message=plans-active');
}
