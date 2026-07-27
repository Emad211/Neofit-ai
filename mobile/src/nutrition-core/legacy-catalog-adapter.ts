import { pointRange, scaleNutritionVector } from './nutrition';
import type { FoodConcept, FoodVariant, NutritionRange, NutritionVector } from './types';

export interface LegacyCatalogFood {
  readonly id: string;
  readonly nameFa: string;
  readonly nameEn: string;
  readonly aliasesFa: readonly string[];
  readonly aliasesEn: readonly string[];
  readonly category: string;
  readonly portionLabelFa: string;
  readonly portionLabelEn: string;
  readonly portionGrams: number | null;
  readonly calories: number;
  readonly proteinG: number;
  readonly carbsG: number;
  readonly fatG: number;
  readonly variabilityPct: number;
  readonly sourceType: 'seeded' | 'custom' | 'imported';
  readonly sourceLabel: string;
}

export interface LegacyCatalogDocument {
  readonly concept: FoodConcept;
  readonly variant: FoodVariant;
}

function uncertaintyRange(center: NutritionVector, variabilityPct: number): NutritionRange {
  const fraction = Math.max(0, Math.min(0.8, variabilityPct / 100));
  return {
    p10: scaleNutritionVector(center, 1 - fraction),
    p50: pointRange(center).p50,
    p90: scaleNutritionVector(center, 1 + fraction),
  };
}

/**
 * Converts the existing serving-based catalog without pretending that an
 * unknown serving weight is 100 g. The new canonical layer can therefore
 * coexist with old records while preserving scientific meaning.
 */
export function legacyCatalogFoodToDocument(item: LegacyCatalogFood): LegacyCatalogDocument {
  const variantId = `${item.id}:default`;
  const center: NutritionVector = {
    energyKcal: item.calories,
    proteinG: item.proteinG,
    carbsG: item.carbsG,
    fatG: item.fatG,
  };
  return {
    concept: {
      id: item.id,
      nameFa: item.nameFa,
      nameEn: item.nameEn,
      aliasesFa: [...item.aliasesFa],
      aliasesEn: [...item.aliasesEn],
      category: item.category,
      defaultVariantId: variantId,
    },
    variant: {
      id: variantId,
      conceptId: item.id,
      nameFa: item.nameFa,
      nameEn: item.nameEn,
      preparationTags: [],
      nutrientBasis: 'per_serving',
      basisGrams: item.portionGrams,
      nutrientsPerBasis: center,
      nutrientRangePerBasis: uncertaintyRange(center, item.variabilityPct),
      portions: [{
        id: `${variantId}:standard`,
        labelFa: item.portionLabelFa,
        labelEn: item.portionLabelEn,
        gramWeight: item.portionGrams,
        basisMultiplier: 1,
      }],
      evidenceTier: item.sourceType === 'custom' ? 'user_entered' : 'legacy_estimate',
      sourceRecordId: item.id,
      sourceDataset: item.sourceLabel || 'NeoFit legacy catalog',
    },
  };
}
