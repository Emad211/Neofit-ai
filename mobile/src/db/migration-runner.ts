import type { Migration } from '@/db/migrations';

export interface MigrationTransaction {
  execAsync(sql: string): Promise<void>;
}

export interface MigrationDatabase {
  getFirstAsync<T>(sql: string): Promise<T | null>;
  withExclusiveTransactionAsync(
    task: (transaction: MigrationTransaction) => Promise<void>,
  ): Promise<void>;
}

export interface MigrationRunResult {
  readonly fromVersion: number;
  readonly toVersion: number;
  readonly appliedVersions: readonly number[];
}

function assertMigrationPlan(migrations: readonly Migration[]): void {
  let previous = 0;
  for (const migration of migrations) {
    if (!Number.isInteger(migration.version) || migration.version <= 0) {
      throw new Error(`Migration version must be a positive integer: ${migration.version}`);
    }
    if (migration.version !== previous + 1) {
      throw new Error(
        `Migration versions must be contiguous. Expected ${previous + 1}, received ${migration.version}.`,
      );
    }
    if (!migration.name.trim()) {
      throw new Error(`Migration ${migration.version} requires a name.`);
    }
    if (!migration.sql.trim()) {
      throw new Error(`Migration ${migration.version} requires SQL.`);
    }
    previous = migration.version;
  }
}

async function readUserVersion(database: MigrationDatabase): Promise<number> {
  const row = await database.getFirstAsync<{ user_version: number }>('PRAGMA user_version;');
  const version = Number(row?.user_version ?? 0);
  if (!Number.isInteger(version) || version < 0) {
    throw new Error(`Invalid SQLite user_version: ${String(row?.user_version ?? 'missing')}`);
  }
  return version;
}

export async function runDatabaseMigrations(
  database: MigrationDatabase,
  migrations: readonly Migration[],
): Promise<MigrationRunResult> {
  assertMigrationPlan(migrations);
  const fromVersion = await readUserVersion(database);
  const latestVersion = migrations.at(-1)?.version ?? 0;
  if (fromVersion > latestVersion) {
    throw new Error(
      `Database version ${fromVersion} is newer than supported version ${latestVersion}.`,
    );
  }

  const appliedVersions: number[] = [];
  let currentVersion = fromVersion;
  for (const migration of migrations) {
    if (migration.version <= currentVersion) continue;
    await database.withExclusiveTransactionAsync(async (transaction) => {
      await transaction.execAsync(migration.sql);
      await transaction.execAsync(`PRAGMA user_version = ${migration.version};`);
    });
    const persistedVersion = await readUserVersion(database);
    if (persistedVersion !== migration.version) {
      throw new Error(
        `Migration ${migration.version} completed but user_version is ${persistedVersion}.`,
      );
    }
    currentVersion = persistedVersion;
    appliedVersions.push(migration.version);
  }

  return {
    fromVersion,
    toVersion: currentVersion,
    appliedVersions,
  };
}
