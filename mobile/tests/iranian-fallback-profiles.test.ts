import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import {
  IRANIAN_FALLBACK_PROFILE_COUNT,
  IRANIAN_FALLBACK_SEED,
} from '../src/data/iranian-fallback-seed.generated';
import { IRANIAN_FOOD_SEED } from '../src/data/iranian-food-seed';
import { legacyCatalogFoodToDocument } from '../src/nutrition-core';

test('Iranian runtime coverage is exactly 83 existing plus 178 DS0 fallback profiles', () => {
  assert.equal(IRANIAN_FOOD_SEED.length, 83);
  assert.equal(IRANIAN_FALLBACK_PROFILE_COUNT, 178);
  assert.equal(IRANIAN_FALLBACK_SEED.length, 178);
  const all = [...IRANIAN_FOOD_SEED, ...IRANIAN_FALLBACK_SEED];
  assert.equal(all.length, 261);
  assert.equal(new Set(all.map((item) => item.id)).size, 261);
});

test('generated fallback profiles remain broad, built-in and non-verified', () => {
  for (const item of IRANIAN_FALLBACK_SEED) {
    assert.equal(item.sourceType, 'seeded');
    assert.equal(item.confidence, 'low');
    assert.equal(item.portionGrams, null);
    assert.match(item.sourceLabel, /IFKB DS0 broad-fallback/);
    assert.ok(item.variabilityPct >= 35 && item.variabilityPct <= 60);
    const document = legacyCatalogFoodToDocument(item);
    assert.equal(document.variant.evidenceTier, 'broad_fallback');
    assert.equal(document.variant.basisGrams, null);
    assert.equal(document.variant.portions[0]?.gramWeight, null);
    assert.ok((document.variant.nutrientRangePerBasis?.p10.energyKcal ?? Infinity)
      < (document.variant.nutrientsPerBasis.energyKcal ?? -Infinity));
    assert.ok((document.variant.nutrientRangePerBasis?.p90.energyKcal ?? -Infinity)
      > (document.variant.nutrientsPerBasis.energyKcal ?? Infinity));
  }
});

test('user-import replacement targets imported records only, never built-in DS0 profiles', () => {
  const source = readFileSync(new URL('../src/db/food-repository.ts', import.meta.url), 'utf8');
  assert.match(source, /BUILT_IN_IRANIAN_FOOD_SEED\.length !== 261/);
  assert.match(source, /for \(const item of BUILT_IN_IRANIAN_FOOD_SEED\)/);
  assert.match(source, /DELETE FROM food_catalog WHERE source_type = 'imported'/);
  assert.doesNotMatch(source, /DELETE FROM food_catalog WHERE source_type = 'seeded'/);
});
