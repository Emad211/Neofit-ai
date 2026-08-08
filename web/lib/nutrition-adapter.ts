import {
  calculateGoalProgress,
  calculateRecipe,
  calculateVariantNutrition,
  legacyCatalogFoodToDocument,
  normalizePersianText,
  summarizeDiaryDay,
  type DiaryEntry,
  type LegacyCatalogFood,
  type MealType,
  type NutritionEstimate,
  type NutritionGoals,
  type NutritionVector,
} from '@neofit/nutrition-core';

export interface WebMacroSet {
  readonly calories: number;
  readonly proteinG: number;
  readonly carbsG: number;
  readonly fatG: number;
}

export interface WebDiarySourceItem {
  readonly foodId: string;
  readonly portionCount: number;
}

export interface WebDiarySeed {
  readonly id: string;
  readonly label: string;
  readonly mealType: MealType;
  readonly portionText: string;
  readonly items: readonly WebDiarySourceItem[];
}

export interface WebDiaryEntry {
  readonly core: DiaryEntry;
  readonly mealLabelFa: string;
  readonly portionText: string;
  readonly macros: WebMacroSet;
}

export interface WebFoodEstimate {
  readonly estimate: NutritionEstimate;
  readonly macros: WebMacroSet;
  readonly variantId: string;
  readonly portionId: string;
}

interface WebDiarySummaryBase {
  readonly macros: WebMacroSet;
  readonly grams: number | null;
  readonly entryCount: number;
}

export interface ConfiguredWebDiarySummary extends WebDiarySummaryBase {
  readonly targets: WebMacroSet;
  readonly remainingCalories: number;
  readonly calorieProgressPercent: number;
  readonly targetsConfigured: true;
}

export interface UnconfiguredWebDiarySummary extends WebDiarySummaryBase {
  readonly targets: null;
  readonly remainingCalories: null;
  readonly calorieProgressPercent: null;
  readonly targetsConfigured: false;
}

export type WebDiarySummary = ConfiguredWebDiarySummary | UnconfiguredWebDiarySummary;

const MEAL_LABELS_FA: Readonly<Record<MealType, string>> = {
  breakfast: 'صبحانه',
  lunch: 'ناهار',
  dinner: 'شام',
  snack: 'میان‌وعده',
};

function requiredFiniteNutrient(
  vector: NutritionVector,
  key: 'energyKcal' | 'proteinG' | 'carbsG' | 'fatG',
): number {
  const value = vector[key];
  if (value === undefined || !Number.isFinite(value)) {
    throw new Error(`${key} is missing from the Web macro view`);
  }
  return value;
}

function webMacrosFromVector(vector: NutritionVector): WebMacroSet {
  return {
    calories: requiredFiniteNutrient(vector, 'energyKcal'),
    proteinG: requiredFiniteNutrient(vector, 'proteinG'),
    carbsG: requiredFiniteNutrient(vector, 'carbsG'),
    fatG: requiredFiniteNutrient(vector, 'fatG'),
  };
}

function resolveFood(
  foods: readonly LegacyCatalogFood[],
  foodId: string,
): LegacyCatalogFood {
  const food = foods.find((item) => item.id === foodId);
  if (!food) throw new Error(`Web fixture food ${foodId} is unresolved`);
  return food;
}

export function mealTypeLabelFa(mealType: MealType): string {
  return MEAL_LABELS_FA[mealType];
}

export function webMacrosFromEstimate(estimate: NutritionEstimate): WebMacroSet {
  return webMacrosFromVector(estimate.center);
}

export function estimateWebFood(
  food: LegacyCatalogFood,
  portionCount: number,
): WebFoodEstimate {
  const document = legacyCatalogFoodToDocument(food);
  const portion = document.variant.portions[0];
  if (!portion) throw new Error(`Food ${food.id} has no standard portion`);
  const estimate = calculateVariantNutrition(document.variant, {
    kind: 'portion',
    portionId: portion.id,
    count: portionCount,
  });
  return {
    estimate,
    macros: webMacrosFromEstimate(estimate),
    variantId: document.variant.id,
    portionId: portion.id,
  };
}

