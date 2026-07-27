import { z } from 'zod';
import { getDatabase } from '@/db/database';

const StoredSettingSchema = z.object({ value: z.string() });

export async function getSetting<T>(
  key: string,
  schema: z.ZodType<T>,
  fallback: T,
): Promise<T> {
  const database = await getDatabase();
  const row = await database.getFirstAsync<{ value: string }>(
    'SELECT value FROM app_settings WHERE key = ?;',
    key,
  );

  const stored = StoredSettingSchema.safeParse(row);
  if (!stored.success) return fallback;

  try {
    const parsed = JSON.parse(stored.data.value) as unknown;
    const result = schema.safeParse(parsed);
    return result.success ? result.data : fallback;
  } catch {
    return fallback;
  }
}

export async function setSetting<T>(key: string, value: T) {
  const database = await getDatabase();
  const now = new Date().toISOString();
  await database.runAsync(
    `INSERT INTO app_settings (key, value, updated_at)
     VALUES (?, ?, ?)
     ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = excluded.updated_at;`,
    key,
    JSON.stringify(value),
    now,
  );
}

export async function deleteSetting(key: string) {
  const database = await getDatabase();
  await database.runAsync('DELETE FROM app_settings WHERE key = ?;', key);
}

export async function listSettings() {
  const database = await getDatabase();
  return database.getAllAsync<{ key: string; value: string; updated_at: string }>(
    'SELECT key, value, updated_at FROM app_settings ORDER BY key;',
  );
}
