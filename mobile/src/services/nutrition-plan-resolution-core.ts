import { NutritionPlanSchema, type NutritionPlan } from '@/domain/models';
import { createId } from '@/lib/id';
import {
  addNutritionVectors,
  roundNutritionVector,
  type NutritionVector,
} from '@/nutrition-core';

export type PlannedIngredientCategory =
  | 'produce'
  | 'fruit'
  | 'protein'
  | 'dairy'
  | 'pantry'
  | 'other';

export interface NutritionPlanDraftIngredient {
  readonly name: string;
  readonly quantity: string;
  /** Exact local IFKB alias/name or a conventional English USDA/FNDDS query. */
  readonly catalogQuery: string;
  /** Planned edible mass. It is a planning default, not a measured intake. */
  readonly grams: number;
  readonly category: PlannedIngredientCategory;
}

export interface NutritionPlanDraftMeal {
  readonly type: 'breakfast' | 'lunch' | 'dinner' | 'snack';
  readonly name: string;
  readonly ingredients: readonly NutritionPlanDraftIngredient[];
}

export interface NutritionPlanDraft {
  readonly title: string;
  readonly summary: string;
  readonly days: readonly {
    readonly dayIndex: number;
    readonly meals: readonly NutritionPlanDraftMeal[];
  }[];
  readonly safetyNotes: readonly string[];
}

export interface CatalogIngredientResolution {
  readonly source: 'ifkb' | 'fndds' | 'sr_legacy';
  readonly foodId: string;
  readonly resolvedName: string;
  readonly nutrition: NutritionVector;
}

export interface NutritionPlanCatalog {
  resolveIngredient(query: string, grams: number): Promise<CatalogIngredientResolution | null>;
}

export type NutritionPlanResolutionResult =
  | { readonly ok: true; readonly plan: NutritionPlan }
  | { readonly ok: false; readonly issues: readonly string[] };

const REQUIRED_MACROS = ['energyKcal', 'proteinG', 'carbsG', 'fatG'] as const;

export function hasCompletePlanMacros(vector: NutritionVector): boolean {
  return REQUIRED_MACROS.every((key) => {
    const value = vector[key];
    return typeof value === 'number' && Number.isFinite(value) && value >= 0;
  });
}

function buildMealNutrition(vector: NutritionVector) {
  const rounded = roundNutritionVector(vector, 1);
  if (!hasCompletePlanMacros(rounded)) return null;
  return {
    calories: Math.round(rounded.energyKcal ?? 0),
    proteinG: rounded.proteinG ?? 0,
    carbsG: rounded.carbsG ?? 0,
    fatG: rounded.fatG ?? 0,
  };
}

export async function resolveNutritionPlanDraftWithCatalog(input: {
  readonly draft: NutritionPlanDraft;
  readonly dailyCalorieTarget: number;
  readonly catalog: NutritionPlanCatalog;
  readonly createdAt?: string;
}): Promise<NutritionPlanResolutionResult> {
  const issues: string[] = [];
  const days = [];

  for (const day of [...input.draft.days].sort((left, right) => left.dayIndex - right.dayIndex)) {
    const meals = [];
    for (const meal of day.meals) {
      let total: NutritionVector = {};
      const ingredients = [];

      for (const ingredient of meal.ingredients) {
        const query = ingredient.catalogQuery.trim();
        if (!query || !Number.isFinite(ingredient.grams) || ingredient.grams <= 0) {
          issues.push(
            `dayIndex ${day.dayIndex}, meal "${meal.name}": "${ingredient.name}" needs a non-empty catalogQuery and positive grams.`,
          );
          continue;
        }

        const resolved = await input.catalog.resolveIngredient(query, ingredient.grams);
        if (!resolved) {
          issues.push(
            `dayIndex ${day.dayIndex}, meal "${meal.name}": catalogQuery "${query}" could not be resolved unambiguously in IFKB/USDA.`,
          );
          continue;
        }

        total = addNutritionVectors(total, resolved.nutrition);
        ingredients.push({
          name: ingredient.name,
          quantity: ingredient.quantity,
          category: ingredient.category,
          grams: ingredient.grams,
          catalogQuery: query,
          catalogSource: resolved.source,
          catalogFoodId: resolved.foodId,
          resolvedName: resolved.resolvedName,
        });
      }

      if (ingredients.length !== meal.ingredients.length) continue;
      const nutrition = buildMealNutrition(total);
      if (!nutrition) {
        issues.push(`dayIndex ${day.dayIndex}, meal "${meal.name}" lacks complete local calories/macros.`);
        continue;
      }

      meals.push({
        id: createId('meal'),
        type: meal.type,
        name: meal.name,
        ...nutrition,
        nutritionSource: 'ifkb_resolved' as const,
        ingredients,
      });
    }

    if (meals.length !== day.meals.length) continue;
    days.push({
      dayIndex: day.dayIndex,
      meals,
      totalCalories: meals.reduce((sum, meal) => sum + meal.calories, 0),
    });
  }

  if (issues.length > 0 || days.length !== input.draft.days.length) {
    return { ok: false, issues: issues.slice(0, 24) };
  }

  try {
    return {
      ok: true,
      plan: NutritionPlanSchema.parse({
        id: createId('nutrition-plan'),
        title: input.draft.title,
        summary: input.draft.summary,
        dailyCalorieTarget: Math.round(input.dailyCalorieTarget),
        days,
        safetyNotes: input.draft.safetyNotes,
        createdAt: input.createdAt ?? new Date().toISOString(),
      }),
    };
  } catch (error) {
    return {
      ok: false,
      issues: [error instanceof Error ? error.message : 'Resolved plan failed the local nutrition schema.'],
    };
  }
}

export function isIfkbResolvedNutritionPlan(plan: NutritionPlan): boolean {
  return plan.days.every((day) => day.meals.every((meal) => (
    meal.nutritionSource === 'ifkb_resolved'
    && meal.ingredients.every((ingredient) => (
      typeof ingredient.grams === 'number'
      && Number.isFinite(ingredient.grams)
      && ingredient.grams > 0
      && Boolean(ingredient.catalogQuery?.trim())
      && Boolean(ingredient.catalogSource)
      && Boolean(ingredient.catalogFoodId?.trim())
      && Boolean(ingredient.resolvedName?.trim())
    ))
  )));
}

export function assertIfkbResolvedNutritionPlan(plan: NutritionPlan): void {
  if (!isIfkbResolvedNutritionPlan(plan)) {
    throw new Error(
      'AI nutrition plans must be fully resolved through IFKB/USDA before they can be saved or logged.',
    );
  }
}
