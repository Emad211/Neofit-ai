import 'server-only';

import { activeAuthSession } from '@/lib/auth/active-session';
import { parseOnboardingDraft } from '@/lib/onboarding/model';
import { onboardingSnapshotSha256 } from '@/lib/program-cycle/persistence';
import { hasSupabasePublicEnv } from '@/lib/supabase/env';
import type { Tables } from '@/lib/supabase/database.types';
import { createClient } from '@/lib/supabase/server';
import { parseNutritionPlanDocument, type NutritionPlanDocument } from '@/lib/nutrition-plan-core';
import { parseWorkoutPlanDocument, type WorkoutPlanDocument } from '@/lib/workout-plan-core';
import { parseProgramCycleStatus, type ProgramCycleStatus } from './core';

type ProgramCycleRow = Tables<'program_cycles'>;

export interface ProgramCycleSnapshot {
  readonly mode: 'account' | 'guest' | 'unavailable';
  readonly cycle: (ProgramCycleRow & { readonly status: ProgramCycleStatus }) | null;
  readonly workoutPlan: {
    readonly title: string;
    readonly version: number;
    readonly status: string;
    readonly document: WorkoutPlanDocument;
  } | null;
  readonly nutritionPlan: {
    readonly title: string;
    readonly version: number;
    readonly status: string;
    readonly document: NutritionPlanDocument;
  } | null;
  // True only for a generation-eligible cycle whose live onboarding draft no
  // longer matches the provenance hash pinned when the cycle was created. The
  // page uses this to route the user back to review instead of offering a
  // generate action that would fail closed on the same mismatch.
  readonly onboardingChanged: boolean;
  readonly loadError: string | null;
}

export async function loadProgramCycleSnapshot(): Promise<ProgramCycleSnapshot> {
  const emptyPlans = { workoutPlan: null, nutritionPlan: null, onboardingChanged: false } as const;
  if (!hasSupabasePublicEnv()) return { mode: 'guest', cycle: null, ...emptyPlans, loadError: null };
  const supabase = await createClient();
  const active = await activeAuthSession(supabase);
  if (!active) return { mode: 'guest', cycle: null, ...emptyPlans, loadError: null };

  const { data, error } = await supabase
    .from('program_cycles')
    .select('*')
    .eq('user_id', active.userId)
    .neq('status', 'completed')
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error) return { mode: 'unavailable', cycle: null, ...emptyPlans, loadError: 'خواندن چرخهٔ دوره انجام نشد.' };
  if (!data) return { mode: 'account', cycle: null, ...emptyPlans, loadError: null };
  const status = parseProgramCycleStatus(data.status);
  if (!status) return { mode: 'unavailable', cycle: null, ...emptyPlans, loadError: 'وضعیت چرخهٔ دوره معتبر نیست.' };

  if (!data.active_workout_plan_id || !data.active_nutrition_plan_id) {
    // Only draft/failed cycles can still be generated, so only they need the
    // provenance check. A mismatch means onboarding was re-completed after the
    // cycle was pinned; the page turns the generate action into a review prompt.
    let onboardingChanged = false;
    if (status === 'draft' || status === 'failed') {
      const onboarding = await supabase
        .from('user_onboarding')
        .select('draft,status')
        .eq('user_id', active.userId)
        .maybeSingle();
      if (!onboarding.error && onboarding.data?.status === 'completed') {
        const draft = parseOnboardingDraft(onboarding.data.draft ?? null);
        onboardingChanged = !draft || onboardingSnapshotSha256(draft) !== data.onboarding_snapshot_sha256;
      }
    }
    return { mode: 'account', cycle: { ...data, status }, ...emptyPlans, onboardingChanged, loadError: null };
  }
  const [workoutResult, nutritionResult] = await Promise.all([
    supabase.from('workout_plans').select('title,version,status,plan').eq('id', data.active_workout_plan_id).eq('user_id', active.userId).maybeSingle(),
    supabase.from('nutrition_plans').select('title,version,status,plan').eq('id', data.active_nutrition_plan_id).eq('user_id', active.userId).maybeSingle(),
  ]);
  if (workoutResult.error || nutritionResult.error || !workoutResult.data || !nutritionResult.data) {
    return { mode: 'account', cycle: { ...data, status }, ...emptyPlans, loadError: 'نسخه‌های برنامهٔ این چرخه خوانده نشدند.' };
  }
  const workoutDocument = parseWorkoutPlanDocument(workoutResult.data.plan);
  const nutritionDocument = parseNutritionPlanDocument(nutritionResult.data.plan);
  if (!workoutDocument || !nutritionDocument) {
    return { mode: 'account', cycle: { ...data, status }, ...emptyPlans, loadError: 'ساختار یکی از برنامه‌های این چرخه معتبر نیست.' };
  }
  return {
    mode: 'account',
    cycle: { ...data, status },
    workoutPlan: { ...workoutResult.data, document: workoutDocument },
    nutritionPlan: { ...nutritionResult.data, document: nutritionDocument },
    onboardingChanged: false,
    loadError: null,
  };
}
