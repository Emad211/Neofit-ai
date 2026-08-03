import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { DatabaseSync } from 'node:sqlite';
import test from 'node:test';
import { migrations } from '../src/db/migrations';

const diaryMigration = migrations.find((migration) => migration.version === 4);

test('migration 4 imports legacy meals exactly once with local date and nutrition JSON', () => {
  assert.ok(diaryMigration);
  const db = new DatabaseSync(':memory:');
  try {
    db.exec(`
      CREATE TABLE meal_logs (
        id TEXT PRIMARY KEY,
        eaten_at TEXT NOT NULL,
        meal_type TEXT NOT NULL,
        description TEXT NOT NULL,
        calories INTEGER NOT NULL,
        protein_g REAL NOT NULL,
        carbs_g REAL NOT NULL,
        fat_g REAL NOT NULL,
        source TEXT NOT NULL,
        created_at TEXT NOT NULL
      );
      CREATE TABLE nutrition_diary_entries (
        id TEXT PRIMARY KEY,
        local_date TEXT NOT NULL,
        meal_type TEXT NOT NULL,
        label TEXT NOT NULL,
        source_type TEXT NOT NULL CHECK(source_type IN ('food','recipe','custom')),
        source_id TEXT NOT NULL,
        grams REAL,
        nutrition_center_json TEXT NOT NULL,
        nutrition_range_json TEXT,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL
      );
      INSERT INTO meal_logs VALUES (
        'meal-1','2026-07-27T12:30:00.000Z','lunch','قورمه سبزی',420,24,28,24,'catalog','2026-07-27T12:30:01.000Z'
      );
    `);
    db.exec(diaryMigration.sql);
    db.exec(diaryMigration.sql);
    const row = db.prepare(`
      SELECT id,label,source_type,grams,nutrition_center_json
      FROM nutrition_diary_entries
    `).get() as {
      id: string;
      label: string;
      source_type: string;
      grams: number | null;
      nutrition_center_json: string;
    };
    assert.equal(row.id, 'legacy-meal:meal-1');
    assert.equal(row.label, 'قورمه سبزی');
    assert.equal(row.source_type, 'food');
    assert.equal(row.grams, null);
    assert.deepEqual(JSON.parse(row.nutrition_center_json), {
      energyKcal: 420,
      proteinG: 24,
      carbsG: 28,
      fatG: 24,
    });
    assert.equal(db.prepare('SELECT COUNT(*) AS count FROM nutrition_diary_entries').get().count, 1);
  } finally {
    db.close();
  }
});

test('runtime reconciliation promotes prefixed IDs and prevents duplicate meals', () => {
  const source = readFileSync(new URL('../src/db/nutrition-meal-repository.ts', import.meta.url), 'utf8');
  assert.match(source, /UPDATE OR IGNORE nutrition_diary_entries/);
  assert.match(source, /id = substr\(id, 13\)/);
  assert.match(source, /DELETE FROM nutrition_diary_entries[\s\S]*id LIKE 'legacy-meal:%'/);
  assert.match(source, /if \(source === 'plan'\) return 'recipe'/);
  const logMealBody = source.slice(source.indexOf('export async function logMeal'), source.indexOf('export async function getDailySummary'));
  assert.match(logMealBody, /saveNutritionDiaryEntry/);
  assert.doesNotMatch(logMealBody, /INSERT INTO meal_logs/);
});
