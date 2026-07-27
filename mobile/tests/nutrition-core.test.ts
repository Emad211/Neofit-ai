import assert from 'node:assert/strict';
import test from 'node:test';
import {
  NUTRITION_CORE_MIGRATION_V1,
  VisionRecognitionService,
  addNutritionVectors,
  calculateGoalProgress,
  calculateRecipe,
  calculateVariantNutrition,
  legacyCatalogFoodToDocument,
  normalizePersianText,
  parseFoodQuery,
  sanitizeVisionObservation,
  searchFoodDocuments,
  summarizeDiaryDay,
  type DiaryEntry,
  type FoodConcept,
  type FoodVariant,
  type PreparedVisionImage,
  type VisionCandidateMatcher,
  type VisionRecognitionContext,
  type VisionTransport,
} from '../src/nutrition-core';

const concept: FoodConcept = {
  id: 'egg-white',
  nameFa: 'سفیده تخم مرغ',
  nameEn: 'Egg white',
  aliasesFa: ['سفیده', 'تخم مرغ بدون زرده'],
  aliasesEn: ['egg whites'],
  category: 'egg',
  defaultVariantId: 'egg-white-no-fat',
};

const variant: FoodVariant = {
  id: 'egg-white-no-fat',
  conceptId: concept.id,
  nameFa: 'سفیده تخم مرغ پخته بدون روغن',
  nameEn: 'Cooked egg white without added fat',
  preparationTags: ['egg_white', 'without_yolk', 'boiled', 'without_added_fat'],
  nutrientBasis: 'per_100g',
  basisGrams: 100,
  nutrientsPerBasis: {
    energyKcal: 52,
    proteinG: 10.9,
    carbsG: 0.7,
    fatG: 0.2,
  },
  portions: [
    {
      id: 'one-white',
      labelFa: 'یک سفیده',
      labelEn: 'One egg white',
      gramWeight: 33,
      basisMultiplier: 0.33,
    },
  ],
  evidenceTier: 'verified_source',
};

const unknownWeightServingVariant: FoodVariant = {
  id: 'legacy-stew-serving',
  conceptId: 'legacy-stew',
  nameFa: 'خورش نمونه، یک پرس',
  nameEn: 'Sample stew, one serving',
  preparationTags: ['stew'],
  nutrientBasis: 'per_serving',
  basisGrams: null,
  nutrientsPerBasis: {
    energyKcal: 400,
    proteinG: 20,
    carbsG: 30,
    fatG: 20,
  },
  portions: [{
    id: 'legacy-stew-standard',
    labelFa: 'یک پرس',
    labelEn: 'One serving',
    gramWeight: null,
    basisMultiplier: 1,
  }],
  evidenceTier: 'legacy_estimate',
};

test('Persian normalization unifies Arabic characters, digits and half spaces', () => {
  assert.equal(normalizePersianText('  سفيده‌ی ۲ عدد! '), 'سفیده ی 2 عدد');
});

test('query parser extracts preparation modifiers with Unicode-safe Persian rules', () => {
  const parsed = parseFoodQuery('سفیده تخم مرغ آب پز بدون روغن');
  assert.ok(parsed.modifiers.includes('egg_white'));
  assert.ok(parsed.modifiers.includes('boiled'));
  assert.ok(parsed.modifiers.includes('without_added_fat'));
});

test('deterministic search ranks the matching variant first', () => {
  const hits = searchFoodDocuments('تخم مرغ بدون زرده آب پز', [
    { concept, variants: [variant] },
  ]);
  assert.equal(hits[0]?.variantId, variant.id);
  assert.ok((hits[0]?.score ?? 0) > 100);
});

test('per-100g portion nutrition and additive modifiers are deterministic', () => {
  const estimate = calculateVariantNutrition(
    variant,
    { kind: 'portion', portionId: 'one-white', count: 2 },
    [{
      id: 'oil-5g',
      labelFa: 'پنج گرم روغن',
      labelEn: '5 g oil',
      additiveNutrition: { energyKcal: 45, fatG: 5 },
    }],
  );
  assert.equal(estimate.grams, 66);
  assert.ok(Math.abs((estimate.center.energyKcal ?? 0) - 79.32) < 0.001);
  assert.ok(Math.abs((estimate.center.proteinG ?? 0) - 7.194) < 0.001);
  assert.ok(Math.abs((estimate.center.fatG ?? 0) - 5.132) < 0.001);
});

