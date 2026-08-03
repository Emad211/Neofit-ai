import assert from 'node:assert/strict';
import test from 'node:test';
import {
  NUTRITION_CORE_SCHEMA_VERSION,
  addNutritionVectors,
  calculateGoalProgress,
  calculateRecipe,
  calculateVariantNutrition,
  roundNutritionVector,
  summarizeDiaryDay,
  sumNutritionVectorsStrict,
  type DiaryEntry,
} from '../src';
import {
  MOBILE_RC_EXPECTED,
  MOBILE_RC_GOLDEN_PROVENANCE,
  eggWhiteVariant,
  unknownWeightServingVariant,
} from './mobile-rc-golden-v1';

function closeTo(actual: number | undefined, expected: number, tolerance: number): void {
  assert.notEqual(actual, undefined);
  assert.ok(Math.abs((actual ?? 0) - expected) <= tolerance, `${actual} is not within ${tolerance} of ${expected}`);
}

test('golden fixtures identify an exact frozen Mobile RC authority', () => {
  assert.equal(NUTRITION_CORE_SCHEMA_VERSION, 1);
  assert.match(MOBILE_RC_GOLDEN_PROVENANCE.referenceHead, /^[a-f0-9]{40}$/);
  for (const [key, value] of Object.entries(MOBILE_RC_GOLDEN_PROVENANCE)) {
    if (key.endsWith('Blob')) assert.match(value, /^[a-f0-9]{40}$/);
  }
});

test('per-100g portions and additive modifiers match Mobile RC', () => {
  const estimate = calculateVariantNutrition(
    eggWhiteVariant,
    { kind: 'portion', portionId: 'one-white', count: 2 },
    [{
      id: 'oil-5g',
      labelFa: 'پنج گرم روغن',
      labelEn: '5 g oil',
      additiveNutrition: { energyKcal: 45, fatG: 5 },
    }],
  );

  assert.equal(estimate.grams, MOBILE_RC_EXPECTED.twoEggWhitesWithOil.grams);
  assert.equal(estimate.center.energyKcal, MOBILE_RC_EXPECTED.twoEggWhitesWithOil.energyKcal);
  assert.equal(estimate.center.proteinG, MOBILE_RC_EXPECTED.twoEggWhitesWithOil.proteinG);
  assert.equal(estimate.center.fatG, MOBILE_RC_EXPECTED.twoEggWhitesWithOil.fatG);
});

test('unknown serving weight remains null and gram calculation fails closed', () => {
  const estimate = calculateVariantNutrition(
    unknownWeightServingVariant,
    { kind: 'portion', portionId: 'legacy-stew-standard', count: 1.5 },
  );

  assert.equal(estimate.grams, MOBILE_RC_EXPECTED.unknownWeightOneAndHalf.grams);
  assert.equal(estimate.center.energyKcal, MOBILE_RC_EXPECTED.unknownWeightOneAndHalf.energyKcal);
  assert.equal(estimate.center.proteinG, MOBILE_RC_EXPECTED.unknownWeightOneAndHalf.proteinG);
  assert.throws(
    () => calculateVariantNutrition(unknownWeightServingVariant, { kind: 'grams', grams: 100 }),
    /basis weight is unknown/,
  );
});

test('per-100g variants require an exact 100 gram basis', () => {
  assert.throws(
    () => calculateVariantNutrition({ ...eggWhiteVariant, basisGrams: 99 }, { kind: 'grams', grams: 100 }),
    /basisGrams is not 100/,
  );
});

test('recipe total, per-serving and per-100g values match Mobile RC', () => {
  const eggEstimate = calculateVariantNutrition(
    eggWhiteVariant,
    { kind: 'portion', portionId: 'one-white', count: 3 },
  );
  const recipe = calculateRecipe({
    id: 'recipe-1',
    name: 'Three egg whites',
    ingredients: [{ id: 'i1', label: 'Egg whites', estimate: eggEstimate }],
    servingCount: 3,
    cookedYieldGrams: 90,
  });

  assert.equal(recipe.total.grams, MOBILE_RC_EXPECTED.threeEggWhiteRecipe.totalGrams);
  assert.equal(recipe.perServing.grams, MOBILE_RC_EXPECTED.threeEggWhiteRecipe.perServingGrams);
  closeTo(
    recipe.per100g?.center.proteinG,
    MOBILE_RC_EXPECTED.threeEggWhiteRecipe.per100gProteinG,
    0.01,
  );
});

test('recipe preserves unknown total grams', () => {
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

test('diary propagates unknown grams and matches Mobile RC totals', () => {
  const knownEstimate = calculateVariantNutrition(
    eggWhiteVariant,
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
    { ...base, id: 'known', label: 'Egg white', sourceId: eggWhiteVariant.id, estimate: knownEstimate },
    { ...base, id: 'unknown', label: 'Stew', sourceId: unknownWeightServingVariant.id, estimate: unknownEstimate },
  ];
  const summary = summarizeDiaryDay(entries, '2026-07-27');

  assert.equal(summary.entryCount, 2);
  assert.equal(summary.total.grams, MOBILE_RC_EXPECTED.mixedDiary.grams);
  closeTo(summary.total.center.proteinG, MOBILE_RC_EXPECTED.mixedDiary.proteinG, 0.001);
});

test('strict aggregates never invent a missing nutrient as zero', () => {
  assert.deepEqual(
    sumNutritionVectorsStrict([
      { energyKcal: 10, proteinG: 2 },
      { energyKcal: 5 },
    ]),
    { energyKcal: 15 },
  );

  assert.deepEqual(
    addNutritionVectors({ energyKcal: 10, proteinG: 2 }, { energyKcal: 5, fatG: 1 }),
    { energyKcal: 15, proteinG: 2, fatG: 1 },
  );
});

test('goal progress keeps unknown nutrients unknown', () => {
  const progress = calculateGoalProgress(
    { energyKcal: 1500 },
    { daily: { energyKcal: 2000, proteinG: 120, fiberG: 30, sodiumMg: 2300 } },
  );

  const energy = progress.find((item) => item.nutrient === 'energyKcal');
  const protein = progress.find((item) => item.nutrient === 'proteinG');
  const fiber = progress.find((item) => item.nutrient === 'fiberG');
  const sodium = progress.find((item) => item.nutrient === 'sodiumMg');

  assert.equal(energy?.mode, 'target');
  assert.equal(energy?.ratio, 0.75);
  assert.equal(protein?.ratio, null);
  assert.equal(fiber?.mode, 'minimum');
  assert.equal(sodium?.mode, 'maximum');
});

test('15-significant-digit canonicalization is separate from display rounding', () => {
  assert.deepEqual(addNutritionVectors({ energyKcal: 229.99999999999997 }, {}), { energyKcal: 230 });
  assert.deepEqual(roundNutritionVector({ proteinG: 7.194 }, 1), { proteinG: 7.2 });
  assert.deepEqual(roundNutritionVector({ proteinG: 7.194 }, 3), { proteinG: 7.194 });
});
