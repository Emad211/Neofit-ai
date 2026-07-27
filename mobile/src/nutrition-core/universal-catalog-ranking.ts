import { normalizePersianText, parseFoodQuery } from './search';

export type UniversalSourceType = 'sr_legacy' | 'fndds';

export interface UniversalCatalogCandidate {
  readonly id: string;
  readonly sourceType: UniversalSourceType;
  readonly nameEn: string;
  readonly caloriesKcal: number | null;
  readonly proteinG: number | null;
  readonly fatG: number | null;
  readonly carbsG: number | null;
  readonly fiberG: number | null;
  readonly sugarsG: number | null;
  readonly sodiumMg: number | null;
  readonly cholesterolMg: number | null;
  readonly calciumMg: number | null;
  readonly ironMg: number | null;
  readonly potassiumMg: number | null;
  readonly vitaminCMg: number | null;
  readonly macroComplete: boolean;
  readonly portionCount: number;
  readonly bm25: number;
}

export interface RankedUniversalCatalogCandidate extends UniversalCatalogCandidate {
  readonly score: number;
  readonly reasons: readonly string[];
}

const PREPARED_TERMS = new Set([
  'boiled', 'poached', 'cooked', 'fried', 'grilled', 'roasted', 'baked', 'salad',
  'sandwich', 'pizza', 'soup', 'stew', 'burger', 'omelet', 'omelette', 'with',
]);
const ATOMIC_TERMS = new Set(['raw', 'fresh', 'whole', 'white', 'yolk']);
const UNCOMMON_PROCESS_TERMS = [
  'dried', 'dehydrated', 'frozen', 'pasteurized', 'powder', 'powdered', 'sugared',
  'canned with syrup', 'restaurant', 'fast food', 'school lunch',
];

export function sanitizeFtsQuery(value: string): string {
  const tokens = value
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter((token) => token.length > 0)
    .slice(0, 10);
  return tokens.map((token) => `"${token.replaceAll('"', '""')}"`).join(' AND ');
}

function normalizedEnglish(value: string): string {
  return value
    .normalize('NFKC')
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function phraseTokens(value: string): string[] {
  return normalizedEnglish(value).split(' ').filter(Boolean);
}

function tokenCoverage(query: readonly string[], candidate: readonly string[]): number {
  if (query.length === 0) return 0;
  const set = new Set(candidate);
  return query.filter((token) => set.has(token)).length / query.length;
}

export function rankUniversalCatalogCandidates(
  query: string,
  rows: readonly UniversalCatalogCandidate[],
  limit = 20,
): RankedUniversalCatalogCandidate[] {
  if (!Number.isInteger(limit) || limit <= 0) {
    throw new RangeError('limit must be a positive integer');
  }
  const normalizedQuery = normalizedEnglish(query);
  const queryTokens = phraseTokens(normalizedQuery);
  const parsed = parseFoodQuery(query);
  const querySuggestsPrepared = queryTokens.some((token) => PREPARED_TERMS.has(token))
    || parsed.modifiers.some((modifier) => ['boiled', 'fried', 'grilled', 'with_oil'].includes(modifier));
  const querySuggestsAtomic = queryTokens.some((token) => ATOMIC_TERMS.has(token));

  return rows
    .map((row): RankedUniversalCatalogCandidate => {
      const name = normalizedEnglish(row.nameEn);
      const nameTokens = phraseTokens(name);
      const reasons: string[] = [];
      let score = 0;
      if (name === normalizedQuery) {
        score += 1_000;
        reasons.push('exact_name');
      } else if (name.startsWith(normalizedQuery)) {
        score += 760;
        reasons.push('prefix_name');
      } else if (name.includes(normalizedQuery)) {
        score += 600;
        reasons.push('contains_phrase');
      } else {
        const coverage = tokenCoverage(queryTokens, nameTokens);
        score += coverage * 420;
        if (coverage > 0) reasons.push(`token_coverage:${coverage.toFixed(2)}`);
      }

      // SQLite FTS5 returns better matches as more-negative BM25 values.
      score += Math.min(150, Math.max(0, -row.bm25 * 8));
      if (row.macroComplete) {
        score += 18;
        reasons.push('complete_macros');
      }
      if (row.portionCount > 0) {
        score += Math.min(12, row.portionCount * 2);
        reasons.push('has_portions');
      }
      if (querySuggestsPrepared && row.sourceType === 'fndds') {
        score += 35;
        reasons.push('consumed_food_source');
      }
      if (querySuggestsAtomic && row.sourceType === 'sr_legacy') {
        score += 25;
        reasons.push('atomic_food_source');
      }
      if (!querySuggestsPrepared && row.sourceType === 'fndds' && /\b(raw|cooked|fried|boiled|grilled)\b/.test(name)) {
        score += 8;
      }
      for (const term of UNCOMMON_PROCESS_TERMS) {
        if (name.includes(term) && !normalizedQuery.includes(term)) {
          score -= 45;
          reasons.push(`unrequested_process:${term}`);
        }
      }
      if (/\b(raw|fresh)\b/.test(name) && !/\b(dried|frozen|pasteurized)\b/.test(name)) {
        score += 12;
        reasons.push('common_fresh_form');
      }
      score -= Math.max(0, name.length - normalizedQuery.length) * 0.08;
      return { ...row, score: Math.round(Math.max(0, score) * 100) / 100, reasons };
    })
    .filter((row) => row.score > 0)
    .sort((left, right) =>
      right.score - left.score
      || Number(right.macroComplete) - Number(left.macroComplete)
      || left.nameEn.length - right.nameEn.length
      || left.id.localeCompare(right.id),
    )
    .slice(0, limit);
}

export function normalizedAliasKey(value: string): string {
  return normalizePersianText(value);
}

export function containsNormalizedAlias(normalizedQuery: string, normalizedAlias: string): boolean {
  if (!normalizedAlias) return false;
  const query = ` ${normalizePersianText(normalizedQuery)} `;
  const alias = ` ${normalizePersianText(normalizedAlias)} `;
  return query.includes(alias);
}
