import { createHash } from 'node:crypto';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { DatabaseSync } from 'node:sqlite';
import { IRANIAN_FALLBACK_SEED } from '../src/data/iranian-fallback-seed.generated';
import { IRANIAN_FOOD_SEED } from '../src/data/iranian-food-seed';
import { migrations } from '../src/db/migration-plan';
import {
  IFKB_CATALOG_RELEASE,
  NUTRIENT_KEYS,
} from '../src/nutrition-core';

interface SqliteObjectRow {
  type: string;
  name: string;
  tbl_name: string;
  sql: string;
}

interface TableColumnRow {
  cid: number;
  name: string;
  type: string;
  notnull: number;
  dflt_value: unknown;
  pk: number;
  hidden: number;
}

interface ForeignKeyRow {
  id: number;
  seq: number;
  table: string;
  from: string;
  to: string;
  on_update: string;
  on_delete: string;
  match: string;
}

function sha256(value: string | Buffer): string {
  return createHash('sha256').update(value).digest('hex');
}

function canonicalJson(value: unknown): string {
  return JSON.stringify(value, null, 2) + '\n';
}

function normalizeSql(value: string): string {
  return value.replace(/\s+/g, ' ').trim();
}

function supportsFts5(database: DatabaseSync): boolean {
  try {
    database.exec('CREATE VIRTUAL TABLE __fts5_probe USING fts5(value); DROP TABLE __fts5_probe;');
    return true;
  } catch (error) {
    if (String(error).includes('no such module: fts5')) return false;
    throw error;
  }
}

function replaceRequired(
  sql: string,
  pattern: RegExp,
  replacement: string,
  label: string,
): string {
  const next = sql.replace(pattern, replacement);
  if (next === sql) throw new Error(`Could not create portable substitute for ${label}.`);
  return next;
}

function portableMigrationSql(version: number, sql: string): string {
  let result = sql;
  if (version === 2) {
    result = replaceRequired(
      result,
      /CREATE VIRTUAL TABLE IF NOT EXISTS food_catalog_fts USING fts5\([\s\S]*?\);/,
      `CREATE TABLE IF NOT EXISTS food_catalog_fts (
         rowid INTEGER PRIMARY KEY,
         name_fa TEXT NOT NULL,
         name_en TEXT NOT NULL,
         aliases_search TEXT NOT NULL
       );`,
      'food_catalog_fts',
    );
    const deletion = /INSERT INTO food_catalog_fts\(food_catalog_fts,\s*rowid,\s*name_fa,\s*name_en,\s*aliases_search\)\s*VALUES\s*\('delete',\s*old\.rowid,\s*old\.name_fa,\s*old\.name_en,\s*old\.aliases_search\);/g;
    const count = result.match(deletion)?.length ?? 0;
    if (count !== 2) throw new Error(`Expected two food FTS delete commands; found ${count}.`);
    result = result.replace(deletion, 'DELETE FROM food_catalog_fts WHERE rowid = old.rowid;');
  }
  if (version === 3) {
    result = replaceRequired(
      result,
      /CREATE VIRTUAL TABLE IF NOT EXISTS nutrition_search_fts USING fts5\([\s\S]*?\);/,
      `CREATE TABLE IF NOT EXISTS nutrition_search_fts (
         concept_id TEXT,
         variant_id TEXT,
         name_fa TEXT,
         name_en TEXT,
         aliases TEXT,
         preparation_tags TEXT
       );`,
      'nutrition_search_fts',
    );
  }
  return result;
}

function quoteIdentifier(value: string): string {
  return `"${value.replaceAll('"', '""')}"`;
}

function sortedStringHash(values: readonly string[]): string {
  return sha256(values.slice().sort().join('\n') + '\n');
}

function queryStringColumn(database: DatabaseSync, sql: string): string[] {
  return (database.prepare(sql).all() as Array<Record<string, unknown>>)
    .map((row) => String(Object.values(row)[0] ?? ''))
    .filter(Boolean)
    .sort();
}

