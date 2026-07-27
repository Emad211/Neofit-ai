import type * as SQLite from 'expo-sqlite';
import { getDatabase } from '@/db/database';
import type { FoodCatalogItem } from '@/domain/models';
import {
  legacyCatalogFoodToDocument,
  normalizePersianText,
  searchFoodDocuments,
  type EvidenceTier,
  type FoodConcept,
  type FoodVariant,
  type NutritionRange,
  type NutritionVector,
  type PortionDefinition,
  type SearchDocument,
} from '@/nutrition-core';

interface ConceptRow {
  id: string;
  name_fa: string;
  name_en: string;
  category: string;
  region: string | null;
  default_variant_id: string;
}

interface VariantRow {
  id: string;
  concept_id: string;
  name_fa: string;
  name_en: string;
  preparation_tags_json: string;
  nutrient_basis: FoodVariant['nutrientBasis'];
  basis_grams: number | null;
  nutrients_per_basis_json: string;
  nutrient_range_per_basis_json: string | null;
  evidence_tier: EvidenceTier;
  source_record_id: string | null;
  source_dataset: string | null;
  source_version: string | null;
}

interface PortionRow {
  id: string;
  variant_id: string;
  label_fa: string;
  label_en: string;
  gram_weight: number | null;
  basis_multiplier: number;
}

interface AliasRow {
  concept_id: string;
  locale: 'fa' | 'en';
  alias_display: string;
}

interface LegacyFoodRow {
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
  source_type: FoodCatalogItem['sourceType'];
  source_label: string;
}

function parseJson<T>(value: string | null, fallback: T): T {
  if (value === null) return fallback;
  try {
    return JSON.parse(value) as T;
  } catch {
    return fallback;
  }
}

function parseStringArray(value: string): string[] {
  const parsed = parseJson<unknown>(value, []);
  return Array.isArray(parsed)
    ? parsed.filter((item): item is string => typeof item === 'string')
    : [];
}

function conceptFromRow(row: ConceptRow, aliases: readonly AliasRow[]): FoodConcept {
  const aliasesFa = aliases
    .filter((alias) => alias.locale === 'fa')
    .map((alias) => alias.alias_display);
  const aliasesEn = aliases
    .filter((alias) => alias.locale === 'en')
    .map((alias) => alias.alias_display);
  const base = {
    id: row.id,
    nameFa: row.name_fa,
    nameEn: row.name_en,
    aliasesFa,
    aliasesEn,
    category: row.category,
    defaultVariantId: row.default_variant_id,
  } satisfies Omit<FoodConcept, 'region'>;
  return row.region === null ? base : { ...base, region: row.region };
}

function portionsByVariant(rows: readonly PortionRow[]): Map<string, PortionDefinition[]> {
  const result = new Map<string, PortionDefinition[]>();
  for (const row of rows) {
    const values = result.get(row.variant_id) ?? [];
    values.push({
      id: row.id,
      labelFa: row.label_fa,
      labelEn: row.label_en,
      gramWeight: row.gram_weight,
      basisMultiplier: row.basis_multiplier,
    });
    result.set(row.variant_id, values);
  }
  return result;
}

function variantFromRow(
  row: VariantRow,
  portions: readonly PortionDefinition[],
): FoodVariant {
  const base = {
    id: row.id,
    conceptId: row.concept_id,
    nameFa: row.name_fa,
    nameEn: row.name_en,
    preparationTags: parseJson<string[]>(row.preparation_tags_json, []),
    nutrientBasis: row.nutrient_basis,
    basisGrams: row.basis_grams,
    nutrientsPerBasis: parseJson<NutritionVector>(row.nutrients_per_basis_json, {}),
    portions,
    evidenceTier: row.evidence_tier,
  } satisfies Omit<FoodVariant, 'nutrientRangePerBasis' | 'sourceRecordId' | 'sourceDataset' | 'sourceVersion'>;

  return {
    ...base,
    ...(row.nutrient_range_per_basis_json === null
      ? {}
      : { nutrientRangePerBasis: parseJson<NutritionRange>(row.nutrient_range_per_basis_json, { p10: {}, p50: {}, p90: {} }) }),
    ...(row.source_record_id === null ? {} : { sourceRecordId: row.source_record_id }),
    ...(row.source_dataset === null ? {} : { sourceDataset: row.source_dataset }),
    ...(row.source_version === null ? {} : { sourceVersion: row.source_version }),
  };
}

