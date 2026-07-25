import {
  ActivityLogInput,
  MealLogInput,
  WeightLogInput,
  WorkoutSetLogInput,
} from '@/domain/models';
import { getDatabase } from '@/db/database';
import { createId } from '@/lib/id';

export async function logMeal(input: MealLogInput) {
  const database = await getDatabase();
  const id = createId('meal');
  const createdAt = new Date().toISOString();

  await database.runAsync(
    `INSERT INTO meal_logs (
      id, eaten_at, meal_type, description, calories,
      protein_g, carbs_g, fat_g, source, created_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?);`,
    id,
    input.eatenAt,
    input.mealType,
    input.description.trim(),
    Math.max(0, Math.round(input.calories)),
    Math.max(0, input.proteinG),
    Math.max(0, input.carbsG),
    Math.max(0, input.fatG),
    input.source,
    createdAt,
  );

  return id;
}

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
  workoutPlanId?: string;
  workoutTitle: string;
  startedAt: string;
  completedAt: string;
  durationMinutes: number;
  sets: WorkoutSetLogInput[];
}) {
  const database = await getDatabase();
  const sessionId = createId('workout');
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
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?);`,
      sessionId,
      input.workoutPlanId ?? null,
      input.workoutTitle.trim(),
      input.startedAt,
      input.completedAt,
      Math.max(0, Math.round(input.durationMinutes)),
      totalVolumeKg,
      createdAt,
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

export async function getDailySummary(startIso: string, endIso: string) {
  const database = await getDatabase();
  const [meal, activity, workout] = await Promise.all([
    database.getFirstAsync<{
      calories: number | null;
      protein_g: number | null;
      carbs_g: number | null;
      fat_g: number | null;
      count: number;
    }>(
      `SELECT
        SUM(calories) AS calories,
        SUM(protein_g) AS protein_g,
        SUM(carbs_g) AS carbs_g,
        SUM(fat_g) AS fat_g,
        COUNT(*) AS count
       FROM meal_logs WHERE eaten_at >= ? AND eaten_at < ?;`,
      startIso,
      endIso,
    ),
    database.getFirstAsync<{
      duration_minutes: number | null;
      calories_burned: number | null;
      count: number;
    }>(
      `SELECT
        SUM(duration_minutes) AS duration_minutes,
        SUM(calories_burned) AS calories_burned,
        COUNT(*) AS count
       FROM activity_logs WHERE started_at >= ? AND started_at < ?;`,
      startIso,
      endIso,
    ),
    database.getFirstAsync<{
      duration_minutes: number | null;
      total_volume_kg: number | null;
      count: number;
    }>(
      `SELECT
        SUM(duration_minutes) AS duration_minutes,
        SUM(total_volume_kg) AS total_volume_kg,
        COUNT(*) AS count
       FROM workout_sessions WHERE completed_at >= ? AND completed_at < ?;`,
      startIso,
      endIso,
    ),
  ]);

  return {
    nutrition: {
      calories: Number(meal?.calories || 0),
      proteinG: Number(meal?.protein_g || 0),
      carbsG: Number(meal?.carbs_g || 0),
      fatG: Number(meal?.fat_g || 0),
      count: Number(meal?.count || 0),
    },
    activity: {
      durationMinutes: Number(activity?.duration_minutes || 0),
      caloriesBurned: Number(activity?.calories_burned || 0),
      count: Number(activity?.count || 0),
    },
    workout: {
      durationMinutes: Number(workout?.duration_minutes || 0),
      totalVolumeKg: Number(workout?.total_volume_kg || 0),
      count: Number(workout?.count || 0),
    },
  };
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

export async function getRecentMeals(limit = 50) {
  const database = await getDatabase();
  const safeLimit = Math.min(500, Math.max(1, Math.round(limit)));
  return database.getAllAsync<{
    id: string;
    eatenAt: string;
    mealType: string;
    description: string;
    calories: number;
    proteinG: number;
    carbsG: number;
    fatG: number;
    source: string;
  }>(
    `SELECT
      id, eaten_at AS eatenAt, meal_type AS mealType, description,
      calories, protein_g AS proteinG, carbs_g AS carbsG,
      fat_g AS fatG, source
     FROM meal_logs ORDER BY eaten_at DESC LIMIT ?;`,
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
  const database = await getDatabase();
  const table = {
    meal: 'meal_logs',
    activity: 'activity_logs',
    weight: 'weight_logs',
    workout: 'workout_sessions',
  }[kind];
  await database.runAsync(`DELETE FROM ${table} WHERE id = ?;`, id);
}
