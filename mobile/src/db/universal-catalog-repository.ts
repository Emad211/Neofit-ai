import { getUniversalCatalogDatabase } from '@/db/universal-catalog-database';
import {
  containsNormalizedAlias,
  normalizedAliasKey,
  rankUniversalCatalogCandidates,
  sanitizeFtsQuery,
  type RankedUniversalCatalogCandidate,
  type UniversalCatalogCandidate,
  type UniversalSourceType,
} from '@/nutrition-core/universal-catalog-ranking';
import { parseFoodQuery } from '@/nutrition-core/search';

interface GenericFoodRow {
  id: string;
  source_type: UniversalSourceType;
  name_en: string;
  calories_kcal: number | null;
  protein_g: number | null;
  fat_g: number | null;
  carbs_g: number | null;
  fiber_g: number | null;
  sugars_g: number | null;
  sodium_mg: number | null;
  cholesterol_mg: number | null;
  macro_completeness: number;
  portion_count: number;
  bm25_score: number;
}

interface PortionRow {
  id: number;
  amount: number;
  label: string;
  measure_unit: string | null;
  gram_weight: number;
}

interface AliasRow {
  alias_fa: string;
  target: string;
  target_type: 'generic' | 'iranian_canon';
}

interface IranianCanonRow {
  canon_id: string;
  name_fa: string;
  name_en: string;
  aliases_fa: string | null;
  category: string | null;
  region: string | null;
  priority: string | null;
  rank_score: number;
}

export interface UniversalPortion {
  readonly id: number;
  readonly amount: number;
  readonly label: string;
  readonly measureUnit: string | null;
  readonly gramWeight: number;
}

export interface UniversalFoodDetails extends RankedUniversalCatalogCandidate {
  readonly portions: readonly UniversalPortion[];
}

export interface IranianIdentityHit {
  readonly kind: 'iranian_identity';
  readonly canonId: string;
  readonly nameFa: string;
  readonly nameEn: string;
  readonly aliasesFa: readonly string[];
  readonly category: string | null;
  readonly region: string | null;
  readonly priority: string | null;
  readonly score: number;
}

export interface GenericFoodHit extends RankedUniversalCatalogCandidate {
  readonly kind: 'generic_food';
}

export type UniversalCatalogHit = IranianIdentityHit | GenericFoodHit;

let aliasesPromise: Promise<Map<string, AliasRow[]>> | null = null;
let sortedAliasesPromise: Promise<readonly [string, readonly AliasRow[]][]> | null = null;

function candidateFromRow(row: GenericFoodRow): UniversalCatalogCandidate {
  return {
    id: row.id,
    sourceType: row.source_type,
    nameEn: row.name_en,
    caloriesKcal: row.calories_kcal,
    proteinG: row.protein_g,
    fatG: row.fat_g,
    carbsG: row.carbs_g,
    fiberG: row.fiber_g,
    sugarsG: row.sugars_g,
    sodiumMg: row.sodium_mg,
    cholesterolMg: row.cholesterol_mg,
    macroComplete: row.macro_completeness === 1,
    portionCount: row.portion_count,
    bm25: row.bm25_score,
  };
}

async function aliasMap(): Promise<Map<string, AliasRow[]>> {
  if (!aliasesPromise) {
    aliasesPromise = getUniversalCatalogDatabase().then(async (database) => {
      const rows = await database.getAllAsync<AliasRow>(
        'SELECT alias_fa,target,target_type FROM persian_search_aliases;',
      );
      const map = new Map<string, AliasRow[]>();
      for (const row of rows) {
        const key = normalizedAliasKey(row.alias_fa);
        const values = map.get(key) ?? [];
        values.push(row);
        map.set(key, values);
      }
      return map;
    }).catch((error) => {
      aliasesPromise = null;
      sortedAliasesPromise = null;
      throw error;
    });
  }
  return aliasesPromise;
}

async function sortedAliases(): Promise<readonly [string, readonly AliasRow[]][]> {
  if (!sortedAliasesPromise) {
    sortedAliasesPromise = aliasMap().then((map) =>
      [...map.entries()].sort((left, right) => right[0].length - left[0].length),
    );
  }
  return sortedAliasesPromise;
}

async function matchingAliases(normalizedQuery: string): Promise<readonly AliasRow[]> {
  const exact = (await aliasMap()).get(normalizedQuery);
  if (exact?.length) return exact;
  const contained = (await sortedAliases()).find(([key]) => containsNormalizedAlias(normalizedQuery, key));
  return contained?.[1] ?? [];
}

