import { getDatabase } from '@/db/database';
import {
  deleteNutritionDiaryEntry,
  listNutritionDiaryEntries,
  saveNutritionDiaryEntry,
  summarizeNutritionDiaryDate,
} from '@/db/nutrition-diary-repository';
import type { MealLogInput } from '@/domain/models';
import { createId } from '@/lib/id';
import type { DiaryEntry, NutritionVector } from '@/nutrition-core';

function localDateFromDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function localDateFromIso(value: string): string {
  const date = new Date(value);
  if (!Number.isFinite(date.getTime())) throw new Error('Meal timestamp is invalid.');
  return localDateFromDate(date);
}

function mealSourceType(source: MealLogInput['source']): DiaryEntry['sourceType'] {
  return source === 'manual' ? 'custom' : 'food';
}

export async function logMeal(input: MealLogInput): Promise<string> {
  const now = new Date();
  const eatenAt = new Date(input.eatenAt);
  if (!Number.isFinite(eatenAt.getTime())) throw new Error('Meal timestamp is invalid.');
  const id = createId('meal');
  const center: NutritionVector = {
    energyKcal: Math.max(0, Math.round(input.calories)),
    proteinG: Math.max(0, input.proteinG),
    carbsG: Math.max(0, input.carbsG),
    fatG: Math.max(0, input.fatG),
  };
  await saveNutritionDiaryEntry({
    id,
    localDate: localDateFromDate(eatenAt),
    mealType: input.mealType,
    label: input.description.trim(),
    sourceType: mealSourceType(input.source),
    sourceId: `meal-input:${input.source}`,
    estimate: { grams: null, center },
    createdAt: now.toISOString(),
    updatedAt: now.toISOString(),
  });
  return id;
}

export async function getDailySummary(startIso: string, endIso: string) {
  const database = await getDatabase();
  const localDate = localDateFromIso(startIso);
  const [nutrition, activity, workout] = await Promise.all([
    summarizeNutritionDiaryDate(localDate),
    database.getFirstAsync<{
      duration_minutes: number | null;
      calories_burned: number | null;
      count: number;
    }>(
      `SELECT SUM(duration_minutes) AS duration_minutes,
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
      `SELECT SUM(duration_minutes) AS duration_minutes,
              SUM(total_volume_kg) AS total_volume_kg,
              COUNT(*) AS count
       FROM workout_sessions WHERE completed_at >= ? AND completed_at < ?;`,
      startIso,
      endIso,
    ),
  ]);

  return {
    nutrition: {
      calories: Number(nutrition.total.center.energyKcal ?? 0),
      proteinG: Number(nutrition.total.center.proteinG ?? 0),
      carbsG: Number(nutrition.total.center.carbsG ?? 0),
      fatG: Number(nutrition.total.center.fatG ?? 0),
      count: nutrition.entryCount,
    },
    activity: {
      durationMinutes: Number(activity?.duration_minutes ?? 0),
      caloriesBurned: Number(activity?.calories_burned ?? 0),
      count: Number(activity?.count ?? 0),
    },
    workout: {
      durationMinutes: Number(workout?.duration_minutes ?? 0),
      totalVolumeKg: Number(workout?.total_volume_kg ?? 0),
      count: Number(workout?.count ?? 0),
    },
  };
}

export async function getRecentMeals(limit = 50) {
  const safeLimit = Math.min(500, Math.max(1, Math.round(limit)));
  const entries = await listNutritionDiaryEntries({ limit: safeLimit });
  return entries.map((entry) => ({
    id: entry.id,
    eatenAt: entry.createdAt,
    mealType: entry.mealType,
    description: entry.label,
    calories: Number(entry.estimate.center.energyKcal ?? 0),
    proteinG: Number(entry.estimate.center.proteinG ?? 0),
    carbsG: Number(entry.estimate.center.carbsG ?? 0),
    fatG: Number(entry.estimate.center.fatG ?? 0),
    source: entry.sourceType,
  }));
}

export async function deleteMealLog(id: string): Promise<boolean> {
  return deleteNutritionDiaryEntry(id);
}
