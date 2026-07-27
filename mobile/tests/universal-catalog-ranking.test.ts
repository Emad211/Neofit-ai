import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import {
  containsNormalizedAlias,
  rankUniversalCatalogCandidates,
  sanitizeFtsQuery,
} from '../src/nutrition-core/universal-catalog-ranking';

test('universal catalog query helpers are deterministic and Persian-safe', () => {
  assert.equal(sanitizeFtsQuery('egg, white'), '"egg" AND "white"');
  assert.equal(containsNormalizedAlias('سفیده تخم مرغ 50 گرم', 'سفیده تخم مرغ'), true);
  assert.equal(containsNormalizedAlias('تخم مرغ کامل', 'زرده'), false);
});

test('universal catalog ranking prefers common fresh forms over dried variants', () => {
  const rows = [
    {
      id: 'dried', sourceType: 'sr_legacy' as const, nameEn: 'Egg, white, dried',
      caloriesKcal: 382, proteinG: 81.1, fatG: 0, carbsG: 7.8, fiberG: 0,
      sugarsG: 5.4, sodiumMg: 1280, cholesterolMg: 0, macroComplete: true,
      portionCount: 1, bm25: -9.2,
    },
    {
      id: 'raw', sourceType: 'sr_legacy' as const, nameEn: 'Egg, white, raw, fresh',
      caloriesKcal: 52, proteinG: 10.9, fatG: 0.2, carbsG: 0.7, fiberG: 0,
      sugarsG: 0.7, sodiumMg: 166, cholesterolMg: 0, macroComplete: true,
      portionCount: 2, bm25: -8.5,
    },
    {
      id: 'sandwich', sourceType: 'fndds' as const, nameEn: 'Egg white sandwich',
      caloriesKcal: 166, proteinG: 10, fatG: 4, carbsG: 22, fiberG: 1,
      sugarsG: 2, sodiumMg: 450, cholesterolMg: 5, macroComplete: true,
      portionCount: 1, bm25: -9.2,
    },
  ];
  const ranked = rankUniversalCatalogCandidates('egg, white', rows, 3);
  assert.equal(ranked[0]?.id, 'raw');
  assert.ok((ranked.find((row) => row.id === 'dried')?.score ?? 0) < (ranked[0]?.score ?? 0));
});

test('the existing app matcher owns the universal fallback path', () => {
  const source = readFileSync(new URL('../src/services/local-food-matcher.ts', import.meta.url), 'utf8');
  assert.match(source, /searchUniversalCatalog/);
  assert.match(source, /getUniversalFoodDetails/);
  assert.match(source, /مقدار پیش‌فرض ۱۰۰ گرم است و باید تأیید شود/);
  assert.match(source, /source:\s*'universal_catalog'/);
});
