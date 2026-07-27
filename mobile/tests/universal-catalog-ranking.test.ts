import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import {
  buildPersianAliasIndex,
  containsNormalizedAlias,
  matchPersianAliasRecords,
  rankUniversalCatalogCandidates,
  resolveGenericAliasTarget,
  sanitizeFtsQuery,
  type UniversalCatalogCandidate,
} from '../src/nutrition-core/universal-catalog-ranking';

function candidate(input: Pick<UniversalCatalogCandidate, 'id' | 'sourceType' | 'nameEn' | 'caloriesKcal' | 'proteinG' | 'fatG' | 'carbsG' | 'fiberG' | 'sugarsG' | 'sodiumMg' | 'cholesterolMg' | 'macroComplete' | 'portionCount' | 'bm25'>): UniversalCatalogCandidate {
  return {
    ...input,
    calciumMg: null,
    ironMg: null,
    potassiumMg: null,
    vitaminCMg: null,
  };
}

test('universal catalog query helpers are deterministic and Persian-safe', () => {
  assert.equal(sanitizeFtsQuery('egg, white'), '"egg" AND "white"');
  assert.equal(containsNormalizedAlias('سفیده تخم مرغ 50 گرم', 'سفیده تخم مرغ'), true);
  assert.equal(containsNormalizedAlias('تخم مرغ کامل', 'زرده'), false);
});

test('Persian alias index prefers exact or longest contained aliases', () => {
  const index = buildPersianAliasIndex([
    { aliasFa: 'تخم مرغ', target: 'egg, whole', targetType: 'generic' },
    { aliasFa: 'سفیده تخم مرغ', target: 'egg, white', targetType: 'generic' },
    { aliasFa: 'دیزی', target: 'IFKB-CANON-00108', targetType: 'iranian_canon' },
  ]);
  assert.equal(matchPersianAliasRecords('50 گرم سفیده تخم مرغ', index)[0]?.target, 'egg, white');
  assert.equal(matchPersianAliasRecords('دیزی', index)[0]?.target, 'IFKB-CANON-00108');
});

test('generic modifier resolution never duplicates an existing preparation state', () => {
  assert.equal(resolveGenericAliasTarget('egg, whole, boiled', 'تخم مرغ آب پز'), 'egg, whole, boiled');
  assert.equal(resolveGenericAliasTarget('egg, white', 'سفیده بدون روغن'), 'egg, white, no added fat');
  assert.equal(resolveGenericAliasTarget('grilled chicken', 'مرغ گریل'), 'grilled chicken');
});

