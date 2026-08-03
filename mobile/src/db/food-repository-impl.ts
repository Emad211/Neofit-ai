import type * as SQLite from 'expo-sqlite';
import { IRANIAN_FALLBACK_SEED } from '@/data/iranian-fallback-seed.generated';
import { IRANIAN_FOOD_SEED } from '@/data/iranian-food-seed';
import { FoodCatalogItem, FoodCatalogItemSchema } from '@/domain/models';
import { getDatabase } from '@/db/database';
import { FOOD_CATALOG_UPSERT_PRECEDENCE_SQL } from '@/db/food-catalog-precedence';
import { createId } from '@/lib/id';
import {
  isAllowedImportedEvidenceTier,
  legacyCatalogFoodToDocument,
  resolveCatalogEvidenceTier,
  type EvidenceTier,
} from '@/nutrition-core';
import {
  deleteNutritionFoodConcepts,
  upsertNutritionFoodDocuments,
} from '@/db/nutrition-food-repository';

const BUILT_IN_IRANIAN_FOOD_SEED: readonly FoodCatalogItem[] = [
  ...IRANIAN_FOOD_SEED,
  ...IRANIAN_FALLBACK_SEED,
];
const BUILT_IN_IRANIAN_FOOD_BY_ID = new Map(
  BUILT_IN_IRANIAN_FOOD_SEED.map((item) => [item.id, item] as const),
);
if (BUILT_IN_IRANIAN_FOOD_SEED.length !== 261) {
  throw new Error(`Built-in Iranian catalog must contain 261 records; found ${BUILT_IN_IRANIAN_FOOD_SEED.length}.`);
}
if (BUILT_IN_IRANIAN_FOOD_BY_ID.size !== BUILT_IN_IRANIAN_FOOD_SEED.length) {
  throw new Error('Built-in Iranian catalog contains duplicate ids.');
}

export type FoodCatalogRecord = FoodCatalogItem & {
  readonly evidenceTier: EvidenceTier;
  readonly sourceRecordId: string | null;
  readonly sourceVersion: string | null;
};

interface FoodRow {
  id: string;
  name_fa: string;
  name_en: string;
  aliases_fa_json: string;
  aliases_en_json: string;
  category: FoodCatalogItem['category'];
  portion_label_fa: string;
  portion_label_en: string;
  portion_grams: number | null;
  calories: number;
  protein_g: number;
  carbs_g: number;
  fat_g: number;
  variability_pct: number;
  confidence: FoodCatalogItem['confidence'];
  source_type: FoodCatalogItem['sourceType'];
  source_label: string;
  evidence_tier: EvidenceTier;
  source_record_id: string | null;
  source_version: string | null;
  notes_fa: string;
  notes_en: string;
  updated_at: string;
}

interface FoodProvenanceInput {
  readonly evidenceTier?: EvidenceTier;
  readonly sourceRecordId?: string | null;
  readonly sourceVersion?: string | null;
}

function parseStringArray(value: string): string[] {
  try {
    const parsed = JSON.parse(value) as unknown;
    return Array.isArray(parsed)
      ? parsed.filter((item): item is string => typeof item === 'string')
      : [];
  } catch {
    return [];
  }
}

function mapFood(row: FoodRow): FoodCatalogRecord {
  const base = FoodCatalogItemSchema.parse({
    id: row.id,
    nameFa: row.name_fa,
    nameEn: row.name_en,
    aliasesFa: parseStringArray(row.aliases_fa_json),
    aliasesEn: parseStringArray(row.aliases_en_json),
    category: row.category,
    portionLabelFa: row.portion_label_fa,
    portionLabelEn: row.portion_label_en,
    portionGrams: row.portion_grams,
    calories: row.calories,
    proteinG: row.protein_g,
    carbsG: row.carbs_g,
    fatG: row.fat_g,
    variabilityPct: row.variability_pct,
    confidence: row.confidence,
    sourceType: row.source_type,
    sourceLabel: row.source_label,
    notesFa: row.notes_fa,
    notesEn: row.notes_en,
    updatedAt: row.updated_at,
  });
  return {
    ...base,
    evidenceTier: row.evidence_tier,
    sourceRecordId: row.source_record_id,
    sourceVersion: row.source_version,
  };
}

