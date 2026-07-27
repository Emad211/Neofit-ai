import { z } from 'zod';
import { getDatabase } from '@/db/database';
import { createId } from '@/lib/id';

export async function recordAiRequest(input: {
  kind: string;
  model: string;
  requestId: string | null;
  status: 'success' | 'failed';
  durationMs: number;
  errorCode?: string;
}) {
  const database = await getDatabase();
  await database.runAsync(
    `INSERT INTO ai_requests (
      id, kind, model, request_id, status, duration_ms, error_code, created_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?);`,
    createId('ai'),
    input.kind,
    input.model,
    input.requestId,
    input.status,
    Math.max(0, Math.round(input.durationMs)),
    input.errorCode ?? null,
    new Date().toISOString(),
  );
}

export async function getCachedAiResponse<T>(
  cacheKey: string,
  schema: z.ZodType<T>,
): Promise<T | null> {
  const database = await getDatabase();
  const row = await database.getFirstAsync<{
    response_json: string;
    expires_at: string;
  }>(
    'SELECT response_json, expires_at FROM ai_cache WHERE cache_key = ?;',
    cacheKey,
  );

  if (!row) return null;
  if (Date.parse(row.expires_at) <= Date.now()) {
    await database.runAsync('DELETE FROM ai_cache WHERE cache_key = ?;', cacheKey);
    return null;
  }

  try {
    return schema.parse(JSON.parse(row.response_json) as unknown);
  } catch {
    await database.runAsync('DELETE FROM ai_cache WHERE cache_key = ?;', cacheKey);
    return null;
  }
}

export async function setCachedAiResponse(input: {
  cacheKey: string;
  kind: string;
  response: unknown;
  ttlMs: number;
}) {
  const database = await getDatabase();
  const now = new Date();
  const expiresAt = new Date(now.getTime() + Math.max(60_000, input.ttlMs));

  await database.runAsync(
    `INSERT INTO ai_cache (cache_key, kind, response_json, expires_at, created_at)
     VALUES (?, ?, ?, ?, ?)
     ON CONFLICT(cache_key) DO UPDATE SET
       kind = excluded.kind,
       response_json = excluded.response_json,
       expires_at = excluded.expires_at,
       created_at = excluded.created_at;`,
    input.cacheKey,
    input.kind,
    JSON.stringify(input.response),
    expiresAt.toISOString(),
    now.toISOString(),
  );
}

export async function clearExpiredAiCache() {
  const database = await getDatabase();
  await database.runAsync('DELETE FROM ai_cache WHERE expires_at <= ?;', new Date().toISOString());
}

export async function getAiRequestStats(days = 30) {
  const database = await getDatabase();
  const since = new Date(Date.now() - Math.max(1, days) * 86_400_000).toISOString();
  return database.getAllAsync<{
    kind: string;
    status: string;
    count: number;
    averageDurationMs: number;
  }>(
    `SELECT
      kind,
      status,
      COUNT(*) AS count,
      AVG(duration_ms) AS averageDurationMs
     FROM ai_requests
     WHERE created_at >= ?
     GROUP BY kind, status
     ORDER BY kind, status;`,
    since,
  );
}
