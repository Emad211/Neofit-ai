import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import {
  buildCatalogQueries,
  FoodIdentityInterpretationSchema,
} from '../src/services/food-language-contract';

test('LLM food identity contract strips nutrition and invented-weight fields', () => {
  const parsed = FoodIdentityInterpretationSchema.parse({
    primaryQuery: 'قورمه سبزی',
    alternateQueries: ['قرمه سبزی'],
    explicitAmountText: null,
    confidence: 0.82,
    needsUserConfirmation: false,
    clarificationQuestion: null,
    warnings: [],
    calories: 700,
    proteinG: 40,
    servingGrams: 450,
  });

  assert.equal('calories' in parsed, false);
  assert.equal('proteinG' in parsed, false);
  assert.equal('servingGrams' in parsed, false);
});

test('catalog queries preserve only an explicitly copied amount and deduplicate aliases', () => {
  const queries = buildCatalogQueries(FoodIdentityInterpretationSchema.parse({
    primaryQuery: 'آش رشته',
    alternateQueries: ['آش‌رشته', 'ash reshteh', 'آش رشته'],
    explicitAmountText: 'دو کاسه',
    confidence: 0.9,
    needsUserConfirmation: false,
    clarificationQuestion: null,
    warnings: [],
  }));

  assert.deepEqual(queries, [
    'دو کاسه آش رشته',
    'دو کاسه ash reshteh',
  ]);
});

test('food identity resolver is local-first and calls LLM only after weak local matching', () => {
  const source = readFileSync(new URL('../src/services/food-identity-resolver.ts', import.meta.url), 'utf8');
  const localIndex = source.indexOf('findBestLocalFoodMatch(description)');
  const llmCallIndex = source.indexOf('const interpretation = await interpretFoodIdentityWithLlm');
  assert.ok(localIndex >= 0);
  assert.ok(llmCallIndex >= 0);
  assert.ok(localIndex < llmCallIndex);
  assert.match(source, /directMatch\.score >= RELIABLE_LOCAL_SCORE/);
  assert.match(source, /if \(!input\.allowLlm\)/);
});

test('LLM interpreter prompt forbids nutrition, hidden ingredients and invented amounts', () => {
  const source = readFileSync(new URL('../src/services/food-language-interpretation.ts', import.meta.url), 'utf8');
  assert.match(source, /Never provide or estimate calories, nutrients, grams, serving weights/);
  assert.match(source, /Never create an amount that the user did not state/);
  assert.match(source, /Do not merge visibly separate plate components/);
  assert.match(source, /requestStructured/);
});

test('meal estimator exposes local-first text, Vision, and Vision plus LLM fallback', () => {
  const source = readFileSync(new URL('../app/meal-estimator.tsx', import.meta.url), 'utf8');
  assert.match(source, /resolveFoodIdentityLocalFirst/);
  assert.match(source, /recognizeFoodFromPhoto/);
  assert.match(source, /Vision \+ LLM/);
  assert.match(source, /allowLlm: hasAvalAiKey/);
  assert.match(source, /visionCandidates: observation\.candidates/);
  assert.match(source, /Nutrition was calculated only from the local catalog/);
  assert.doesNotMatch(source, /calories:\s*languageResolution/);
  assert.doesNotMatch(source, /proteinG:\s*observation/);
});
