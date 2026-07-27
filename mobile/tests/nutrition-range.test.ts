import assert from 'node:assert/strict';
import test from 'node:test';
import { relativeNutritionRange } from '../src/nutrition-core';

function closeTo(actual: number | undefined, expected: number, tolerance = 1e-9) {
  assert.notEqual(actual, undefined);
  assert.ok(Math.abs((actual ?? 0) - expected) <= tolerance, `${actual} is not within ${tolerance} of ${expected}`);
}

test('relative nutrition ranges preserve missing nutrients and center values', () => {
  const range = relativeNutritionRange({ energyKcal: 200, proteinG: 10 }, 0.15);
  closeTo(range.p10.energyKcal, 170);
  closeTo(range.p50.energyKcal, 200);
  closeTo(range.p90.energyKcal, 230);
  closeTo(range.p10.proteinG, 8.5);
  assert.equal(range.p50.carbsG, undefined);
});

test('relative nutrition range rejects invalid uncertainty fractions', () => {
  assert.throws(() => relativeNutritionRange({ energyKcal: 100 }, -0.1), /between 0 and 1/);
  assert.throws(() => relativeNutritionRange({ energyKcal: 100 }, 1.1), /between 0 and 1/);
});
