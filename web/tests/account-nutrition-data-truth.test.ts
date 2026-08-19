import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';
import { dailyTargets, foodFixtures, initialDiary } from '@/data/fixtures';
import { buildInitialWebDiary, summarizeWebDiary } from '@/lib/nutrition-adapter';

const TEST_DATE = '2026-08-08';
const TEST_TIME = '2026-08-08T08:00:00.000Z';

async function source(path: string) { return readFile(new URL(`../${path}`, import.meta.url), 'utf8'); }

test('empty first account day is zero consumed nutrition without invented targets', () => {
  const summary = summarizeWebDiary([], TEST_DATE, null);
  assert.equal(summary.entryCount, 0);
  assert.deepEqual(summary.macros, { calories: 0, proteinG: 0, carbsG: 0, fatG: 0 });
  assert.equal(summary.targetsConfigured, false);
  assert.equal(summary.targets, null);
  assert.equal(summary.remainingCalories, null);
  assert.equal(summary.calorieProgressPercent, null);

  const demo = summarizeWebDiary([], TEST_DATE, dailyTargets);
  assert.equal(demo.targetsConfigured, true);
  assert.equal(demo.remainingCalories, dailyTargets.daily.energyKcal);
  assert.equal(demo.calorieProgressPercent, 0);
});

test('real consumed nutrition can be summarized without inventing account targets', () => {
  const diary = buildInitialWebDiary({ foods: foodFixtures, seeds: initialDiary, localDate: TEST_DATE, timestamp: TEST_TIME });
  const summary = summarizeWebDiary(diary, TEST_DATE, null);
  assert.equal(summary.entryCount, 2);
  assert.ok(summary.macros.calories > 0);
  assert.equal(summary.targets, null);
  assert.equal(summary.remainingCalories, null);
  assert.equal(summary.calorieProgressPercent, null);
  assert.equal(summary.targetsConfigured, false);
  const demo = summarizeWebDiary(diary, TEST_DATE, dailyTargets);
  assert.equal(demo.targetsConfigured, true);
  assert.ok(demo.targets?.calories);
});

test('first-account bootstrap never creates synthetic nutrition goals', async () => {
  const bootstrap = await source('lib/supabase/bootstrap.ts');
  assert.doesNotMatch(bootstrap, /nutrition_goals/);
  assert.doesNotMatch(bootstrap, /dailyTargets|NUTRITION_CORE_SCHEMA_VERSION/);
  assert.match(bootstrap, /profiles/);
  assert.match(bootstrap, /user_settings/);
});

test('shared app shell loads identity only', async () => {
  const layout = await source('app/(main)/layout.tsx');
  const shell = await source('components/app-shell.tsx');
  assert.match(layout, /loadAccountIdentity/);
  assert.match(layout, /AccountStateProvider/);
  assert.doesNotMatch(layout, /loadAccountSnapshot|loadNutritionSnapshot|NutritionStateProvider/);
  assert.match(shell, /useAccountState/);
  assert.doesNotMatch(shell, /useNutritionState/);
});

test('Today alone loads a date-bounded nutrition snapshot', async () => {
  const account = await source('lib/supabase/account.ts');
  const today = await source('app/(main)/today/page.tsx');
  const nutrition = await source('app/(main)/nutrition/page.tsx');
  assert.match(account, /loadNutritionSnapshot/);
  assert.match(account, /\.eq\('local_date', localDate\)/);
  assert.doesNotMatch(account, /dailyTargets/);
  assert.match(today, /loadNutritionSnapshot/);
  assert.match(today, /NutritionStateProvider/);
  assert.doesNotMatch(nutrition, /loadNutritionSnapshot/);
});

test('non-nutrition screens do not depend on the global Nutrition diary', async () => {
  for (const path of ['components/app-shell.tsx', 'components/profile-screen.tsx', 'components/progress-screen.tsx', 'components/coach-screen.tsx']) {
    const content = await source(path);
    assert.doesNotMatch(content, /useNutritionState/, path);
  }
});

test('Today renders an explicit unconfigured target state without developer-facing copy', async () => {
  const today = await source('components/today-screen.tsx');
  assert.match(today, /targetsConfigured/);
  assert.match(today, /هدف روزانه تنظیم نشده/);
  assert.match(today, /فقط مصرف ثبت‌شده نمایش داده می‌شود/);
  assert.doesNotMatch(today, /NeoFit برای حساب واقعی|کاتالوگ نسخه‌دار|Demo/);
  assert.doesNotMatch(today, /2200|140.*250.*70/);
});

test('Coach nutrition context remains truthful when goals are absent', async () => {
  const loader = await source('lib/coach/context-loader.ts');
  assert.match(loader, /goalsConfigured: false/);
  assert.match(loader, /@neofit\/nutrition-core/);
  assert.match(loader, /\.eq\('local_date', localDate\)/);
  assert.doesNotMatch(loader, /dailyTargets/);
});
