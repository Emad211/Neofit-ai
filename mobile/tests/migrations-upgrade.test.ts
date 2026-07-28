import assert from 'node:assert/strict';
import { DatabaseSync } from 'node:sqlite';
import test from 'node:test';
import {
  runDatabaseMigrations,
  type MigrationDatabase,
  type MigrationTransaction,
} from '../src/db/migration-runner';
import { migrations, type Migration } from '../src/db/migrations';

function nodeDatabaseAdapter(database: DatabaseSync): MigrationDatabase {
  return {
    async getFirstAsync<T>(sql: string): Promise<T | null> {
      return (database.prepare(sql).get() as T | undefined) ?? null;
    },
    async withExclusiveTransactionAsync(
      task: (transaction: MigrationTransaction) => Promise<void>,
    ): Promise<void> {
      database.exec('BEGIN IMMEDIATE;');
      try {
        await task({
          async execAsync(sql: string): Promise<void> {
            database.exec(sql);
          },
        });
        database.exec('COMMIT;');
      } catch (error) {
        database.exec('ROLLBACK;');
        throw error;
      }
    },
  };
}

function scalarNumber(database: DatabaseSync, sql: string): number {
  const row = database.prepare(sql).get() as Record<string, unknown> | undefined;
  const value = row ? Object.values(row)[0] : undefined;
  return Number(value ?? 0);
}

function tableExists(database: DatabaseSync, table: string): boolean {
  const row = database.prepare(
    "SELECT 1 AS present FROM sqlite_master WHERE type='table' AND name=?;",
  ).get(table) as { present: number } | undefined;
  return row?.present === 1;
}

function assertFts5Available(database: DatabaseSync): void {
  database.exec('CREATE VIRTUAL TABLE __fts5_probe USING fts5(value); DROP TABLE __fts5_probe;');
}

function insertLegacyProfile(database: DatabaseSync): void {
  database.prepare(`
    INSERT INTO profile (
      id, name, locale, goal, gender, age, height_cm, weight_kg,
      fitness_level, activity_level, training_days, session_minutes,
      workout_location, available_equipment_json, dietary_preferences_json,
      allergies_json, medical_notes, sleep_hours, stress_level, timezone,
      created_at, updated_at
    ) VALUES (
      1, ?, 'fa', 'lose_weight', 'male', 30, 176, 90,
      'intermediate', 'moderately_active', 4, 60,
      'gym', '[]', '[]', '[]', '', 7, 5, 'Asia/Tehran', ?, ?
    );
  `).run('Legacy user', '2026-07-27T08:00:00.000Z', '2026-07-27T08:00:00.000Z');
}

function insertLegacyMeal(
  database: DatabaseSync,
  input: {
    id: string;
    source: 'manual' | 'plan' | 'ai_photo';
    calories: number;
  },
): void {
  database.prepare(`
    INSERT INTO meal_logs (
      id, eaten_at, meal_type, description, calories,
      protein_g, carbs_g, fat_g, source, created_at
    ) VALUES (?, ?, 'lunch', ?, ?, 20, 40, 10, ?, ?);
  `).run(
    input.id,
    '2026-07-27T12:00:00.000Z',
    `Legacy ${input.source}`,
    input.calories,
    input.source,
    '2026-07-27T12:01:00.000Z',
  );
}

