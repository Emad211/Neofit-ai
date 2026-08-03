import assert from 'node:assert/strict';
import { DatabaseSync } from 'node:sqlite';
import test from 'node:test';
import {
  NUTRIENT_KEYS,
  calculateUniversalFoodEstimate,
  rankUniversalCatalogCandidates,
  universalNutritionVector,
  universalSourceUncertainty,
  type NutritionVector,
  type UniversalCatalogCandidate,
  type UniversalNutrientRecord,
} from '../src';
import {
  FNDDS_150G_GOLDEN,
  SQLITE_EQUIVALENCE_GRAMS_GOLDEN,
  SR_LEGACY_50G_GOLDEN,
  UNIVERSAL_ESTIMATE_GOLDEN_PROVENANCE,
  UNIVERSAL_GRAMS_BOUNDARY_GOLDEN,
  UNIVERSAL_MACRO_GUARD_GOLDEN,
  UNIVERSAL_SOURCE_UNCERTAINTY_GOLDEN,
  UNIVERSAL_SQLITE_ROW_GOLDEN,
} from './universal-estimate-golden-v1';

interface SqliteUniversalRow {
  source_type: 'sr_legacy' | 'fndds';
  calories_kcal: number | null;
  protein_g: number | null;
  fat_g: number | null;
  carbs_g: number | null;
  fiber_g: number | null;
  sugars_g: number | null;
  sodium_mg: number | null;
  cholesterol_mg: number | null;
  calcium_mg: number | null;
  iron_mg: number | null;
  potassium_mg: number | null;
  vitamin_c_mg: number | null;
}

function recordFromSqliteRow(row: SqliteUniversalRow): UniversalNutrientRecord {
  return {
    sourceType: row.source_type,
    caloriesKcal: row.calories_kcal,
    proteinG: row.protein_g,
    fatG: row.fat_g,
    carbsG: row.carbs_g,
    fiberG: row.fiber_g,
    sugarsG: row.sugars_g,
    sodiumMg: row.sodium_mg,
    cholesterolMg: row.cholesterol_mg,
    calciumMg: row.calcium_mg,
    ironMg: row.iron_mg,
    potassiumMg: row.potassium_mg,
    vitaminCMg: row.vitamin_c_mg,
  };
}

function closeTo(
  actual: number | null | undefined,
  expected: number | null | undefined,
): void {
  if (actual === null || actual === undefined || expected === null || expected === undefined) {
    assert.equal(actual ?? null, expected ?? null);
    return;
  }
  const tolerance = Math.max(1e-10, Math.abs(expected) * 1e-12);
  assert.ok(
    Math.abs(actual - expected) <= tolerance,
    `${actual} differs from ${expected} by more than ${tolerance}`,
  );
}

function assertAbsent(vector: NutritionVector, keys: readonly string[]): void {
  for (const key of keys) {
    assert.equal(vector[key as keyof NutritionVector], undefined, key);
  }
}

function candidate(
  input: Partial<UniversalCatalogCandidate>
    & Pick<UniversalCatalogCandidate, 'id' | 'nameEn' | 'macroComplete' | 'portionCount'>,
): UniversalCatalogCandidate {
  return {
    sourceType: 'fndds',
    caloriesKcal: input.macroComplete ? 100 : null,
    proteinG: input.macroComplete ? 5 : null,
    fatG: input.macroComplete ? 2 : null,
    carbsG: input.macroComplete ? 15 : null,
    fiberG: null,
    sugarsG: null,
    sodiumMg: null,
    cholesterolMg: null,
    calciumMg: null,
    ironMg: null,
    potassiumMg: null,
    vitaminCMg: null,
    bm25: -10,
    ...input,
  };
}

test('Batch 4 fixtures identify exact Mobile, Repository and SQLite authorities', () => {
  assert.match(UNIVERSAL_ESTIMATE_GOLDEN_PROVENANCE.referenceHead, /^[a-f0-9]{40}$/);
  for (const [key, value] of Object.entries(UNIVERSAL_ESTIMATE_GOLDEN_PROVENANCE)) {
    if (key.endsWith('Blob')) assert.match(value, /^[a-f0-9]{40}$/);
  }
});

test('Universal source uncertainty matches the frozen SR/FNDDS policy', () => {
  assert.equal(universalSourceUncertainty('fndds'), UNIVERSAL_SOURCE_UNCERTAINTY_GOLDEN.fndds);
  assert.equal(
    universalSourceUncertainty('sr_legacy'),
    UNIVERSAL_SOURCE_UNCERTAINTY_GOLDEN.sr_legacy,
  );
});

