import { DatabaseSync } from 'node:sqlite';
import type {
  MigrationDatabase,
  MigrationTransaction,
} from '../src/db/migration-runner';
import type { Migration } from '../src/db/migrations';

export function nodeDatabaseAdapter(database: DatabaseSync): MigrationDatabase {
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

export function scalarNumber(database: DatabaseSync, sql: string): number {
  const row = database.prepare(sql).get() as Record<string, unknown> | undefined;
  return Number(row ? Object.values(row)[0] : 0);
}

export function tableExists(database: DatabaseSync, table: string): boolean {
  const row = database.prepare(
    "SELECT 1 AS present FROM sqlite_master WHERE type='table' AND name=?;",
  ).get(table) as { present: number } | undefined;
  return row?.present === 1;
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
  if (next === sql) throw new Error(`Could not create portable SQLite substitute for ${label}.`);
  return next;
}

export function portableNutritionSchema(sql: string): string {
  return replaceRequired(
    sql,
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

export function nodeCompatibleProductionMigrations(
  database: DatabaseSync,
  migrations: readonly Migration[],
): { readonly list: readonly Migration[]; readonly nativeFts5: boolean } {
  const nativeFts5 = supportsFts5(database);
  if (nativeFts5) return { list: migrations, nativeFts5 };

  const list = migrations.map((migration): Migration => {
    let sql = migration.sql;
    if (migration.version === 2) {
      sql = replaceRequired(
        sql,
        /CREATE VIRTUAL TABLE IF NOT EXISTS food_catalog_fts USING fts5\([\s\S]*?\);/,
        `CREATE TABLE IF NOT EXISTS food_catalog_fts (
           rowid INTEGER PRIMARY KEY,
           name_fa TEXT NOT NULL,
           name_en TEXT NOT NULL,
           aliases_search TEXT NOT NULL
         );`,
        'food_catalog_fts',
      );
      const ftsDelete = /INSERT INTO food_catalog_fts\(food_catalog_fts,\s*rowid,\s*name_fa,\s*name_en,\s*aliases_search\)\s*VALUES\s*\('delete',\s*old\.rowid,\s*old\.name_fa,\s*old\.name_en,\s*old\.aliases_search\);/g;
      const deleteCount = sql.match(ftsDelete)?.length ?? 0;
      if (deleteCount !== 2) throw new Error(`Expected two FTS delete commands, found ${deleteCount}.`);
      sql = sql.replace(ftsDelete, 'DELETE FROM food_catalog_fts WHERE rowid = old.rowid;');
    }
    if (migration.version === 3) sql = portableNutritionSchema(sql);
    return { ...migration, name: `${migration.name}-node-portable-fts`, sql };
  });
  return { list, nativeFts5 };
}
