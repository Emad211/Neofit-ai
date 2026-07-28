import assert from 'node:assert/strict';
import { DatabaseSync } from 'node:sqlite';
import test from 'node:test';
import { runDatabaseMigrations } from '../src/db/migration-runner';
import { migrations, type Migration } from '../src/db/migration-plan';
import {
  nodeCompatibleProductionMigrations,
  nodeDatabaseAdapter,
  scalarNumber,
  tableExists,
} from './sqlite-test-helpers';

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
  input: { id: string; source: 'manual' | 'plan' | 'ai_photo'; calories: number },
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

function insertPreV5Food(
  database: DatabaseSync,
  input: {
    id: string;
    sourceType: 'seeded' | 'custom' | 'imported';
    sourceLabel: string;
  },
): void {
  database.prepare(`
    INSERT INTO food_catalog (
      id, name_fa, name_en, aliases_fa_json, aliases_en_json, aliases_search,
      category, portion_label_fa, portion_label_en, portion_grams,
      calories, protein_g, carbs_g, fat_g, variability_pct, confidence,
      source_type, source_label, notes_fa, notes_en, updated_at
    ) VALUES (
      ?, ?, ?, '[]', '[]', ?,
      'custom', 'یک سهم', 'one serving', NULL,
      100, 5, 10, 4, 20, 'medium',
      ?, ?, '', '', '2026-07-27T00:00:00.000Z'
    );
  `).run(
    input.id,
    `غذای ${input.id}`,
    `Food ${input.id}`,
    input.id,
    input.sourceType,
    input.sourceLabel,
  );
}

function verifyFoodCatalogSearchTriggers(database: DatabaseSync): void {
  database.prepare(`
    INSERT INTO food_catalog (
      id, name_fa, name_en, aliases_fa_json, aliases_en_json, aliases_search,
      category, portion_label_fa, portion_label_en, portion_grams,
      calories, protein_g, carbs_g, fat_g, variability_pct, confidence,
      source_type, source_label, evidence_tier, source_record_id, source_version,
      notes_fa, notes_en, updated_at
    ) VALUES (
      'migration-test-food', 'غذای تست', 'Migration test food', '[]', '[]', 'غذای تست',
      'custom', 'یک سهم', 'one serving', NULL,
      100, 5, 10, 4, 20, 'medium',
      'custom', 'migration test', 'user_entered', 'migration-test-food', NULL,
      '', '', '2026-07-27T00:00:00.000Z'
    );
  `).run();
  assert.equal(
    scalarNumber(database, "SELECT COUNT(*) FROM food_catalog_fts WHERE name_en='Migration test food';"),
    1,
  );
  database.prepare(
    "UPDATE food_catalog SET name_en='Updated migration food' WHERE id='migration-test-food';",
  ).run();
  assert.equal(
    scalarNumber(database, "SELECT COUNT(*) FROM food_catalog_fts WHERE name_en='Migration test food';"),
    0,
  );
  assert.equal(
    scalarNumber(database, "SELECT COUNT(*) FROM food_catalog_fts WHERE name_en='Updated migration food';"),
    1,
  );
  database.prepare("DELETE FROM food_catalog WHERE id='migration-test-food';").run();
  assert.equal(
    scalarNumber(database, "SELECT COUNT(*) FROM food_catalog_fts WHERE name_en='Updated migration food';"),
    0,
  );
}

test('production migrations upgrade v1 data through v5 exactly once', async () => {
  const database = new DatabaseSync(':memory:');
  try {
    database.exec('PRAGMA foreign_keys=ON;');
    const production = nodeCompatibleProductionMigrations(database, migrations);
    const adapter = nodeDatabaseAdapter(database);

    const initial = await runDatabaseMigrations(adapter, production.list.slice(0, 1));
    assert.deepEqual(initial.appliedVersions, [1]);
    insertLegacyProfile(database);
    insertLegacyMeal(database, { id: 'manual-1', source: 'manual', calories: 410 });
    insertLegacyMeal(database, { id: 'plan-1', source: 'plan', calories: 520 });
    insertLegacyMeal(database, { id: 'photo-1', source: 'ai_photo', calories: 630 });

    const throughV4 = await runDatabaseMigrations(adapter, production.list.slice(0, 4));
    assert.equal(throughV4.fromVersion, 1);
    assert.equal(throughV4.toVersion, 4);
    assert.deepEqual(throughV4.appliedVersions, [2, 3, 4]);
    assert.equal(scalarNumber(database, 'SELECT COUNT(*) FROM meal_logs;'), 3);
    assert.equal(scalarNumber(database, 'SELECT COUNT(*) FROM nutrition_diary_entries;'), 3);
    assert.equal(tableExists(database, 'food_catalog_fts'), true);
    assert.equal(tableExists(database, 'nutrition_search_fts'), true);

    insertPreV5Food(database, {
      id: 'fallback-existing',
      sourceType: 'seeded',
      sourceLabel: 'IFKB DS0 broad-fallback category prior',
    });
    insertPreV5Food(database, {
      id: 'custom-existing',
      sourceType: 'custom',
      sourceLabel: 'User food',
    });
    insertPreV5Food(database, {
      id: 'seed-existing',
      sourceType: 'seeded',
      sourceLabel: 'Legacy built-in estimate',
    });

    const provenanceUpgrade = await runDatabaseMigrations(adapter, production.list);
    assert.deepEqual(provenanceUpgrade, {
      fromVersion: 4,
      toVersion: 5,
      appliedVersions: [5],
    });
    assert.equal(scalarNumber(database, 'PRAGMA user_version;'), 5);

    const provenanceRows = database.prepare(`
      SELECT id, evidence_tier, source_record_id, source_version
      FROM food_catalog
      WHERE id IN ('fallback-existing','custom-existing','seed-existing')
      ORDER BY id;
    `).all() as Array<{
      id: string;
      evidence_tier: string;
      source_record_id: string | null;
      source_version: string | null;
    }>;
    assert.deepEqual(
      provenanceRows.map((row) => [row.id, row.evidence_tier, row.source_record_id, row.source_version]),
      [
        ['custom-existing', 'user_entered', 'custom-existing', null],
        ['fallback-existing', 'broad_fallback', 'fallback-existing', null],
        ['seed-existing', 'legacy_estimate', 'seed-existing', null],
      ],
    );
    verifyFoodCatalogSearchTriggers(database);

    const profile = database.prepare(
      'SELECT name, extended_profile_json FROM profile WHERE id=1;',
    ).get() as { name: string; extended_profile_json: string } | undefined;
    assert.equal(profile?.name, 'Legacy user');
    assert.equal(profile?.extended_profile_json, '{}');

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

    const repeated = await runDatabaseMigrations(adapter, production.list);
    assert.deepEqual(repeated, { fromVersion: 5, toVersion: 5, appliedVersions: [] });
    assert.equal(scalarNumber(database, 'SELECT COUNT(*) FROM nutrition_diary_entries;'), 3);
    assert.equal(
      scalarNumber(database, "SELECT COUNT(*) FROM nutrition_diary_entries WHERE id LIKE 'legacy-meal:%';"),
      3,
    );
    console.log(JSON.stringify({
      migrationUpgrade: 'v1-to-v5',
      nativeFts5: production.nativeFts5,
      importedLegacyMeals: 3,
      provenanceRows: provenanceRows.length,
      repeatedAppliedVersions: repeated.appliedVersions,
    }));
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
