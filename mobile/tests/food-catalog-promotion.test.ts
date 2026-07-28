import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { DatabaseSync } from 'node:sqlite';
import test from 'node:test';
import {
  canFoodCatalogSourceReplace,
} from '../src/db/food-catalog-precedence';
import { runDatabaseMigrations } from '../src/db/migration-runner';
import { migrations } from '../src/db/migration-plan';
import {
  isAllowedImportedEvidenceTier,
  legacyCatalogFoodToDocument,
  resolveCatalogEvidenceTier,
} from '../src/nutrition-core';
import {
  nodeCompatibleProductionMigrations,
  nodeDatabaseAdapter,
} from './sqlite-test-helpers';

interface PromotionRow {
  source_type: string;
  source_label: string;
  evidence_tier: string;
  source_record_id: string | null;
  source_version: string | null;
  calories: number;
}

function insertCatalogRow(
  database: DatabaseSync,
  input: {
    id: string;
    sourceType: 'seeded' | 'imported' | 'custom';
    sourceLabel: string;
    calories: number;
    evidenceTier?: string;
    sourceRecordId?: string | null;
    sourceVersion?: string | null;
  },
): void {
  database.prepare(`
    INSERT INTO food_catalog (
      id, name_fa, name_en, aliases_fa_json, aliases_en_json, aliases_search,
      category, portion_label_fa, portion_label_en, portion_grams,
      calories, protein_g, carbs_g, fat_g, variability_pct, confidence,
      source_type, source_label, evidence_tier, source_record_id, source_version,
      notes_fa, notes_en, updated_at
    ) VALUES (
      ?, ?, ?, '[]', '[]', ?,
      'custom', 'یک سهم', 'one serving', NULL,
      ?, 5, 10, 4, 20, 'medium',
      ?, ?, ?, ?, ?, '', '', '2026-07-28T00:00:00.000Z'
    )
    ON CONFLICT(id) DO UPDATE SET
      name_fa=excluded.name_fa,
      name_en=excluded.name_en,
      aliases_search=excluded.aliases_search,
      calories=excluded.calories,
      source_type=excluded.source_type,
      source_label=excluded.source_label,
      evidence_tier=excluded.evidence_tier,
      source_record_id=excluded.source_record_id,
      source_version=excluded.source_version,
      updated_at=excluded.updated_at;
  `).run(
    input.id,
    `غذای ${input.id}`,
    `Food ${input.id}`,
    input.id,
    input.calories,
    input.sourceType,
    input.sourceLabel,
    input.evidenceTier ?? 'legacy_estimate',
    input.sourceRecordId ?? null,
    input.sourceVersion ?? null,
  );
}

function row(database: DatabaseSync, id: string): PromotionRow {
  const result = database.prepare(`
    SELECT source_type, source_label, evidence_tier,
           source_record_id, source_version, calories
    FROM food_catalog WHERE id=?;
  `).get(id) as PromotionRow | undefined;
  if (!result) throw new Error(`Missing food row ${id}`);
  return result;
}

test('food source precedence matrix is explicit and conservative', () => {
  assert.equal(canFoodCatalogSourceReplace('seeded', 'seeded'), true);
  assert.equal(canFoodCatalogSourceReplace('seeded', 'imported'), true);
  assert.equal(canFoodCatalogSourceReplace('seeded', 'custom'), false);
  assert.equal(canFoodCatalogSourceReplace('imported', 'seeded'), false);
  assert.equal(canFoodCatalogSourceReplace('imported', 'imported'), true);
  assert.equal(canFoodCatalogSourceReplace('imported', 'custom'), false);
  assert.equal(canFoodCatalogSourceReplace('custom', 'seeded'), false);
  assert.equal(canFoodCatalogSourceReplace('custom', 'imported'), false);
  assert.equal(canFoodCatalogSourceReplace('custom', 'custom'), true);
});

test('SQLite promotion triggers preserve imported evidence against reseeding', async () => {
  const database = new DatabaseSync(':memory:');
  try {
    database.exec('PRAGMA foreign_keys=ON;');
    const production = nodeCompatibleProductionMigrations(database, migrations);
    await runDatabaseMigrations(nodeDatabaseAdapter(database), production.list);

    insertCatalogRow(database, {
      id: 'promoted-food',
      sourceType: 'seeded',
      sourceLabel: 'IFKB DS0 broad-fallback category prior',
      calories: 300,
    });
    assert.deepEqual(
      Object.values(row(database, 'promoted-food')),
      ['seeded', 'IFKB DS0 broad-fallback category prior', 'broad_fallback', 'promoted-food', null, 300],
    );

    insertCatalogRow(database, {
      id: 'promoted-food',
      sourceType: 'imported',
      sourceLabel: 'Peer-reviewed recipe dataset',
      calories: 412,
      evidenceTier: 'verified_source',
      sourceRecordId: 'paper-table-7-row-3',
      sourceVersion: '2026.1',
    });
    assert.deepEqual(
      Object.values(row(database, 'promoted-food')),
      ['imported', 'Peer-reviewed recipe dataset', 'verified_source', 'paper-table-7-row-3', '2026.1', 412],
    );

    insertCatalogRow(database, {
      id: 'promoted-food',
      sourceType: 'seeded',
      sourceLabel: 'IFKB DS0 broad-fallback category prior',
      calories: 250,
    });
    assert.deepEqual(
      Object.values(row(database, 'promoted-food')),
      ['imported', 'Peer-reviewed recipe dataset', 'verified_source', 'paper-table-7-row-3', '2026.1', 412],
    );
  } finally {
    database.close();
  }
});

