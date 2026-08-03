import { getDatabase } from '@/db/database';

interface VisionCacheRow {
  response_json: string;
  expires_at: string;
}

export async function getNutritionVisionCache<T>(input: {
  fingerprint: string;
  providerKey: string;
  modelKey: string;
  now?: Date;
}): Promise<T | null> {
  const database = await getDatabase();
  const row = await database.getFirstAsync<VisionCacheRow>(
    `SELECT response_json, expires_at
     FROM nutrition_vision_cache
     WHERE fingerprint = ? AND provider_key = ? AND model_key = ?;`,
    input.fingerprint,
    input.providerKey,
    input.modelKey,
  );
  if (!row) return null;
  if (new Date(row.expires_at).getTime() <= (input.now ?? new Date()).getTime()) {
    await database.runAsync(
      'DELETE FROM nutrition_vision_cache WHERE fingerprint = ?;',
      input.fingerprint,
    );
    return null;
  }
  try {
    return JSON.parse(row.response_json) as T;
  } catch {
    await database.runAsync(
      'DELETE FROM nutrition_vision_cache WHERE fingerprint = ?;',
      input.fingerprint,
    );
    return null;
  }
}

export async function setNutritionVisionCache(input: {
  fingerprint: string;
  providerKey: string;
  modelKey: string;
  response: unknown;
  createdAt: string;
  expiresAt: string;
}): Promise<void> {
  const database = await getDatabase();
  await database.runAsync(
    `INSERT INTO nutrition_vision_cache (
       fingerprint, provider_key, model_key, response_json, created_at, expires_at
     ) VALUES (?, ?, ?, ?, ?, ?)
     ON CONFLICT(fingerprint) DO UPDATE SET
       provider_key = excluded.provider_key,
       model_key = excluded.model_key,
       response_json = excluded.response_json,
       created_at = excluded.created_at,
       expires_at = excluded.expires_at;`,
    input.fingerprint,
    input.providerKey,
    input.modelKey,
    JSON.stringify(input.response),
    input.createdAt,
    input.expiresAt,
  );
}

export async function pruneNutritionVisionCache(now = new Date()): Promise<number> {
  const database = await getDatabase();
  const result = await database.runAsync(
    'DELETE FROM nutrition_vision_cache WHERE expires_at <= ?;',
    now.toISOString(),
  );
  return result.changes;
}
