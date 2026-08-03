import assert from 'node:assert/strict';
import { DatabaseSync } from 'node:sqlite';
import test from 'node:test';
import {
  NUTRITION_CORE_MIGRATION_V1,
  calculateVariantNutrition,
  type FoodVariant,
  type NutritionVector,
} from '../src/nutrition-core';
import { portableNutritionSchema } from './sqlite-test-helpers';

function closeTo(actual: number | null | undefined, expected: number | null | undefined): void {
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

function insertVariant(database: DatabaseSync, variant: FoodVariant): void {
  const now = '2026-07-28T00:00:00.000Z';
  database.prepare(`
    INSERT INTO nutrition_food_concepts (
      id, name_fa, name_en, category, region, default_variant_id, created_at, updated_at
    ) VALUES (?, ?, ?, 'test', NULL, ?, ?, ?);
  `).run(
    variant.conceptId,
    `مفهوم ${variant.conceptId}`,
    `Concept ${variant.conceptId}`,
    variant.id,
    now,
    now,
  );
  database.prepare(`
    INSERT INTO nutrition_food_variants (
      id, concept_id, name_fa, name_en, preparation_tags_json,
      nutrient_basis, basis_grams, nutrients_per_basis_json,
      nutrient_range_per_basis_json, evidence_tier, source_record_id,
      source_dataset, source_version, is_default
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1);
  `).run(
    variant.id,
    variant.conceptId,
    variant.nameFa,
    variant.nameEn,
    JSON.stringify(variant.preparationTags),
    variant.nutrientBasis,
    variant.basisGrams,
    JSON.stringify(variant.nutrientsPerBasis),
    variant.nutrientRangePerBasis === undefined ? null : JSON.stringify(variant.nutrientRangePerBasis),
    variant.evidenceTier,
    variant.sourceRecordId ?? null,
    variant.sourceDataset ?? null,
    variant.sourceVersion ?? null,
  );
  const insertPortion = database.prepare(`
    INSERT INTO nutrition_portions (
      id, variant_id, label_fa, label_en, gram_weight, basis_multiplier
    ) VALUES (?, ?, ?, ?, ?, ?);
  `);
  for (const portion of variant.portions) {
    insertPortion.run(
      portion.id,
      variant.id,
      portion.labelFa,
      portion.labelEn,
      portion.gramWeight,
      portion.basisMultiplier,
    );
  }
}

interface SqlNutritionResult {
  grams: number | null;
  energyKcal: number | null;
  proteinG: number | null;
  carbsG: number | null;
  fatG: number | null;
  calciumMg: number | null;
  p10EnergyKcal: number | null;
  p50EnergyKcal: number | null;
  p90EnergyKcal: number | null;
}

function calculatePortionInSql(
  database: DatabaseSync,
  variantId: string,
  portionId: string,
  count: number,
): SqlNutritionResult {
  return database.prepare(`
    SELECT
      CASE WHEN p.gram_weight IS NULL THEN NULL ELSE p.gram_weight * ? END AS grams,
      json_extract(v.nutrients_per_basis_json, '$.energyKcal') * p.basis_multiplier * ? AS energyKcal,
      json_extract(v.nutrients_per_basis_json, '$.proteinG') * p.basis_multiplier * ? AS proteinG,
      json_extract(v.nutrients_per_basis_json, '$.carbsG') * p.basis_multiplier * ? AS carbsG,
      json_extract(v.nutrients_per_basis_json, '$.fatG') * p.basis_multiplier * ? AS fatG,
      json_extract(v.nutrients_per_basis_json, '$.calciumMg') * p.basis_multiplier * ? AS calciumMg,
      COALESCE(
        json_extract(v.nutrient_range_per_basis_json, '$.p10.energyKcal'),
        json_extract(v.nutrients_per_basis_json, '$.energyKcal')
      ) * p.basis_multiplier * ? AS p10EnergyKcal,
      COALESCE(
        json_extract(v.nutrient_range_per_basis_json, '$.p50.energyKcal'),
        json_extract(v.nutrients_per_basis_json, '$.energyKcal')
      ) * p.basis_multiplier * ? AS p50EnergyKcal,
      COALESCE(
        json_extract(v.nutrient_range_per_basis_json, '$.p90.energyKcal'),
        json_extract(v.nutrients_per_basis_json, '$.energyKcal')
      ) * p.basis_multiplier * ? AS p90EnergyKcal
    FROM nutrition_food_variants v
    JOIN nutrition_portions p ON p.variant_id=v.id
    WHERE v.id=? AND p.id=?;
  `).get(
    count,
    count,
    count,
    count,
    count,
    count,
    count,
    count,
    count,
    variantId,
    portionId,
  ) as SqlNutritionResult;
}

function calculateGramsInSql(
  database: DatabaseSync,
  variantId: string,
  grams: number,
): Pick<SqlNutritionResult, 'grams' | 'energyKcal' | 'proteinG' | 'calciumMg'> {
  return database.prepare(`
    SELECT
      ? AS grams,
      json_extract(nutrients_per_basis_json, '$.energyKcal') * (? / basis_grams) AS energyKcal,
      json_extract(nutrients_per_basis_json, '$.proteinG') * (? / basis_grams) AS proteinG,
      json_extract(nutrients_per_basis_json, '$.calciumMg') * (? / basis_grams) AS calciumMg
    FROM nutrition_food_variants
    WHERE id=?;
  `).get(grams, grams, grams, grams, variantId) as Pick<
    SqlNutritionResult,
    'grams' | 'energyKcal' | 'proteinG' | 'calciumMg'
  >;
}

function compareVector(sql: SqlNutritionResult, vector: NutritionVector): void {
  closeTo(sql.energyKcal, vector.energyKcal);
  closeTo(sql.proteinG, vector.proteinG);
  closeTo(sql.carbsG, vector.carbsG);
  closeTo(sql.fatG, vector.fatG);
  closeTo(sql.calciumMg, vector.calciumMg);
}

test('SQLite basis and portion arithmetic matches TypeScript Nutrition Core', () => {
  const database = new DatabaseSync(':memory:');
  try {
    database.exec(portableNutritionSchema(NUTRITION_CORE_MIGRATION_V1));
    const per100: FoodVariant = {
      id: 'variant-per100',
      conceptId: 'concept-per100',
      nameFa: 'غذای صدگرمی',
      nameEn: 'Per 100 g food',
      preparationTags: ['cooked'],
      nutrientBasis: 'per_100g',
      basisGrams: 100,
      nutrientsPerBasis: {
        energyKcal: 237.4,
        proteinG: 12.75,
        carbsG: 31.2,
        fatG: 6.4,
        sodiumMg: 90,
      },
      nutrientRangePerBasis: {
        p10: { energyKcal: 213.66, proteinG: 11.475 },
        p50: { energyKcal: 237.4, proteinG: 12.75 },
        p90: { energyKcal: 261.14, proteinG: 14.025 },
      },
      portions: [{
        id: 'portion-bowl',
        labelFa: 'یک کاسه',
        labelEn: 'one bowl',
        gramWeight: 175,
        basisMultiplier: 1.75,
      }],
      evidenceTier: 'verified_source',
      sourceRecordId: 'source-100',
      sourceDataset: 'equivalence-test',
      sourceVersion: '1',
    };
    insertVariant(database, per100);

    for (const count of [0.5, 1, 1.5, 2, 3.25]) {
      const typescript = calculateVariantNutrition(per100, {
        kind: 'portion',
        portionId: 'portion-bowl',
        count,
      });
      const sqlite = calculatePortionInSql(database, per100.id, 'portion-bowl', count);
      closeTo(sqlite.grams, typescript.grams);
      compareVector(sqlite, typescript.center);
      closeTo(sqlite.p10EnergyKcal, typescript.range?.p10.energyKcal);
      closeTo(sqlite.p50EnergyKcal, typescript.range?.p50.energyKcal);
      closeTo(sqlite.p90EnergyKcal, typescript.range?.p90.energyKcal);
      assert.equal(sqlite.calciumMg, null);
      assert.equal(typescript.center.calciumMg, undefined);
    }

    for (const grams of [1, 83.3, 100, 250.75, 999.9]) {
      const typescript = calculateVariantNutrition(per100, { kind: 'grams', grams });
      const sqlite = calculateGramsInSql(database, per100.id, grams);
      closeTo(sqlite.grams, typescript.grams);
      closeTo(sqlite.energyKcal, typescript.center.energyKcal);
      closeTo(sqlite.proteinG, typescript.center.proteinG);
      assert.equal(sqlite.calciumMg, null);
      assert.equal(typescript.center.calciumMg, undefined);
    }
  } finally {
    database.close();
  }
});

test('SQLite and TypeScript preserve unknown serving weight and point ranges', () => {
  const database = new DatabaseSync(':memory:');
  try {
    database.exec(portableNutritionSchema(NUTRITION_CORE_MIGRATION_V1));
    const serving: FoodVariant = {
      id: 'variant-serving',
      conceptId: 'concept-serving',
      nameFa: 'غذای سهمی',
      nameEn: 'Serving food',
      preparationTags: ['mixed'],
      nutrientBasis: 'per_serving',
      basisGrams: null,
      nutrientsPerBasis: {
        energyKcal: 420,
        proteinG: 18,
        carbsG: 36,
        fatG: 22,
      },
      portions: [{
        id: 'portion-serving',
        labelFa: 'یک پرس',
        labelEn: 'one serving',
        gramWeight: null,
        basisMultiplier: 1,
      }],
      evidenceTier: 'broad_fallback',
      sourceDataset: 'equivalence-test',
    };
    insertVariant(database, serving);

    const typescript = calculateVariantNutrition(serving, {
      kind: 'portion',
      portionId: 'portion-serving',
      count: 2,
    });
    const sqlite = calculatePortionInSql(database, serving.id, 'portion-serving', 2);
    assert.equal(typescript.grams, null);
    assert.equal(sqlite.grams, null);
    compareVector(sqlite, typescript.center);
    closeTo(sqlite.p10EnergyKcal, typescript.range?.p10.energyKcal);
    closeTo(sqlite.p50EnergyKcal, typescript.range?.p50.energyKcal);
    closeTo(sqlite.p90EnergyKcal, typescript.range?.p90.energyKcal);
    closeTo(typescript.range?.p10.energyKcal, typescript.center.energyKcal);
    closeTo(typescript.range?.p50.energyKcal, typescript.center.energyKcal);
    closeTo(typescript.range?.p90.energyKcal, typescript.center.energyKcal);
  } finally {
    database.close();
  }
});