test('serving-based nutrition keeps unknown serving weight null', () => {
  const estimate = calculateVariantNutrition(
    unknownWeightServingVariant,
    { kind: 'portion', portionId: 'legacy-stew-standard', count: 1.5 },
  );
  assert.equal(estimate.grams, null);
  assert.equal(estimate.center.energyKcal, 600);
  assert.equal(estimate.center.proteinG, 30);
});

test('gram calculation is rejected when serving basis weight is unknown', () => {
  assert.throws(
    () => calculateVariantNutrition(unknownWeightServingVariant, { kind: 'grams', grams: 100 }),
    /basis weight is unknown/,
  );
});

test('per-100g variants must declare a 100 gram basis', () => {
  assert.throws(
    () => calculateVariantNutrition({ ...variant, basisGrams: 99 }, { kind: 'grams', grams: 100 }),
    /basisGrams is not 100/,
  );
});

test('recipe engine calculates totals, servings and per 100 g', () => {
  const eggEstimate = calculateVariantNutrition(
    variant,
    { kind: 'portion', portionId: 'one-white', count: 3 },
  );
  const recipe = calculateRecipe({
    id: 'recipe-1',
    name: 'Three egg whites',
    ingredients: [{ id: 'i1', label: 'Egg whites', estimate: eggEstimate }],
    servingCount: 3,
    cookedYieldGrams: 90,
  });
  assert.equal(recipe.perServing.grams, 30);
  assert.ok(recipe.per100g !== undefined);
  assert.ok(Math.abs((recipe.per100g?.center.proteinG ?? 0) - 11.99) < 0.01);
});

test('recipe with an unknown-weight serving preserves unknown total grams', () => {
  const estimate = calculateVariantNutrition(
    unknownWeightServingVariant,
    { kind: 'basis', multiplier: 2 },
  );
  const recipe = calculateRecipe({
    id: 'recipe-unknown-weight',
    name: 'Unknown-weight recipe',
    ingredients: [{ id: 'i1', label: 'Stew', estimate }],
    servingCount: 4,
  });
  assert.equal(recipe.total.grams, null);
  assert.equal(recipe.perServing.grams, null);
  assert.equal(recipe.per100g, undefined);
  assert.equal(recipe.perServing.center.energyKcal, 200);
});

test('diary summary propagates unknown total weight instead of inventing grams', () => {
  const knownEstimate = calculateVariantNutrition(
    variant,
    { kind: 'portion', portionId: 'one-white', count: 1 },
  );
  const unknownEstimate = calculateVariantNutrition(
    unknownWeightServingVariant,
    { kind: 'basis', multiplier: 1 },
  );
  const base: Omit<DiaryEntry, 'id' | 'label' | 'sourceId' | 'estimate'> = {
    localDate: '2026-07-27',
    mealType: 'breakfast',
    sourceType: 'food',
    createdAt: '2026-07-27T08:00:00+04:00',
    updatedAt: '2026-07-27T08:00:00+04:00',
  };
  const entries: DiaryEntry[] = [
    { ...base, id: 'known', label: 'Egg white', sourceId: variant.id, estimate: knownEstimate },
    { ...base, id: 'unknown', label: 'Stew', sourceId: unknownWeightServingVariant.id, estimate: unknownEstimate },
  ];
  const summary = summarizeDiaryDay(entries, '2026-07-27');
  assert.equal(summary.entryCount, 2);
  assert.equal(summary.total.grams, null);
  assert.equal(summary.byMeal.breakfast.grams, null);
  assert.ok(Math.abs((summary.total.center.proteinG ?? 0) - 23.597) < 0.001);
});

test('diary and recipe totals do not treat missing nutrients as zero', () => {
  const completeEstimate = calculateVariantNutrition(
    variant,
    { kind: 'portion', portionId: 'one-white', count: 1 },
  );
  const incompleteEstimate = {
    grams: 100,
    center: { energyKcal: 100 },
  } as const;
  const entryBase = {
    localDate: '2026-07-27',
    mealType: 'breakfast' as const,
    sourceType: 'food' as const,
    createdAt: '2026-07-27T08:00:00+04:00',
    updatedAt: '2026-07-27T08:00:00+04:00',
  };
  const summary = summarizeDiaryDay([
    { ...entryBase, id: 'complete', label: 'Complete', sourceId: 'complete', estimate: completeEstimate },
    { ...entryBase, id: 'incomplete', label: 'Incomplete', sourceId: 'incomplete', estimate: incompleteEstimate },
  ], '2026-07-27');
  assert.equal(summary.total.center.energyKcal, (completeEstimate.center.energyKcal ?? 0) + 100);
  assert.equal(summary.total.center.proteinG, undefined);

  const recipe = calculateRecipe({
    id: 'missing-nutrient-recipe',
    name: 'Missing nutrient recipe',
    ingredients: [
      { id: 'complete', label: 'Complete', estimate: completeEstimate },
      { id: 'incomplete', label: 'Incomplete', estimate: incompleteEstimate },
    ],
    servingCount: 1,
  });
  assert.equal(recipe.total.center.proteinG, undefined);
});

