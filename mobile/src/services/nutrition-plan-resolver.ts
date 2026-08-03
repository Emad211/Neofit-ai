import {
  getNutritionFoodDocument,
  searchNutritionFoods,
} from '@/db/nutrition-food-repository';
import {
  getUniversalFoodDetails,
  searchUniversalCatalog,
} from '@/db/universal-catalog-repository';
import {
  calculateUniversalFoodEstimate,
  calculateVariantNutrition,
} from '@/nutrition-core';
import {
  hasCompletePlanMacros,
  resolveNutritionPlanDraftWithCatalog,
  type CatalogIngredientResolution,
  type NutritionPlanDraft,
  type NutritionPlanResolutionResult,
} from '@/services/nutrition-plan-resolution-core';

function normalizedEnglish(value: string): string {
  return value
    .normalize('NFKC')
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function chooseLocalHit(
  hits: Awaited<ReturnType<typeof searchNutritionFoods>>,
) {
  const top = hits[0];
  if (!top) return null;

  const exact = top.reasons.includes('exact_name');
  const nextOtherConcept = hits.find((hit) => hit.conceptId !== top.conceptId);
  if (exact) {
    const competingExact = nextOtherConcept?.reasons.includes('exact_name')
      && Math.abs(top.score - nextOtherConcept.score) < 3;
    return competingExact ? null : top;
  }

  const margin = top.score - (nextOtherConcept?.score ?? 0);
  return top.reasons.includes('prefix_name') && top.score >= 75 && margin >= 20
    ? top
    : null;
}

async function resolveFromIfkb(
  query: string,
  grams: number,
): Promise<CatalogIngredientResolution | null> {
  const hit = chooseLocalHit(await searchNutritionFoods(query, 6));
  if (!hit) return null;

  const document = await getNutritionFoodDocument(hit.conceptId);
  if (!document) return null;
  const variant = document.variants.find((item) => item.id === hit.variantId);
  if (!variant || variant.basisGrams === null) return null;

  try {
    const estimate = calculateVariantNutrition(variant, { kind: 'grams', grams });
    if (!hasCompletePlanMacros(estimate.center)) return null;
    return {
      source: 'ifkb',
      foodId: variant.id,
      resolvedName: document.concept.nameFa || document.concept.nameEn,
      nutrition: estimate.center,
    };
  } catch {
    return null;
  }
}

function chooseGenericHit(
  query: string,
  hits: Awaited<ReturnType<typeof searchUniversalCatalog>>,
) {
  const generic = hits.filter((hit) => hit.kind === 'generic_food');
  const top = generic[0];
  if (!top) return null;

  const next = generic[1];
  if (top.reasons.includes('exact_name')) {
    const competingExact = next?.reasons.includes('exact_name')
      && normalizedEnglish(next.nameEn) === normalizedEnglish(top.nameEn)
      && Math.abs(top.score - next.score) < 20;
    return competingExact ? null : top;
  }

  const margin = top.score - (next?.score ?? 0);
  const normalizedQuery = normalizedEnglish(query);
  const normalizedName = normalizedEnglish(top.nameEn);
  const safePrefix = top.reasons.includes('prefix_name')
    && normalizedName.startsWith(normalizedQuery)
    && top.score >= 760
    && margin >= 60;
  const safeContains = top.reasons.includes('contains_phrase')
    && top.score >= 600
    && margin >= 80;
  const safeTokenReorder = top.reasons.includes('token_coverage:1.00')
    && top.score >= 500
    && margin >= 80;
  return safePrefix || safeContains || safeTokenReorder ? top : null;
}

async function resolveFromGenericCatalog(
  query: string,
  grams: number,
): Promise<CatalogIngredientResolution | null> {
  const hit = chooseGenericHit(query, await searchUniversalCatalog(query, 8));
  if (!hit) return null;
  const details = await getUniversalFoodDetails(hit.id);
  if (!details || !details.macroComplete) return null;

  try {
    const estimate = calculateUniversalFoodEstimate(details, grams);
    if (!hasCompletePlanMacros(estimate.center)) return null;
    return {
      source: details.sourceType,
      foodId: details.id,
      resolvedName: details.nameEn,
      nutrition: estimate.center,
    };
  } catch {
    return null;
  }
}

export async function resolveNutritionPlanDraft(input: {
  readonly draft: NutritionPlanDraft;
  readonly dailyCalorieTarget: number;
  readonly createdAt?: string;
}): Promise<NutritionPlanResolutionResult> {
  return resolveNutritionPlanDraftWithCatalog({
    ...input,
    catalog: {
      async resolveIngredient(query, grams) {
        return await resolveFromIfkb(query, grams)
          ?? await resolveFromGenericCatalog(query, grams);
      },
    },
  });
}
