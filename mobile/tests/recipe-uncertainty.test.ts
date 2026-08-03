import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

test('USDA recipe ingredients preserve source-specific uncertainty ranges', () => {
  const source = readFileSync(new URL('../src/services/nutrition-recipe-resolver.ts', import.meta.url), 'utf8');
  assert.match(source, /relativeNutritionRange/);
  assert.match(source, /details\.sourceType === 'fndds' \? 0\.15 : 0\.08/);
  assert.match(source, /scaleNutritionRange\(relativeNutritionRange\(per100g, uncertainty\), factor\)/);
  assert.doesNotMatch(source, /range:\s*scaleNutritionRange\(pointRange\(per100g\), factor\)/);
});
