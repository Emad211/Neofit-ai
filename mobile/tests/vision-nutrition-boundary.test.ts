import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import { VisionFoodObservationSchema } from '../src/services/vision-food-contract';
import { buildCatalogFoodEstimate } from '../src/services/food-catalog-core-adapter';
import type { FoodCatalogItem } from '../src/domain/models';

test('Vision provider nutrition fields are stripped from validated observations', () => {
  const observation = VisionFoodObservationSchema.parse({
    candidates: [{
      label: 'قورمه سبزی',
      confidence: 0.8,
      visibleComponents: ['خورش', 'برنج'],
      preparationHints: ['خورشتی'],
      calories: 900,
      proteinG: 70,
      servingGrams: 500,
    }],
    warnings: [],
  });

  const candidate = observation.candidates[0];
  assert.ok(candidate);
  assert.equal('calories' in candidate, false);
  assert.equal('proteinG' in candidate, false);
  assert.equal('servingGrams' in candidate, false);
});

test('catalog adapter is the only source of displayed nutrition', () => {
  const item: FoodCatalogItem = {
    id: 'test-food',
    nameFa: 'غذای آزمایشی',
    nameEn: 'Test food',
    aliasesFa: [],
    aliasesEn: [],
    category: 'custom',
    portionLabelFa: 'یک سهم',
    portionLabelEn: 'one serving',
    portionGrams: null,
    calories: 200,
    proteinG: 10,
    carbsG: 20,
    fatG: 8,
    variabilityPct: 20,
    confidence: 'medium',
    sourceType: 'custom',
    sourceLabel: 'test',
    notesFa: '',
    notesEn: '',
    updatedAt: '2026-07-27T00:00:00.000Z',
  };

  const result = buildCatalogFoodEstimate({ item, multiplier: 1.5, locale: 'fa' });
  assert.equal(result.estimate.calories, 300);
  assert.equal(result.estimate.proteinG, 15);
  assert.equal(result.calorieRange.low, 240);
  assert.equal(result.calorieRange.high, 360);
});

test('meal estimator uses a consented prepared photo and never AI nutrition estimators', () => {
  const source = readFileSync(new URL('../app/meal-estimator.tsx', import.meta.url), 'utf8');
  assert.match(source, /recognizeFoodFromPhoto/);
  assert.match(source, /buildCatalogFoodEstimate/);
  assert.match(source, /confirmVisionUpload/);
  assert.match(source, /prepareVisionImage/);
  assert.match(source, /base64:\s*false/);
  assert.match(source, /imageDataUrl:\s*prepared\.imageDataUrl/);
  assert.match(source, /prepared\.byteLength/);
  assert.doesNotMatch(source, /asset\.base64/);
  assert.doesNotMatch(source, /estimateFoodFromText/);
  assert.doesNotMatch(source, /estimateFoodFromPhoto/);
  assert.match(source, /source:\s*'catalog'/);
});

test('billable AvalAI requests do not retry ambiguous timeouts or provider errors', () => {
  const source = readFileSync(new URL('../src/services/avalai-client.ts', import.meta.url), 'utf8');
  assert.match(source, /silently repeating it could create duplicate cost/);
  assert.match(source, /return error\.status === 0 && error\.requestId === null/);
  assert.match(source, /It was not automatically retried to avoid a duplicate charge/);
});
