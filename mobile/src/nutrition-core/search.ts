import type { FoodConcept, FoodVariant } from './types';

const ARABIC_TO_PERSIAN: Readonly<Record<string, string>> = {
  ي: 'ی',
  ى: 'ی',
  ك: 'ک',
  ة: 'ه',
  ۀ: 'ه',
  ؤ: 'و',
  إ: 'ا',
  أ: 'ا',
};

const PERSIAN_DIGITS = '۰۱۲۳۴۵۶۷۸۹';
const ARABIC_DIGITS = '٠١٢٣٤٥٦٧٨٩';

export type QueryModifier =
  | 'without_yolk'
  | 'egg_white'
  | 'low_fat'
  | 'grilled'
  | 'boiled'
  | 'fried'
  | 'without_added_fat'
  | 'with_oil'
  | 'skinless';

const MODIFIER_PATTERNS: readonly {
  readonly modifier: QueryModifier;
  readonly pattern: RegExp;
}[] = [
  { modifier: 'without_yolk', pattern: /(?:بدون\s+زرده|بی\s*زرده)/g },
  { modifier: 'egg_white', pattern: /(?:سفیده(?:\s+تخم\s*مرغ)?|تخم\s*مرغ\s+فقط\s+سفیده)/g },
  { modifier: 'low_fat', pattern: /(?:کم\s*چرب|چربی\s+کم)/g },
  { modifier: 'grilled', pattern: /(?:گریل(?:\s*شده)?|کبابی)/g },
  { modifier: 'boiled', pattern: /(?:آب\s*پز|اب\s*پز|جوشانده)/g },
  { modifier: 'fried', pattern: /(?:سرخ\s*شده|سرخ\s*کرده|سوخاری)/g },
  { modifier: 'without_added_fat', pattern: /(?:بدون\s+روغن|بی\s*روغن|بدون\s+چربی\s+افزوده)/g },
  { modifier: 'with_oil', pattern: /(?:با\s+روغن|روغنی)/g },
  { modifier: 'skinless', pattern: /(?:بدون\s+پوست|بی\s*پوست)/g },
];

export interface ParsedFoodQuery {
  readonly original: string;
  readonly normalized: string;
  readonly baseQuery: string;
  readonly modifiers: readonly QueryModifier[];
  readonly tokens: readonly string[];
}

export interface SearchDocument {
  readonly concept: FoodConcept;
  readonly variants: readonly FoodVariant[];
}

export interface FoodSearchHit {
  readonly conceptId: string;
  readonly variantId: string;
  readonly score: number;
  readonly reasons: readonly string[];
}

export function normalizePersianText(value: string): string {
  let normalized = value.normalize('NFKC').toLowerCase();
  normalized = [...normalized]
    .map((character) => {
      const persianIndex = PERSIAN_DIGITS.indexOf(character);
      if (persianIndex >= 0) {
        return String(persianIndex);
      }
      const arabicIndex = ARABIC_DIGITS.indexOf(character);
      if (arabicIndex >= 0) {
        return String(arabicIndex);
      }
      return ARABIC_TO_PERSIAN[character] ?? character;
    })
    .join('');

  return normalized
    .replace(/[\u064B-\u065F\u0670\u06D6-\u06ED]/g, '')
    .replace(/[\u200c\u200d_\-\/]+/g, ' ')
    .replace(/[^\p{L}\p{N}\s]/gu, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

export function parseFoodQuery(query: string): ParsedFoodQuery {
  const normalized = normalizePersianText(query);
  const modifiers: QueryModifier[] = [];
  let baseQuery = normalized;

  for (const rule of MODIFIER_PATTERNS) {
    rule.pattern.lastIndex = 0;
    if (rule.pattern.test(baseQuery)) {
      modifiers.push(rule.modifier);
      rule.pattern.lastIndex = 0;
      baseQuery = baseQuery.replace(rule.pattern, ' ');
    }
  }

  baseQuery = baseQuery.replace(/\s+/g, ' ').trim();
  const tokens = baseQuery.length === 0 ? [] : baseQuery.split(' ');
  return { original: query, normalized, baseQuery, modifiers, tokens };
}

function tokenOverlapScore(queryTokens: readonly string[], candidate: string): number {
  if (queryTokens.length === 0) {
    return 0;
  }
  const candidateTokens = new Set(normalizePersianText(candidate).split(' ').filter(Boolean));
  const matched = queryTokens.filter((token) => candidateTokens.has(token)).length;
  return matched / queryTokens.length;
}

function modifierTags(modifier: QueryModifier): readonly string[] {
  switch (modifier) {
    case 'without_yolk':
      return ['without_yolk', 'egg_white'];
    case 'egg_white':
      return ['egg_white', 'without_yolk'];
    case 'low_fat':
      return ['low_fat'];
    case 'grilled':
      return ['grilled', 'kebab'];
    case 'boiled':
      return ['boiled', 'poached'];
    case 'fried':
      return ['fried', 'breaded'];
    case 'without_added_fat':
      return ['without_added_fat', 'no_added_fat'];
    case 'with_oil':
      return ['with_oil', 'added_oil'];
    case 'skinless':
      return ['skinless'];
  }
}

function scoreVariant(
  parsed: ParsedFoodQuery,
  concept: FoodConcept,
  variant: FoodVariant,
): FoodSearchHit {
  const reasons: string[] = [];
  let score = 0;
  const query = parsed.baseQuery;
  const candidateNames = [
    concept.nameFa,
    concept.nameEn,
    ...concept.aliasesFa,
    ...concept.aliasesEn,
    variant.nameFa,
    variant.nameEn,
  ].map(normalizePersianText);

  if (query.length > 0) {
    if (candidateNames.includes(query)) {
      score += 100;
      reasons.push('exact_name');
    } else if (candidateNames.some((name) => name.startsWith(query))) {
      score += 75;
      reasons.push('prefix_name');
    } else {
      const overlap = Math.max(
        ...candidateNames.map((name) => tokenOverlapScore(parsed.tokens, name)),
      );
      score += overlap * 60;
      if (overlap > 0) {
        reasons.push(`token_overlap:${overlap.toFixed(2)}`);
      }
    }
  }

  const tags = new Set(variant.preparationTags.map(normalizePersianText));
  for (const modifier of parsed.modifiers) {
    const expectedTags = modifierTags(modifier).map(normalizePersianText);
    const matched = expectedTags.some((tag) => tags.has(tag));
    if (matched) {
      score += 18;
      reasons.push(`modifier_match:${modifier}`);
    } else {
      score -= 8;
      reasons.push(`modifier_unresolved:${modifier}`);
    }
  }

  if (variant.id === concept.defaultVariantId) {
    score += 2;
    reasons.push('default_variant');
  }

  return {
    conceptId: concept.id,
    variantId: variant.id,
    score: Math.max(0, Math.round(score * 100) / 100),
    reasons,
  };
}

export function searchFoodDocuments(
  query: string,
  documents: readonly SearchDocument[],
  limit = 10,
): FoodSearchHit[] {
  if (!Number.isInteger(limit) || limit <= 0) {
    throw new RangeError('limit must be a positive integer');
  }
  const parsed = parseFoodQuery(query);
  return documents
    .flatMap((document) =>
      document.variants.map((variant) => scoreVariant(parsed, document.concept, variant)),
    )
    .filter((hit) => hit.score > 0)
    .sort((left, right) =>
      right.score - left.score
      || left.conceptId.localeCompare(right.conceptId)
      || left.variantId.localeCompare(right.variantId),
    )
    .slice(0, limit);
}
