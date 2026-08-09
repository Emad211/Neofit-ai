'use client';

import type { WorkoutDay } from '@/data/workout-fixtures';
import { createClient } from '@/lib/supabase/client';
import type { Tables } from '@/lib/supabase/database.types';
import {
  completeWorkoutSet,
  createWorkoutPlayerState,
  type WorkoutPlayerState,
  type WorkoutPosition,
} from '@/lib/workout-session';

export interface AccountWorkoutState {
  readonly sessionId: string;
  readonly player: WorkoutPlayerState;
}

type SessionRow = Pick<
  Tables<'workout_sessions'>,
  'id' | 'client_mutation_id' | 'started_at' | 'workout_plan_id' | 'workout_plan_version'
>;
type SetRow = Pick<
  Tables<'workout_sets'>,
  'exercise_id' | 'exercise_name' | 'exercise_order' | 'set_order' | 'target_reps' | 'reps' | 'weight_kg' | 'completed_at'
>;

function accountPlanProvenance(workout: WorkoutDay): { planId: string; planVersion: number } {
  if (!workout.planId || !Number.isInteger(workout.planVersion) || Number(workout.planVersion) < 1) {
    throw new Error('نسخهٔ برنامه تمرینی حساب مشخص نیست.');
  }
  return { planId: workout.planId, planVersion: Number(workout.planVersion) };
}

function mapRowsToPlayer(workout: WorkoutDay, session: SessionRow, rows: readonly SetRow[]): WorkoutPlayerState {
  let player = createWorkoutPlayerState(workout, {
    clientMutationId: session.client_mutation_id,
    startedAt: session.started_at,
  });

  for (const row of rows) {
    if (!row.completed_at || row.reps === null || row.weight_kg === null) continue;
    const position: WorkoutPosition = {
      exerciseIndex: row.exercise_order - 1,
      setIndex: row.set_order - 1,
    };
    player = {
      ...player,
      sets: player.sets.map((set) =>
        set.exerciseOrder === row.exercise_order && set.setOrder === row.set_order
          ? {
              ...set,
              exerciseId: row.exercise_id,
              exerciseName: row.exercise_name,
              targetReps: row.target_reps,
              reps: String(row.reps),
              weightKg: String(row.weight_kg),
            }
          : set,
      ),
    };
    player = completeWorkoutSet(player, position, row.completed_at);
  }
  return player;
}

async function loadActiveSession(userId: string, workout: WorkoutDay): Promise<AccountWorkoutState | null> {
  const { planId, planVersion } = accountPlanProvenance(workout);
  const supabase = createClient();
  const { data: session, error: sessionError } = await supabase
    .from('workout_sessions')
    .select('id,client_mutation_id,started_at,workout_plan_id,workout_plan_version')
    .eq('user_id', userId)
    .eq('workout_id', workout.id)
    .eq('status', 'active')
    .order('started_at', { ascending: false })
    .limit(1)
    .maybeSingle();
  if (sessionError) throw new Error('خواندن جلسه فعال تمرین ناموفق بود.');
  if (!session) return null;
  if (session.workout_plan_id !== planId || session.workout_plan_version !== planVersion) {
    throw new Error('جلسه فعال به نسخهٔ دیگری از برنامه تمرینی تعلق دارد. ابتدا آن جلسه را کامل یا لغو کن.');
  }

  const { data: rows, error: setsError } = await supabase
    .from('workout_sets')
    .select('exercise_id,exercise_name,exercise_order,set_order,target_reps,reps,weight_kg,completed_at')
    .eq('user_id', userId)
    .eq('session_id', session.id)
    .order('exercise_order', { ascending: true })
    .order('set_order', { ascending: true });
  if (setsError) throw new Error('خواندن ست‌های تمرین ناموفق بود.');
  return { sessionId: session.id, player: mapRowsToPlayer(workout, session, rows ?? []) };
}

export async function loadOrCreateAccountWorkout(userId: string, workout: WorkoutDay): Promise<AccountWorkoutState> {
  const { planId, planVersion } = accountPlanProvenance(workout);
  const existing = await loadActiveSession(userId, workout);
  if (existing) return existing;

  const player = createWorkoutPlayerState(workout);
  const supabase = createClient();
  const { data, error } = await supabase
    .from('workout_sessions')
    .insert({
      user_id: userId,
      client_mutation_id: player.clientMutationId,
      workout_id: workout.id,
      workout_title: workout.title,
      workout_plan_id: planId,
      workout_plan_version: planVersion,
      status: 'active',
      started_at: player.startedAt,
    })
    .select('id')
    .single();

  if (error) {
    // A second tab may have created the same active workout between the read and insert.
    if (error.code === '23505') {
      const raced = await loadActiveSession(userId, workout);
      if (raced) return raced;
    }
    throw new Error('ساخت جلسه تمرین در حساب ناموفق بود.');
  }
  return { sessionId: data.id, player };
}

export async function persistAccountWorkoutSet(input: {
  readonly userId: string;
  readonly sessionId: string;
  readonly state: WorkoutPlayerState;
  readonly position: WorkoutPosition;
}): Promise<void> {
  const exerciseOrder = input.position.exerciseIndex + 1;
  const setOrder = input.position.setIndex + 1;
  const set = input.state.sets.find(
    (entry) => entry.exerciseOrder === exerciseOrder && entry.setOrder === setOrder,
  );
  if (!set?.completedAt) throw new Error('ست کامل برای ذخیره پیدا نشد.');
  const reps = Number.parseInt(set.reps, 10);
  const weightKg = Number.parseFloat(set.weightKg);
  const supabase = createClient();
  const { error } = await supabase.from('workout_sets').upsert({
    session_id: input.sessionId,
    user_id: input.userId,
    exercise_id: set.exerciseId,
    exercise_name: set.exerciseName,
    exercise_order: set.exerciseOrder,
    set_order: set.setOrder,
    target_reps: set.targetReps,
    reps,
    weight_kg: weightKg,
    completed_at: set.completedAt,
  }, { onConflict: 'session_id,exercise_order,set_order' });
  if (error) throw new Error('ذخیره ست تمرین ناموفق بود.');
}

export async function completeAccountWorkout(input: {
  readonly userId: string;
  readonly sessionId: string;
  readonly completedAt: string;
  readonly durationMinutes: number;
  readonly rpe: number;
  readonly painScale: number;
  readonly notes: string;
  readonly totalVolumeKg: number;
}): Promise<void> {
  const supabase = createClient();
  const { error } = await supabase
    .from('workout_sessions')
    .update({
      status: 'completed',
      completed_at: input.completedAt,
      duration_minutes: input.durationMinutes,
      rpe: input.rpe,
      pain_scale: input.painScale,
      notes: input.notes || null,
      total_volume_kg: input.totalVolumeKg,
    })
    .eq('user_id', input.userId)
    .eq('id', input.sessionId)
    .eq('status', 'active');
  if (error) throw new Error('تکمیل جلسه تمرین در حساب ناموفق بود.');
}

export async function cancelAccountWorkout(userId: string, sessionId: string): Promise<void> {
  const supabase = createClient();
  const { error } = await supabase
    .from('workout_sessions')
    .update({ status: 'cancelled', completed_at: null })
    .eq('user_id', userId)
    .eq('id', sessionId)
    .eq('status', 'active');
  if (error) throw new Error('لغو جلسه تمرین ناموفق بود.');
}