test('universal catalog ranking prefers common fresh forms over dried variants', () => {
  const rows = [
    candidate({
      id: 'dried', sourceType: 'sr_legacy', nameEn: 'Egg, white, dried',
      caloriesKcal: 382, proteinG: 81.1, fatG: 0, carbsG: 7.8, fiberG: 0,
      sugarsG: 5.4, sodiumMg: 1280, cholesterolMg: 0, macroComplete: true,
      portionCount: 1, bm25: -9.2,
    }),
    candidate({
      id: 'raw', sourceType: 'sr_legacy', nameEn: 'Egg, white, raw, fresh',
      caloriesKcal: 52, proteinG: 10.9, fatG: 0.2, carbsG: 0.7, fiberG: 0,
      sugarsG: 0.7, sodiumMg: 166, cholesterolMg: 0, macroComplete: true,
      portionCount: 2, bm25: -8.5,
    }),
    candidate({
      id: 'sandwich', sourceType: 'fndds', nameEn: 'Egg white sandwich',
      caloriesKcal: 166, proteinG: 10, fatG: 4, carbsG: 22, fiberG: 1,
      sugarsG: 2, sodiumMg: 450, cholesterolMg: 5, macroComplete: true,
      portionCount: 1, bm25: -9.2,
    }),
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

test('all meal entry surfaces write through Nutrition Diary', () => {
  const paths = [
    '../app/(tabs)/nutrition.tsx',
    '../app/meal-estimator.tsx',
    '../app/iranian-foods.tsx',
  ];
  for (const path of paths) {
    const source = readFileSync(new URL(path, import.meta.url), 'utf8');
    assert.match(source, /@\/db\/nutrition-meal-repository/);
    assert.doesNotMatch(source, /import \{ logMeal \} from '@\/db\/log-repository'/);
  }
  const provider = readFileSync(new URL('../src/providers/app-provider.tsx', import.meta.url), 'utf8');
  assert.match(provider, /getDailySummary \} from '@\/db\/nutrition-meal-repository'/);
  const compatibility = readFileSync(new URL('../src/db/log-repository.ts', import.meta.url), 'utf8');
  assert.match(compatibility, /from '@\/db\/nutrition-meal-repository'/);
  assert.doesNotMatch(compatibility, /INSERT INTO meal_logs/);
});

test('legacy meals are migrated idempotently before Diary reads and writes', () => {
  const source = readFileSync(new URL('../src/db/nutrition-meal-repository.ts', import.meta.url), 'utf8');
  assert.match(source, /nutrition\.diary\.legacy-meal-migration/);
  assert.match(source, /INSERT OR IGNORE INTO nutrition_diary_entries/);
  assert.match(source, /await ensureLegacyMealMigration\(\)/);
  assert.match(source, /saveNutritionDiaryEntry/);
});

test('complete food search combines local and universal data and blocks identity-only logging', () => {
  const source = readFileSync(new URL('../app/food-search.tsx', import.meta.url), 'utf8');
  assert.match(source, /searchNutritionFoods/);
  assert.match(source, /searchUniversalCatalog/);
  assert.match(source, /getUniversalFoodDetails/);
  assert.match(source, /saveNutritionDiaryEntry/);
  assert.match(source, /const disabled = result\.kind === 'identity'/);
  assert.match(source, /Official portion/);
  assert.match(source, /هویت غذای ایرانی موجود است؛ پروفایل تغذیه هنوز آمادهٔ اپ نیست/);
});

test('favorites store only source identity and search text, not copied nutrition', () => {
  const repository = readFileSync(new URL('../src/db/nutrition-favorite-repository.ts', import.meta.url), 'utf8');
  assert.match(repository, /nutrition\.food-favorites\.v1/);
  assert.match(repository, /labelFa/);
  assert.match(repository, /labelEn/);
  assert.match(repository, /query/);
  assert.doesNotMatch(repository, /calories|proteinG|carbsG|fatG/);
  const component = readFileSync(new URL('../src/components/food-search-shortcuts.tsx', import.meta.url), 'utf8');
  assert.match(component, /getRecentMeals/);
  assert.match(component, /listFavoriteFoods/);
  assert.match(component, /queryFromDiaryLabel/);
});

test('today Diary supports grouped entries, deletion, and guarded yesterday copy', () => {
  const source = readFileSync(new URL('../app/nutrition-diary.tsx', import.meta.url), 'utf8');
  assert.match(source, /MEAL_ORDER/);
  assert.match(source, /deleteNutritionDiaryEntry/);
  assert.match(source, /cloneDiaryEntriesToDate/);
  assert.match(source, /Alert\.alert/);
  assert.match(source, /refreshDailySummary/);
});

test('recipe builder persists exact source ids and recalculates before logging', () => {
  const page = readFileSync(new URL('../app/recipes.tsx', import.meta.url), 'utf8');
  assert.match(page, /sourceId: `universal:\$\{hit\.id\}`/);
  assert.match(page, /saveNutritionRecipe/);
  assert.match(page, /resolvePersistedRecipe/);
  assert.match(page, /saveNutritionDiaryEntry/);
  assert.match(page, /recipeMealType/);
  const resolver = readFileSync(new URL('../src/services/nutrition-recipe-resolver.ts', import.meta.url), 'utf8');
  assert.match(resolver, /Nested recipe cycle detected/);
  assert.match(resolver, /getUniversalFoodDetails/);
  assert.match(resolver, /calculateVariantNutrition/);
  assert.match(resolver, /calculateRecipe/);
});
