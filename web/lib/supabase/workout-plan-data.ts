import 'server-only';

import { workoutPlan as guestWorkoutPlan } from '@/data/workout-fixtures';
import {
  WORKOUT_PLAN_SCHEMA_VERSION,
  parseWorkoutPlanDocument,
  workoutPlanViews,
  type WorkoutPlanView,
} from '@/lib/workout-plan-core';
import { loadAccountIdentity } from './account';
import { createClient } from './server';
import type { Tables } from './database.types';

type WorkoutPlanRow = Tables<'workout_plans'>;

export interface WorkoutPlanSnapshot extends Omit<WorkoutPlanView, 'mode'> {
  readonly mode: 'account' | 'guest' | 'unavailable';
}

function guestSnapshot(): WorkoutPlanSnapshot {
  return {
    mode: 'guest',
    planId: null,
    version: null,
    schemaVersion: WORKOUT_PLAN_SCHEMA_VERSION,
    title: 'برنامه نمونه مهمان',
    source: 'demo',
    days: guestWorkoutPlan,
    loadError: null,
  };
}

function emptyAccountSnapshot(loadError: string | null = null): WorkoutPlanSnapshot {
  return {
    mode: 'account',
    planId: null,
    version: null,
    schemaVersion: WORKOUT_PLAN_SCHEMA_VERSION,
    title: null,
    source: null,
    days: [],
    loadError,
  };
}

function rowSnapshot(row: WorkoutPlanRow): WorkoutPlanSnapshot {
  if (row.schema_version !== WORKOUT_PLAN_SCHEMA_VERSION) {
    return emptyAccountSnapshot('نسخهٔ برنامه تمرینی با این نسخه از NeoFit سازگار نیست.');
  }
  const document = parseWorkoutPlanDocument(row.plan);
  if (!document) return emptyAccountSnapshot('ساختار برنامه تمرینی حساب معتبر نیست.');
  return {
    mode: 'account',
    planId: row.id,
    version: row.version,
    schemaVersion: row.schema_version,
    title: row.title,
    source: row.source,
    days: workoutPlanViews(document),
    loadError: null,
  };
}

export async function loadWorkoutPlanSnapshot(): Promise<WorkoutPlanSnapshot> {
  const identity = await loadAccountIdentity();
  if (identity.loadError) {
    return {
      ...emptyAccountSnapshot(identity.loadError),
      mode: 'unavailable',
    };
  }
  if (!identity.account) return guestSnapshot();

  try {
    const supabase = await createClient();
    const result = await supabase
      .from('workout_plans')
      .select('*')
      .eq('user_id', identity.account.id)
      .eq('status', 'active')
      .maybeSingle();
    if (result.error) return emptyAccountSnapshot('خواندن برنامه تمرینی حساب ناموفق بود.');
    if (!result.data) return emptyAccountSnapshot();
    return rowSnapshot(result.data);
  } catch {
    return emptyAccountSnapshot('برنامه تمرینی حساب در دسترس نبود.');
  }
}

export function findWorkoutInSnapshot(snapshot: WorkoutPlanSnapshot, workoutId: string) {
  return snapshot.days.find((day) => day.id === workoutId);
}
