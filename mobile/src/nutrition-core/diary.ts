import { addNutritionRanges, addNutritionVectors, pointRange } from './nutrition';
import type { DiaryEntry, MealType, NutritionEstimate, NutritionRange, NutritionVector } from './types';

export interface DiaryDaySummary {
  readonly localDate: string;
  readonly total: NutritionEstimate;
  readonly byMeal: Readonly<Record<MealType, NutritionEstimate>>;
  readonly entryCount: number;
}

const MEAL_TYPES: readonly MealType[] = ['breakfast', 'lunch', 'dinner', 'snack'];

function emptyEstimate(): NutritionEstimate {
  return { grams: 0, center: {}, range: pointRange({}) };
}

function combineEstimates(left: NutritionEstimate, right: NutritionEstimate): NutritionEstimate {
  return {
    grams: left.grams + right.grams,
    center: addNutritionVectors(left.center, right.center),
    range: addNutritionRanges(
      left.range ?? pointRange(left.center),
      right.range ?? pointRange(right.center),
    ),
  };
}

export function upsertDiaryEntry(
  entries: readonly DiaryEntry[],
  nextEntry: DiaryEntry,
): DiaryEntry[] {
  const index = entries.findIndex((entry) => entry.id === nextEntry.id);
  if (index < 0) {
    return [...entries, nextEntry];
  }
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
  const byMealMutable: Record<MealType, NutritionEstimate> = {
    breakfast: emptyEstimate(),
    lunch: emptyEstimate(),
    dinner: emptyEstimate(),
    snack: emptyEstimate(),
  };
  let total = emptyEstimate();
  let entryCount = 0;

  for (const entry of entries) {
    if (entry.localDate !== localDate) {
      continue;
    }
    total = combineEstimates(total, entry.estimate);
    byMealMutable[entry.mealType] = combineEstimates(
      byMealMutable[entry.mealType],
      entry.estimate,
    );
    entryCount += 1;
  }

  const byMeal = Object.fromEntries(
    MEAL_TYPES.map((mealType) => [mealType, byMealMutable[mealType]]),
  ) as Record<MealType, NutritionEstimate>;

  return { localDate, total, byMeal, entryCount };
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
