import type { LegacyCatalogFood, MealType } from '@neofit/nutrition-core';
import type { Json } from '@/lib/supabase/database.types';

export const NUTRITION_PLAN_SCHEMA_VERSION = 1;
export const MAX_NUTRITION_PLAN_DAYS = 14;
export const MAX_NUTRITION_PLAN_MEALS_PER_DAY = 8;
export const MAX_NUTRITION_PLAN_ITEMS_PER_MEAL = 16;

const MEAL_TYPES: readonly MealType[] = ['breakfast', 'lunch', 'dinner', 'snack'];
const FORBIDDEN_NUTRITION_CLAIM_KEYS = new Set([
  'calories',
  'macros',
  'energyKcal',
  'proteinG',
  'carbsG',
  'fatG',
  'nutrition',
  'estimate',
]);

export interface NutritionPlanItemDocument {
  readonly foodId: string;
  readonly sourceVersion: string;
  readonly portionCount: number;
}

export interface NutritionPlanMealDocument {
  readonly id: string;
  readonly mealType: MealType;
  readonly label: string;
  readonly items: readonly NutritionPlanItemDocument[];
}

export interface NutritionPlanDayDocument {
  readonly id: string;
  readonly day: string;
  readonly title: string;
  readonly meals: readonly NutritionPlanMealDocument[];
}

export interface NutritionPlanDocument {
  readonly days: readonly NutritionPlanDayDocument[];
}

export interface ResolvedNutritionPlanItem {
  readonly foodId: string;
  readonly nameFa: string;
  readonly portionLabelFa: string;
  readonly sourceVersion: string;
  readonly portionCount: number;
}

export interface ResolvedNutritionPlanMeal {
  readonly id: string;
  readonly mealType: MealType;
  readonly label: string;
  readonly items: readonly ResolvedNutritionPlanItem[];
}

export interface ResolvedNutritionPlanDay {
  readonly id: string;
  readonly day: string;
  readonly title: string;
  readonly meals: readonly ResolvedNutritionPlanMeal[];
}

function object(value: Json | undefined): { [key: string]: Json | undefined } | null {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
    ? value as { [key: string]: Json | undefined }
    : null;
}

function containsForbiddenClaims(record: { [key: string]: Json | undefined }): boolean {
  return Object.keys(record).some((key) => FORBIDDEN_NUTRITION_CLAIM_KEYS.has(key));
}

function text(value: Json | undefined, maxLength: number): string | null {
  return typeof value === 'string' && value.trim().length >= 1 && value.length <= maxLength
    ? value.trim()
    : null;
}

function positivePortion(value: Json | undefined): number | null {
  return typeof value === 'number' && Number.isFinite(value) && value > 0 && value <= 20
    ? value
    : null;
}

function mealType(value: Json | undefined): MealType | null {
  return typeof value === 'string' && MEAL_TYPES.includes(value as MealType)
    ? value as MealType
    : null;
}

function parseItem(value: Json): NutritionPlanItemDocument | null {
  const record = object(value);
  if (!record || containsForbiddenClaims(record)) return null;
  const foodId = text(record.foodId, 180);
  const sourceVersion = text(record.sourceVersion, 180);
  const portionCount = positivePortion(record.portionCount);
  if (!foodId || !sourceVersion || portionCount === null) return null;
  return { foodId, sourceVersion, portionCount };
}

function parseMeal(value: Json): NutritionPlanMealDocument | null {
  const record = object(value);
  if (!record || containsForbiddenClaims(record)) return null;
  const id = text(record.id, 160);
  const type = mealType(record.mealType);
  const label = text(record.label, 180);
  if (!id || !type || !label || !Array.isArray(record.items)) return null;
  if (record.items.length < 1 || record.items.length > MAX_NUTRITION_PLAN_ITEMS_PER_MEAL) return null;
  const items = record.items.map(parseItem);
  if (items.some((item) => item === null)) return null;
  return { id, mealType: type, label, items: items as NutritionPlanItemDocument[] };
}

function parseDay(value: Json): NutritionPlanDayDocument | null {
  const record = object(value);
  if (!record || containsForbiddenClaims(record)) return null;
  const id = text(record.id, 160);
  const day = text(record.day, 80);
  const title = text(record.title, 180);
  if (!id || !day || !title || !Array.isArray(record.meals)) return null;
  if (record.meals.length < 1 || record.meals.length > MAX_NUTRITION_PLAN_MEALS_PER_DAY) return null;
  const meals = record.meals.map(parseMeal);
  if (meals.some((meal) => meal === null)) return null;
  const parsedMeals = meals as NutritionPlanMealDocument[];
  if (new Set(parsedMeals.map((meal) => meal.id)).size !== parsedMeals.length) return null;
  return { id, day, title, meals: parsedMeals };
}

export function parseNutritionPlanDocument(value: Json): NutritionPlanDocument | null {
  const record = object(value);
  if (!record || containsForbiddenClaims(record) || !Array.isArray(record.days)) return null;
  if (record.days.length < 1 || record.days.length > MAX_NUTRITION_PLAN_DAYS) return null;
  const days = record.days.map(parseDay);
  if (days.some((day) => day === null)) return null;
  const parsedDays = days as NutritionPlanDayDocument[];
  if (new Set(parsedDays.map((day) => day.id)).size !== parsedDays.length) return null;

  const mealIds = parsedDays.flatMap((day) => day.meals.map((meal) => meal.id));
  if (new Set(mealIds).size !== mealIds.length) return null;

  return { days: parsedDays };
}

export function resolveNutritionPlanDocument(
  document: NutritionPlanDocument,
  foods: readonly LegacyCatalogFood[],
): readonly ResolvedNutritionPlanDay[] | null {
  const catalog = new Map(foods.map((food) => [food.id, food]));
  const days: ResolvedNutritionPlanDay[] = [];

  for (const day of document.days) {
    const meals: ResolvedNutritionPlanMeal[] = [];
    for (const meal of day.meals) {
      const items: ResolvedNutritionPlanItem[] = [];
      for (const item of meal.items) {
        const food = catalog.get(item.foodId);
        if (!food || food.sourceVersion !== item.sourceVersion) return null;
        items.push({
          foodId: food.id,
          nameFa: food.nameFa,
          portionLabelFa: food.portionLabelFa,
          sourceVersion: item.sourceVersion,
          portionCount: item.portionCount,
        });
      }
      meals.push({ id: meal.id, mealType: meal.mealType, label: meal.label, items });
    }
    days.push({ id: day.id, day: day.day, title: day.title, meals });
  }

  return days;
}
