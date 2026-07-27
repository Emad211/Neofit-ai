import { z } from 'zod';
import { ExerciseVideo, ExerciseVideoSchema } from '@/domain/models';
import { getDatabase } from '@/db/database';

const VideoListSchema = z.array(ExerciseVideoSchema).max(20);

export type CachedExerciseVideos = {
  cacheKey: string;
  exerciseId: string;
  query: string;
  locale: 'fa' | 'en';
  videos: ExerciseVideo[];
  selectedIndex: number;
  fetchedAt: string;
  expiresAt: string;
};

interface CacheRow {
  cache_key: string;
  exercise_id: string;
  query: string;
  locale: 'fa' | 'en';
  videos_json: string;
  selected_index: number;
  fetched_at: string;
  expires_at: string;
}

function mapRow(row: CacheRow): CachedExerciseVideos | null {
  try {
    const videos = VideoListSchema.parse(JSON.parse(row.videos_json) as unknown);
    return {
      cacheKey: row.cache_key,
      exerciseId: row.exercise_id,
      query: row.query,
      locale: row.locale,
      videos,
      selectedIndex: Math.min(Math.max(0, row.selected_index), Math.max(0, videos.length - 1)),
      fetchedAt: row.fetched_at,
      expiresAt: row.expires_at,
    };
  } catch (error) {
    console.warn('Invalid exercise video cache row was ignored.', error);
    return null;
  }
}

export async function getExerciseVideoCache(cacheKey: string) {
  const database = await getDatabase();
  const row = await database.getFirstAsync<CacheRow>(
    'SELECT * FROM exercise_video_cache WHERE cache_key = ?;',
    cacheKey,
  );
  if (!row) return null;
  if (Date.parse(row.expires_at) <= Date.now()) {
    await database.runAsync('DELETE FROM exercise_video_cache WHERE cache_key = ?;', cacheKey);
    return null;
  }
  const parsed = mapRow(row);
  if (!parsed) {
    await database.runAsync('DELETE FROM exercise_video_cache WHERE cache_key = ?;', cacheKey);
  }
  return parsed;
}

export async function saveExerciseVideoCache(input: {
  cacheKey: string;
  exerciseId: string;
  query: string;
  locale: 'fa' | 'en';
  videos: ExerciseVideo[];
  ttlMs?: number;
}) {
  const videos = VideoListSchema.parse(input.videos);
  const database = await getDatabase();
  const fetchedAt = new Date();
  const expiresAt = new Date(fetchedAt.getTime() + Math.max(86_400_000, input.ttlMs || 60 * 86_400_000));
  await database.runAsync(
    `INSERT INTO exercise_video_cache (
      cache_key, exercise_id, query, locale, videos_json,
      selected_index, fetched_at, expires_at
    ) VALUES (?, ?, ?, ?, ?, 0, ?, ?)
    ON CONFLICT(cache_key) DO UPDATE SET
      exercise_id = excluded.exercise_id,
      query = excluded.query,
      locale = excluded.locale,
      videos_json = excluded.videos_json,
      selected_index = 0,
      fetched_at = excluded.fetched_at,
      expires_at = excluded.expires_at;`,
    input.cacheKey,
    input.exerciseId,
    input.query,
    input.locale,
    JSON.stringify(videos),
    fetchedAt.toISOString(),
    expiresAt.toISOString(),
  );
  return {
    cacheKey: input.cacheKey,
    exerciseId: input.exerciseId,
    query: input.query,
    locale: input.locale,
    videos,
    selectedIndex: 0,
    fetchedAt: fetchedAt.toISOString(),
    expiresAt: expiresAt.toISOString(),
  } satisfies CachedExerciseVideos;
}

export async function selectCachedExerciseVideo(cacheKey: string, selectedIndex: number) {
  const database = await getDatabase();
  await database.runAsync(
    'UPDATE exercise_video_cache SET selected_index = ? WHERE cache_key = ?;',
    Math.max(0, Math.round(selectedIndex)),
    cacheKey,
  );
}

export async function clearExerciseVideoCache(cacheKey?: string) {
  const database = await getDatabase();
  if (cacheKey) {
    await database.runAsync('DELETE FROM exercise_video_cache WHERE cache_key = ?;', cacheKey);
  } else {
    await database.runAsync('DELETE FROM exercise_video_cache;');
  }
}

export async function clearExpiredExerciseVideoCache() {
  const database = await getDatabase();
  await database.runAsync('DELETE FROM exercise_video_cache WHERE expires_at <= ?;', new Date().toISOString());
}
