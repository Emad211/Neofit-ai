import assert from 'node:assert/strict';
import test from 'node:test';
import {
  NUTRITION_CORE_MIGRATION_V1,
  VisionRecognitionService,
  addNutritionVectors,
  calculateGoalProgress,
  calculateRecipe,
  calculateVariantNutrition,
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
  nutrientsPer100g: {
    energyKcal: 52,
    proteinG: 10.9,
    carbsG: 0.7,
    fatG: 0.2,
  },
  portions: [
    { id: 'one-white', labelFa: 'یک سفیده', labelEn: 'One egg white', gramWeight: 33 },
  ],
  evidenceTier: 'verified_source',
};

test('Persian normalization unifies Arabic characters, digits and half spaces', () => {
  assert.equal(normalizePersianText('  سفيده‌ي ۲ عدد! '), 'سفیده ی 2 عدد');
});

test('query parser extracts preparation modifiers', () => {
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

test('portion nutrition and additive modifiers are deterministic', () => {
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

test('diary summary aggregates meals without treating missing nutrients as source data', () => {
  const estimate = calculateVariantNutrition(
    variant,
    { kind: 'portion', portionId: 'one-white', count: 1 },
  );
  const entry: DiaryEntry = {
    id: 'entry-1',
    localDate: '2026-07-27',
    mealType: 'breakfast',
    label: 'Egg white',
    sourceType: 'food',
    sourceId: variant.id,
    estimate,
    createdAt: '2026-07-27T08:00:00+04:00',
    updatedAt: '2026-07-27T08:00:00+04:00',
  };
  const summary = summarizeDiaryDay([entry, { ...entry, id: 'entry-2' }], '2026-07-27');
  assert.equal(summary.entryCount, 2);
  assert.ok(Math.abs((summary.total.center.proteinG ?? 0) - 7.194) < 0.001);
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

test('SQL migration includes all core tracker and vision cache tables', () => {
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
});

test('vector addition is missing-aware and deterministic', () => {
  assert.deepEqual(
    addNutritionVectors({ energyKcal: 10, proteinG: 2 }, { energyKcal: 5, fatG: 1 }),
    { energyKcal: 15, proteinG: 2, fatG: 1 },
  );
});