test('production migrations upgrade v1 data through v4 exactly once', async () => {
  const database = new DatabaseSync(':memory:');
  try {
    database.exec('PRAGMA foreign_keys=ON;');
    assertFts5Available(database);
    const adapter = nodeDatabaseAdapter(database);

    const initial = await runDatabaseMigrations(adapter, migrations.slice(0, 1));
    assert.deepEqual(initial.appliedVersions, [1]);
    insertLegacyProfile(database);
    insertLegacyMeal(database, { id: 'manual-1', source: 'manual', calories: 410 });
    insertLegacyMeal(database, { id: 'plan-1', source: 'plan', calories: 520 });
    insertLegacyMeal(database, { id: 'photo-1', source: 'ai_photo', calories: 630 });

    const upgraded = await runDatabaseMigrations(adapter, migrations);
    assert.equal(upgraded.fromVersion, 1);
    assert.equal(upgraded.toVersion, 4);
    assert.deepEqual(upgraded.appliedVersions, [2, 3, 4]);
    assert.equal(scalarNumber(database, 'PRAGMA user_version;'), 4);
    assert.equal(scalarNumber(database, 'SELECT COUNT(*) FROM meal_logs;'), 3);
    assert.equal(scalarNumber(database, 'SELECT COUNT(*) FROM nutrition_diary_entries;'), 3);

    const profile = database.prepare(
      'SELECT name, extended_profile_json FROM profile WHERE id=1;',
    ).get() as { name: string; extended_profile_json: string } | undefined;
    assert.deepEqual(profile, { name: 'Legacy user', extended_profile_json: '{}' });

    const diary = database.prepare(`
      SELECT id, source_type, source_id, nutrition_center_json, created_at, updated_at
      FROM nutrition_diary_entries ORDER BY id;
    `).all() as Array<{
      id: string;
      source_type: string;
      source_id: string;
      nutrition_center_json: string;
      created_at: string;
      updated_at: string;
    }>;
    assert.deepEqual(
      diary.map((row) => [row.id, row.source_type]),
      [
        ['legacy-meal:manual-1', 'custom'],
        ['legacy-meal:photo-1', 'food'],
        ['legacy-meal:plan-1', 'recipe'],
      ],
    );
    for (const row of diary) {
      assert.equal(row.source_id, row.id);
      assert.equal(row.created_at, '2026-07-27T12:00:00.000Z');
      assert.equal(row.updated_at, '2026-07-27T12:01:00.000Z');
      const nutrition = JSON.parse(row.nutrition_center_json) as Record<string, number>;
      assert.equal(nutrition.proteinG, 20);
      assert.equal(nutrition.carbsG, 40);
      assert.equal(nutrition.fatG, 10);
      assert.ok([410, 520, 630].includes(nutrition.energyKcal ?? -1));
    }

    const repeated = await runDatabaseMigrations(adapter, migrations);
    assert.deepEqual(repeated, {
      fromVersion: 4,
      toVersion: 4,
      appliedVersions: [],
    });
    assert.equal(scalarNumber(database, 'SELECT COUNT(*) FROM nutrition_diary_entries;'), 3);
    assert.equal(
      scalarNumber(database, "SELECT COUNT(*) FROM nutrition_diary_entries WHERE id LIKE 'legacy-meal:%';"),
      3,
    );
  } finally {
    database.close();
  }
});

test('migration runner rolls back failed migration SQL and its user_version', async () => {
  const database = new DatabaseSync(':memory:');
  try {
    const adapter = nodeDatabaseAdapter(database);
    const first: Migration = {
      version: 1,
      name: 'stable',
      sql: 'CREATE TABLE stable (id INTEGER PRIMARY KEY);',
    };
    const failing: Migration = {
      version: 2,
      name: 'failing',
      sql: `
        CREATE TABLE transient (id INTEGER PRIMARY KEY);
        INSERT INTO missing_table(id) VALUES (1);
      `,
    };
    await runDatabaseMigrations(adapter, [first]);
    await assert.rejects(
      () => runDatabaseMigrations(adapter, [first, failing]),
      /missing_table/,
    );
    assert.equal(scalarNumber(database, 'PRAGMA user_version;'), 1);
    assert.equal(tableExists(database, 'stable'), true);
    assert.equal(tableExists(database, 'transient'), false);
  } finally {
    database.close();
  }
});

test('migration runner rejects gaps and databases newer than the app', async () => {
  const database = new DatabaseSync(':memory:');
  try {
    const adapter = nodeDatabaseAdapter(database);
    const first: Migration = { version: 1, name: 'one', sql: 'SELECT 1;' };
    const third: Migration = { version: 3, name: 'three', sql: 'SELECT 3;' };
    await assert.rejects(
      () => runDatabaseMigrations(adapter, [first, third]),
      /contiguous/,
    );

    database.exec('PRAGMA user_version=99;');
    await assert.rejects(
      () => runDatabaseMigrations(adapter, migrations),
      /newer than supported/,
    );
  } finally {
    database.close();
  }
});
