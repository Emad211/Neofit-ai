'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { activeAuthSession } from '@/lib/auth/active-session';
import { parseOnboardingDraft } from '@/lib/onboarding/model';
import { materializeProgramPlans, ProgramMaterializationError } from '@/lib/program-generation/materializer';
import { createClient } from '@/lib/supabase/server';

function text(formData: FormData, key: string): string {
  const value = formData.get(key);
  return typeof value === 'string' ? value.trim() : '';
}

function revisionValue(value: string): number | null {
  const parsed = Number.parseInt(value, 10);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : null;
}

function generationErrorCode(error: unknown): string {
  if (error instanceof ProgramMaterializationError) return error.code;
  return 'generation_failed';
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

  let plans;
  try {
    plans = materializeProgramPlans(draft);
  } catch (error) {
    redirect(`/program?error=${encodeURIComponent(generationErrorCode(error))}`);
  }

  const transition = await supabase.rpc('transition_program_cycle', {
    p_cycle_id: cycle.id,
    p_expected_revision: cycle.revision,
    p_target_status: 'generating',
  });
  const generating = transition.data?.[0];
  if (transition.error || !generating) redirect('/program?error=generation_start_failed');

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