test('legacy adapter preserves serving basis and null weight', () => {
  const document = legacyCatalogFoodToDocument({
    id: 'legacy-ghormeh-sabzi',
    nameFa: 'قورمه سبزی',
    nameEn: 'Ghormeh sabzi',
    aliasesFa: ['قرمه سبزی'],
    aliasesEn: [],
    category: 'stew',
    portionLabelFa: 'یک پرس',
    portionLabelEn: 'One serving',
    portionGrams: null,
    calories: 420,
    proteinG: 24,
    carbsG: 28,
    fatG: 24,
    variabilityPct: 30,
    sourceType: 'seeded',
    sourceLabel: 'NeoFit starter catalog',
  });
  assert.equal(document.variant.nutrientBasis, 'per_serving');
  assert.equal(document.variant.basisGrams, null);
  assert.equal(document.variant.portions[0]?.gramWeight, null);
  assert.equal(document.variant.portions[0]?.basisMultiplier, 1);
  assert.equal(document.variant.nutrientsPerBasis.energyKcal, 420);
});

test('goal progress keeps unknown nutrients missing', () => {
  const progress = calculateGoalProgress(
    { energyKcal: 1500 },
    { daily: { energyKcal: 2000, proteinG: 120 } },
  );
  assert.equal(progress.find((item) => item.nutrient === 'energyKcal')?.ratio, 0.75);
  assert.equal(progress.find((item) => item.nutrient === 'proteinG')?.ratio, null);
});

test('vision payload sanitizer ignores nutrition fields from a provider', () => {
  const result = sanitizeVisionObservation({
    candidates: [{
      label: 'Ghormeh sabzi',
      confidence: 1.4,
      visibleComponents: ['herbs', 'beans'],
      preparationHints: ['stew'],
      calories: 900,
      proteinG: 80,
    }],
    warnings: [],
  });
  assert.equal(result.candidates[0]?.confidence, 1);
  assert.equal('calories' in (result.candidates[0] ?? {}), false);
});

test('vision recognition service resolves provider labels through IFKB matcher', async () => {
  const transport: VisionTransport = {
    async recognize(_image: PreparedVisionImage, _context: VisionRecognitionContext): Promise<unknown> {
      return { candidates: [{ label: 'egg white', confidence: 0.9 }] };
    },
  };
  const matcher: VisionCandidateMatcher = {
    matchLabel(): readonly { conceptId: string; variantId: string; score: number; reasons: readonly string[] }[] {
      return [{ conceptId: concept.id, variantId: variant.id, score: 100, reasons: ['test'] }];
    },
  };
  const service = new VisionRecognitionService(transport, matcher);
  const result = await service.recognize(
    { base64: 'abc', mimeType: 'image/jpeg', width: 512, height: 512, byteLength: 3 },
    { locale: 'fa' },
  );
  assert.equal(result.candidates[0]?.matches[0]?.conceptId, concept.id);
});

test('SQL migration includes tracker tables and the corrected nutrient-basis columns', () => {
  for (const table of [
    'nutrition_food_concepts',
    'nutrition_food_variants',
    'nutrition_portions',
    'nutrition_diary_entries',
    'nutrition_recipes',
    'nutrition_recipe_ingredients',
    'nutrition_goals',
    'nutrition_vision_cache',
  ]) {
    assert.match(NUTRITION_CORE_MIGRATION_V1, new RegExp(table));
  }
  assert.match(NUTRITION_CORE_MIGRATION_V1, /nutrient_basis/);
  assert.match(NUTRITION_CORE_MIGRATION_V1, /basis_multiplier/);
  assert.match(NUTRITION_CORE_MIGRATION_V1, /grams REAL CHECK \(grams IS NULL OR grams >= 0\)/);
  assert.doesNotMatch(NUTRITION_CORE_MIGRATION_V1, /grams REAL NOT NULL CHECK \(grams >= 0\)/);
});

test('vector addition is missing-aware and deterministic', () => {
  assert.deepEqual(
    addNutritionVectors({ energyKcal: 10, proteinG: 2 }, { energyKcal: 5, fatG: 1 }),
    { energyKcal: 15, proteinG: 2, fatG: 1 },
  );
});
