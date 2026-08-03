import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import {
  calculateGoalProgress,
  nutritionGoalMode,
} from '../src/nutrition-core';

test('nutrition goal modes distinguish targets, minimums, and maximums', () => {
  for (const nutrient of ['energyKcal', 'proteinG', 'carbsG', 'fatG'] as const) {
    assert.equal(nutritionGoalMode(nutrient), 'target');
  }
  for (const nutrient of ['sugarsG', 'sodiumMg', 'cholesterolMg'] as const) {
    assert.equal(nutritionGoalMode(nutrient), 'maximum');
  }
  for (const nutrient of ['fiberG', 'calciumMg', 'ironMg', 'potassiumMg', 'vitaminCMg'] as const) {
    assert.equal(nutritionGoalMode(nutrient), 'minimum');
  }
});

test('goal progress preserves missing nutrients and boundary-specific remaining values', () => {
  const progress = calculateGoalProgress(
    {
      energyKcal: 2100,
      fiberG: 20,
      sugarsG: 55,
      calciumMg: 1000,
    },
    {
      daily: {
        energyKcal: 2000,
        proteinG: 120,
        fiberG: 30,
        sugarsG: 50,
        calciumMg: 900,
      },
    },
  );
  const byKey = new Map(progress.map((item) => [item.nutrient, item]));
  assert.equal(byKey.get('energyKcal')?.mode, 'target');
  assert.equal(byKey.get('energyKcal')?.remaining, -100);
  assert.equal(byKey.get('sugarsG')?.mode, 'maximum');
  assert.equal(byKey.get('sugarsG')?.remaining, -5);
  assert.equal(byKey.get('fiberG')?.mode, 'minimum');
  assert.equal(byKey.get('fiberG')?.remaining, 10);
  assert.equal(byKey.get('calciumMg')?.remaining, 0);
  assert.equal(byKey.get('proteinG')?.consumed, null);
  assert.equal(byKey.get('proteinG')?.ratio, null);
  assert.equal(byKey.get('proteinG')?.remaining, null);
});

test('goals screen uses user-entered boundaries and current Diary nutrients', () => {
  const source = readFileSync(new URL('../app/nutrition-goals.tsx', import.meta.url), 'utf8');
  assert.match(source, /getActiveNutritionGoal/);
  assert.match(source, /summarizeNutritionDiaryDate/);
  assert.match(source, /saveNutritionGoal/);
  assert.match(source, /No medical recommendation was generated/);
  assert.match(source, /Missing nutrients remain unknown rather than becoming zero/);
  assert.match(source, /calciumMg/);
  assert.match(source, /ironMg/);
  assert.match(source, /potassiumMg/);
  assert.match(source, /vitaminCMg/);
});
