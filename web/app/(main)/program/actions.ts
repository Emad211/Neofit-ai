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
    supabase.from('program_cycles').select('id,status,revision').eq('id', cycleId).eq('user_id', active.userId).maybeSingle(),
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
    await supabase.rpc('transition_program_cycle', {
      p_cycle_id: cycle.id,
      p_expected_revision: generating.cycle_revision,
      p_target_status: 'failed',
      p_failure_code: failureCode,
    });
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
