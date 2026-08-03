import assert from 'node:assert/strict';
import test from 'node:test';
import {
  rankUniversalCatalogCandidates,
  type UniversalCatalogCandidate,
} from '../src/nutrition-core/universal-catalog-ranking';

function candidate(input: Partial<UniversalCatalogCandidate> & Pick<UniversalCatalogCandidate, 'id' | 'nameEn' | 'macroComplete' | 'portionCount'>): UniversalCatalogCandidate {
  return {
    sourceType: 'fndds',
    caloriesKcal: input.macroComplete ? 100 : null,
    proteinG: input.macroComplete ? 5 : null,
    fatG: input.macroComplete ? 2 : null,
    carbsG: input.macroComplete ? 15 : null,
    fiberG: null,
    sugarsG: null,
    sodiumMg: null,
    cholesterolMg: null,
    calciumMg: null,
    ironMg: null,
    potassiumMg: null,
    vitaminCMg: null,
    bm25: -10,
    ...input,
  };
}

test('macro-incomplete universal records are never selectable', () => {
  const ranked = rankUniversalCatalogCandidates('milk human', [
    candidate({ id: 'incomplete', nameEn: 'Milk, human', macroComplete: false, portionCount: 2 }),
    candidate({ id: 'complete', nameEn: 'Milk, human, mature', macroComplete: true, portionCount: 1 }),
  ]);
  assert.deepEqual(ranked.map((row) => row.id), ['complete']);
});

test('macro-complete records remain usable by grams without official portions', () => {
  const ranked = rankUniversalCatalogCandidates('ingredient food', [
    candidate({ id: 'grams-only', nameEn: 'Ingredient food', macroComplete: true, portionCount: 0 }),
  ]);
  assert.equal(ranked[0]?.id, 'grams-only');
  assert.equal(ranked[0]?.portionCount, 0);
  assert.ok(ranked[0]?.reasons.includes('complete_macros'));
  assert.equal(ranked[0]?.reasons.includes('has_portions'), false);
});
