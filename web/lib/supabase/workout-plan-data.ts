import 'server-only';

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
  readonly userId: string | null;
}

function guestSnapshot(): WorkoutPlanSnapshot {
  return {
    mode: 'guest',
    userId: null,
    planId: null,
    version: null,
    schemaVersion: WORKOUT_PLAN_SCHEMA_VERSION,
    title: null,
    source: null,
    days: [],
    loadError: null,
  };
}

function emptyAccountSnapshot(userId: string | null, loadError: string | null = null): WorkoutPlanSnapshot {
  return {
    mode: 'account',
    userId,
    planId: null,
    version: null,
    schemaVersion: WORKOUT_PLAN_SCHEMA_VERSION,
    title: null,
    source: null,
    days: [],
    loadError,
  };
}

function rowSnapshot(userId: string, row: WorkoutPlanRow): WorkoutPlanSnapshot {
  if (row.schema_version !== WORKOUT_PLAN_SCHEMA_VERSION) {
    return emptyAccountSnapshot(userId, 'این برنامه تمرینی با نسخه فعلی NeoFit سازگار نیست.');
  }
  const document = parseWorkoutPlanDocument(row.plan);
  if (!document) return emptyAccountSnapshot(userId, 'برنامه تمرینی فعلاً قابل نمایش نیست.');
  return {
    mode: 'account',
    userId,
    planId: row.id,
    version: row.version,
    schemaVersion: row.schema_version,
    title: row.title,
    source: row.source,
    days: workoutPlanViews(document, { planId: row.id, planVersion: row.version }),
    loadError: null,
  };
}

export async function loadWorkoutPlanSnapshot(): Promise<WorkoutPlanSnapshot> {
  const identity = await loadAccountIdentity();
  if (identity.loadError) {
    return {
      ...emptyAccountSnapshot(null, identity.loadError),
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
    if (result.error) return emptyAccountSnapshot(identity.account.id, 'برنامه تمرینی بارگذاری نشد.');
    if (!result.data) return emptyAccountSnapshot(identity.account.id);
    return rowSnapshot(identity.account.id, result.data);
  } catch {
    return emptyAccountSnapshot(identity.account.id, 'برنامه تمرینی در دسترس نیست.');
  }
}

export function findWorkoutInSnapshot(snapshot: WorkoutPlanSnapshot, workoutId: string) {
  return snapshot.days.find((day) => day.id === workoutId);
}
