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

test('Today no longer claims the real Nutrition Plan is fixture-backed', async () => {
  const today = await read('components/today-screen.tsx');
  assert.doesNotMatch(today, /fixture-backed/i);
  assert.match(today, /برنامهٔ حساب از نسخهٔ فعال و کاتالوگ نسخه‌دار/);
  assert.match(today, /حالت مهمان فقط نمونهٔ Demo/);
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

test('Workout does not label the first static plan item as the next session without schedule/history truth', async () => {
  const workout = await read('components/workout-screen.tsx');
  assert.doesNotMatch(workout, />بعدی</);
  assert.doesNotMatch(workout, /is-next/);
  assert.match(workout, /جلسه‌ای را به‌عنوان «بعدی» حدس نمی‌زند/);
});

test('Progress dates are bound to the matching metric row', async () => {
  const progress = await read('components/progress-screen.tsx');
  assert.match(progress, /latestWeightRow/);
  assert.match(progress, /latestWaistRow/);
  assert.match(progress, /latestBodyFatRow/);
  assert.match(progress, /metricDate\(latestWaistRow\)/);
  assert.match(progress, /metricDate\(latestBodyFatRow\)/);
  assert.doesNotMatch(progress, /latestWaist[^\n]*[\s\S]{0,180}latest\?\.measuredAt/);
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

test('App shell provides a visible-on-focus skip link to page content', async () => {
  const shell = await read('components/app-shell.tsx');
  const css = await read('app/ui-truth-polish.css');
  assert.match(shell, /className="skip-link" href="#screen-content"/);
  assert.match(shell, /id="screen-content" tabIndex=\{-1\}/);
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

test('user-facing component copy no longer contains stale fixture-backed implementation status', async () => {
  const files = await sourceFiles('components');
  const offenders: string[] = [];
  for (const file of files) {
    if (file.endsWith('route-placeholder.tsx')) continue;
    const source = await readFile(file, 'utf8');
    if (/fixture-backed/i.test(source)) offenders.push(file.replace(`${webRoot}/`, ''));
  }
  assert.deepEqual(offenders, []);
});
