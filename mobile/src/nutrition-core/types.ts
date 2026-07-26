export const NUTRIENT_KEYS = [
  'energyKcal',
  'proteinG',
  'carbsG',
  'fatG',
  'fiberG',
  'sugarsG',
  'sodiumMg',
  'cholesterolMg',
  'calciumMg',
  'ironMg',
  'potassiumMg',
  'vitaminCMg',
] as const;

export type NutrientKey = (typeof NUTRIENT_KEYS)[number];
export type NutritionVector = Partial<Record<NutrientKey, number>>;

export interface NutritionRange {
  readonly p10: NutritionVector;
  readonly p50: NutritionVector;
  readonly p90: NutritionVector;
}

export interface NutritionEstimate {
  readonly grams: number;
  readonly center: NutritionVector;
  readonly range?: NutritionRange;
}

export interface PortionDefinition {
  readonly id: string;
  readonly labelFa: string;
  readonly labelEn: string;
  readonly gramWeight: number;
}

export type EvidenceTier =
  | 'verified_source'
  | 'digital_consensus'
  | 'legacy_estimate'
  | 'broad_fallback';

export interface FoodConcept {
  readonly id: string;
  readonly nameFa: string;
  readonly nameEn: string;
  readonly aliasesFa: readonly string[];
  readonly aliasesEn: readonly string[];
  readonly category: string;
  readonly region?: string;
  readonly defaultVariantId: string;
}

export interface FoodVariant {
  readonly id: string;
  readonly conceptId: string;
  readonly nameFa: string;
  readonly nameEn: string;
  readonly preparationTags: readonly string[];
  readonly nutrientsPer100g: NutritionVector;
  readonly nutrientRangePer100g?: NutritionRange;
  readonly portions: readonly PortionDefinition[];
  readonly evidenceTier: EvidenceTier;
}

export type ServingInput =
  | { readonly kind: 'grams'; readonly grams: number }
  | { readonly kind: 'portion'; readonly portionId: string; readonly count: number };

export interface NutritionModifier {
  readonly id: string;
  readonly labelFa: string;
  readonly labelEn: string;
  readonly additiveNutrition: NutritionVector;
  readonly additiveRange?: NutritionRange;
}

export type MealType = 'breakfast' | 'lunch' | 'dinner' | 'snack';

export interface DiaryEntry {
  readonly id: string;
  readonly localDate: string;
  readonly mealType: MealType;
  readonly label: string;
  readonly sourceType: 'food' | 'recipe' | 'custom';
  readonly sourceId: string;
  readonly estimate: NutritionEstimate;
  readonly createdAt: string;
  readonly updatedAt: string;
}

export interface NutritionGoals {
  readonly daily: NutritionVector;
}

export interface GoalProgressItem {
  readonly nutrient: NutrientKey;
  readonly consumed: number | null;
  readonly goal: number;
  readonly ratio: number | null;
  readonly remaining: number | null;
}
