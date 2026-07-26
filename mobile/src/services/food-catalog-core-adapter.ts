import { scaleFood } from '@/db/food-repository';
import type { FoodCatalogItem, FoodEstimate } from '@/domain/models';

/**
 * Converts the existing serving-based catalog record into the stable UI result.
 * The Vision API never contributes calories or macros to this function.
 */
export function buildCatalogFoodEstimate(input: {
  readonly item: FoodCatalogItem;
  readonly multiplier: number;
  readonly locale: 'fa' | 'en';
  readonly assumptions?: readonly string[];
}): { estimate: FoodEstimate; calorieRange: { low: number; high: number } } {
  const scaled = scaleFood(input.item, input.multiplier);
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