async function upsertDocument(
  database: SQLite.SQLiteDatabase,
  document: SearchDocument,
): Promise<void> {
  const now = new Date().toISOString();
  await database.runAsync(
    `INSERT INTO nutrition_food_concepts (
       id, name_fa, name_en, category, region, default_variant_id, created_at, updated_at
     ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
     ON CONFLICT(id) DO UPDATE SET
       name_fa = excluded.name_fa,
       name_en = excluded.name_en,
       category = excluded.category,
       region = excluded.region,
       default_variant_id = excluded.default_variant_id,
       updated_at = excluded.updated_at;`,
    document.concept.id,
    document.concept.nameFa,
    document.concept.nameEn,
    document.concept.category,
    document.concept.region ?? null,
    document.concept.defaultVariantId,
    now,
    now,
  );

  await database.runAsync('DELETE FROM nutrition_search_fts WHERE concept_id = ?;', document.concept.id);
  await database.runAsync('DELETE FROM nutrition_food_aliases WHERE concept_id = ?;', document.concept.id);
  await database.runAsync('DELETE FROM nutrition_food_variants WHERE concept_id = ?;', document.concept.id);

  for (const alias of document.concept.aliasesFa) {
    const normalized = normalizePersianText(alias);
    if (!normalized) continue;
    await database.runAsync(
      `INSERT OR IGNORE INTO nutrition_food_aliases (
         concept_id, locale, alias_normalized, alias_display
       ) VALUES (?, 'fa', ?, ?);`,
      document.concept.id,
      normalized,
      alias,
    );
  }
  for (const alias of document.concept.aliasesEn) {
    const normalized = normalizePersianText(alias);
    if (!normalized) continue;
    await database.runAsync(
      `INSERT OR IGNORE INTO nutrition_food_aliases (
         concept_id, locale, alias_normalized, alias_display
       ) VALUES (?, 'en', ?, ?);`,
      document.concept.id,
      normalized,
      alias,
    );
  }

  const aliasesSearch = [...document.concept.aliasesFa, ...document.concept.aliasesEn].join(' ');
  for (const variant of document.variants) {
    await database.runAsync(
      `INSERT INTO nutrition_food_variants (
         id, concept_id, name_fa, name_en, preparation_tags_json,
         nutrient_basis, basis_grams, nutrients_per_basis_json,
         nutrient_range_per_basis_json, evidence_tier, source_record_id,
         source_dataset, source_version, is_default
       ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);`,
      variant.id,
      variant.conceptId,
      variant.nameFa,
      variant.nameEn,
      JSON.stringify(variant.preparationTags),
      variant.nutrientBasis,
      variant.basisGrams,
      JSON.stringify(variant.nutrientsPerBasis),
      variant.nutrientRangePerBasis === undefined ? null : JSON.stringify(variant.nutrientRangePerBasis),
      variant.evidenceTier,
      variant.sourceRecordId ?? null,
      variant.sourceDataset ?? null,
      variant.sourceVersion ?? null,
      variant.id === document.concept.defaultVariantId ? 1 : 0,
    );

    for (const portion of variant.portions) {
      await database.runAsync(
        `INSERT INTO nutrition_portions (
           id, variant_id, label_fa, label_en, gram_weight, basis_multiplier
         ) VALUES (?, ?, ?, ?, ?, ?);`,
        portion.id,
        variant.id,
        portion.labelFa,
        portion.labelEn,
        portion.gramWeight,
        portion.basisMultiplier,
      );
    }

    await database.runAsync(
      `INSERT INTO nutrition_search_fts (
         concept_id, variant_id, name_fa, name_en, aliases, preparation_tags
       ) VALUES (?, ?, ?, ?, ?, ?);`,
      document.concept.id,
      variant.id,
      `${document.concept.nameFa} ${variant.nameFa}`,
      `${document.concept.nameEn} ${variant.nameEn}`,
      aliasesSearch,
      variant.preparationTags.join(' '),
    );
  }
}

export async function upsertNutritionFoodDocuments(
  documents: readonly SearchDocument[],
  database?: SQLite.SQLiteDatabase,
): Promise<void> {
  if (documents.length === 0) return;
  const db = database ?? await getDatabase();
  await db.withExclusiveTransactionAsync(async (transaction) => {
    for (const document of documents) {
      await upsertDocument(transaction, document);
    }
  });
}

export async function upsertNutritionFoodDocument(
  document: SearchDocument,
  database?: SQLite.SQLiteDatabase,
): Promise<void> {
  await upsertNutritionFoodDocuments([document], database);
}

export async function deleteNutritionFoodConcepts(
  conceptIds: readonly string[],
  database?: SQLite.SQLiteDatabase,
): Promise<number> {
  const ids = [...new Set(conceptIds.map((id) => id.trim()).filter(Boolean))];
  if (ids.length === 0) return 0;
  const db = database ?? await getDatabase();
  let deleted = 0;
  await db.withExclusiveTransactionAsync(async (transaction) => {
    for (const id of ids) {
      await transaction.runAsync('DELETE FROM nutrition_search_fts WHERE concept_id = ?;', id);
      const result = await transaction.runAsync(
        'DELETE FROM nutrition_food_concepts WHERE id = ?;',
        id,
      );
      deleted += result.changes;
    }
  });
  return deleted;
}