test('FNDDS 150g estimate preserves missing nutrients and 15 percent range', () => {
  const estimate = calculateUniversalFoodEstimate(FNDDS_150G_GOLDEN.record, FNDDS_150G_GOLDEN.grams);
  assert.equal(estimate.grams, FNDDS_150G_GOLDEN.expected.grams);
  assert.deepEqual(estimate.center, FNDDS_150G_GOLDEN.expected.center);
  assert.deepEqual(estimate.range?.p10, FNDDS_150G_GOLDEN.expected.p10);
  assert.deepEqual(estimate.range?.p50, FNDDS_150G_GOLDEN.expected.p50);
  assert.deepEqual(estimate.range?.p90, FNDDS_150G_GOLDEN.expected.p90);
  assertAbsent(estimate.center, FNDDS_150G_GOLDEN.expected.absent);
});

test('SR Legacy 50g estimate uses the narrower 8 percent range', () => {
  const estimate = calculateUniversalFoodEstimate(
    SR_LEGACY_50G_GOLDEN.record,
    SR_LEGACY_50G_GOLDEN.grams,
  );
  assert.equal(estimate.grams, SR_LEGACY_50G_GOLDEN.expected.grams);
  assert.deepEqual(estimate.center, SR_LEGACY_50G_GOLDEN.expected.center);
  closeTo(estimate.range?.p10.energyKcal, SR_LEGACY_50G_GOLDEN.expected.p10EnergyKcal);
  closeTo(estimate.range?.p50.energyKcal, SR_LEGACY_50G_GOLDEN.expected.p50EnergyKcal);
  closeTo(estimate.range?.p90.energyKcal, SR_LEGACY_50G_GOLDEN.expected.p90EnergyKcal);
  assertAbsent(estimate.center, SR_LEGACY_50G_GOLDEN.expected.absent);
});

test('Universal vector follows the official nutrient order and omits SQLite nulls', () => {
  const vector = universalNutritionVector(FNDDS_150G_GOLDEN.record);
  assert.deepEqual(
    Object.keys(vector),
    NUTRIENT_KEYS.filter((key) => vector[key] !== undefined),
  );
  assertAbsent(vector, FNDDS_150G_GOLDEN.expected.absent);
});

test('Universal grams validation is fail-closed at the frozen boundaries', () => {
  for (const grams of UNIVERSAL_GRAMS_BOUNDARY_GOLDEN.accepted) {
    assert.equal(calculateUniversalFoodEstimate(FNDDS_150G_GOLDEN.record, grams).grams, grams);
  }
  for (const grams of UNIVERSAL_GRAMS_BOUNDARY_GOLDEN.rejected) {
    assert.throws(
      () => calculateUniversalFoodEstimate(FNDDS_150G_GOLDEN.record, grams),
      /finite positive number/,
    );
  }
});

test('Repository snake_case fixture maps without inventing missing values', () => {
  const row = UNIVERSAL_SQLITE_ROW_GOLDEN.sqlite;
  const record = recordFromSqliteRow(row);
  assert.deepEqual(record, {
    sourceType: UNIVERSAL_SQLITE_ROW_GOLDEN.candidate.sourceType,
    caloriesKcal: UNIVERSAL_SQLITE_ROW_GOLDEN.candidate.caloriesKcal,
    proteinG: UNIVERSAL_SQLITE_ROW_GOLDEN.candidate.proteinG,
    fatG: UNIVERSAL_SQLITE_ROW_GOLDEN.candidate.fatG,
    carbsG: UNIVERSAL_SQLITE_ROW_GOLDEN.candidate.carbsG,
    fiberG: UNIVERSAL_SQLITE_ROW_GOLDEN.candidate.fiberG,
    sugarsG: UNIVERSAL_SQLITE_ROW_GOLDEN.candidate.sugarsG,
    sodiumMg: UNIVERSAL_SQLITE_ROW_GOLDEN.candidate.sodiumMg,
    cholesterolMg: UNIVERSAL_SQLITE_ROW_GOLDEN.candidate.cholesterolMg,
    calciumMg: UNIVERSAL_SQLITE_ROW_GOLDEN.candidate.calciumMg,
    ironMg: UNIVERSAL_SQLITE_ROW_GOLDEN.candidate.ironMg,
    potassiumMg: UNIVERSAL_SQLITE_ROW_GOLDEN.candidate.potassiumMg,
    vitaminCMg: UNIVERSAL_SQLITE_ROW_GOLDEN.candidate.vitaminCMg,
  });
});

