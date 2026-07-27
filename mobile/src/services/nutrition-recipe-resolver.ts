import { getDatabase } from '@/db/database';
import {
  getNutritionRecipe,
  type PersistedRecipe,
  type PersistedRecipeIngredient,
} from '@/db/nutrition-recipe-repository';
import { getUniversalFoodDetails } from '@/db/universal-catalog-repository';
import {
  calculateRecipe,
  calculateVariantNutrition,
  pointRange,
  relativeNutritionRange,
  scaleNutritionRange,
  scaleNutritionVector,
  type EvidenceTier,
  type FoodVariant,
  type NutritionEstimate,
  type NutritionRange,
  type NutritionVector,
  type PortionDefinition,
  type RecipeCalculationResult,
  type RecipeIngredientInput,
} from '@/nutrition-core';

interface VariantRow {
  id: string;
  concept_id: string;
  name_fa: string;
  name_en: string;
  preparation_tags_json: string;
  nutrient_basis: FoodVariant['nutrientBasis'];
  basis_grams: number | null;
  nutrients_per_basis_json: string;
  nutrient_range_per_basis_json: string | null;
  evidence_tier: EvidenceTier;
  source_record_id: string | null;
  source_dataset: string | null;
  source_version: string | null;
}

interface PortionRow {
  id: string;
  label_fa: string;
  label_en: string;
  gram_weight: number | null;
  basis_multiplier: number;
}

export interface ResolvedRecipeIngredient {
  readonly id: string;
  readonly sourceType: PersistedRecipeIngredient['sourceType'];
  readonly sourceId: string;
  readonly labelFa: string;
  readonly labelEn: string;
  readonly estimate: NutritionEstimate;
  readonly consumedFraction: number;
}

export interface ResolvedPersistedRecipe {
  readonly recipe: PersistedRecipe;
  readonly ingredients: readonly ResolvedRecipeIngredient[];
  readonly calculation: RecipeCalculationResult;
}

function parseJson<T>(value: string | null, fallback: T): T {
  if (value === null) return fallback;
  try {
    return JSON.parse(value) as T;
  } catch {
    return fallback;
  }
}

async function localVariant(variantId: string): Promise<FoodVariant | null> {
  const database = await getDatabase();
  const [row, portionRows] = await Promise.all([
    database.getFirstAsync<VariantRow>(
      'SELECT * FROM nutrition_food_variants WHERE id = ?;',
      variantId,
    ),
    database.getAllAsync<PortionRow>(
      `SELECT id,label_fa,label_en,gram_weight,basis_multiplier
       FROM nutrition_portions WHERE variant_id = ? ORDER BY id;`,
      variantId,
    ),
  ]);
  if (!row) return null;
  const portions: PortionDefinition[] = portionRows.map((portion) => ({
    id: portion.id,
    labelFa: portion.label_fa,
    labelEn: portion.label_en,
    gramWeight: portion.gram_weight,
    basisMultiplier: portion.basis_multiplier,
  }));
  return {
    id: row.id,
    conceptId: row.concept_id,
    nameFa: row.name_fa,
    nameEn: row.name_en,
    preparationTags: parseJson<string[]>(row.preparation_tags_json, []),
    nutrientBasis: row.nutrient_basis,
    basisGrams: row.basis_grams,
    nutrientsPerBasis: parseJson<NutritionVector>(row.nutrients_per_basis_json, {}),
    ...(row.nutrient_range_per_basis_json === null
      ? {}
      : { nutrientRangePerBasis: parseJson<NutritionRange>(row.nutrient_range_per_basis_json, { p10: {}, p50: {}, p90: {} }) }),
    portions,
    evidenceTier: row.evidence_tier,
    ...(row.source_record_id === null ? {} : { sourceRecordId: row.source_record_id }),
    ...(row.source_dataset === null ? {} : { sourceDataset: row.source_dataset }),
    ...(row.source_version === null ? {} : { sourceVersion: row.source_version }),
  };
}

function universalVector(details: NonNullable<Awaited<ReturnType<typeof getUniversalFoodDetails>>>): NutritionVector {
  return {
    ...(details.caloriesKcal === null ? {} : { energyKcal: details.caloriesKcal }),
    ...(details.proteinG === null ? {} : { proteinG: details.proteinG }),
    ...(details.carbsG === null ? {} : { carbsG: details.carbsG }),
    ...(details.fatG === null ? {} : { fatG: details.fatG }),
    ...(details.fiberG === null ? {} : { fiberG: details.fiberG }),
    ...(details.sugarsG === null ? {} : { sugarsG: details.sugarsG }),
    ...(details.sodiumMg === null ? {} : { sodiumMg: details.sodiumMg }),
    ...(details.cholesterolMg === null ? {} : { cholesterolMg: details.cholesterolMg }),
    ...(details.calciumMg === null ? {} : { calciumMg: details.calciumMg }),
    ...(details.ironMg === null ? {} : { ironMg: details.ironMg }),
    ...(details.potassiumMg === null ? {} : { potassiumMg: details.potassiumMg }),
    ...(details.vitaminCMg === null ? {} : { vitaminCMg: details.vitaminCMg }),
  };
}