function nutritionDocumentFromCatalogItem(item: FoodCatalogRecord) {
  const legacy = legacyCatalogFoodToDocument({
    id: item.id,
    nameFa: item.nameFa,
    nameEn: item.nameEn,
    aliasesFa: item.aliasesFa,
    aliasesEn: item.aliasesEn,
    category: item.category,
    portionLabelFa: item.portionLabelFa,
    portionLabelEn: item.portionLabelEn,
    portionGrams: item.portionGrams,
    calories: item.calories,
    proteinG: item.proteinG,
    carbsG: item.carbsG,
    fatG: item.fatG,
    variabilityPct: item.variabilityPct,
    sourceType: item.sourceType,
    sourceLabel: item.sourceLabel,
    evidenceTier: item.evidenceTier,
    sourceRecordId: item.sourceRecordId,
    sourceVersion: item.sourceVersion,
  });
  return { concept: legacy.concept, variants: [legacy.variant] };
}

export function normalizeFoodSearch(value: string): string {
  return value
    .normalize('NFKC')
    .toLocaleLowerCase('fa')
    .replace(/[يى]/g, 'ی')
    .replace(/ك/g, 'ک')
    .replace(/[ۀة]/g, 'ه')
    .replace(/[ؤ]/g, 'و')
    .replace(/[إأ]/g, 'ا')
    .replace(/[َُِّْٰـ]/g, '')
    .replace(/[\u200c\u200f\u202a-\u202e]/g, ' ')
    .replace(/[^\p{L}\p{N}\s]/gu, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function searchText(item: FoodCatalogItem): string {
  return normalizeFoodSearch([
    item.nameFa,
    item.nameEn,
    ...item.aliasesFa,
    ...item.aliasesEn,
  ].join(' '));
}

function normalizedOptionalText(
  value: string | null | undefined,
  label: string,
  maximumLength: number,
): string | null {
  const normalized = value?.trim() ?? '';
  if (!normalized) return null;
  if (normalized.length > maximumLength) {
    throw new Error(`${label} must not exceed ${maximumLength} characters.`);
  }
  return normalized;
}

function resolveFoodProvenance(
  item: FoodCatalogItem,
  input: FoodProvenanceInput = {},
): Pick<FoodCatalogRecord, 'evidenceTier' | 'sourceRecordId' | 'sourceVersion'> {
  return {
    evidenceTier: resolveCatalogEvidenceTier({
      sourceType: item.sourceType,
      sourceLabel: item.sourceLabel,
      ...(input.evidenceTier === undefined ? {} : { evidenceTier: input.evidenceTier }),
    }),
    sourceRecordId: normalizedOptionalText(input.sourceRecordId, 'sourceRecordId', 300) ?? item.id,
    sourceVersion: normalizedOptionalText(input.sourceVersion, 'sourceVersion', 120),
  };
}

async function insertFood(
  database: SQLite.SQLiteDatabase,
  item: FoodCatalogItem,
  provenanceInput: FoodProvenanceInput = {},
): Promise<void> {
  const provenance = resolveFoodProvenance(item, provenanceInput);
  await database.runAsync(
    `INSERT INTO food_catalog (
      id, name_fa, name_en, aliases_fa_json, aliases_en_json, aliases_search,
      category, portion_label_fa, portion_label_en, portion_grams,
      calories, protein_g, carbs_g, fat_g, variability_pct, confidence,
      source_type, source_label, evidence_tier, source_record_id, source_version,
      notes_fa, notes_en, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    ON CONFLICT(id) DO UPDATE SET
      name_fa = excluded.name_fa,
      name_en = excluded.name_en,
      aliases_fa_json = excluded.aliases_fa_json,
      aliases_en_json = excluded.aliases_en_json,
      aliases_search = excluded.aliases_search,
      category = excluded.category,
      portion_label_fa = excluded.portion_label_fa,
      portion_label_en = excluded.portion_label_en,
      portion_grams = excluded.portion_grams,
      calories = excluded.calories,
      protein_g = excluded.protein_g,
      carbs_g = excluded.carbs_g,
      fat_g = excluded.fat_g,
      variability_pct = excluded.variability_pct,
      confidence = excluded.confidence,
      source_type = excluded.source_type,
      source_label = excluded.source_label,
      evidence_tier = excluded.evidence_tier,
      source_record_id = excluded.source_record_id,
      source_version = excluded.source_version,
      notes_fa = excluded.notes_fa,
      notes_en = excluded.notes_en,
      updated_at = excluded.updated_at
    WHERE ${FOOD_CATALOG_UPSERT_PRECEDENCE_SQL};`,
    item.id,
    item.nameFa,
    item.nameEn,
    JSON.stringify(item.aliasesFa),
    JSON.stringify(item.aliasesEn),
    searchText(item),
    item.category,
    item.portionLabelFa,
    item.portionLabelEn,
    item.portionGrams,
    item.calories,
    item.proteinG,
    item.carbsG,
    item.fatG,
    item.variabilityPct,
    item.confidence,
    item.sourceType,
    item.sourceLabel,
    provenance.evidenceTier,
    provenance.sourceRecordId,
    provenance.sourceVersion,
    item.notesFa,
    item.notesEn,
    item.updatedAt,
  );
}

function uniqueIds(ids: readonly string[]): string[] {
  return [...new Set(ids.map((id) => id.trim()).filter(Boolean))];
}

async function listFoodRowsByIds(
  database: SQLite.SQLiteDatabase,
  ids: readonly string[],
): Promise<FoodRow[]> {
  const normalized = uniqueIds(ids);
  const rows: FoodRow[] = [];
  for (let offset = 0; offset < normalized.length; offset += 400) {
    const chunk = normalized.slice(offset, offset + 400);
    const placeholders = chunk.map(() => '?').join(',');
    rows.push(...await database.getAllAsync<FoodRow>(
      `SELECT * FROM food_catalog WHERE id IN (${placeholders}) ORDER BY id;`,
      ...chunk,
    ));
  }
  return rows;
}

async function restoreBuiltInFoods(
  database: SQLite.SQLiteDatabase,
  ids: readonly string[],
): Promise<void> {
  for (const id of uniqueIds(ids)) {
    const builtIn = BUILT_IN_IRANIAN_FOOD_BY_ID.get(id);
    if (builtIn) await insertFood(database, builtIn);
  }
}

async function synchronizeCanonicalFoodIds(
  database: SQLite.SQLiteDatabase,
  ids: readonly string[],
): Promise<void> {
  const normalized = uniqueIds(ids);
  if (normalized.length === 0) return;
  await deleteNutritionFoodConcepts(normalized, database);
  const currentRows = await listFoodRowsByIds(database, normalized);
  await upsertNutritionFoodDocuments(
    currentRows.map(mapFood).map(nutritionDocumentFromCatalogItem),
    database,
  );
}

export async function seedIranianFoodCatalog(database?: SQLite.SQLiteDatabase): Promise<void> {
  const db = database ?? await getDatabase();
  await db.withExclusiveTransactionAsync(async (transaction) => {
    for (const item of BUILT_IN_IRANIAN_FOOD_SEED) {
      await insertFood(transaction, item);
    }
  });
}

export async function countFoodCatalog(): Promise<number> {
  const database = await getDatabase();
  const row = await database.getFirstAsync<{ count: number }>('SELECT COUNT(*) AS count FROM food_catalog;');
  return Number(row?.count || 0);
}

export async function getFoodById(id: string): Promise<FoodCatalogRecord | null> {
  const database = await getDatabase();
  const row = await database.getFirstAsync<FoodRow>('SELECT * FROM food_catalog WHERE id = ?;', id);
  return row ? mapFood(row) : null;
}

export async function listFoodCatalog(input: {
  category?: FoodCatalogItem['category'];
  limit?: number;
  offset?: number;
} = {}): Promise<FoodCatalogRecord[]> {
  const database = await getDatabase();
  const limit = Math.min(500, Math.max(1, Math.round(input.limit || 100)));
  const offset = Math.max(0, Math.round(input.offset || 0));
  const rows = input.category
    ? await database.getAllAsync<FoodRow>(
        'SELECT * FROM food_catalog WHERE category = ? ORDER BY name_fa LIMIT ? OFFSET ?;',
        input.category,
        limit,
        offset,
      )
    : await database.getAllAsync<FoodRow>(
        'SELECT * FROM food_catalog ORDER BY category, name_fa LIMIT ? OFFSET ?;',
        limit,
        offset,
      );
  return rows.map(mapFood);
}

export async function listAllFoodCatalog(): Promise<FoodCatalogRecord[]> {
  const database = await getDatabase();
  const rows = await database.getAllAsync<FoodRow>(
    'SELECT * FROM food_catalog ORDER BY category, name_fa;',
  );
  return rows.map(mapFood);
}

function safeFtsQuery(value: string): string {
  const tokens = normalizeFoodSearch(value).split(' ').filter((token) => token.length > 0).slice(0, 8);
  return tokens.map((token) => `"${token.replaceAll('"', '""')}"*`).join(' AND ');
}

export async function searchFoodCatalog(query: string, limit = 30): Promise<FoodCatalogRecord[]> {
  const database = await getDatabase();
  const normalized = normalizeFoodSearch(query);
  const safeLimit = Math.min(100, Math.max(1, Math.round(limit)));
  if (!normalized) return listFoodCatalog({ limit: safeLimit });

  try {
    const ftsQuery = safeFtsQuery(normalized);
    const rows = await database.getAllAsync<FoodRow>(
      `SELECT food_catalog.*
       FROM food_catalog_fts
       JOIN food_catalog ON food_catalog.rowid = food_catalog_fts.rowid
       WHERE food_catalog_fts MATCH ?
       ORDER BY bm25(food_catalog_fts), food_catalog.name_fa
       LIMIT ?;`,
      ftsQuery,
      safeLimit,
    );
    if (rows.length > 0) return rows.map(mapFood);
  } catch (error) {
    console.warn('Food FTS query failed; falling back to normalized search.', error);
  }

  const like = `%${normalized}%`;
  const rows = await database.getAllAsync<FoodRow>(
    `SELECT * FROM food_catalog
     WHERE aliases_search LIKE ? OR name_fa LIKE ? OR name_en LIKE ?
     ORDER BY CASE WHEN aliases_search LIKE ? THEN 0 ELSE 1 END, name_fa
     LIMIT ?;`,
    like,
    `%${query.trim()}%`,
    `%${query.trim()}%`,
    `${normalized}%`,
    safeLimit,
  );
  return rows.map(mapFood);
}

export async function saveCustomFood(
  input: Omit<FoodCatalogItem, 'id' | 'sourceType' | 'updatedAt'> & { id?: string },
): Promise<FoodCatalogItem> {
  const item = FoodCatalogItemSchema.parse({
    ...input,
    id: input.id || createId('custom-food'),
    sourceType: 'custom',
    updatedAt: new Date().toISOString(),
  });
  const database = await getDatabase();
  const existing = await database.getFirstAsync<{ source_type: FoodCatalogItem['sourceType'] }>(
    'SELECT source_type FROM food_catalog WHERE id = ?;',
    item.id,
  );
  if (existing && existing.source_type !== 'custom') {
    throw new Error('A custom food cannot reuse a built-in or imported food id.');
  }
  await insertFood(database, item, { evidenceTier: 'user_entered' });
  const stored = await database.getFirstAsync<FoodRow>('SELECT * FROM food_catalog WHERE id = ?;', item.id);
  if (!stored) throw new Error('Custom food could not be persisted.');
  await upsertNutritionFoodDocuments([nutritionDocumentFromCatalogItem(mapFood(stored))], database);
  return item;
}

export async function importFoodCatalogItems(input: {
  items: FoodCatalogItem[];
  sourceLabel: string;
  sourceVersion?: string | null;
  evidenceTier?: EvidenceTier;
  replacePreviousImports?: boolean;
}): Promise<number> {
  if (input.items.length < 1 || input.items.length > 10_000) {
    throw new Error('Imported food catalog must contain 1 to 10,000 items.');
  }
  const sourceLabel = input.sourceLabel.trim();
  if (sourceLabel.length < 2 || sourceLabel.length > 300) {
    throw new Error('Imported food catalog needs a valid source label.');
  }
  const evidenceTier = input.evidenceTier ?? 'legacy_estimate';
  if (!isAllowedImportedEvidenceTier(evidenceTier)) {
    throw new Error('Imported evidence tier must be verified_source, digital_consensus or legacy_estimate.');
  }
  const sourceVersion = normalizedOptionalText(input.sourceVersion, 'sourceVersion', 120);
  const now = new Date().toISOString();
  const parsed = input.items.map((raw) => FoodCatalogItemSchema.parse({
    ...raw,
    sourceType: 'imported',
    sourceLabel,
    updatedAt: now,
  }));
  if (new Set(parsed.map((item) => item.id)).size !== parsed.length) {
    throw new Error('Imported food catalog contains duplicate ids.');
  }

  const database = await getDatabase();
  const existingRows = await listFoodRowsByIds(database, parsed.map((item) => item.id));
  const customCollisions = existingRows
    .filter((row) => row.source_type === 'custom')
    .map((row) => row.id);
  if (customCollisions.length > 0) {
    throw new Error(`Imported foods collide with custom ids: ${customCollisions.join(', ')}`);
  }
  const previousImportedIds = input.replacePreviousImports === false
    ? []
    : (await database.getAllAsync<{ id: string }>(
        "SELECT id FROM food_catalog WHERE source_type = 'imported';",
      )).map((row) => row.id);
  const affectedIds = uniqueIds([...previousImportedIds, ...parsed.map((item) => item.id)]);

  await database.withExclusiveTransactionAsync(async (transaction) => {
    if (input.replacePreviousImports !== false) {
      await transaction.runAsync("DELETE FROM food_catalog WHERE source_type = 'imported';");
      await restoreBuiltInFoods(transaction, previousImportedIds);
    }
    for (const item of parsed) {
      await insertFood(transaction, item, {
        evidenceTier,
        sourceRecordId: item.id,
        sourceVersion,
      });
    }
  });

  await synchronizeCanonicalFoodIds(database, affectedIds);
  return parsed.length;
}

export async function deleteCustomFood(id: string): Promise<void> {
  const database = await getDatabase();
  const result = await database.runAsync(
    "DELETE FROM food_catalog WHERE id = ? AND source_type = 'custom';",
    id,
  );
  if (result.changes > 0) {
    await deleteNutritionFoodConcepts([id], database);
  }
}

export async function deleteImportedFoodCatalog(): Promise<number> {
  const database = await getDatabase();
  const ids = (await database.getAllAsync<{ id: string }>(
    "SELECT id FROM food_catalog WHERE source_type = 'imported';",
  )).map((row) => row.id);
  let deleted = 0;
  await database.withExclusiveTransactionAsync(async (transaction) => {
    const result = await transaction.runAsync("DELETE FROM food_catalog WHERE source_type = 'imported';");
    deleted = result.changes;
    await restoreBuiltInFoods(transaction, ids);
  });
  await synchronizeCanonicalFoodIds(database, ids);
  return deleted;
}

export function scaleFood(item: FoodCatalogItem, multiplier: number) {
  const safeMultiplier = Math.min(20, Math.max(0.05, multiplier));
  const variability = item.variabilityPct / 100;
  const calories = item.calories * safeMultiplier;
  return {
    multiplier: safeMultiplier,
    calories: Math.round(calories),
    caloriesLow: Math.max(0, Math.round(calories * (1 - variability))),
    caloriesHigh: Math.round(calories * (1 + variability)),
    proteinG: Math.round(item.proteinG * safeMultiplier * 10) / 10,
    carbsG: Math.round(item.carbsG * safeMultiplier * 10) / 10,
    fatG: Math.round(item.fatG * safeMultiplier * 10) / 10,
  };
}
