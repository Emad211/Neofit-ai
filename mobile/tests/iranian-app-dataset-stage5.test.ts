import assert from 'node:assert/strict';
import { existsSync, mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { resolve } from 'node:path';
import test from 'node:test';
import { buildIranianAppDatasetStage5 } from '../scripts/build-iranian-app-dataset-stage5';

test('Stage 5 dataset upgrades all 178 category fallbacks to archetype fallbacks', () => {
  const output = mkdtempSync(resolve(tmpdir(), 'neofit-stage5-test-'));
  try {
    const result = buildIranianAppDatasetStage5(output);
    assert.equal(result.foods.length, 261);
    assert.equal(result.manifest.archetypeFallbackCount, 178);
    assert.equal(result.manifest.broadCategoryFallbackRemaining, 0);
    assert.ok(Number(result.manifest.archetypeCount) >= 25);

    const fallback = result.foods.filter((food) => food.evidenceTier === 'archetype_fallback');
    assert.equal(fallback.length, 178);
    assert.ok(fallback.every((food) => food.estimateModelId === 'ifkb-archetype-prior-v2'));
    assert.ok(fallback.every((food) => food.servingWeightSource === 'archetype_default_estimate'));
    assert.ok(fallback.every((food) => food.requiresUserConfirmation));
    assert.ok(fallback.every((food) => food.archetypeId !== null));
    assert.ok(fallback.every((food) => food.servingGrams > 0));

    const improvement = result.manifest.improvementAgainstStage3 as Record<string, number>;
    assert.ok(improvement.calorieChangedFoodCount >= 100);
    assert.ok(improvement.distinctFallbackNutritionTuples >= 20);
    const serving = result.manifest.servingWeights as Record<string, number>;
    assert.equal(serving.archetypeDefaultEstimate, 178);
    assert.ok(serving.distinctFallbackWeights >= 8);

    for (const file of ['iranian-foods.json', 'iranian-foods.csv', 'manifest.json', 'README.md']) {
      assert.equal(existsSync(resolve(output, file)), true);
    }
    const csv = readFileSync(resolve(output, 'iranian-foods.csv'), 'utf8');
    assert.match(csv.split('\n')[0] ?? '', /estimateModelId/);
    assert.match(csv.split('\n')[0] ?? '', /archetypeSampleCount/);
  } finally {
    rmSync(output, { recursive: true, force: true });
  }
});