function genericTargetWithModifiers(target: string, query: string): string {
  const modifiers = new Set(parseFoodQuery(query).modifiers);
  let resolved = target;
  if (modifiers.has('egg_white') || modifiers.has('without_yolk')) resolved = 'egg, white';
  if (modifiers.has('boiled')) resolved += ', boiled';
  else if (modifiers.has('fried')) resolved += ', fried';
  else if (modifiers.has('grilled')) resolved += ', grilled';
  if (modifiers.has('without_added_fat')) resolved += ', no added fat';
  return resolved;
}

async function searchIranianIdentity(query: string, directCanonId?: string): Promise<IranianIdentityHit[]> {
  const database = await getUniversalCatalogDatabase();
  const rows = directCanonId
    ? await database.getAllAsync<IranianCanonRow>(
        `SELECT canon_id,name_fa,name_en,aliases_fa,category,region,priority,1000 AS rank_score
         FROM iranian_canon WHERE canon_id=? LIMIT 1;`,
        directCanonId,
      )
    : await database.getAllAsync<IranianCanonRow>(
        `SELECT c.canon_id,c.name_fa,c.name_en,c.aliases_fa,c.category,c.region,c.priority,
                -bm25(iranian_food_search) AS rank_score
         FROM iranian_food_search s
         JOIN iranian_canon c ON c.canon_id=s.canon_id
         WHERE iranian_food_search MATCH ?
         ORDER BY bm25(iranian_food_search)
         LIMIT 12;`,
        query,
      );
  return rows.map((row) => ({
    kind: 'iranian_identity',
    canonId: row.canon_id,
    nameFa: row.name_fa,
    nameEn: row.name_en,
    aliasesFa: (row.aliases_fa ?? '').split('|').map((value) => value.trim()).filter(Boolean),
    category: row.category,
    region: row.region,
    priority: row.priority,
    score: row.rank_score,
  }));
}

async function searchGeneric(query: string, limit: number): Promise<GenericFoodHit[]> {
  const ftsQuery = sanitizeFtsQuery(query);
  if (!ftsQuery) return [];
  const database = await getUniversalCatalogDatabase();
  const rows = await database.getAllAsync<GenericFoodRow>(
    `SELECT f.id,f.source_type,f.name_en,f.calories_kcal,f.protein_g,f.fat_g,f.carbs_g,
            f.fiber_g,f.sugars_g,f.sodium_mg,f.cholesterol_mg,f.macro_completeness,
            f.portion_count,bm25(generic_food_search) AS bm25_score
     FROM generic_food_search s
     JOIN generic_foods f ON f.id=s.id
     WHERE generic_food_search MATCH ?
     LIMIT 100;`,
    ftsQuery,
  );
  return rankUniversalCatalogCandidates(query, rows.map(candidateFromRow), limit)
    .map((row) => ({ kind: 'generic_food' as const, ...row }));
}

export async function searchUniversalCatalog(query: string, limit = 20): Promise<UniversalCatalogHit[]> {
  const normalized = normalizedAliasKey(query);
  if (normalized.length < 2) return [];
  const aliases = await matchingAliases(normalized);
  const iranianAlias = aliases.find((row) => row.target_type === 'iranian_canon');
  if (iranianAlias) return searchIranianIdentity('', iranianAlias.target);
  const genericAlias = aliases.find((row) => row.target_type === 'generic');
  if (genericAlias) return searchGeneric(genericTargetWithModifiers(genericAlias.target, query), limit);

  const isMostlyPersian = /[\u0600-\u06ff]/.test(normalized);
  if (isMostlyPersian) {
    const queryFts = normalized.split(' ').map((token) => `"${token.replaceAll('"', '""')}"`).join(' AND ');
    return searchIranianIdentity(queryFts);
  }
  return searchGeneric(query, limit);
}

export async function getUniversalFoodDetails(id: string): Promise<UniversalFoodDetails | null> {
  const database = await getUniversalCatalogDatabase();
  const row = await database.getFirstAsync<Omit<GenericFoodRow, 'bm25_score'>>(
    `SELECT id,source_type,name_en,calories_kcal,protein_g,fat_g,carbs_g,fiber_g,sugars_g,
            sodium_mg,cholesterol_mg,macro_completeness,portion_count
     FROM generic_foods WHERE id=?;`,
    id,
  );
  if (!row) return null;
  const portions = await database.getAllAsync<PortionRow>(
    `SELECT id,amount,label,measure_unit,gram_weight
     FROM generic_portions WHERE food_id=? ORDER BY gram_weight, id;`,
    id,
  );
  const ranked = rankUniversalCatalogCandidates(
    row.name_en,
    [candidateFromRow({ ...row, bm25_score: 0 })],
    1,
  )[0];
  if (!ranked) return null;
  return {
    ...ranked,
    portions: portions.map((portion) => ({
      id: portion.id,
      amount: portion.amount,
      label: portion.label,
      measureUnit: portion.measure_unit,
      gramWeight: portion.gram_weight,
    })),
  };
}
