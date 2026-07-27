import assert from 'node:assert/strict';
import test from 'node:test';
import { relativeNutritionRange } from '../src/nutrition-core';

test('relative nutrition ranges preserve missing nutrients and center values', () => {
  const range = relativeNutritionRange({ energyKcal: 200, proteinG: 10 }, 0.15);
  assert.equal(range.p10.energyKcal, 170);
  assert.equal(range.p50.energyKcal, 200);
  assert.equal(range.p90.energyKcal, 230);
  assert.equal(range.p10.proteinG, 8.5);
  assert.equal(range.p50.carbsG, undefined);
});

test('relative nutrition range rejects invalid uncertainty fractions', () => {
  assert.throws(() => relativeNutritionRange({ energyKcal: 100 }, -0.1), /between 0 and 1/);
  assert.throws(() => relativeNutritionRange({ energyKcal: 100 }, 1.1), /between 0 and 1/);
});
