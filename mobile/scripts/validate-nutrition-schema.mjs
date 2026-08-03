import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { DatabaseSync } from 'node:sqlite';

const source = readFileSync(new URL('../src/nutrition-core/sql.ts', import.meta.url), 'utf8');
const match = source.match(/export const NUTRITION_CORE_MIGRATION_V1 = `([\s\S]*?)`;\s*$/);
if (!match?.[1]) {
  throw new Error('Could not extract NUTRITION_CORE_MIGRATION_V1');
}

function hasFts5(db) {
  try {
    db.exec("CREATE VIRTUAL TABLE __fts5_probe USING fts5(value); DROP TABLE __fts5_probe;");
    return true;
  } catch (error) {
    if (String(error).includes('no such module: fts5')) {
      return false;
    }
    throw error;
  }
}

function replaceFtsWithPortableTable(sql) {
  const portable = `CREATE TABLE IF NOT EXISTS nutrition_search_fts (
    concept_id TEXT,
    variant_id TEXT,
    name_fa TEXT,
    name_en TEXT,
    aliases TEXT,
    preparation_tags TEXT
  );`;
  const replaced = sql.replace(
    /CREATE VIRTUAL TABLE IF NOT EXISTS nutrition_search_fts USING fts5\([\s\S]*?\);/,
    portable,
  );
  if (replaced === sql) {
    throw new Error('Could not replace nutrition_search_fts for portable SQLite validation');
  }
  return replaced;
}

const db = new DatabaseSync(':memory:');
try {
  const fts5Available = hasFts5(db);
  db.exec(fts5Available ? match[1] : replaceFtsWithPortableTable(match[1]));
  const now = '2026-07-27T00:00:00.000Z';
  const insertConcept = db.prepare(`
    INSERT INTO nutrition_food_concepts (
      id, name_fa, name_en, category, region, default_variant_id, created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `);
  insertConcept.run('serving-food', 'غذای سهمی', 'Serving food', 'stew', null, 'serving-variant', now, now);
  insertConcept.run('per100-food', 'غذای صد گرم', 'Per 100 g food', 'ingredient', null, 'per100-variant', now, now);

  const insertVariant = db.prepare(`
    INSERT INTO nutrition_food_variants (
      id, concept_id, name_fa, name_en, preparation_tags_json,
      nutrient_basis, basis_grams, nutrients_per_basis_json,
      nutrient_range_per_basis_json, evidence_tier, source_record_id,
      source_dataset, source_version, is_default
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  insertVariant.run(
    'serving-variant', 'serving-food', 'یک پرس', 'One serving', '[]',
    'per_serving', null, '{"energyKcal":400}', null, 'legacy_estimate',
    'legacy-1', 'test', null, 1,
  );
  insertVariant.run(
    'per100-variant', 'per100-food', 'صد گرم', '100 g', '[]',
    'per_100g', 100, '{"energyKcal":100}', null, 'verified_source',
    'source-1', 'test', '1', 1,
  );

  db.prepare(`
    INSERT INTO nutrition_portions (
      id, variant_id, label_fa, label_en, gram_weight, basis_multiplier
    ) VALUES (?, ?, ?, ?, ?, ?)
  `).run('serving-portion', 'serving-variant', 'یک پرس', 'One serving', null, 1);

  assert.throws(() => {
    insertVariant.run(
      'invalid-per100', 'per100-food', 'نامعتبر', 'Invalid', '[]',
      'per_100g', null, '{}', null, 'verified_source', null, 'test', null, 0,
    );
  }, /CHECK constraint failed/);

  db.prepare(`
    INSERT INTO nutrition_diary_entries (
      id, local_date, meal_type, label, source_type, source_id, grams,
      nutrition_center_json, nutrition_range_json, created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    'diary-1', '2026-07-27', 'lunch', 'Serving food', 'food',
    'serving-variant', null, '{"energyKcal":400}', null, now, now,
  );
  const diary = db.prepare('SELECT grams FROM nutrition_diary_entries WHERE id = ?').get('diary-1');
  assert.equal(diary.grams, null);

  db.prepare(`
    INSERT INTO nutrition_recipes (
      id, name, serving_count, cooked_yield_grams, created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?)
  `).run('recipe-1', 'Recipe', 2, null, now, now);
  const insertIngredient = db.prepare(`
    INSERT INTO nutrition_recipe_ingredients (
      id, recipe_id, source_type, source_id, grams, basis_multiplier,
      consumed_fraction, sort_order
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `);
  insertIngredient.run('ingredient-1', 'recipe-1', 'food', 'serving-variant', null, 2, 1, 0);
  assert.throws(() => {
    insertIngredient.run('ingredient-invalid', 'recipe-1', 'food', 'serving-variant', null, null, 1, 1);
  }, /CHECK constraint failed/);

  const tables = db.prepare(`
    SELECT name FROM sqlite_master
    WHERE type IN ('table', 'view') AND name LIKE 'nutrition_%'
    ORDER BY name
  `).all();
  assert.ok(tables.length >= 10);
  console.log(JSON.stringify({
    status: 'ok',
    nutritionObjects: tables.length,
    unknownServingWeightPreserved: diary.grams === null,
    fts5Available,
    ftsValidationMode: fts5Available ? 'native' : 'portable-table-substitute',
  }));
} finally {
  db.close();
}
