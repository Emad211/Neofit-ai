import { File } from 'expo-file-system';
import * as SQLite from 'expo-sqlite';
import { migrations } from '@/db/migrations';

export const DATABASE_NAME = 'neofit.db';
const FOOD_SEED_SETTING = 'catalog.iranian-foods.seed-version';
const FOOD_SEED_VERSION = '1';
const REQUIRED_V1_TABLES = [
  'app_settings',
  'profile',
  'plans',
  'meal_logs',
  'activity_logs',
  'weight_logs',
  'workout_sessions',
  'workout_set_logs',
  'ai_requests',
  'ai_cache',
] as const;
const REQUIRED_V2_TABLES = ['food_catalog', 'exercise_video_cache'] as const;

let databasePromise: Promise<SQLite.SQLiteDatabase> | null = null;

async function runMigrations(database: SQLite.SQLiteDatabase) {
  await database.execAsync('PRAGMA journal_mode = WAL;');
  await database.execAsync('PRAGMA foreign_keys = ON;');
  await database.execAsync('PRAGMA busy_timeout = 5000;');

  const row = await database.getFirstAsync<{ user_version: number }>('PRAGMA user_version;');
  let currentVersion = Number(row?.user_version || 0);

  for (const migration of migrations) {
    if (migration.version <= currentVersion) continue;

    await database.withExclusiveTransactionAsync(async (transaction) => {
      await transaction.execAsync(migration.sql);
      await transaction.execAsync(`PRAGMA user_version = ${migration.version};`);
    });

    currentVersion = migration.version;
  }
}

async function seedLocalCatalogs(database: SQLite.SQLiteDatabase) {
  const row = await database.getFirstAsync<{ value: string }>(
    'SELECT value FROM app_settings WHERE key = ?;',
    FOOD_SEED_SETTING,
  );
  if (row?.value === FOOD_SEED_VERSION) return;

  const { seedIranianFoodCatalog } = await import('@/db/food-repository');
  await seedIranianFoodCatalog(database);
  await database.runAsync(
    `INSERT INTO app_settings (key, value, updated_at)
     VALUES (?, ?, ?)
     ON CONFLICT(key) DO UPDATE SET
       value = excluded.value,
       updated_at = excluded.updated_at;`,
    FOOD_SEED_SETTING,
    FOOD_SEED_VERSION,
    new Date().toISOString(),
  );
}

export async function getDatabase() {
  if (!databasePromise) {
    databasePromise = SQLite.openDatabaseAsync(DATABASE_NAME).then(async (database) => {
      await runMigrations(database);
      await seedLocalCatalogs(database);
      return database;
    }).catch((error) => {
      databasePromise = null;
      throw error;
    });
  }

  return databasePromise;
}

async function closeCurrentDatabase() {
  if (!databasePromise) return;
  const database = await databasePromise;
  await database.closeAsync();
  databasePromise = null;
}

async function validateBackupBytes(bytes: Uint8Array) {
  if (bytes.byteLength < 512) throw new Error('Backup file is too small to be a valid NeoFit database.');
  if (bytes.byteLength > 250 * 1024 * 1024) throw new Error('Backup file is larger than the supported limit.');

  const memoryDatabase = await SQLite.deserializeDatabaseAsync(bytes);
  try {
    await memoryDatabase.execAsync('PRAGMA foreign_keys = ON;');
    const integrity = await memoryDatabase.getFirstAsync<Record<string, string>>('PRAGMA integrity_check;');
    const integrityValue = integrity ? Object.values(integrity)[0] : null;
    if (integrityValue !== 'ok') throw new Error('SQLite integrity check failed.');

    const versionRow = await memoryDatabase.getFirstAsync<{ user_version: number }>('PRAGMA user_version;');
    const version = Number(versionRow?.user_version || 0);
    const newestVersion = migrations.at(-1)?.version || 0;
    if (version < 1 || version > newestVersion) {
      throw new Error('Backup database version is not supported by this app version.');
    }

    const rows = await memoryDatabase.getAllAsync<{ name: string }>(
      `SELECT name FROM sqlite_master
       WHERE type = 'table' AND name NOT LIKE 'sqlite_%';`,
    );
    const tableNames = new Set(rows.map((row) => row.name));
    const required = version >= 2
      ? [...REQUIRED_V1_TABLES, ...REQUIRED_V2_TABLES]
      : [...REQUIRED_V1_TABLES];
    const missing = required.filter((table) => !tableNames.has(table));
    if (missing.length > 0) {
      throw new Error(`Backup is missing required tables: ${missing.join(', ')}`);
    }
  } finally {
    await memoryDatabase.closeAsync();
  }
}

async function writeDatabaseBytes(bytes: Uint8Array) {
  await SQLite.deleteDatabaseAsync(DATABASE_NAME).catch(() => undefined);
  const file = new File(SQLite.defaultDatabaseDirectory, DATABASE_NAME);
  file.write(bytes);
}

export async function createDatabaseBackupBytes() {
  const database = await getDatabase();
  await database.execAsync('PRAGMA wal_checkpoint(TRUNCATE);');
  const bytes = await database.serializeAsync();
  await validateBackupBytes(bytes);
  return bytes;
}

export async function restoreDatabaseBackupBytes(bytes: Uint8Array) {
  await validateBackupBytes(bytes);

  const current = await getDatabase();
  await current.execAsync('PRAGMA wal_checkpoint(TRUNCATE);');
  const rollbackBytes = await current.serializeAsync();
  await closeCurrentDatabase();

  try {
    await writeDatabaseBytes(bytes);
    const restored = await getDatabase();
    const integrity = await restored.getFirstAsync<Record<string, string>>('PRAGMA integrity_check;');
    const integrityValue = integrity ? Object.values(integrity)[0] : null;
    if (integrityValue !== 'ok') throw new Error('Restored database failed its integrity check.');
  } catch (error) {
    await closeCurrentDatabase().catch(() => undefined);
    await writeDatabaseBytes(rollbackBytes);
    await getDatabase();
    throw error;
  }
}

export async function resetLocalDatabase() {
  await closeCurrentDatabase();
  await SQLite.deleteDatabaseAsync(DATABASE_NAME);
  await getDatabase();
}

export async function healthCheckDatabase() {
  const database = await getDatabase();
  const result = await database.getFirstAsync<{ ok: number }>('SELECT 1 AS ok;');
  return result?.ok === 1;
}
