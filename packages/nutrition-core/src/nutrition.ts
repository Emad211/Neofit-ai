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

function assertFinitePositive(value: number, label: string): void {
  if (!Number.isFinite(value) || value <= 0) {
    throw new RangeError(`${label} must be a finite positive number`);
  }
}

/**
 * Removes binary floating-point noise without applying display-level rounding.
 * Fifteen significant digits retain more precision than the source nutrition
 * records while canonicalizing values such as 229.99999999999997 to 230.
 */
function canonicalNutritionNumber(value: number): number {
  if (!Number.isFinite(value)) {
    throw new RangeError('Nutrition arithmetic produced a non-finite number');
  }
  if (Object.is(value, -0)) return 0;
  return Number(value.toPrecision(15));
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
      scaled[nutrient] = canonicalNutritionNumber(value * factor);
    }
  }
  return scaled;
}

/**
 * Builds a symmetric relative interval around an observed center. The relative
 * fraction must be between zero and one. This is an app-level uncertainty band,
 * not a laboratory confidence interval.
 */
export function relativeNutritionRange(
  center: NutritionVector,
  relativeFraction: number,
): NutritionRange {
  validateNutritionVector(center);
  if (!Number.isFinite(relativeFraction) || relativeFraction < 0 || relativeFraction > 1) {
    throw new RangeError('relativeFraction must be between 0 and 1');
  }
  return {
    p10: scaleNutritionVector(center, 1 - relativeFraction),
    p50: { ...center },
    p90: scaleNutritionVector(center, 1 + relativeFraction),
  };
}

/**
 * Adds known nutrient observations while preserving a nutrient as missing only
 * when both inputs are missing. This is appropriate for meal aggregation.
 */
export function addNutritionVectors(
  left: NutritionVector,
  right: NutritionVector,
): NutritionVector {
  const result: NutritionVector = {};
  for (const nutrient of NUTRIENT_KEYS) {
    const leftValue = left[nutrient];
    const rightValue = right[nutrient];
    if (leftValue !== undefined || rightValue !== undefined) {
      result[nutrient] = canonicalNutritionNumber((leftValue ?? 0) + (rightValue ?? 0));
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

/**
 * Strictly sums complete observations. If any vector omits a nutrient, the
 * aggregate omits that nutrient too; an absent source value is not zero.
 */
export function sumNutritionVectorsStrict(
  vectors: readonly NutritionVector[],
): NutritionVector {
  if (vectors.length === 0) return {};
  const result: NutritionVector = {};
  for (const nutrient of NUTRIENT_KEYS) {
    const values = vectors.map((vector) => vector[nutrient]);
    if (values.every((value): value is number => value !== undefined)) {
      result[nutrient] = canonicalNutritionNumber(values.reduce((sum, value) => sum + value, 0));
    }
  }
  return result;
}

export function sumNutritionRangesStrict(
  ranges: readonly NutritionRange[],
): NutritionRange {
  return {
    p10: sumNutritionVectorsStrict(ranges.map((range) => range.p10)),
    p50: sumNutritionVectorsStrict(ranges.map((range) => range.p50)),
    p90: sumNutritionVectorsStrict(ranges.map((range) => range.p90)),
  };
}

export function pointRange(vector: NutritionVector): NutritionRange {
  return { p10: { ...vector }, p50: { ...vector }, p90: { ...vector } };
}

export interface ResolvedServing {
  readonly factor: number;
  readonly grams: number | null;
}

export function resolveServing(
  variant: FoodVariant,
  serving: ServingInput,
): ResolvedServing {
  if (variant.nutrientBasis === 'per_100g' && variant.basisGrams !== 100) {
    throw new Error(`Variant ${variant.id} declares per_100g but basisGrams is not 100`);
  }
  if (variant.basisGrams !== null) {
    assertFinitePositive(variant.basisGrams, 'basisGrams');
  }

  if (serving.kind === 'grams') {
    assertFiniteNonNegative(serving.grams, 'grams');
    if (variant.basisGrams === null) {
      throw new Error(`Variant ${variant.id} cannot be calculated by grams because its basis weight is unknown`);
    }
    return {
      factor: canonicalNutritionNumber(serving.grams / variant.basisGrams),
      grams: serving.grams,
    };
  }

  if (serving.kind === 'basis') {
    assertFiniteNonNegative(serving.multiplier, 'basis multiplier');
    return {
      factor: serving.multiplier,
      grams: variant.basisGrams === null
        ? null
        : canonicalNutritionNumber(variant.basisGrams * serving.multiplier),
    };
  }

  assertFiniteNonNegative(serving.count, 'portion count');
  const portion = variant.portions.find((item) => item.id === serving.portionId);
  if (portion === undefined) {
    throw new Error(`Unknown portion ${serving.portionId} for variant ${variant.id}`);
  }
  assertFinitePositive(portion.basisMultiplier, 'portion basis multiplier');
  if (portion.gramWeight !== null) {
    assertFinitePositive(portion.gramWeight, 'portion gram weight');
  }

  const factor = canonicalNutritionNumber(portion.basisMultiplier * serving.count);
  return {
    factor,
    grams: portion.gramWeight === null
      ? null
      : canonicalNutritionNumber(portion.gramWeight * serving.count),
  };
}

export function calculateVariantNutrition(
  variant: FoodVariant,
  serving: ServingInput,
  modifiers: readonly NutritionModifier[] = [],
): NutritionEstimate {
  validateNutritionVector(variant.nutrientsPerBasis);
  const resolved = resolveServing(variant, serving);

  let center = scaleNutritionVector(variant.nutrientsPerBasis, resolved.factor);
  let range = variant.nutrientRangePerBasis === undefined
    ? pointRange(center)
    : scaleNutritionRange(variant.nutrientRangePerBasis, resolved.factor);

  for (const modifier of modifiers) {
    validateNutritionVector(modifier.additiveNutrition);
    center = addNutritionVectors(center, modifier.additiveNutrition);
    range = addNutritionRanges(
      range,
      modifier.additiveRange ?? pointRange(modifier.additiveNutrition),
    );
  }

  return { grams: resolved.grams, center, range };
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