export function createWebDiaryEntry(input: {
  readonly id: string;
  readonly label: string;
  readonly mealType: MealType;
  readonly portionText: string;
  readonly items: readonly WebDiarySourceItem[];
  readonly foods: readonly LegacyCatalogFood[];
  readonly localDate: string;
  readonly timestamp: string;
}): WebDiaryEntry {
  if (input.items.length === 0) {
    throw new Error('A Web diary entry requires at least one source food');
  }

  const ingredients = input.items.map((item, index) => {
    const food = resolveFood(input.foods, item.foodId);
    const calculated = estimateWebFood(food, item.portionCount);
    return {
      id: `${input.id}:ingredient:${index}`,
      label: food.nameFa,
      estimate: calculated.estimate,
      variantId: calculated.variantId,
    };
  });

  const estimate = ingredients.length === 1
    ? ingredients[0]!.estimate
    : calculateRecipe({
        id: `${input.id}:recipe`,
        name: input.label,
        ingredients: ingredients.map(({ id, label, estimate: ingredientEstimate }) => ({
          id,
          label,
          estimate: ingredientEstimate,
        })),
        servingCount: 1,
      }).total;

  const core: DiaryEntry = {
    id: input.id,
    localDate: input.localDate,
    mealType: input.mealType,
    label: input.label,
    sourceType: ingredients.length === 1 ? 'food' : 'recipe',
    sourceId: ingredients.length === 1
      ? ingredients[0]!.variantId
      : `${input.id}:recipe`,
    estimate,
    createdAt: input.timestamp,
    updatedAt: input.timestamp,
  };

  return {
    core,
    mealLabelFa: mealTypeLabelFa(input.mealType),
    portionText: input.portionText,
    macros: webMacrosFromEstimate(estimate),
  };
}

export function buildInitialWebDiary(input: {
  readonly foods: readonly LegacyCatalogFood[];
  readonly seeds: readonly WebDiarySeed[];
  readonly localDate: string;
  readonly timestamp: string;
}): WebDiaryEntry[] {
  return input.seeds.map((seed) => createWebDiaryEntry({
    ...seed,
    foods: input.foods,
    localDate: input.localDate,
    timestamp: input.timestamp,
  }));
}

export function summarizeWebDiary(
  entries: readonly WebDiaryEntry[],
  localDate: string,
  goals: NutritionGoals,
): ConfiguredWebDiarySummary;
export function summarizeWebDiary(
  entries: readonly WebDiaryEntry[],
  localDate: string,
  goals: null,
): UnconfiguredWebDiarySummary;
export function summarizeWebDiary(
  entries: readonly WebDiaryEntry[],
  localDate: string,
  goals: NutritionGoals | null,
): WebDiarySummary;
export function summarizeWebDiary(
  entries: readonly WebDiaryEntry[],
  localDate: string,
  goals: NutritionGoals | null,
): WebDiarySummary {
  const summary = summarizeDiaryDay(entries.map((entry) => entry.core), localDate);
  const macros = webMacrosFromEstimate(summary.total);

  if (!goals) {
    return {
      macros,
      targets: null,
      grams: summary.total.grams,
      entryCount: summary.entryCount,
      remainingCalories: null,
      calorieProgressPercent: null,
      targetsConfigured: false,
    };
  }

  // A non-null goal must contain the four Web macro targets. Invalid persisted
  // goals fail closed here instead of silently becoming a fabricated target.
  const targets = webMacrosFromVector(goals.daily);
  const progress = calculateGoalProgress(summary.total.center, goals);
  const energy = progress.find((item) => item.nutrient === 'energyKcal');
  if (!energy || energy.ratio === null || energy.remaining === null) {
    throw new Error('energyKcal goal progress is unavailable');
  }

  return {
    macros,
    targets,
    grams: summary.total.grams,
    entryCount: summary.entryCount,
    remainingCalories: Math.max(0, energy.remaining),
    calorieProgressPercent: Math.min(100, Math.max(0, Math.round(energy.ratio * 100))),
    targetsConfigured: true,
  };
}

export function filterWebFoods<T extends LegacyCatalogFood>(
  foods: readonly T[],
  query: string,
): T[] {
  const normalizedQuery = normalizePersianText(query);
  if (!normalizedQuery) return [...foods];

  return foods.filter((food) => {
    const searchable = [
      food.nameFa,
      food.nameEn,
      ...food.aliasesFa,
      ...food.aliasesEn,
    ].map(normalizePersianText);
    return searchable.some((value) => value.includes(normalizedQuery));
  });
}