test('SQLite protects custom ids and normalizes invalid imported evidence', async () => {
  const database = new DatabaseSync(':memory:');
  try {
    const production = nodeCompatibleProductionMigrations(database, migrations);
    await runDatabaseMigrations(nodeDatabaseAdapter(database), production.list);

    insertCatalogRow(database, {
      id: 'custom-food',
      sourceType: 'custom',
      sourceLabel: 'User entry',
      calories: 200,
    });
    insertCatalogRow(database, {
      id: 'custom-food',
      sourceType: 'imported',
      sourceLabel: 'External import',
      calories: 999,
      evidenceTier: 'verified_source',
    });
    assert.deepEqual(
      Object.values(row(database, 'custom-food')),
      ['custom', 'User entry', 'user_entered', 'custom-food', null, 200],
    );

    insertCatalogRow(database, {
      id: 'invalid-import-evidence',
      sourceType: 'imported',
      sourceLabel: 'External import',
      calories: 350,
      evidenceTier: 'broad_fallback',
    });
    assert.equal(row(database, 'invalid-import-evidence').evidence_tier, 'legacy_estimate');
  } finally {
    database.close();
  }
});

test('canonical adapter preserves explicit provenance and cannot promote DS0 by label alone', () => {
  assert.equal(resolveCatalogEvidenceTier({
    sourceType: 'imported',
    sourceLabel: 'Peer-reviewed dataset',
    evidenceTier: 'verified_source',
  }), 'verified_source');
  assert.equal(resolveCatalogEvidenceTier({
    sourceType: 'seeded',
    sourceLabel: 'IFKB DS0 broad-fallback',
    evidenceTier: 'verified_source',
  }), 'broad_fallback');
  assert.equal(resolveCatalogEvidenceTier({
    sourceType: 'custom',
    sourceLabel: 'User entry',
    evidenceTier: 'verified_source',
  }), 'user_entered');
  assert.equal(isAllowedImportedEvidenceTier('verified_source'), true);
  assert.equal(isAllowedImportedEvidenceTier('digital_consensus'), true);
  assert.equal(isAllowedImportedEvidenceTier('legacy_estimate'), true);
  assert.equal(isAllowedImportedEvidenceTier('broad_fallback'), false);
  assert.equal(isAllowedImportedEvidenceTier('user_entered'), false);

  const document = legacyCatalogFoodToDocument({
    id: 'verified-food',
    nameFa: 'غذای معتبر',
    nameEn: 'Verified food',
    aliasesFa: [],
    aliasesEn: [],
    category: 'stew',
    portionLabelFa: 'یک پرس',
    portionLabelEn: 'one serving',
    portionGrams: 280,
    calories: 410,
    proteinG: 24,
    carbsG: 30,
    fatG: 18,
    variabilityPct: 12,
    sourceType: 'imported',
    sourceLabel: 'Peer-reviewed recipe dataset',
    evidenceTier: 'verified_source',
    sourceRecordId: 'dataset:record:42',
    sourceVersion: '2026.1',
  });
  assert.equal(document.variant.evidenceTier, 'verified_source');
  assert.equal(document.variant.sourceRecordId, 'dataset:record:42');
  assert.equal(document.variant.sourceDataset, 'Peer-reviewed recipe dataset');
  assert.equal(document.variant.sourceVersion, '2026.1');
  assert.equal(document.variant.basisGrams, 280);
});

test('promotion repository restores built-ins and refreshes canonical ids after import removal', () => {
  const source = readFileSync(new URL('../src/db/food-repository-impl.ts', import.meta.url), 'utf8');
  assert.match(source, /FOOD_CATALOG_UPSERT_PRECEDENCE_SQL/);
  assert.match(source, /restoreBuiltInFoods\(transaction, previousImportedIds\)/);
  assert.match(source, /restoreBuiltInFoods\(transaction, ids\)/);
  assert.match(source, /synchronizeCanonicalFoodIds\(database, affectedIds\)/);
  assert.match(source, /synchronizeCanonicalFoodIds\(database, ids\)/);
  assert.match(source, /evidenceTier\?: EvidenceTier/);
  assert.match(source, /sourceVersion\?: string \| null/);
});
