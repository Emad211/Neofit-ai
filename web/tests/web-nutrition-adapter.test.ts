import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import {
  dailyTargets,
  foodFixtures,
  initialDiary,
} from '@/data/fixtures';
import {
  buildInitialWebDiary,
  createWebDiaryEntry,
  estimateWebFood,
  filterWebFoods,
  summarizeWebDiary,
  webMacrosFromEstimate,
} from '@/lib/nutrition-adapter';
import {
  WEB_ADAPTER_BOUNDARY_GOLDEN,
  WEB_AFTER_ADD_GOLDEN,
  WEB_FIXTURE_DATE,
  WEB_FIXTURE_TIMESTAMP,
  WEB_FOOD_GOLDEN,
  WEB_INITIAL_DIARY_GOLDEN,
  WEB_NUTRITION_ADAPTER_GOLDEN_PROVENANCE,
  WEB_SEARCH_GOLDEN,
} from './web-nutrition-adapter-golden-v1';

function food(id: string) {
  const result = foodFixtures.find((item) => item.id === id);
  assert.ok(result, `Missing fixture food ${id}`);
  return result;
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

test('Web adapter fixtures identify exact Web, Mobile and Core authorities', () => {
  assert.match(WEB_NUTRITION_ADAPTER_GOLDEN_PROVENANCE.batch5Merge, /^[a-f0-9]{40}$/);
  for (const [key, value] of Object.entries(WEB_NUTRITION_ADAPTER_GOLDEN_PROVENANCE)) {
    if (key.endsWith('Blob')) assert.match(value, /^[a-f0-9]{40}$/, key);
  }
});

test('Standard and fractional food portions are calculated by Nutrition Core', () => {
  const ghormeh = estimateWebFood(food(WEB_FOOD_GOLDEN.ghormehSabzi.id), 1.5);
  assert.deepEqual(ghormeh.macros, WEB_FOOD_GOLDEN.ghormehSabzi.oneAndHalf.macros);
  assert.equal(ghormeh.estimate.grams, WEB_FOOD_GOLDEN.ghormehSabzi.oneAndHalf.grams);

  const egg = estimateWebFood(food(WEB_FOOD_GOLDEN.boiledEgg.id), 2);
  assert.deepEqual(egg.macros, WEB_FOOD_GOLDEN.boiledEgg.two.macros);
  assert.equal(egg.estimate.grams, WEB_FOOD_GOLDEN.boiledEgg.two.grams);
});

test('Initial Web diary is rebuilt from source foods rather than precomputed macros', () => {
  const diary = buildInitialWebDiary({
    foods: foodFixtures,
    seeds: initialDiary,
    localDate: WEB_FIXTURE_DATE,
    timestamp: WEB_FIXTURE_TIMESTAMP,
  });

  assert.equal(diary.length, 2);
  assert.deepEqual(diary[0]?.macros, WEB_INITIAL_DIARY_GOLDEN.breakfast.macros);
  assert.equal(diary[0]?.core.estimate.grams, WEB_INITIAL_DIARY_GOLDEN.breakfast.grams);
  assert.deepEqual(diary[1]?.macros, WEB_INITIAL_DIARY_GOLDEN.lunch.macros);
  assert.equal(diary[1]?.core.estimate.grams, WEB_INITIAL_DIARY_GOLDEN.lunch.grams);
});

test('Day summary and goal progress come from shared Core contracts', () => {
  const diary = buildInitialWebDiary({
    foods: foodFixtures,
    seeds: initialDiary,
    localDate: WEB_FIXTURE_DATE,
    timestamp: WEB_FIXTURE_TIMESTAMP,
  });
  const summary = summarizeWebDiary(diary, WEB_FIXTURE_DATE, dailyTargets);

  assert.equal(summary.entryCount, WEB_INITIAL_DIARY_GOLDEN.total.entryCount);
  assert.deepEqual(summary.macros, WEB_INITIAL_DIARY_GOLDEN.total.macros);
  assert.equal(summary.grams, WEB_INITIAL_DIARY_GOLDEN.total.grams);
  assert.equal(summary.remainingCalories, WEB_INITIAL_DIARY_GOLDEN.total.remainingCalories);
  assert.equal(summary.calorieProgressPercent, WEB_INITIAL_DIARY_GOLDEN.total.calorieProgressPercent);
});

test('Adding a fractional serving updates the diary through Core estimates', () => {
  const diary = buildInitialWebDiary({
    foods: foodFixtures,
    seeds: initialDiary,
    localDate: WEB_FIXTURE_DATE,
    timestamp: WEB_FIXTURE_TIMESTAMP,
  });
  const added = createWebDiaryEntry({
    id: 'added-joojeh',
    label: 'جوجه کباب',
    mealType: 'dinner',
    portionText: '۱٫۵ سهم',
    items: [{ foodId: WEB_AFTER_ADD_GOLDEN.added.foodId, portionCount: WEB_AFTER_ADD_GOLDEN.added.portionCount }],
    foods: foodFixtures,
    localDate: WEB_FIXTURE_DATE,
    timestamp: WEB_FIXTURE_TIMESTAMP,
  });
  assert.deepEqual(added.macros, WEB_AFTER_ADD_GOLDEN.added.macros);

  const summary = summarizeWebDiary([...diary, added], WEB_FIXTURE_DATE, dailyTargets);
  assert.equal(summary.entryCount, WEB_AFTER_ADD_GOLDEN.total.entryCount);
  assert.deepEqual(summary.macros, WEB_AFTER_ADD_GOLDEN.total.macros);
  assert.equal(summary.remainingCalories, WEB_AFTER_ADD_GOLDEN.total.remainingCalories);
  assert.equal(summary.calorieProgressPercent, WEB_AFTER_ADD_GOLDEN.total.calorieProgressPercent);
});

test('Web food filtering delegates Persian normalization to Nutrition Core', () => {
  for (const fixture of WEB_SEARCH_GOLDEN) {
    assert.deepEqual(
      filterWebFoods(foodFixtures, fixture.query).map((item) => item.id),
      fixture.expectedIds,
      fixture.query,
    );
  }
});

test('View conversion fails closed when one of the four required macros is missing', () => {
  assert.throws(
    () => webMacrosFromEstimate({ grams: null, center: { energyKcal: 100, proteinG: 5, carbsG: 10 } }),
    /fatG.*missing/i,
  );
});

test('Web component contains no duplicated nutrition arithmetic after Batch 6', () => {
  const source = readFileSync(new URL('../components/neofit-prototype.tsx', import.meta.url), 'utf8');
  for (const pattern of WEB_ADAPTER_BOUNDARY_GOLDEN.forbiddenComponentPatterns) {
    assert.doesNotMatch(source, new RegExp(escapeRegExp(pattern)), pattern);
  }
  for (const symbol of WEB_ADAPTER_BOUNDARY_GOLDEN.requiredComponentSymbols) {
    assert.match(source, new RegExp(`\\b${escapeRegExp(symbol)}\\b`), symbol);
  }
});

test('Web consumes Nutrition Core as a focused local package', () => {
  const webPackage = JSON.parse(readFileSync(new URL('../package.json', import.meta.url), 'utf8')) as {
    dependencies?: Record<string, string>;
    scripts?: Record<string, string>;
  };
  const corePackage = JSON.parse(
    readFileSync(new URL('../../packages/nutrition-core/package.json', import.meta.url), 'utf8'),
  ) as { exports?: Record<string, string> };
  const nextConfig = readFileSync(new URL('../next.config.ts', import.meta.url), 'utf8');

  assert.equal(
    webPackage.dependencies?.[WEB_ADAPTER_BOUNDARY_GOLDEN.packageName],
    WEB_ADAPTER_BOUNDARY_GOLDEN.localDependency,
  );
  assert.match(webPackage.scripts?.['test:adapter'] ?? '', /web-nutrition-adapter\.test\.ts/);
  assert.equal(corePackage.exports?.['.'], './src/index.ts');
  assert.match(nextConfig, /transpilePackages/);
  assert.match(nextConfig, /@neofit\/nutrition-core/);
});
