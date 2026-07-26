import {
  NUTRIENT_KEYS,
  type FoodVariant,
  type NutritionEstimate,
  type NutritionModifier,
  type NutritionRange,
  type NutritionVector,
  type NutrientKey,
  type ServingInput,
} from './types';

function assertFiniteNonNegative(value: number, label: string): void {
  if (!Number.isFinite(value) || value < 0) {
    throw new RangeError(`${label} must be a finite non-negative number`);
  }
}

export function validateNutritionVector(vector: NutritionVector): void {
  for (const nutrient of NUTRIENT_KEYS) {
    const value = vector[nutrient];
    if (value !== undefined) {
      assertFiniteNonNegative(value, nutrient);
    }
  }
}

export function scaleNutritionVector(
  vector: NutritionVector,
  factor: number,
): NutritionVector {
  assertFiniteNonNegative(factor, 'factor');
  const scaled: NutritionVector = {};
  for (const nutrient of NUTRIENT_KEYS) {
    const value = vector[nutrient];
    if (value !== undefined) {
      scaled[nutrient] = value * factor;
    }
  }
  return scaled;
}

export function addNutritionVectors(
  left: NutritionVector,
  right: NutritionVector,
): NutritionVector {
  const result: NutritionVector = {};
  for (const nutrient of NUTRIENT_KEYS) {
    const leftValue = left[nutrient];
    const rightValue = right[nutrient];
    if (leftValue !== undefined || rightValue !== undefined) {
      result[nutrient] = (leftValue ?? 0) + (rightValue ?? 0);
    }
  }
  return result;
}

export function scaleNutritionRange(
  range: NutritionRange,
  factor: number,
): NutritionRange {
  return {
    p10: scaleNutritionVector(range.p10, factor),
    p50: scaleNutritionVector(range.p50, factor),
    p90: scaleNutritionVector(range.p90, factor),
  };
}

export function addNutritionRanges(
  left: NutritionRange,
  right: NutritionRange,
): NutritionRange {
  return {
    p10: addNutritionVectors(left.p10, right.p10),
    p50: addNutritionVectors(left.p50, right.p50),
    p90: addNutritionVectors(left.p90, right.p90),
  };
}

export function pointRange(vector: NutritionVector): NutritionRange {
  return { p10: { ...vector }, p50: { ...vector }, p90: { ...vector } };
}

export function servingToGrams(
  variant: FoodVariant,
  serving: ServingInput,
): number {
  if (serving.kind === 'grams') {
    assertFiniteNonNegative(serving.grams, 'grams');
    return serving.grams;
  }

  assertFiniteNonNegative(serving.count, 'portion count');
  const portion = variant.portions.find((item) => item.id === serving.portionId);
  if (portion === undefined) {
    throw new Error(`Unknown portion ${serving.portionId} for variant ${variant.id}`);
  }
  assertFiniteNonNegative(portion.gramWeight, 'portion gram weight');
  return portion.gramWeight * serving.count;
}

export function calculateVariantNutrition(
  variant: FoodVariant,
  serving: ServingInput,
  modifiers: readonly NutritionModifier[] = [],
): NutritionEstimate {
  validateNutritionVector(variant.nutrientsPer100g);
  const grams = servingToGrams(variant, serving);
  const factor = grams / 100;

  let center = scaleNutritionVector(variant.nutrientsPer100g, factor);
  let range = variant.nutrientRangePer100g === undefined
    ? pointRange(center)
    : scaleNutritionRange(variant.nutrientRangePer100g, factor);

  for (const modifier of modifiers) {
    validateNutritionVector(modifier.additiveNutrition);
    center = addNutritionVectors(center, modifier.additiveNutrition);
    range = addNutritionRanges(
      range,
      modifier.additiveRange ?? pointRange(modifier.additiveNutrition),
    );
  }

  return { grams, center, range };
}

export function roundNutritionVector(
  vector: NutritionVector,
  decimals = 1,
): NutritionVector {
  if (!Number.isInteger(decimals) || decimals < 0 || decimals > 6) {
    throw new RangeError('decimals must be an integer between 0 and 6');
  }
  const factor = 10 ** decimals;
  const result: NutritionVector = {};
  for (const nutrient of NUTRIENT_KEYS) {
    const value = vector[nutrient];
    if (value !== undefined) {
      result[nutrient] = Math.round(value * factor) / factor;
    }
  }
  return result;
}

export function getNutrient(
  vector: NutritionVector,
  nutrient: NutrientKey,
): number | null {
  return vector[nutrient] ?? null;
}
