import { getDatabase } from '@/db/database';
import {
  summarizeDiaryDay,
  type DiaryDaySummary,
  type DiaryEntry,
  type MealType,
  type NutritionEstimate,
  type NutritionRange,
  type NutritionVector,
} from '@/nutrition-core';

interface DiaryRow {
  id: string;
  local_date: string;
  meal_type: MealType;
  label: string;
  source_type: DiaryEntry['sourceType'];
  source_id: string;
  grams: number | null;
  nutrition_center_json: string;
  nutrition_range_json: string | null;
  created_at: string;
  updated_at: string;
}

function parseJson<T>(value: string | null, fallback: T): T {
  if (value === null) return fallback;
  try {
    return JSON.parse(value) as T;
  } catch {
    return fallback;
  }
}

function mapDiaryRow(row: DiaryRow): DiaryEntry {
  const center = parseJson<NutritionVector>(row.nutrition_center_json, {});
  const estimateBase = { grams: row.grams, center } satisfies Omit<NutritionEstimate, 'range'>;
  return {
    id: row.id,
    localDate: row.local_date,
    mealType: row.meal_type,
    label: row.label,
    sourceType: row.source_type,
    sourceId: row.source_id,
    estimate: row.nutrition_range_json === null
      ? estimateBase
      : { ...estimateBase, range: parseJson<NutritionRange>(row.nutrition_range_json, { p10: {}, p50: {}, p90: {} }) },
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function assertLocalDate(value: string, label: string): void {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) throw new Error(`${label} must use YYYY-MM-DD`);
}

export async function saveNutritionDiaryEntry(entry: DiaryEntry): Promise<void> {
  const database = await getDatabase();
  await database.runAsync(
    `INSERT INTO nutrition_diary_entries (
       id, local_date, meal_type, label, source_type, source_id, grams,
       nutrition_center_json, nutrition_range_json, created_at, updated_at
     ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
     ON CONFLICT(id) DO UPDATE SET
       local_date = excluded.local_date,
       meal_type = excluded.meal_type,
       label = excluded.label,
       source_type = excluded.source_type,
       source_id = excluded.source_id,
       grams = excluded.grams,
       nutrition_center_json = excluded.nutrition_center_json,
       nutrition_range_json = excluded.nutrition_range_json,
       updated_at = excluded.updated_at;`,
    entry.id,
    entry.localDate,
    entry.mealType,
    entry.label,
    entry.sourceType,
    entry.sourceId,
    entry.estimate.grams,
    JSON.stringify(entry.estimate.center),
    entry.estimate.range === undefined ? null : JSON.stringify(entry.estimate.range),
    entry.createdAt,
    entry.updatedAt,
  );
}

export async function getNutritionDiaryEntry(id: string): Promise<DiaryEntry | null> {
  const database = await getDatabase();
  const row = await database.getFirstAsync<DiaryRow>(
    'SELECT * FROM nutrition_diary_entries WHERE id = ?;',
    id,
  );
  return row ? mapDiaryRow(row) : null;
}

export async function listNutritionDiaryEntries(input: {
  localDate?: string;
  mealType?: MealType;
  limit?: number;
} = {}): Promise<DiaryEntry[]> {
  const database = await getDatabase();
  const clauses: string[] = [];
  const parameters: (string | number)[] = [];
  if (input.localDate) {
    assertLocalDate(input.localDate, 'localDate');
    clauses.push('local_date = ?');
    parameters.push(input.localDate);
  }
  if (input.mealType) {
    clauses.push('meal_type = ?');
    parameters.push(input.mealType);
  }
  const limit = Math.min(2_000, Math.max(1, Math.round(input.limit ?? 500)));
  parameters.push(limit);
  const where = clauses.length === 0 ? '' : `WHERE ${clauses.join(' AND ')}`;
  const rows = await database.getAllAsync<DiaryRow>(
    `SELECT * FROM nutrition_diary_entries
     ${where}
     ORDER BY local_date DESC, created_at DESC
     LIMIT ?;`,
    ...parameters,
  );
  return rows.map(mapDiaryRow);
}

export async function listNutritionDiaryEntriesInRange(input: {
  readonly dateFrom: string;
  readonly dateTo: string;
  readonly limit?: number;
}): Promise<DiaryEntry[]> {
  assertLocalDate(input.dateFrom, 'dateFrom');
  assertLocalDate(input.dateTo, 'dateTo');
  if (input.dateFrom > input.dateTo) throw new Error('dateFrom must not be after dateTo');
  const limit = Math.min(50_000, Math.max(1, Math.round(input.limit ?? 20_000)));
  const database = await getDatabase();
  const rows = await database.getAllAsync<DiaryRow>(
    `SELECT * FROM nutrition_diary_entries
     WHERE local_date >= ? AND local_date <= ?
     ORDER BY local_date DESC, created_at DESC
     LIMIT ?;`,
    input.dateFrom,
    input.dateTo,
    limit,
  );
  return rows.map(mapDiaryRow);
}

export async function listAllNutritionDiaryEntries(limit = 50_000): Promise<DiaryEntry[]> {
  const safeLimit = Math.min(50_000, Math.max(1, Math.round(limit)));
  const database = await getDatabase();
  const rows = await database.getAllAsync<DiaryRow>(
    `SELECT * FROM nutrition_diary_entries
     ORDER BY local_date DESC, created_at DESC
     LIMIT ?;`,
    safeLimit,
  );
  return rows.map(mapDiaryRow);
}

export async function deleteNutritionDiaryEntry(id: string): Promise<boolean> {
  const database = await getDatabase();
  const result = await database.runAsync(
    'DELETE FROM nutrition_diary_entries WHERE id = ?;',
    id,
  );
  return result.changes > 0;
}

export async function summarizeNutritionDiaryDate(localDate: string): Promise<DiaryDaySummary> {
  const entries = await listNutritionDiaryEntries({ localDate, limit: 2_000 });
  return summarizeDiaryDay(entries, localDate);
}
