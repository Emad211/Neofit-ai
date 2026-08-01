import { createHash } from 'node:crypto';
import { mkdtempSync, mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import {
  getIranianFallbackArchetypeMetadata,
  IRANIAN_ARCHETYPE_FALLBACK_SEED,
  IRANIAN_FALLBACK_ARCHETYPE_COUNT,
} from '../src/data/iranian-fallback-archetypes';
import type { FoodCatalogItem } from '../src/domain/models';
import {
  buildIranianAppDataset,
  type IranianAppDatasetRow,
} from './build-iranian-app-dataset';

const VERSION = '0.16.0-stage5';
const RELEASED_AT = '2026-08-01T01:30:00.000Z';

type Range = { low: number; central: number; high: number };

type Stage5Row = Omit<
  IranianAppDatasetRow,
  'servingWeightSource' | 'evidenceTier'
> & {
  servingWeightSource:
    | 'declared'
    | 'category_default_estimate'
    | 'archetype_default_estimate';
  evidenceTier:
    | 'archetype_fallback'
    | 'curated_estimate'
    | 'multi_source_identity_with_curated_nutrition';
  estimateModelId:
    | 'ifkb-archetype-prior-v2'
    | 'legacy-curated-profile'
    | 'ds2-identity-curated-nutrition';
  archetypeId: string | null;
  archetypeSampleCount: number | null;
  categorySampleCount: number | null;
};

function sha256(value: string | Buffer): string {
  return createHash('sha256').update(value).digest('hex');
}

function round(value: number, digits = 2): number {
  const factor = 10 ** digits;
  return Math.round((value + Number.EPSILON) * factor) / factor;
}

function nutritionRange(value: number, variabilityPct: number): Range {
  const fraction = variabilityPct / 100;
  return {
    low: round(Math.max(0, value * (1 - fraction))),
    central: round(value),
    high: round(value * (1 + fraction)),
  };
}

function csvEscape(value: unknown): string {
  const text = value === null || value === undefined ? '' : String(value);
  return /[",\n\r]/.test(text) ? `"${text.replaceAll('"', '""')}"` : text;
}

function toCsv(rows: readonly Stage5Row[]): string {
  const headers = [
    'canonId', 'appProfileId', 'nameFa', 'nameEn', 'aliasesFa', 'aliasesEn',
    'category', 'priority', 'portionLabelFa', 'portionLabelEn', 'servingGrams',
    'servingWeightSource', 'caloriesLow', 'caloriesCentral', 'caloriesHigh',
    'proteinLow', 'proteinCentral', 'proteinHigh', 'carbsLow', 'carbsCentral',
    'carbsHigh', 'fatLow', 'fatCentral', 'fatHigh', 'per100gCalories',
    'per100gProtein', 'per100gCarbs', 'per100gFat', 'variabilityPct',
    'confidence', 'evidenceTier', 'estimateModelId', 'archetypeId',
    'archetypeSampleCount', 'categorySampleCount', 'sourceLabel',
    'requiresUserConfirmation', 'imageStatus', 'imageKey',
  ] as const;
  const flatRows = rows.map((row) => ({
    canonId: row.canonId,
    appProfileId: row.appProfileId,
    nameFa: row.nameFa,
    nameEn: row.nameEn,
    aliasesFa: row.aliasesFa.join('|'),
    aliasesEn: row.aliasesEn.join('|'),
    category: row.category,
    priority: row.priority ?? '',
    portionLabelFa: row.portionLabelFa,
    portionLabelEn: row.portionLabelEn,
    servingGrams: row.servingGrams,
    servingWeightSource: row.servingWeightSource,
    caloriesLow: row.perServing.caloriesKcal.low,
    caloriesCentral: row.perServing.caloriesKcal.central,
    caloriesHigh: row.perServing.caloriesKcal.high,
    proteinLow: row.perServing.proteinG.low,
    proteinCentral: row.perServing.proteinG.central,
    proteinHigh: row.perServing.proteinG.high,
    carbsLow: row.perServing.carbsG.low,
    carbsCentral: row.perServing.carbsG.central,
    carbsHigh: row.perServing.carbsG.high,
    fatLow: row.perServing.fatG.low,
    fatCentral: row.perServing.fatG.central,
    fatHigh: row.perServing.fatG.high,
    per100gCalories: row.per100gCentral.caloriesKcal,
    per100gProtein: row.per100gCentral.proteinG,
    per100gCarbs: row.per100gCentral.carbsG,
    per100gFat: row.per100gCentral.fatG,
    variabilityPct: row.variabilityPct,
    confidence: row.confidence,
    evidenceTier: row.evidenceTier,
    estimateModelId: row.estimateModelId,
    archetypeId: row.archetypeId ?? '',
    archetypeSampleCount: row.archetypeSampleCount ?? '',
    categorySampleCount: row.categorySampleCount ?? '',
    sourceLabel: row.sourceLabel,
    requiresUserConfirmation: row.requiresUserConfirmation,
    imageStatus: row.imageStatus,
    imageKey: row.imageKey,
  }));
  return `${headers.join(',')}\n${flatRows
    .map((row) => headers.map((header) => csvEscape(row[header])).join(','))
    .join('\n')}\n`;
}

function countBy<T>(values: readonly T[], selector: (value: T) => string): Record<string, number> {
  const output: Record<string, number> = {};
  for (const value of values) {
    const key = selector(value);
    output[key] = (output[key] ?? 0) + 1;
  }
  return Object.fromEntries(Object.entries(output).sort(([left], [right]) => left.localeCompare(right)));
}

function median(values: readonly number[]): number {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((left, right) => left - right);
  const middle = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 1
    ? sorted[middle]!
    : (sorted[middle - 1]! + sorted[middle]!) / 2;
}

function applyFallbackProfile(base: IranianAppDatasetRow, profile: FoodCatalogItem): Stage5Row {
  const metadata = getIranianFallbackArchetypeMetadata(profile);
  const servingGrams = profile.portionGrams;
  if (servingGrams === null || servingGrams <= 0) {
    throw new Error(`Stage 5 fallback ${profile.id} has no archetype serving weight.`);
  }
  return {
    ...base,
    portionLabelFa: profile.portionLabelFa,
    portionLabelEn: profile.portionLabelEn,
    servingGrams,
    servingWeightSource: metadata.servingWeightSource,
    perServing: {
      caloriesKcal: nutritionRange(profile.calories, profile.variabilityPct),
      proteinG: nutritionRange(profile.proteinG, profile.variabilityPct),
      carbsG: nutritionRange(profile.carbsG, profile.variabilityPct),
      fatG: nutritionRange(profile.fatG, profile.variabilityPct),
    },
    per100gCentral: {
      caloriesKcal: round((profile.calories * 100) / servingGrams),
      proteinG: round((profile.proteinG * 100) / servingGrams),
      carbsG: round((profile.carbsG * 100) / servingGrams),
      fatG: round((profile.fatG * 100) / servingGrams),
    },
    variabilityPct: profile.variabilityPct,
    confidence: profile.confidence,
    evidenceTier: 'archetype_fallback',
    estimateModelId: metadata.estimateModelId,
    archetypeId: metadata.archetypeId,
    archetypeSampleCount: metadata.archetypeSampleCount,
    categorySampleCount: metadata.categorySampleCount,
    sourceLabel: profile.sourceLabel,
    notesFa: profile.notesFa,
    notesEn: profile.notesEn,
    requiresUserConfirmation: true,
  };
}

export function buildIranianAppDatasetStage5(outputDir: string): {
  foods: Stage5Row[];
  manifest: Record<string, unknown>;
} {
  const temporary = mkdtempSync(resolve(tmpdir(), 'neofit-stage3-baseline-'));
  let baseline: ReturnType<typeof buildIranianAppDataset>;
  try {
    baseline = buildIranianAppDataset(temporary);
  } finally {
    rmSync(temporary, { recursive: true, force: true });
  }

  const fallbackById = new Map(
    IRANIAN_ARCHETYPE_FALLBACK_SEED.map((item) => [item.id, item] as const),
  );
  const foods: Stage5Row[] = baseline.foods.map((food) => {
    const fallback = fallbackById.get(food.appProfileId);
    if (fallback) return applyFallbackProfile(food, fallback);
    return {
      ...food,
      evidenceTier: food.evidenceTier,
      estimateModelId: food.evidenceTier === 'multi_source_identity_with_curated_nutrition'
        ? 'ds2-identity-curated-nutrition'
        : 'legacy-curated-profile',
      archetypeId: null,
      archetypeSampleCount: null,
      categorySampleCount: null,
    };
  });

  const fallbackRows = foods.filter((food) => food.evidenceTier === 'archetype_fallback');
  if (foods.length !== 261 || fallbackRows.length !== 178) {
    throw new Error(`Stage 5 expected 261 foods and 178 archetype fallbacks; found ${foods.length}/${fallbackRows.length}.`);
  }
  for (const food of fallbackRows) {
    if (food.servingWeightSource !== 'archetype_default_estimate') {
      throw new Error(`Fallback ${food.canonId} lost its serving-weight provenance.`);
    }
    if (!food.archetypeId || food.archetypeSampleCount === null || food.categorySampleCount === null) {
      throw new Error(`Fallback ${food.canonId} has incomplete archetype metadata.`);
    }
    if (!food.sourceLabel.includes('DS0 broad-fallback archetype prior v2')) {
      throw new Error(`Fallback ${food.canonId} has the wrong Stage 5 source label.`);
    }
  }

  const baselineById = new Map(baseline.foods.map((food) => [food.appProfileId, food] as const));
  const calorieChanges = fallbackRows.map((food) => Math.abs(
    food.perServing.caloriesKcal.central
      - (baselineById.get(food.appProfileId)?.perServing.caloriesKcal.central ?? 0),
  ));
  const nutritionTupleCount = new Set(fallbackRows.map((food) => [
    food.perServing.caloriesKcal.central,
    food.perServing.proteinG.central,
    food.perServing.carbsG.central,
    food.perServing.fatG.central,
  ].join('|'))).size;
  const servingWeightCount = new Set(fallbackRows.map((food) => food.servingGrams)).size;
  const zeroSampleCount = fallbackRows.filter((food) => food.archetypeSampleCount === 0).length;
  const oneSampleCount = fallbackRows.filter((food) => food.archetypeSampleCount === 1).length;
  const twoPlusSampleCount = fallbackRows.filter((food) => (food.archetypeSampleCount ?? 0) >= 2).length;
  const fivePlusSampleCount = fallbackRows.filter((food) => (food.archetypeSampleCount ?? 0) >= 5).length;

  const manifest = {
    format: 'neofit-iranian-app-dataset',
    version: VERSION,
    releasedAt: RELEASED_AT,
    foodCount: foods.length,
    archetypeFallbackCount: fallbackRows.length,
    broadCategoryFallbackRemaining: 0,
    archetypeCount: IRANIAN_FALLBACK_ARCHETYPE_COUNT,
    fallbackArchetypeCounts: countBy(fallbackRows, (food) => food.archetypeId ?? 'none'),
    fallbackCategoryCounts: countBy(fallbackRows, (food) => food.category),
    archetypeSupport: {
      zeroSampleFoods: zeroSampleCount,
      oneSampleFoods: oneSampleCount,
      twoOrMoreSampleFoods: twoPlusSampleCount,
      fiveOrMoreSampleFoods: fivePlusSampleCount,
    },
    servingWeights: {
      declared: foods.filter((food) => food.servingWeightSource === 'declared').length,
      categoryDefaultEstimate: foods.filter(
        (food) => food.servingWeightSource === 'category_default_estimate',
      ).length,
      archetypeDefaultEstimate: foods.filter(
        (food) => food.servingWeightSource === 'archetype_default_estimate',
      ).length,
      distinctFallbackWeights: servingWeightCount,
    },
    improvementAgainstStage3: {
      calorieChangedFoodCount: calorieChanges.filter((value) => value > 0).length,
      medianAbsoluteCalorieChange: round(median(calorieChanges)),
      maximumAbsoluteCalorieChange: round(Math.max(...calorieChanges)),
      distinctFallbackNutritionTuples: nutritionTupleCount,
    },
    evidenceCounts: countBy(foods, (food) => food.evidenceTier),
    confidenceCounts: countBy(foods, (food) => food.confidence),
    licensedImageReferenceCount: foods.filter(
      (food) => food.imageStatus === 'licensed_reference_available',
    ).length,
    placeholderImageCount: foods.filter(
      (food) => food.imageStatus === 'placeholder_required',
    ).length,
    policies: {
      model: 'data-derived archetype medians shrunk toward curated category medians',
      zeroSampleArchetypesUseConservativeMultipliers: true,
      estimatedServingWeightsAreExplicitlyLabeled: true,
      everyArchetypeFallbackRequiresUserConfirmation: true,
      evidenceTierRemainsNonPromotable: true,
      providerOrLlmNutritionAccepted: false,
      visionAndLlmIdentityPipelineChanged: false,
    },
    baselineFoodsSha256: baseline.manifest.foodsSha256,
    foodsSha256: sha256(JSON.stringify(foods)),
  };

  mkdirSync(outputDir, { recursive: true });
  const dataset = {
    format: manifest.format,
    version: VERSION,
    releasedAt: RELEASED_AT,
    manifest,
    foods,
  };
  writeFileSync(resolve(outputDir, 'iranian-foods.json'), `${JSON.stringify(dataset, null, 2)}\n`, 'utf8');
  writeFileSync(resolve(outputDir, 'iranian-foods.csv'), toCsv(foods), 'utf8');
  writeFileSync(resolve(outputDir, 'manifest.json'), `${JSON.stringify(manifest, null, 2)}\n`, 'utf8');
  writeFileSync(resolve(outputDir, 'README.md'), [
    '# NeoFit Iranian App Dataset — Stage 5/10',
    '',
    '- 261 canonical Iranian foods.',
    '- All 178 former category-only fallbacks now use explicit food archetypes.',
    '- Archetype medians are shrunk toward curated category medians to limit small-sample distortion.',
    '- Serving weights are useful estimates, not measurements, and remain labeled.',
    '- Every fallback still requires user confirmation and remains non-promotable DS0 evidence.',
    '- Vision and LLM identify foods but never supply nutrition values.',
    '',
  ].join('\n'), 'utf8');

  return { foods, manifest };
}

function outputDirectory(): string {
  const index = process.argv.indexOf('--output-dir');
  return resolve(
    index >= 0 && process.argv[index + 1]
      ? process.argv[index + 1]!
      : '../build/iranian-app-dataset-stage5',
  );
}

const invokedPath = process.argv[1];
if (invokedPath && import.meta.url === pathToFileURL(resolve(invokedPath)).href) {
  const result = buildIranianAppDatasetStage5(outputDirectory());
  console.log(JSON.stringify(result.manifest, null, 2));
}
