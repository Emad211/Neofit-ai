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

/**
 * Grams are null when the source defines nutrition only for a named serving and
 * no defensible serving weight exists. Missing weight must never become zero.
 */
export interface NutritionEstimate {
  readonly grams: number | null;
  readonly center: NutritionVector;
  readonly range?: NutritionRange;
}

export interface PortionDefinition {
  readonly id: string;
  readonly labelFa: string;
  readonly labelEn: string;
  readonly gramWeight: number | null;
  /** Multiplier against the variant's declared nutrient basis. */
  readonly basisMultiplier: number;
}

export type EvidenceTier =
  | 'verified_source'
  | 'digital_consensus'
  | 'legacy_estimate'
  | 'broad_fallback'
  | 'user_entered';

export type NutrientBasis = 'per_100g' | 'per_serving';

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
  readonly nutrientBasis: NutrientBasis;
  /**
   * Physical weight represented by one basis unit. It is 100 for per_100g.
   * It may be null for a named serving whose weight is genuinely unknown.
   */
  readonly basisGrams: number | null;
  readonly nutrientsPerBasis: NutritionVector;
  readonly nutrientRangePerBasis?: NutritionRange;
  readonly portions: readonly PortionDefinition[];
  readonly evidenceTier: EvidenceTier;
  readonly sourceRecordId?: string;
  readonly sourceDataset?: string;
  readonly sourceVersion?: string;
}

export type ServingInput =
  | { readonly kind: 'grams'; readonly grams: number }
  | { readonly kind: 'portion'; readonly portionId: string; readonly count: number }
  | { readonly kind: 'basis'; readonly multiplier: number };

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

export type NutritionGoalMode = 'target' | 'minimum' | 'maximum';

export interface GoalProgressItem {
  readonly nutrient: NutrientKey;
  readonly mode: NutritionGoalMode;
  readonly consumed: number | null;
  readonly goal: number;
  readonly ratio: number | null;
  /**
   * Positive means the remaining distance to the configured boundary. A
   * negative number means the target/maximum has been exceeded. For minimum
   * goals it becomes zero after the minimum is reached.
   */
  readonly remaining: number | null;
}
