import {
  addNutritionRanges,
  addNutritionVectors,
  pointRange,
  scaleNutritionRange,
  scaleNutritionVector,
} from './nutrition';
import type { NutritionEstimate, NutritionRange, NutritionVector } from './types';

export interface RecipeIngredientInput {
  readonly id: string;
  readonly label: string;
  readonly estimate: NutritionEstimate;
  readonly consumedFraction?: number;
}

export interface RecipeCalculationInput {
  readonly id: string;
  readonly name: string;
  readonly ingredients: readonly RecipeIngredientInput[];
  readonly servingCount: number;
  readonly cookedYieldGrams?: number;
}

export interface RecipeCalculationResult {
  readonly id: string;
  readonly name: string;
  readonly total: NutritionEstimate;
  readonly perServing: NutritionEstimate;
  readonly per100g?: NutritionEstimate;
}

function validatePositive(value: number, label: string): void {
  if (!Number.isFinite(value) || value <= 0) {
    throw new RangeError(`${label} must be a finite positive number`);
  }
}

export function calculateRecipe(
  recipe: RecipeCalculationInput,
): RecipeCalculationResult {
  validatePositive(recipe.servingCount, 'servingCount');
  if (recipe.ingredients.length === 0) {
    throw new Error('A recipe requires at least one ingredient');
  }

  let totalGrams = 0;
  let totalCenter: NutritionVector = {};
  let totalRange: NutritionRange = pointRange({});

  for (const ingredient of recipe.ingredients) {
    const fraction = ingredient.consumedFraction ?? 1;
    if (!Number.isFinite(fraction) || fraction < 0 || fraction > 1) {
      throw new RangeError('consumedFraction must be between 0 and 1');
    }
    totalGrams += ingredient.estimate.grams * fraction;
    totalCenter = addNutritionVectors(
      totalCenter,
      scaleNutritionVector(ingredient.estimate.center, fraction),
    );
    totalRange = addNutritionRanges(
      totalRange,
      scaleNutritionRange(
        ingredient.estimate.range ?? pointRange(ingredient.estimate.center),
        fraction,
      ),
    );
  }

  const total: NutritionEstimate = {
    grams: recipe.cookedYieldGrams ?? totalGrams,
    center: totalCenter,
    range: totalRange,
  };
  const perServingFactor = 1 / recipe.servingCount;
  const perServing: NutritionEstimate = {
    grams: total.grams * perServingFactor,
    center: scaleNutritionVector(total.center, perServingFactor),
    range: scaleNutritionRange(total.range ?? pointRange(total.center), perServingFactor),
  };

  const result: RecipeCalculationResult = {
    id: recipe.id,
    name: recipe.name,
    total,
    perServing,
  };

  if (recipe.cookedYieldGrams !== undefined) {
    validatePositive(recipe.cookedYieldGrams, 'cookedYieldGrams');
    const per100gFactor = 100 / recipe.cookedYieldGrams;
    return {
      ...result,
      per100g: {
        grams: 100,
        center: scaleNutritionVector(total.center, per100gFactor),
        range: scaleNutritionRange(total.range ?? pointRange(total.center), per100gFactor),
      },
    };
  }

  return result;
}