function scaledEstimate(estimate: NutritionEstimate, factor: number, grams: number | null): NutritionEstimate {
  return {
    grams,
    center: scaleNutritionVector(estimate.center, factor),
    range: scaleNutritionRange(estimate.range ?? pointRange(estimate.center), factor),
  };
}

async function resolveIngredient(
  ingredient: PersistedRecipeIngredient,
  stack: ReadonlySet<string>,
): Promise<ResolvedRecipeIngredient> {
  if (ingredient.sourceType === 'recipe') {
    if (stack.has(ingredient.sourceId)) throw new Error('Nested recipe cycle detected.');
    const nested = await getNutritionRecipe(ingredient.sourceId);
    if (!nested) throw new Error(`Nested recipe not found: ${ingredient.sourceId}`);
    const resolvedNested = await resolvePersistedRecipe(nested, new Set([...stack, ingredient.sourceId]));
    if (ingredient.grams !== null) {
      if (!resolvedNested.calculation.per100g) {
        throw new Error(`Nested recipe has no cooked yield: ${nested.name}`);
      }
      return {
        id: ingredient.id,
        sourceType: ingredient.sourceType,
        sourceId: ingredient.sourceId,
        labelFa: nested.name,
        labelEn: nested.name,
        estimate: scaledEstimate(resolvedNested.calculation.per100g, ingredient.grams / 100, ingredient.grams),
        consumedFraction: ingredient.consumedFraction,
      };
    }
    const multiplier = ingredient.basisMultiplier;
    if (multiplier === null) throw new Error(`Nested recipe amount is missing: ${nested.name}`);
    return {
      id: ingredient.id,
      sourceType: ingredient.sourceType,
      sourceId: ingredient.sourceId,
      labelFa: nested.name,
      labelEn: nested.name,
      estimate: scaledEstimate(
        resolvedNested.calculation.perServing,
        multiplier,
        resolvedNested.calculation.perServing.grams === null
          ? null
          : resolvedNested.calculation.perServing.grams * multiplier,
      ),
      consumedFraction: ingredient.consumedFraction,
    };
  }

  if (ingredient.sourceId.startsWith('universal:')) {
    if (ingredient.grams === null) throw new Error('USDA recipe ingredients require a gram amount.');
    const sourceId = ingredient.sourceId.slice('universal:'.length);
    const details = await getUniversalFoodDetails(sourceId);
    if (!details) throw new Error(`USDA food not found: ${sourceId}`);
    const per100g = universalVector(details);
    const factor = ingredient.grams / 100;
    const uncertainty = details.sourceType === 'fndds' ? 0.15 : 0.08;
    return {
      id: ingredient.id,
      sourceType: ingredient.sourceType,
      sourceId: ingredient.sourceId,
      labelFa: details.nameEn,
      labelEn: details.nameEn,
      estimate: {
        grams: ingredient.grams,
        center: scaleNutritionVector(per100g, factor),
        range: scaleNutritionRange(relativeNutritionRange(per100g, uncertainty), factor),
      },
      consumedFraction: ingredient.consumedFraction,
    };
  }

  const variant = await localVariant(ingredient.sourceId);
  if (!variant) throw new Error(`Local food variant not found: ${ingredient.sourceId}`);
  const estimate = ingredient.grams !== null
    ? calculateVariantNutrition(variant, { kind: 'grams', grams: ingredient.grams })
    : calculateVariantNutrition(variant, {
        kind: 'basis',
        multiplier: ingredient.basisMultiplier ?? 1,
      });
  return {
    id: ingredient.id,
    sourceType: ingredient.sourceType,
    sourceId: ingredient.sourceId,
    labelFa: variant.nameFa,
    labelEn: variant.nameEn,
    estimate,
    consumedFraction: ingredient.consumedFraction,
  };
}

export async function resolvePersistedRecipe(
  recipe: PersistedRecipe,
  stack: ReadonlySet<string> = new Set([recipe.id]),
): Promise<ResolvedPersistedRecipe> {
  const ingredients = await Promise.all(
    recipe.ingredients.map((ingredient) => resolveIngredient(ingredient, stack)),
  );
  const calculationIngredients: RecipeIngredientInput[] = ingredients.map((ingredient) => ({
    id: ingredient.id,
    label: ingredient.labelEn,
    estimate: ingredient.estimate,
    consumedFraction: ingredient.consumedFraction,
  }));
  return {
    recipe,
    ingredients,
    calculation: calculateRecipe({
      id: recipe.id,
      name: recipe.name,
      ingredients: calculationIngredients,
      servingCount: recipe.servingCount,
      ...(recipe.cookedYieldGrams === null ? {} : { cookedYieldGrams: recipe.cookedYieldGrams }),
    }),
  };
}

export async function resolveRecipeById(id: string): Promise<ResolvedPersistedRecipe | null> {
  const recipe = await getNutritionRecipe(id);
  return recipe ? resolvePersistedRecipe(recipe) : null;
}