test('direct SQLite per-100g arithmetic matches TypeScript Universal estimates', () => {
  const database = new DatabaseSync(':memory:');
  try {
    database.exec(`
      CREATE TABLE generic_foods (
        id TEXT PRIMARY KEY,
        source_type TEXT NOT NULL,
        calories_kcal REAL,
        protein_g REAL,
        fat_g REAL,
        carbs_g REAL,
        fiber_g REAL,
        sugars_g REAL,
        sodium_mg REAL,
        cholesterol_mg REAL,
        calcium_mg REAL,
        iron_mg REAL,
        potassium_mg REAL,
        vitamin_c_mg REAL
      );
    `);
    const row = UNIVERSAL_SQLITE_ROW_GOLDEN.sqlite;
    database.prepare(`
      INSERT INTO generic_foods (
        id,source_type,calories_kcal,protein_g,fat_g,carbs_g,fiber_g,sugars_g,
        sodium_mg,cholesterol_mg,calcium_mg,iron_mg,potassium_mg,vitamin_c_mg
      ) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?);
    `).run(
      row.id,
      row.source_type,
      row.calories_kcal,
      row.protein_g,
      row.fat_g,
      row.carbs_g,
      row.fiber_g,
      row.sugars_g,
      row.sodium_mg,
      row.cholesterol_mg,
      row.calcium_mg,
      row.iron_mg,
      row.potassium_mg,
      row.vitamin_c_mg,
    );

    const stored = database.prepare(`
      SELECT source_type,calories_kcal,protein_g,fat_g,carbs_g,fiber_g,sugars_g,
             sodium_mg,cholesterol_mg,calcium_mg,iron_mg,potassium_mg,vitamin_c_mg
      FROM generic_foods WHERE id=?;
    `).get(row.id) as unknown as SqliteUniversalRow;
    const record = recordFromSqliteRow(stored);

    for (const grams of SQLITE_EQUIVALENCE_GRAMS_GOLDEN) {
      const sql = database.prepare(`
        SELECT
          calories_kcal * (? / 100.0) AS energyKcal,
          protein_g * (? / 100.0) AS proteinG,
          carbs_g * (? / 100.0) AS carbsG,
          fat_g * (? / 100.0) AS fatG,
          fiber_g * (? / 100.0) AS fiberG,
          calcium_mg * (? / 100.0) AS calciumMg,
          iron_mg * (? / 100.0) AS ironMg
        FROM generic_foods WHERE id=?;
      `).get(grams, grams, grams, grams, grams, grams, grams, row.id) as Record<string, number | null>;
      const estimate = calculateUniversalFoodEstimate(record, grams);
      closeTo(sql.energyKcal, estimate.center.energyKcal);
      closeTo(sql.proteinG, estimate.center.proteinG);
      closeTo(sql.carbsG, estimate.center.carbsG);
      closeTo(sql.fatG, estimate.center.fatG);
      closeTo(sql.fiberG, estimate.center.fiberG);
      closeTo(sql.calciumMg, estimate.center.calciumMg);
      closeTo(sql.ironMg, estimate.center.ironMg);
    }
  } finally {
    database.close();
  }
});

test('macro guard remains in ranking while grams-only complete records remain usable', () => {
  const ranked = rankUniversalCatalogCandidates('ingredient food', [
    candidate({
      id: UNIVERSAL_MACRO_GUARD_GOLDEN.incompleteId,
      nameEn: 'Ingredient food incomplete',
      macroComplete: false,
      portionCount: 2,
    }),
    candidate({
      id: UNIVERSAL_MACRO_GUARD_GOLDEN.completeGramsOnlyId,
      nameEn: 'Ingredient food',
      macroComplete: true,
      portionCount: 0,
    }),
  ]);
  assert.deepEqual(ranked.map((row) => row.id), [UNIVERSAL_MACRO_GUARD_GOLDEN.completeGramsOnlyId]);
  assert.equal(ranked[0]?.portionCount, 0);
  assert.ok(ranked[0]?.reasons.includes('complete_macros'));
  assert.equal(ranked[0]?.reasons.includes('has_portions'), false);
});
