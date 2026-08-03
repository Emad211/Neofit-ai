import { pointRange, sumNutritionRangesStrict, sumNutritionVectorsStrict } from './nutrition';
import type { DiaryEntry, MealType, NutritionEstimate, NutritionRange, NutritionVector } from './types';

export interface DiaryDaySummary {
  readonly localDate: string;
  readonly total: NutritionEstimate;
  readonly byMeal: Readonly<Record<MealType, NutritionEstimate>>;
  readonly entryCount: number;
}

const MEAL_TYPES: readonly MealType[] = ['breakfast', 'lunch', 'dinner', 'snack'];

function sumKnownGrams(estimates: readonly NutritionEstimate[]): number | null {
  if (estimates.some((estimate) => estimate.grams === null)) return null;
  return estimates.reduce((sum, estimate) => sum + (estimate.grams ?? 0), 0);
}

function summarizeEstimates(estimates: readonly NutritionEstimate[]): NutritionEstimate {
  if (estimates.length === 0) {
    return { grams: 0, center: {}, range: pointRange({}) };
  }
  return {
    grams: sumKnownGrams(estimates),
    center: sumNutritionVectorsStrict(estimates.map((estimate) => estimate.center)),
    range: sumNutritionRangesStrict(
      estimates.map((estimate) => estimate.range ?? pointRange(estimate.center)),
    ),
  };
}

export function upsertDiaryEntry(
  entries: readonly DiaryEntry[],
  nextEntry: DiaryEntry,
): DiaryEntry[] {
  const index = entries.findIndex((entry) => entry.id === nextEntry.id);
  if (index < 0) return [...entries, nextEntry];
  return entries.map((entry, entryIndex) => entryIndex === index ? nextEntry : entry);
}

export function removeDiaryEntry(
  entries: readonly DiaryEntry[],
  entryId: string,
): DiaryEntry[] {
  return entries.filter((entry) => entry.id !== entryId);
}

export function summarizeDiaryDay(
  entries: readonly DiaryEntry[],
  localDate: string,
): DiaryDaySummary {
  const dayEntries = entries.filter((entry) => entry.localDate === localDate);
  const byMeal = Object.fromEntries(
    MEAL_TYPES.map((mealType) => [
      mealType,
      summarizeEstimates(dayEntries.filter((entry) => entry.mealType === mealType).map((entry) => entry.estimate)),
    ]),
  ) as Record<MealType, NutritionEstimate>;

  return {
    localDate,
    total: summarizeEstimates(dayEntries.map((entry) => entry.estimate)),
    byMeal,
    entryCount: dayEntries.length,
  };
}

export function cloneDiaryEntriesToDate(
  entries: readonly DiaryEntry[],
  sourceDate: string,
  targetDate: string,
  createId: (source: DiaryEntry, index: number) => string,
  timestamp: string,
): DiaryEntry[] {
  return entries
    .filter((entry) => entry.localDate === sourceDate)
    .map((entry, index) => ({
      ...entry,
      id: createId(entry, index),
      localDate: targetDate,
      createdAt: timestamp,
      updatedAt: timestamp,
    }));
}

export type { NutritionRange, NutritionVector };
