import type { FoodCatalogItem } from '@/domain/models';
import { scaleFood } from '@/db/food-repository';
import { getUniversalFoodDetails, searchUniversalCatalog } from '@/db/universal-catalog-repository';
import { findBestLocalFoodMatch } from '@/services/local-food-matcher';

function latinDigits(value: string): string {
  const persian = '۰۱۲۳۴۵۶۷۸۹';
  const arabic = '٠١٢٣٤٥٦٧٨٩';
  return value
    .replace(/[۰-۹]/g, (digit) => String(persian.indexOf(digit)))
    .replace(/[٠-٩]/g, (digit) => String(arabic.indexOf(digit)));
}

function explicitGrams(description: string): number | null {
  const match = latinDigits(description).match(/(?:^|\s)(\d+(?:\.\d+)?)\s*(?:گرم|g|gram|grams)(?:\s|$)/i);
  if (!match?.[1]) return null;
  const value = Number(match[1]);
  return Number.isFinite(value) && value > 0 && value <= 5_000 ? value : null;
}

export interface UnifiedFoodMatch {
  readonly item: FoodCatalogItem;
  readonly multiplier: number;
  readonly scaled: ReturnType<typeof scaleFood>;
  readonly score: number;
  readonly source: 'local_catalog' | 'universal_catalog';
  readonly assumptions: readonly string[];
  readonly amountWasExplicit: boolean;
}

export async function findBestUnifiedFoodMatch(description: string): Promise<UnifiedFoodMatch | null> {
  const local = await findBestLocalFoodMatch(description);
  if (local && local.score >= 220) {
    return {
      ...local,
      source: 'local_catalog',
      assumptions: [],
      amountWasExplicit: /\d|نصف|نیم|دو|سه|چهار/.test(description),
    };
  }

  const hits = await searchUniversalCatalog(description, 8);
  const generic = hits.find((hit) => hit.kind === 'generic_food');
  if (!generic || generic.score < 220) return null;
  const details = await getUniversalFoodDetails(generic.id);
  if (!details || details.caloriesKcal === null || details.proteinG === null
    || details.carbsG === null || details.fatG === null) return null;

  const grams = explicitGrams(description);
  const item: FoodCatalogItem = {
    id: `universal:${details.id}`,
    nameFa: details.nameEn,
    nameEn: details.nameEn,
    aliasesFa: [],
    aliasesEn: [],
    category: 'ingredient',
    portionLabelFa: '۱۰۰ گرم',
    portionLabelEn: '100 g',
    portionGrams: 100,
    calories: details.caloriesKcal,
    proteinG: details.proteinG,
    carbsG: details.carbsG,
    fatG: details.fatG,
    variabilityPct: details.sourceType === 'fndds' ? 15 : 8,
    confidence: details.macroComplete ? 'high' : 'medium',
    sourceType: 'imported',
    sourceLabel: details.sourceType === 'fndds'
      ? 'USDA FNDDS 2021–2023'
      : 'USDA SR Legacy',
    notesFa: '',
    notesEn: '',
    updatedAt: '2026-07-27T00:00:00.000Z',
  };
  const multiplier = (grams ?? 100) / 100;
  return {
    item,
    multiplier,
    scaled: scaleFood(item, multiplier),
    score: details.score,
    source: 'universal_catalog',
    amountWasExplicit: grams !== null,
    assumptions: [
      grams === null
        ? 'No amount was supplied; the displayed estimate uses 100 g and must be confirmed.'
        : `Amount parsed from the description: ${grams} g.`,
      `Source record: ${details.nameEn} (${item.sourceLabel}).`,
    ],
  };
}
