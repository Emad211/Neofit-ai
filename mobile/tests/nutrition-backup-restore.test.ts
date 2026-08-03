import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import { IFKB_CATALOG_RELEASE, parseNutritionBackupJson } from '../src/nutrition-core';

function validBackup() {
  return {
    format: 'neofit-nutrition-backup',
    schemaVersion: 1,
    exportedAt: '2026-07-27T12:00:00.000Z',
    publicCatalogReference: IFKB_CATALOG_RELEASE,
    personalData: {
      diaryEntries: [{
        id: 'diary-1',
        localDate: '2026-07-27',
        mealType: 'lunch',
        label: 'قورمه سبزی',
        sourceType: 'food',
        sourceId: 'IFKB-CANON-00008',
        estimate: {
          grams: null,
          center: { energyKcal: 420, proteinG: 18 },
        },
        createdAt: '2026-07-27T12:00:00.000Z',
        updatedAt: '2026-07-27T12:00:00.000Z',
      }],
      recipes: [{
        id: 'recipe-1',
        name: 'آزمایشی',
        servingCount: 2,
        cookedYieldGrams: null,
        ingredients: [{
          id: 'ingredient-1',
          sourceType: 'food',
          sourceId: 'IFKB-CANON-00008',
          grams: null,
          basisMultiplier: 1,
          consumedFraction: 1,
          sortOrder: 0,
        }],
        createdAt: '2026-07-27T12:00:00.000Z',
        updatedAt: '2026-07-27T12:00:00.000Z',
      }],
      goals: [{
        id: 'goal-1',
        activeFrom: '2026-07-27',
        goals: { daily: { energyKcal: 2_000, fiberG: 25 } },
        createdAt: '2026-07-27T12:00:00.000Z',
        updatedAt: '2026-07-27T12:00:00.000Z',
      }],
      favorites: [{
        id: 'IFKB-CANON-00008',
        labelFa: 'قورمه سبزی',
        labelEn: 'Ghormeh sabzi',
        query: 'قورمه سبزی',
        savedAt: '2026-07-27T12:00:00.000Z',
      }],
    },
    exclusions: [
      'The public IFKB SQLite catalog is not duplicated in this personal backup.',
      'API keys, Vision images, cache files, and provider responses are not exported.',
    ],
  };
}

test('valid personal backup is parsed with all record groups intact', () => {
  const parsed = parseNutritionBackupJson(JSON.stringify(validBackup()));
  assert.equal(parsed.personalData.diaryEntries.length, 1);
  assert.equal(parsed.personalData.recipes.length, 1);
  assert.equal(parsed.personalData.goals.length, 1);
  assert.equal(parsed.personalData.favorites.length, 1);
  assert.equal(parsed.publicCatalogReference.version, IFKB_CATALOG_RELEASE.version);
});

test('backup parser rejects malformed JSON, negative nutrients and duplicate ids', () => {
  assert.throws(() => parseNutritionBackupJson('{bad json'), /not valid JSON/);

  const negative = validBackup();
  negative.personalData.diaryEntries[0]!.estimate.center.energyKcal = -1;
  assert.throws(() => parseNutritionBackupJson(JSON.stringify(negative)), /Invalid nutrition backup/);

  const duplicate = validBackup();
  duplicate.personalData.diaryEntries.push({ ...duplicate.personalData.diaryEntries[0]! });
  assert.throws(() => parseNutritionBackupJson(JSON.stringify(duplicate)), /duplicate Diary id/);
});

test('restore implementation is transactional and excludes public catalog and secrets', () => {
  const source = readFileSync(new URL('../src/services/nutrition-backup-restore.ts', import.meta.url), 'utf8');
  assert.match(source, /withExclusiveTransactionAsync/);
  assert.match(source, /DELETE FROM nutrition_diary_entries/);
  assert.match(source, /DELETE FROM nutrition_recipes/);
  assert.match(source, /NUTRITION_FAVORITES_SETTING_KEY/);
  assert.doesNotMatch(source, /api[_-]?key|vision_image|nutrition_vision_cache/i);
});
