import {
  relativeNutritionRange,
  scaleNutritionRange,
  scaleNutritionVector,
} from './nutrition';
import type { NutritionEstimate, NutritionVector } from './types';
import type { UniversalSourceType } from './universal-catalog-ranking';

export interface UniversalNutrientRecord {
  readonly sourceType: UniversalSourceType;
  readonly caloriesKcal: number | null;
  readonly proteinG: number | null;
  readonly fatG: number | null;
  readonly carbsG: number | null;
  readonly fiberG: number | null;
  readonly sugarsG: number | null;
  readonly sodiumMg: number | null;
  readonly cholesterolMg: number | null;
  readonly calciumMg: number | null;
  readonly ironMg: number | null;
  readonly potassiumMg: number | null;
  readonly vitaminCMg: number | null;
}

export function universalNutritionVector(record: UniversalNutrientRecord): NutritionVector {
  return {
    ...(record.caloriesKcal === null ? {} : { energyKcal: record.caloriesKcal }),
    ...(record.proteinG === null ? {} : { proteinG: record.proteinG }),
    ...(record.carbsG === null ? {} : { carbsG: record.carbsG }),
    ...(record.fatG === null ? {} : { fatG: record.fatG }),
    ...(record.fiberG === null ? {} : { fiberG: record.fiberG }),
    ...(record.sugarsG === null ? {} : { sugarsG: record.sugarsG }),
    ...(record.sodiumMg === null ? {} : { sodiumMg: record.sodiumMg }),
    ...(record.cholesterolMg === null ? {} : { cholesterolMg: record.cholesterolMg }),
    ...(record.calciumMg === null ? {} : { calciumMg: record.calciumMg }),
    ...(record.ironMg === null ? {} : { ironMg: record.ironMg }),
    ...(record.potassiumMg === null ? {} : { potassiumMg: record.potassiumMg }),
    ...(record.vitaminCMg === null ? {} : { vitaminCMg: record.vitaminCMg }),
  };
}

export function universalSourceUncertainty(sourceType: UniversalSourceType): number {
  return sourceType === 'fndds' ? 0.15 : 0.08;
}

export function calculateUniversalFoodEstimate(
  record: UniversalNutrientRecord,
  grams: number,
): NutritionEstimate {
  if (!Number.isFinite(grams) || grams <= 0 || grams > 100_000) {
    throw new RangeError('grams must be a finite positive number');
  }
  const per100g = universalNutritionVector(record);
  const factor = grams / 100;
  return {
    grams,
    center: scaleNutritionVector(per100g, factor),
    range: scaleNutritionRange(
      relativeNutritionRange(per100g, universalSourceUncertainty(record.sourceType)),
      factor,
    ),
  };
}
