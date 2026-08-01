import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import {
  classifyIranianFallbackArchetype,
  getIranianFallbackArchetypeMetadata,
  IRANIAN_ARCHETYPE_FALLBACK_SEED,
  IRANIAN_FALLBACK_ARCHETYPE_COUNT,
} from '../src/data/iranian-fallback-archetypes';
import { legacyCatalogFoodToDocument } from '../src/nutrition-core';

test('Stage 5 replaces one-prior-per-category with diverse archetype priors', () => {
  assert.equal(IRANIAN_ARCHETYPE_FALLBACK_SEED.length, 178);
  assert.ok(IRANIAN_FALLBACK_ARCHETYPE_COUNT >= 25);

  const nutritionTuples = new Set(IRANIAN_ARCHETYPE_FALLBACK_SEED.map((item) => [
    item.calories,
    item.proteinG,
    item.carbsG,
    item.fatG,
  ].join('|')));
  const servingWeights = new Set(IRANIAN_ARCHETYPE_FALLBACK_SEED.map((item) => item.portionGrams));
  assert.ok(nutritionTuples.size >= 20);
  assert.ok(servingWeights.size >= 8);
});

test('every archetype fallback remains explicit low-confidence DS0 evidence', () => {
  for (const item of IRANIAN_ARCHETYPE_FALLBACK_SEED) {
    assert.equal(item.sourceType, 'seeded');
    assert.equal(item.confidence, 'low');
    assert.ok(item.portionGrams !== null && item.portionGrams > 0);
    assert.match(item.sourceLabel, /IFKB DS0 broad-fallback archetype prior v2/);
    assert.ok(item.variabilityPct >= 30 && item.variabilityPct <= 60);

    const metadata = getIranianFallbackArchetypeMetadata(item);
    assert.equal(metadata.estimateModelId, 'ifkb-archetype-prior-v2');
    assert.ok(metadata.categorySampleCount > 0);
    assert.ok(metadata.archetypeSampleCount >= 0);

    const document = legacyCatalogFoodToDocument(item);
    assert.equal(document.variant.evidenceTier, 'broad_fallback');
    assert.equal(document.variant.basisGrams, item.portionGrams);
    assert.equal(document.variant.portions[0]?.gramWeight, item.portionGrams);
  }
});

test('food names drive meaningful archetype separation', () => {
  const byId = new Map(IRANIAN_ARCHETYPE_FALLBACK_SEED.map((item) => [item.id, item] as const));
  const walnutStew = byId.get('iranian-fallback-ifkb-canon-00086');
  const herbStew = byId.get('iranian-fallback-ifkb-canon-00088');
  assert.ok(walnutStew && herbStew);
  assert.equal(classifyIranianFallbackArchetype(walnutStew), 'stew_nut_fruit');
  assert.equal(classifyIranianFallbackArchetype(herbStew), 'stew_vegetable');
  assert.notEqual(walnutStew.calories, herbStew.calories);
  assert.notEqual(walnutStew.fatG, herbStew.fatG);
});

test('runtime repository is wired to the transformed fallback seed', () => {
  const source = readFileSync(new URL('../src/db/food-repository-impl.ts', import.meta.url), 'utf8');
  assert.match(source, /IRANIAN_ARCHETYPE_FALLBACK_SEED/);
  assert.doesNotMatch(source, /\.\.\.IRANIAN_FALLBACK_SEED,/);
});