export async function seedNutritionCoreFromLegacyCatalog(
  database?: SQLite.SQLiteDatabase,
): Promise<number> {
  const db = database ?? await getDatabase();
  const rows = await db.getAllAsync<LegacyFoodRow>('SELECT * FROM food_catalog ORDER BY id;');
  await db.withExclusiveTransactionAsync(async (transaction) => {
    for (const row of rows) {
      const legacy = legacyCatalogFoodToDocument({
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
        sourceType: row.source_type,
        sourceLabel: row.source_label,
      });
      await upsertDocument(transaction, {
        concept: legacy.concept,
        variants: [legacy.variant],
      });
    }
  });
  return rows.length;
}

export async function countNutritionConcepts(): Promise<number> {
  const database = await getDatabase();
  const row = await database.getFirstAsync<{ count: number }>(
    'SELECT COUNT(*) AS count FROM nutrition_food_concepts;',
  );
  return Number(row?.count ?? 0);
}

export async function getNutritionFoodDocument(conceptId: string): Promise<SearchDocument | null> {
  const database = await getDatabase();
  const conceptRow = await database.getFirstAsync<ConceptRow>(
    'SELECT * FROM nutrition_food_concepts WHERE id = ?;',
    conceptId,
  );
  if (!conceptRow) return null;

  const [variantRows, portionRows, aliasRows] = await Promise.all([
    database.getAllAsync<VariantRow>(
      'SELECT * FROM nutrition_food_variants WHERE concept_id = ? ORDER BY is_default DESC, name_fa;',
      conceptId,
    ),
    database.getAllAsync<PortionRow>(
      `SELECT p.* FROM nutrition_portions p
       JOIN nutrition_food_variants v ON v.id = p.variant_id
       WHERE v.concept_id = ? ORDER BY p.label_fa;`,
      conceptId,
    ),
    database.getAllAsync<AliasRow>(
      'SELECT concept_id, locale, alias_display FROM nutrition_food_aliases WHERE concept_id = ?;',
      conceptId,
    ),
  ]);
  const portionMap = portionsByVariant(portionRows);
  return {
    concept: conceptFromRow(conceptRow, aliasRows),
    variants: variantRows.map((row) => variantFromRow(row, portionMap.get(row.id) ?? [])),
  };
}

function safeFtsQuery(value: string): string {
  return normalizePersianText(value)
    .split(' ')
    .filter(Boolean)
    .slice(0, 10)
    .map((token) => `"${token.replaceAll('"', '""')}"*`)
    .join(' AND ');
}

async function candidateConceptIds(query: string, limit: number): Promise<string[]> {
  const database = await getDatabase();
  const ftsQuery = safeFtsQuery(query);
  if (!ftsQuery) {
    const rows = await database.getAllAsync<{ id: string }>(
      'SELECT id FROM nutrition_food_concepts ORDER BY name_fa LIMIT ?;',
      limit,
    );
    return rows.map((row) => row.id);
  }

  try {
    const rows = await database.getAllAsync<{ concept_id: string }>(
      `SELECT concept_id, MIN(bm25(nutrition_search_fts)) AS rank
       FROM nutrition_search_fts
       WHERE nutrition_search_fts MATCH ?
       GROUP BY concept_id
       ORDER BY rank
       LIMIT ?;`,
      ftsQuery,
      limit,
    );
    if (rows.length > 0) return rows.map((row) => row.concept_id);
  } catch (error) {
    console.warn('Nutrition FTS query failed; using normalized fallback.', error);
  }

  const normalized = normalizePersianText(query);
  const rows = await database.getAllAsync<{ id: string }>(
    `SELECT DISTINCT c.id
     FROM nutrition_food_concepts c
     LEFT JOIN nutrition_food_aliases a ON a.concept_id = c.id
     WHERE c.name_fa LIKE ? OR c.name_en LIKE ? OR a.alias_normalized LIKE ?
     ORDER BY c.name_fa
     LIMIT ?;`,
    `%${query.trim()}%`,
    `%${query.trim()}%`,
    `%${normalized}%`,
    limit,
  );
  return rows.map((row) => row.id);
}

export async function searchNutritionFoods(query: string, limit = 20) {
  const safeLimit = Math.min(100, Math.max(1, Math.round(limit)));
  const ids = await candidateConceptIds(query, Math.min(200, safeLimit * 5));
  const documents = (await Promise.all(ids.map(getNutritionFoodDocument)))
    .filter((document): document is SearchDocument => document !== null);
  return searchFoodDocuments(query, documents, safeLimit);
}
