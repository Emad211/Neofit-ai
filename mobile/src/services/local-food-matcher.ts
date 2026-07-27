import { listFoodCatalog, normalizeFoodSearch, scaleFood } from '@/db/food-repository';
import { FoodCatalogItem } from '@/domain/models';

function latinDigits(value: string) {
  const persian = '۰۱۲۳۴۵۶۷۸۹';
  const arabic = '٠١٢٣٤٥٦٧٨٩';
  return value
    .replace(/[۰-۹]/g, (digit) => String(persian.indexOf(digit)))
    .replace(/[٠-٩]/g, (digit) => String(arabic.indexOf(digit)));
}

function candidateNames(item: FoodCatalogItem) {
  return [item.nameFa, item.nameEn, ...item.aliasesFa, ...item.aliasesEn]
    .map(normalizeFoodSearch)
    .filter(Boolean)
    .sort((a, b) => b.length - a.length);
}

function tokenOverlap(query: string, candidate: string) {
  const queryTokens = new Set(query.split(' ').filter((token) => token.length > 1));
  const candidateTokens = candidate.split(' ').filter((token) => token.length > 1);
  if (candidateTokens.length === 0) return 0;
  const matches = candidateTokens.filter((token) => queryTokens.has(token)).length;
  return matches / candidateTokens.length;
}

function matchScore(normalizedQuery: string, item: FoodCatalogItem) {
  let score = 0;
  for (const name of candidateNames(item)) {
    if (normalizedQuery === name) score = Math.max(score, 1_000 + name.length);
    else if (normalizedQuery.includes(name)) score = Math.max(score, 700 + name.length * 2);
    else if (name.includes(normalizedQuery) && normalizedQuery.length >= 3) score = Math.max(score, 500 + normalizedQuery.length);
    else score = Math.max(score, Math.round(tokenOverlap(normalizedQuery, name) * 300));
  }
  if (item.sourceType === 'custom') score += 15;
  return score;
}

export function inferServingMultiplier(description: string, item: FoodCatalogItem) {
  const normalized = normalizeFoodSearch(latinDigits(description));

  const gramsMatch = normalized.match(/(?:^|\s)(\d+(?:\.\d+)?)\s*(?:گرم|g|gram|grams)(?:\s|$)/i);
  if (gramsMatch?.[1] && item.portionGrams) {
    const grams = Number(gramsMatch[1]);
    if (Number.isFinite(grams) && grams > 0) return Math.min(20, Math.max(0.05, grams / item.portionGrams));
  }

  if (/\b(?:نصف|نیم|half)\b/i.test(normalized)) return 0.5;
  if (/(?:یک و نیم|1\.5|one and a half)/i.test(normalized)) return 1.5;

  const servingMatch = normalized.match(/(?:^|\s)(\d+(?:\.\d+)?)\s*(?:پرس|کاسه|سیخ|عدد|برش|تکه|لیوان|فنجان|ورق|سهم|servings?|bowls?|skewers?|pieces?|slices?|cups?|glasses?)(?:\s|$)/i);
  if (servingMatch?.[1]) {
    const value = Number(servingMatch[1]);
    if (Number.isFinite(value) && value > 0) return Math.min(20, Math.max(0.05, value));
  }

  const wordNumbers: Array<[RegExp, number]> = [
    [/(?:^|\s)(?:دو|two)(?:\s|$)/i, 2],
    [/(?:^|\s)(?:سه|three)(?:\s|$)/i, 3],
    [/(?:^|\s)(?:چهار|four)(?:\s|$)/i, 4],
  ];
  for (const [pattern, value] of wordNumbers) {
    if (pattern.test(normalized)) return value;
  }

  return 1;
}

export async function findBestLocalFoodMatch(description: string) {
  const normalized = normalizeFoodSearch(latinDigits(description));
  if (normalized.length < 2) return null;
  const items = await listFoodCatalog({ limit: 500 });
  const ranked = items
    .map((item) => ({ item, score: matchScore(normalized, item) }))
    .sort((a, b) => b.score - a.score);
  const best = ranked[0];
  if (!best || best.score < 220) return null;
  const multiplier = inferServingMultiplier(description, best.item);
  return {
    item: best.item,
    multiplier,
    scaled: scaleFood(best.item, multiplier),
    score: best.score,
  };
}