function buildPersonalSchemaAudit() {
  const database = new DatabaseSync(':memory:');
  try {
    database.exec('PRAGMA foreign_keys=ON;');
    const nativeFts5 = supportsFts5(database);
    database.exec('BEGIN IMMEDIATE;');
    try {
      for (const migration of migrations) {
        database.exec(nativeFts5 ? migration.sql : portableMigrationSql(migration.version, migration.sql));
        database.exec(`PRAGMA user_version=${migration.version};`);
      }
      database.exec('COMMIT;');
    } catch (error) {
      database.exec('ROLLBACK;');
      throw error;
    }

    const version = Number(
      (database.prepare('PRAGMA user_version;').get() as { user_version: number }).user_version,
    );
    const latest = migrations.at(-1)?.version ?? 0;
    if (version !== latest) throw new Error(`Schema audit ended at version ${version}, expected ${latest}.`);

    const objects = (database.prepare(`
      SELECT type,name,tbl_name,sql
      FROM sqlite_master
      WHERE sql IS NOT NULL
        AND name NOT LIKE 'sqlite_%'
      ORDER BY type,name;
    `).all() as unknown as SqliteObjectRow[])
      .filter((row) => !/_(?:data|idx|content|docsize|config)$/.test(row.name))
      .map((row) => ({
        type: row.type,
        name: row.name,
        tableName: row.tbl_name,
        sqlSha256: sha256(normalizeSql(row.sql)),
      }));

    const tableNames = objects
      .filter((object) => object.type === 'table')
      .map((object) => object.name)
      .sort();
    const tables = tableNames.map((table) => {
      const columns = database.prepare(`PRAGMA table_xinfo(${quoteIdentifier(table)});`).all()
        as unknown as TableColumnRow[];
      const foreignKeys = database.prepare(`PRAGMA foreign_key_list(${quoteIdentifier(table)});`).all()
        as unknown as ForeignKeyRow[];
      return {
        name: table,
        columns: columns.map((column) => ({
          name: column.name,
          type: column.type,
          notNull: column.notnull === 1,
          defaultValue: column.dflt_value === null ? null : String(column.dflt_value),
          primaryKeyPosition: column.pk,
          hidden: column.hidden,
        })),
        foreignKeys: foreignKeys.map((foreignKey) => ({
          id: foreignKey.id,
          sequence: foreignKey.seq,
          table: foreignKey.table,
          from: foreignKey.from,
          to: foreignKey.to,
          onUpdate: foreignKey.on_update,
          onDelete: foreignKey.on_delete,
          match: foreignKey.match,
        })),
      };
    });

    return {
      latestMigrationVersion: latest,
      migrationCount: migrations.length,
      migrationPlan: migrations.map((migration) => ({
        version: migration.version,
        name: migration.name,
        sqlSha256: sha256(normalizeSql(migration.sql)),
      })),
      nodeFtsValidationMode: nativeFts5 ? 'native-fts5' : 'portable-table-substitute',
      sqliteObjectCount: objects.length,
      sqliteObjects: objects,
      tableCount: tables.length,
      tables,
      schemaFingerprintSha256: sha256(canonicalJson({ objects, tables })),
    };
  } finally {
    database.close();
  }
}

