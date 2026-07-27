import type { FoodCatalogItem, FoodEstimate } from '@/domain/models';

function scaleCatalogFood(item: FoodCatalogItem, multiplier: number) {
  const safeMultiplier = Math.min(20, Math.max(0.05, multiplier));
  const variability = item.variabilityPct / 100;
  const calories = item.calories * safeMultiplier;
  return {
    multiplier: safeMultiplier,
    calories: Math.round(calories),
    caloriesLow: Math.max(0, Math.round(calories * (1 - variability))),
    caloriesHigh: Math.round(calories * (1 + variability)),
    proteinG: Math.round(item.proteinG * safeMultiplier * 10) / 10,
    carbsG: Math.round(item.carbsG * safeMultiplier * 10) / 10,
    fatG: Math.round(item.fatG * safeMultiplier * 10) / 10,
  };
}

/**
 * Converts the existing serving-based catalog record into the stable UI result.
 * This pure function has no database, network, Expo, or Vision dependency.
 * The Vision API never contributes calories or macros to this function.
 */
export function buildCatalogFoodEstimate(input: {
  readonly item: FoodCatalogItem;
  readonly multiplier: number;
  readonly locale: 'fa' | 'en';
  readonly assumptions?: readonly string[];
}): { estimate: FoodEstimate; calorieRange: { low: number; high: number } } {
  const scaled = scaleCatalogFood(input.item, input.multiplier);
  const notes = input.locale === 'fa' ? input.item.notesFa : input.item.notesEn;
  return {
    estimate: {
      itemName: input.locale === 'fa' ? input.item.nameFa : input.item.nameEn,
      servingSize: `${input.locale === 'fa' ? input.item.portionLabelFa : input.item.portionLabelEn} × ${scaled.multiplier}`,
      calories: scaled.calories,
      proteinG: scaled.proteinG,
      carbsG: scaled.carbsG,
      fatG: scaled.fatG,
      confidence: input.item.confidence,
      assumptions: [notes, ...(input.assumptions ?? [])].filter(Boolean).slice(0, 10),
    },
    calorieRange: { low: scaled.caloriesLow, high: scaled.caloriesHigh },
  };
}
