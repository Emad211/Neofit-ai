import * as SQLite from 'expo-sqlite';
import { migrations } from '@/db/migrations';

const DATABASE_NAME = 'neofit.db';

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

export async function getDatabase() {
  if (!databasePromise) {
    databasePromise = SQLite.openDatabaseAsync(DATABASE_NAME).then(async (database) => {
      await runMigrations(database);
      return database;
    }).catch((error) => {
      databasePromise = null;
      throw error;
    });
  }

  return databasePromise;
}

export async function resetLocalDatabase() {
  const database = await getDatabase();
  await database.closeAsync();
  databasePromise = null;
  await SQLite.deleteDatabaseAsync(DATABASE_NAME);
  await getDatabase();
}

export async function healthCheckDatabase() {
  const database = await getDatabase();
  const result = await database.getFirstAsync<{ ok: number }>('SELECT 1 AS ok;');
  return result?.ok === 1;
}
