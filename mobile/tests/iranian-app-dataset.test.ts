import assert from 'node:assert/strict';
import { mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import test from 'node:test';
import { buildIranianAppDataset } from '../scripts/build-iranian-app-dataset';

test('Stage 3 Iranian app dataset is complete and usable', () => {
  const output = mkdtempSync(join(tmpdir(), 'neofit-stage3-'));
  try {
    const { foods, manifest } = buildIranianAppDataset(output);
    assert.equal(foods.length, 261);
    assert.equal(new Set(foods.map((food) => food.canonId)).size, 261);
    assert.equal(manifest.foodCount, 261);

    for (const food of foods) {
      assert.ok(food.servingGrams > 0);
      assert.ok(food.portionLabelFa.length > 0);
      assert.ok(food.portionLabelEn.length > 0);
      assert.ok(food.perServing.caloriesKcal.high >= food.perServing.caloriesKcal.central);
      assert.ok(food.perServing.caloriesKcal.central >= food.perServing.caloriesKcal.low);
      assert.ok(food.per100gCentral.caloriesKcal >= 0);
      assert.ok(food.sourceLabel.length > 0);
      assert.equal(food.imageKey, food.canonId);
    }

    const evidenceCounts = manifest.evidenceCounts as Record<string, number>;
    assert.equal(evidenceCounts.broad_fallback, 178);
    assert.equal(evidenceCounts.curated_estimate, 80);
    assert.equal(evidenceCounts.multi_source_identity_with_curated_nutrition, 3);
    assert.equal(manifest.licensedImageReferenceCount, 43);
    assert.equal(manifest.placeholderImageCount, 218);

    const json = JSON.parse(readFileSync(join(output, 'iranian-foods.json'), 'utf8')) as {
      foods: unknown[];
    };
    assert.equal(json.foods.length, 261);
    assert.ok(readFileSync(join(output, 'iranian-foods.csv'), 'utf8').split('\n').length >= 262);
    assert.ok(readFileSync(join(output, 'README.md'), 'utf8').includes('261 canonical'));
  } finally {
    rmSync(output, { recursive: true, force: true });
  }
});