function buildBundledCatalogAudit() {
  const databasePath = fileURLToPath(
    new URL('../assets/ifkb/ifkb-universal-v1.db', import.meta.url),
  );
  const manifestPath = fileURLToPath(
    new URL('../assets/ifkb/ifkb-universal-v1.manifest.json', import.meta.url),
  );
  const manifest = JSON.parse(readFileSync(manifestPath, 'utf8')) as Record<string, unknown>;
  const bytes = readFileSync(databasePath);
  const database = new DatabaseSync(databasePath, { readOnly: true });
  try {
    const genericFoodIds = queryStringColumn(database, 'SELECT id FROM generic_foods ORDER BY id;');
    const genericConceptIds = queryStringColumn(database, 'SELECT id FROM generic_concepts ORDER BY id;');
    const genericVariantMappings = queryStringColumn(
      database,
      "SELECT food_id || '=>' || concept_id FROM generic_variants ORDER BY food_id;",
    );
    const iranianCanonIds = queryStringColumn(database, 'SELECT canon_id FROM iranian_canon ORDER BY canon_id;');
    const aliasRows = queryStringColumn(
      database,
      "SELECT alias_fa || '=>' || target_type || ':' || target FROM persian_search_aliases ORDER BY alias_fa,target_type,target;",
    );
    const builtInIds = [...IRANIAN_FOOD_SEED, ...IRANIAN_FALLBACK_SEED]
      .map((item) => item.id)
      .sort();

    const checks: Array<[string, number, number]> = [
      ['generic foods', genericFoodIds.length, IFKB_CATALOG_RELEASE.genericFoodCount],
      ['generic concepts', genericConceptIds.length, IFKB_CATALOG_RELEASE.genericConceptCount],
      ['generic variant mappings', genericVariantMappings.length, IFKB_CATALOG_RELEASE.genericVariantMappingCount],
      ['Iranian canon ids', iranianCanonIds.length, IFKB_CATALOG_RELEASE.iranianCanonCount],
      ['Persian alias rows', aliasRows.length, IFKB_CATALOG_RELEASE.persianAliasCount],
      ['built-in Iranian ids', builtInIds.length, IFKB_CATALOG_RELEASE.iranianCanonCount],
    ];
    for (const [label, actual, expected] of checks) {
      if (actual !== expected) throw new Error(`${label}: ${actual} does not match ${expected}.`);
    }
    if (new Set(builtInIds).size !== builtInIds.length) {
      throw new Error('Built-in Iranian seed ids are not unique.');
    }
    if (sortedStringHash(builtInIds) !== sortedStringHash(iranianCanonIds)) {
      throw new Error('Built-in Iranian ids do not exactly match the canonical IFKB id set.');
    }
    const databaseSha256 = sha256(bytes);
    if (databaseSha256 !== IFKB_CATALOG_RELEASE.databaseSha256) {
      throw new Error('Bundled catalog SHA-256 differs from the runtime release contract.');
    }
    if (bytes.byteLength !== IFKB_CATALOG_RELEASE.databaseBytes) {
      throw new Error('Bundled catalog byte size differs from the runtime release contract.');
    }
    if (manifest.databaseSha256 !== databaseSha256) {
      throw new Error('Bundled catalog manifest SHA-256 differs from the actual asset.');
    }

    return {
      catalogRelease: IFKB_CATALOG_RELEASE,
      databaseSha256,
      databaseBytes: bytes.byteLength,
      genericFoodIdCount: genericFoodIds.length,
      genericFoodIdSetSha256: sortedStringHash(genericFoodIds),
      genericConceptIdCount: genericConceptIds.length,
      genericConceptIdSetSha256: sortedStringHash(genericConceptIds),
      genericVariantMappingCount: genericVariantMappings.length,
      genericVariantMappingSha256: sortedStringHash(genericVariantMappings),
      iranianCanonIdCount: iranianCanonIds.length,
      iranianCanonIdSetSha256: sortedStringHash(iranianCanonIds),
      builtInIranianIdSetSha256: sortedStringHash(builtInIds),
      persianAliasRowCount: aliasRows.length,
      persianAliasMappingSha256: sortedStringHash(aliasRows),
    };
  } finally {
    database.close();
  }
}

function outputPath(): string {
  const index = process.argv.indexOf('--output');
  const value = index >= 0 ? process.argv[index + 1] : undefined;
  return resolve(value ?? 'build/schema-freeze-candidate/manifest.json');
}

function main(): void {
  const personalSchema = buildPersonalSchemaAudit();
  const bundledCatalog = buildBundledCatalogAudit();
  const manifest = {
    format: 'neofit-schema-id-freeze-candidate',
    version: '1.0.0',
    status: 'candidate-not-final',
    nutritionNutrientKeys: [...NUTRIENT_KEYS],
    personalSchema,
    bundledCatalog,
  };
  const path = outputPath();
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, canonicalJson(manifest), 'utf8');
  console.log(JSON.stringify({
    output: path,
    latestMigrationVersion: personalSchema.latestMigrationVersion,
    schemaFingerprintSha256: personalSchema.schemaFingerprintSha256,
    genericFoodIdSetSha256: bundledCatalog.genericFoodIdSetSha256,
    iranianCanonIdSetSha256: bundledCatalog.iranianCanonIdSetSha256,
    status: manifest.status,
  }));
}

main();
