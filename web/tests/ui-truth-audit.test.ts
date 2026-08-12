import assert from 'node:assert/strict';
import { readFile, readdir } from 'node:fs/promises';
import test from 'node:test';
import { dirname, extname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const webRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..');

async function read(path: string) {
  return readFile(resolve(webRoot, path), 'utf8');
}

async function sourceFiles(root: string): Promise<string[]> {
  const base = resolve(webRoot, root);
  const entries = await readdir(base, { recursive: true, withFileTypes: true });
  return entries
    .filter((entry) => entry.isFile() && ['.ts', '.tsx'].includes(extname(entry.name)))
    .map((entry) => resolve(entry.parentPath, entry.name));
}

test('Today is truthful without exposing implementation language', async () => {
  const today = await read('components/today-screen.tsx');
  assert.match(today, /هدف روزانه تنظیم نشده/);
  assert.match(today, /برای ذخیره دائمی اطلاعات و دریافت برنامه شخصی وارد حساب شو/);
  assert.doesNotMatch(today, /fixture-backed|کاتالوگ نسخه‌دار|Demo|از خودش نمی‌سازد/i);
});

test('Nutrition catalog chips are real category filters, not decorative Recent/Popular controls', async () => {
  const nutrition = await read('components/nutrition-screen.tsx');
  assert.match(nutrition, /type CategoryFilter = 'all' \| FoodFixture\['category'\]/);
  assert.match(nutrition, /byText\.filter\(\(food\) => food\.category === category\)/);
  assert.match(nutrition, /aria-pressed=\{category === filter\.id\}/);
  assert.match(nutrition, /onClick=\{\(\) => setCategory\(filter\.id\)\}/);
  assert.doesNotMatch(nutrition, />اخیر<|>محبوب‌ها</);
});

test('Nutrition meal dialog supports Escape and returns focus to its opener', async () => {
  const nutrition = await read('components/nutrition-screen.tsx');
  assert.match(nutrition, /event\.key === 'Escape'/);
  assert.match(nutrition, /openerRef\.current\?\.focus\(\)/);
  assert.match(nutrition, /closeButtonRef\.current\?\.focus\(\)/);
  assert.match(nutrition, /aria-modal="true"/);
});

test('Workout does not invent the next session or expose persistence architecture', async () => {
  const workout = await read('components/workout-screen.tsx');
  assert.doesNotMatch(workout, />بعدی</);
  assert.doesNotMatch(workout, /is-next/);
  assert.doesNotMatch(workout, /schedule\/history|دادهٔ واقعی حساب|Demo|نسخهٔ فعال/i);
  assert.match(workout, /برای ساخت برنامه شخصی وارد حساب شو/);
});

test('Progress dates are bound to the matching metric row', async () => {
  const progress = await read('components/progress-screen.tsx');
  assert.match(progress, /latestWeightRow/);
  assert.match(progress, /latestWaistRow/);
  assert.match(progress, /latestBodyFatRow/);
  assert.match(progress, /metricDate\(latestWaistRow\)/);
  assert.match(progress, /metricDate\(latestBodyFatRow\)/);
  assert.doesNotMatch(progress, /latestWaist[^\n]*[\s\S]{0,180}latest\?\.measuredAt/);
  assert.doesNotMatch(progress, /مرز داده|Nutrition diary|Demo|از خودش نمی‌سازد/i);
});

test('Nutrition reset cannot delete the entire account history and current UI diary is date-scoped', async () => {
  const state = await read('components/nutrition-state.tsx');
  assert.match(state, /currentDiary = useMemo/);
  assert.match(state, /entry\.core\.localDate === localDate/);
  const reset = state.slice(state.indexOf('async resetDiary()'));
  assert.match(reset, /\.eq\('user_id', account\.id\)[\s\S]*\.eq\('local_date', localDate\)/);
  assert.doesNotMatch(reset, /\.eq\('user_id', account\.id\);/);
  assert.match(state, /randomUUID/);
});

test('App shell provides a visible-on-focus skip link and hides healthy implementation status', async () => {
  const shell = await read('components/app-shell.tsx');
  const css = await read('app/ui-truth-polish.css');
  assert.match(shell, /className="skip-link" href="#screen-content"/);
  assert.match(shell, /id="screen-content" tabIndex=\{-1\}/);
  assert.match(shell, /const showStatus = !online \|\| Boolean\(loadError\) \|\| !account/);
  assert.doesNotMatch(shell, /حساب متصل است|هر بخش فقط داده‌های موردنیاز|حالت Preview محلی/);
  assert.match(css, /\.skip-link/);
  assert.match(css, /\.skip-link:focus-visible\{transform:translateY\(0\)\}/);
});

test('no app route is still rendered through the generic RoutePlaceholder component', async () => {
  const files = await sourceFiles('app');
  const offenders: string[] = [];
  for (const file of files) {
    const source = await readFile(file, 'utf8');
    if (/RoutePlaceholder/.test(source)) offenders.push(file.replace(`${webRoot}/`, ''));
  }
  assert.deepEqual(offenders, []);
});

test('core user screens do not expose internal architecture vocabulary', async () => {
  const paths = [
    'components/today-screen.tsx',
    'components/progress-screen.tsx',
    'components/profile-screen.tsx',
    'components/workout-screen.tsx',
    'components/nutrition-plan-screen.tsx',
    'app/(main)/program/page.tsx',
  ];
  const forbidden = /fixture-backed|کاتالوگ نسخه‌دار|رجیستری‌شده|هویت‌های کاتالوگ|Nutrition Core|Supabase \+ RLS|معماری داده|Demo مهمان|plan JSON|Planner تمرین|ایجنت تمرین|ایجنت تغذیه|عملیات اتمیک/i;
  const offenders: string[] = [];
  for (const path of paths) {
    const source = await read(path);
    if (forbidden.test(source)) offenders.push(path);
  }
  assert.deepEqual(offenders, []);
});
