import assert from 'node:assert/strict';
import { mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { resolve } from 'node:path';
import test from 'node:test';
import {
  STAGE6_ANALOG_RULES,
  STAGE6_ANALOG_TARGET_COUNT,
} from '../src/data/iranian-generic-analog-rules';
import { buildIranianAppDatasetStage6 } from '../scripts/build-iranian-app-dataset-stage6';

test('Stage 6 targets all 69 zero/one-sample fallbacks with explicit rules', () => {
  assert.equal(STAGE6_ANALOG_TARGET_COUNT, 69);
  assert.equal(Object.keys(STAGE6_ANALOG_RULES).length, 69);
  assert.equal(new Set(Object.keys(STAGE6_ANALOG_RULES)).size, 69);
  for (const [canonId, rule] of Object.entries(STAGE6_ANALOG_RULES)) {
    assert.match(canonId, /^IFKB-CANON-\d{5}$/);
    assert.ok(rule.note.length >= 3);
    assert.ok(rule.tiers.length >= 1);
    for (const tier of rule.tiers) {
      assert.ok(tier.includeAny.length >= 1);
    }
  }
});

test('Stage 6 builds a traceable USDA/FNDDS analog dataset', () => {
  const output = mkdtempSync(resolve(tmpdir(), 'neofit-stage6-test-'));
  try {
    const { foods, manifest, resolutions } = buildIranianAppDatasetStage6(output);
    assert.equal(foods.length, 261);
    assert.equal(new Set(foods.map((food) => food.canonId)).size, 261);
    assert.equal(resolutions.length, 69);
    assert.equal(manifest.stage6TargetCount, 69);

    const analogs = foods.filter((food) => food.evidenceTier === 'generic_analog_fallback');
    const unresolved = foods.filter((food) => food.analogStatus === 'no_safe_analog');
    assert.ok(analogs.length >= 50);
    assert.equal(analogs.length + unresolved.length, 69);

    for (const food of analogs) {
      assert.equal(food.estimateModelId, 'ifkb-generic-analog-v1');
      assert.equal(food.confidence, 'low');
      assert.equal(food.requiresUserConfirmation, true);
      assert.equal(food.analogStatus, 'selected');
      assert.ok((food.analogSupportCount ?? 0) >= 1);
      assert.equal(food.analogSourceIds.length, food.analogSupportCount);
      assert.equal(food.analogSourceNames.length, food.analogSupportCount);
      assert.ok(food.sourceLabel.includes('exactGenericRecords='));
      assert.ok(food.sourceLabel.includes('not exact-food evidence'));
      assert.ok(food.analogMedianPer100g !== null);
      assert.ok(food.perServing.caloriesKcal.low <= food.perServing.caloriesKcal.central);
      assert.ok(food.perServing.caloriesKcal.central <= food.perServing.caloriesKcal.high);
      for (const value of Object.values(food.per100gCentral)) {
        assert.ok(Number.isFinite(value) && value >= 0);
      }
      const atwater = food.per100gCentral.proteinG * 4
        + food.per100gCentral.carbsG * 4
        + food.per100gCentral.fatG * 9;
      const discrepancy = Math.abs(food.per100gCentral.caloriesKcal - atwater)
        / Math.max(1, food.per100gCentral.caloriesKcal);
      assert.ok(discrepancy <= 0.35, `${food.canonId} Atwater discrepancy ${discrepancy}`);
    }

    const registry = readFileSync(resolve(output, 'generic-analog-registry.csv'), 'utf8');
    assert.match(registry, /sourceIds,sourceNames,sourceTypes/);
    assert.equal(registry.trim().split(/\r?\n/).length, 70);
    assert.equal(manifest.policies.providerOrLlmNutritionAccepted, false);
    assert.equal(manifest.policies.genericAnalogsAreNotExactFoodEvidence, true);
  } finally {
    rmSync(output, { recursive: true, force: true });
  }
});
