import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import {
  IFKB_CATALOG_RELEASE,
  buildNutritionBackup,
  diaryEntriesToCsv,
  type DiaryEntry,
} from '../src/nutrition-core';

const entry: DiaryEntry = {
  id: 'meal-1',
  localDate: '2026-07-27',
  mealType: 'lunch',
  label: 'غذای "نمونه", با توضیح',
  sourceType: 'food',
  sourceId: 'universal:fndds:123',
  estimate: {
    grams: 100,
    center: {
      energyKcal: 200,
      proteinG: 12,
      calciumMg: 180,
      // iron and vitamin C intentionally missing.
    },
  },
  createdAt: '2026-07-27T12:00:00.000Z',
  updatedAt: '2026-07-27T12:00:00.000Z',
};

function parseCsvLine(line: string): string[] {
  const values: string[] = [];
  let value = '';
  let quoted = false;
  for (let index = 0; index < line.length; index += 1) {
    const character = line[index];
    if (character === '"') {
      if (quoted && line[index + 1] === '"') {
        value += '"';
        index += 1;
      } else {
        quoted = !quoted;
      }
      continue;
    }
    if (character === ',' && !quoted) {
      values.push(value);
      value = '';
      continue;
    }
    value += character;
  }
  values.push(value);
  return values;
}

test('Diary CSV keeps missing nutrients blank and escapes labels', () => {
  const csv = diaryEntriesToCsv([entry]);
  const lines = csv.trim().split('\r\n');
  assert.equal(lines.length, 2);
  assert.match(lines[0] ?? '', /calciumMg,ironMg,potassiumMg,vitaminCMg/);
  assert.match(lines[1] ?? '', /"غذای ""نمونه"", با توضیح"/);
  const headers = parseCsvLine(lines[0] ?? '');
  const values = parseCsvLine(lines[1] ?? '');
  assert.equal(values.length, headers.length);
  const ironIndex = headers.indexOf('ironMg');
  const vitaminIndex = headers.indexOf('vitaminCMg');
  assert.ok(ironIndex >= 0 && vitaminIndex >= 0);
  assert.equal(values[ironIndex], '');
  assert.equal(values[vitaminIndex], '');
  assert.equal(values[headers.indexOf('label')], entry.label);
});

test('personal JSON backup references but never embeds the public catalog', () => {
  const bundle = buildNutritionBackup({
    exportedAt: '2026-07-27T12:00:00.000Z',
    diaryEntries: [entry],
    recipes: [{ id: 'recipe-1' }],
    goals: [{ id: 'goal-1' }],
    favorites: [{ id: 'favorite-1', query: 'سفیده' }],
  });
  assert.equal(bundle.publicCatalogReference.version, '1.1.0');
  assert.equal(bundle.publicCatalogReference.databaseSha256, IFKB_CATALOG_RELEASE.databaseSha256);
  assert.equal(bundle.personalData.diaryEntries.length, 1);
  assert.deepEqual(
    Object.keys(bundle.personalData).sort(),
    ['diaryEntries', 'favorites', 'goals', 'recipes'],
  );
  const json = JSON.stringify(bundle);
  assert.doesNotMatch(json, /ifkb-universal-v1\.db/);
  assert.doesNotMatch(json, /"(?:apiKey|api_key|visionImage|providerResponse|responseCache)"\s*:/i);
  assert.match(json, /public IFKB SQLite catalog is not duplicated/);
  assert.match(json, /API keys, Vision images, cache files, and provider responses are not exported/);
});

test('history and export services read bounded Diary data and use Expo file sharing', () => {
  const history = readFileSync(new URL('../app/nutrition-history.tsx', import.meta.url), 'utf8');
  assert.match(history, /listNutritionDiaryEntriesInRange/);
  assert.match(history, /shareNutritionDiaryCsv/);
  assert.match(history, /shareNutritionBackupJson/);
  assert.match(history, /Missing nutrients stay unknown/);

  const repository = readFileSync(new URL('../src/db/nutrition-diary-repository.ts', import.meta.url), 'utf8');
  assert.match(repository, /local_date >= \? AND local_date <= \?/);
  assert.match(repository, /LIMIT \?/);

  const service = readFileSync(new URL('../src/services/nutrition-export-service.ts', import.meta.url), 'utf8');
  assert.match(service, /new File\(Paths\.cache/);
  assert.match(service, /Sharing\.isAvailableAsync/);
  assert.match(service, /Sharing\.shareAsync/);
  assert.match(service, /listNutritionRecipes/);
  assert.match(service, /listNutritionGoals/);
  assert.match(service, /listFavoriteFoods/);
});
