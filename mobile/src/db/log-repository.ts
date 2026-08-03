import {
  ActivityLogInput,
  WeightLogInput,
  WorkoutSetLogInput,
} from '@/domain/models';
import { getDatabase } from '@/db/database';
import {
  deleteMealLog,
  getDailySummary,
  getRecentMeals,
  logMeal,
} from '@/db/nutrition-meal-repository';
import { createId } from '@/lib/id';

// Compatibility exports for older screens and modules. All meal behavior is
// implemented only in nutrition-meal-repository, so there is one write path and
// one legacy-migration policy.
export { deleteMealLog, getDailySummary, getRecentMeals, logMeal };

export async function logActivity(input: ActivityLogInput) {
  const database = await getDatabase();
  const id = createId('activity');
  const createdAt = new Date().toISOString();

  await database.runAsync(
    `INSERT INTO activity_logs (
      id, started_at, activity_type, duration_minutes,
      intensity, calories_burned, source, created_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?);`,
    id,
    input.startedAt,
    input.activityType.trim(),
    Math.max(1, Math.round(input.durationMinutes)),
    input.intensity,
    Math.max(0, Math.round(input.caloriesBurned)),
    input.source,
    createdAt,
  );

  return id;
}

export async function logWeight(input: WeightLogInput) {
  const database = await getDatabase();
  const id = createId('weight');
  const createdAt = new Date().toISOString();

  await database.withExclusiveTransactionAsync(async (transaction) => {
    await transaction.runAsync(
      `INSERT INTO weight_logs (id, measured_at, weight_kg, created_at)
       VALUES (?, ?, ?, ?);`,
      id,
      input.measuredAt,
      input.weightKg,
      createdAt,
    );
    await transaction.runAsync(
      `UPDATE profile SET weight_kg = ?, updated_at = ? WHERE id = 1;`,
      input.weightKg,
      createdAt,
    );
  });

  return id;
}

export async function logWorkoutSession(input: {
  sessionId?: string;
  workoutPlanId?: string;
  workoutTitle: string;
  startedAt: string;
  completedAt: string;
  durationMinutes: number;
  sets: WorkoutSetLogInput[];
}) {
  const database = await getDatabase();
  const sessionId = input.sessionId?.trim() || createId('workout');
  const createdAt = new Date().toISOString();
  const totalVolumeKg = input.sets.reduce(
    (sum, set) => sum + Math.max(0, set.reps) * Math.max(0, set.weightKg),
    0,
  );

  await database.withExclusiveTransactionAsync(async (transaction) => {
    await transaction.runAsync(
      `INSERT INTO workout_sessions (
        id, workout_plan_id, workout_title, started_at, completed_at,
        duration_minutes, total_volume_kg, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(id) DO UPDATE SET
        workout_plan_id = excluded.workout_plan_id,
        workout_title = excluded.workout_title,
        started_at = excluded.started_at,
        completed_at = excluded.completed_at,
        duration_minutes = excluded.duration_minutes,
        total_volume_kg = excluded.total_volume_kg;`,
      sessionId,
      input.workoutPlanId ?? null,
      input.workoutTitle.trim(),
      input.startedAt,
      input.completedAt,
      Math.max(0, Math.round(input.durationMinutes)),
      totalVolumeKg,
      createdAt,
    );

    // A retry with the same session id replaces the set snapshot instead of
    // creating a duplicate workout. The transaction keeps session and sets in sync.
    await transaction.runAsync(
      'DELETE FROM workout_set_logs WHERE session_id = ?;',
      sessionId,
    );

    for (const set of input.sets) {
      await transaction.runAsync(
        `INSERT INTO workout_set_logs (
          id, session_id, exercise_order, exercise_name,
          set_number, reps, weight_kg
        ) VALUES (?, ?, ?, ?, ?, ?, ?);`,
        createId('set'),
        sessionId,
        set.exerciseOrder,
        set.exerciseName.trim(),
        set.setNumber,
        set.reps,
        set.weightKg,
      );
    }
  });

  return { sessionId, totalVolumeKg };
}

export async function getWeightHistory(limit = 180) {
  const database = await getDatabase();
  const safeLimit = Math.min(1_000, Math.max(1, Math.round(limit)));
  return database.getAllAsync<{
    id: string;
    measuredAt: string;
    weightKg: number;
  }>(
    `SELECT id, measured_at AS measuredAt, weight_kg AS weightKg
     FROM weight_logs ORDER BY measured_at DESC LIMIT ?;`,
    safeLimit,
  );
}

export async function getRecentActivities(limit = 50) {
  const database = await getDatabase();
  const safeLimit = Math.min(500, Math.max(1, Math.round(limit)));
  return database.getAllAsync<{
    id: string;
    startedAt: string;
    activityType: string;
    durationMinutes: number;
    intensity: string;
    caloriesBurned: number;
    source: string;
  }>(
    `SELECT
      id, started_at AS startedAt, activity_type AS activityType,
      duration_minutes AS durationMinutes, intensity,
      calories_burned AS caloriesBurned, source
     FROM activity_logs ORDER BY started_at DESC LIMIT ?;`,
    safeLimit,
  );
}

export async function getRecentWorkoutSessions(limit = 50) {
  const database = await getDatabase();
  const safeLimit = Math.min(500, Math.max(1, Math.round(limit)));
  return database.getAllAsync<{
    id: string;
    workoutPlanId: string | null;
    workoutTitle: string;
    startedAt: string;
    completedAt: string;
    durationMinutes: number;
    totalVolumeKg: number;
  }>(
    `SELECT
      id, workout_plan_id AS workoutPlanId, workout_title AS workoutTitle,
      started_at AS startedAt, completed_at AS completedAt,
      duration_minutes AS durationMinutes, total_volume_kg AS totalVolumeKg
     FROM workout_sessions ORDER BY completed_at DESC LIMIT ?;`,
    safeLimit,
  );
}

export async function deleteLog(kind: 'meal' | 'activity' | 'weight' | 'workout', id: string) {
  if (kind === 'meal') {
    await deleteMealLog(id);
    return;
  }
  const database = await getDatabase();
  const table = {
    activity: 'activity_logs',
    weight: 'weight_logs',
    workout: 'workout_sessions',
  }[kind];
  await database.runAsync(`DELETE FROM ${table} WHERE id = ?;`, id);
}
