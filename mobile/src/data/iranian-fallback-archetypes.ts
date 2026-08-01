import { IRANIAN_FALLBACK_SEED } from '@/data/iranian-fallback-seed.generated';
import { IRANIAN_FOOD_SEED } from '@/data/iranian-food-seed';
import { FoodCatalogItemSchema, type FoodCatalogItem } from '@/domain/models';

const UPDATED_AT = '2026-08-01T02:05:00.000Z';
const SOURCE_PREFIX = 'IFKB DS0 broad-fallback archetype prior v2.1';

type MacroValues = Pick<FoodCatalogItem, 'calories' | 'proteinG' | 'carbsG' | 'fatG'>;
type PortionPolicy = {
  readonly grams: number;
  readonly labelFa: string;
  readonly labelEn: string;
};

const CATEGORY_VARIABILITY: Readonly<Record<FoodCatalogItem['category'], number>> = {
  stew: 50,
  rice: 45,
  kebab: 45,
  soup: 55,
  breakfast: 50,
  street_food: 60,
  bread: 35,
  dessert: 60,
  dairy_beverage: 50,
  ingredient: 40,
  custom: 60,
};

const ARCHETYPE_PORTIONS = {
  stew_seafood: { grams: 250, labelFa: 'یک پرس بدون برنج', labelEn: '1 serving without rice' },
  stew_poultry: { grams: 250, labelFa: 'یک پرس بدون برنج', labelEn: '1 serving without rice' },
  stew_nut_fruit: { grams: 240, labelFa: 'یک پرس بدون برنج', labelEn: '1 serving without rice' },
  stew_vegetable: { grams: 260, labelFa: 'یک پرس بدون برنج', labelEn: '1 serving without rice' },
  stew_meat_legume: { grams: 250, labelFa: 'یک پرس بدون برنج', labelEn: '1 serving without rice' },
  rice_tahchin: { grams: 280, labelFa: 'یک برش یا پرس متوسط', labelEn: '1 medium slice or serving' },
  rice_meat: { grams: 320, labelFa: 'یک بشقاب متوسط', labelEn: '1 medium plate' },
  rice_mixed_plant: { grams: 300, labelFa: 'یک بشقاب متوسط', labelEn: '1 medium plate' },
  rice_plain_or_mixed: { grams: 300, labelFa: 'یک بشقاب متوسط', labelEn: '1 medium plate' },
  kebab_poultry: { grams: 220, labelFa: 'یک پرس', labelEn: '1 serving' },
  kebab_seafood: { grams: 200, labelFa: 'یک پرس', labelEn: '1 serving' },
  kebab_red_meat: { grams: 200, labelFa: 'یک پرس', labelEn: '1 serving' },
  soup_abgoosht: { grams: 350, labelFa: 'یک کاسه یا پرس', labelEn: '1 bowl or serving' },
  soup_porridge: { grams: 250, labelFa: 'یک کاسه متوسط', labelEn: '1 medium bowl' },
  soup_ash: { grams: 300, labelFa: 'یک کاسه متوسط', labelEn: '1 medium bowl' },
  soup_cold: { grams: 250, labelFa: 'یک کاسه متوسط', labelEn: '1 medium bowl' },
  soup_light: { grams: 300, labelFa: 'یک کاسه متوسط', labelEn: '1 medium bowl' },
  breakfast_egg: { grams: 180, labelFa: 'یک پرس', labelEn: '1 serving' },
  breakfast_other: { grams: 200, labelFa: 'یک پرس', labelEn: '1 serving' },
  street_stuffed: { grams: 220, labelFa: 'یک سهم متوسط', labelEn: '1 medium serving' },
  street_patty_meatball: { grams: 180, labelFa: 'یک سهم متوسط', labelEn: '1 medium serving' },
  street_fried: { grams: 120, labelFa: 'یک سهم متوسط', labelEn: '1 medium serving' },
  street_side_condiment: { grams: 100, labelFa: 'یک سهم کوچک', labelEn: '1 small serving' },
  street_offal: { grams: 220, labelFa: 'یک پرس', labelEn: '1 serving' },
  street_meat_main: { grams: 220, labelFa: 'یک پرس', labelEn: '1 serving' },
  street_vegetable_main: { grams: 180, labelFa: 'یک سهم متوسط', labelEn: '1 medium serving' },
  bread_enriched: { grams: 80, labelFa: 'یک تکه متوسط', labelEn: '1 medium piece' },
  bread_flat: { grams: 60, labelFa: 'یک تکه متوسط', labelEn: '1 medium piece' },
  dessert_frozen: { grams: 100, labelFa: 'یک سهم متوسط', labelEn: '1 medium serving' },
  dessert_syrup_fat: { grams: 80, labelFa: 'یک سهم کوچک', labelEn: '1 small serving' },
  dessert_pudding: { grams: 150, labelFa: 'یک کاسه کوچک', labelEn: '1 small bowl' },
  dessert_fruit_nut: { grams: 80, labelFa: 'یک سهم کوچک', labelEn: '1 small serving' },
  dessert_pastry: { grams: 60, labelFa: 'یک عدد یا سهم کوچک', labelEn: '1 small piece or serving' },
  dessert_other: { grams: 100, labelFa: 'یک سهم متوسط', labelEn: '1 medium serving' },
  beverage_dairy: { grams: 250, labelFa: 'یک لیوان یا کاسه', labelEn: '1 glass or bowl' },
  beverage_sweet_herbal: { grams: 250, labelFa: 'یک لیوان', labelEn: '1 glass' },
} as const satisfies Readonly<Record<string, PortionPolicy>>;

export type IranianFallbackArchetypeId = keyof typeof ARCHETYPE_PORTIONS;

const ZERO_SAMPLE_MULTIPLIERS: Partial<Record<IranianFallbackArchetypeId, MacroValues>> = {
  bread_enriched: { calories: 1.25, proteinG: 1, carbsG: 1.15, fatG: 1.8 },
  dessert_pastry: { calories: 1.25, proteinG: 0.9, carbsG: 1.15, fatG: 1.35 },
  dessert_pudding: { calories: 0.8, proteinG: 1.45, carbsG: 0.95, fatG: 0.6 },
  kebab_seafood: { calories: 0.75, proteinG: 1, carbsG: 0.5, fatG: 0.55 },
  rice_tahchin: { calories: 1.12, proteinG: 1.2, carbsG: 0.95, fatG: 1.5 },
  stew_poultry: { calories: 1.05, proteinG: 1.25, carbsG: 0.85, fatG: 0.9 },
  stew_seafood: { calories: 0.85, proteinG: 1.15, carbsG: 0.8, fatG: 0.75 },
  street_meat_main: { calories: 1.15, proteinG: 1.5, carbsG: 0.7, fatG: 1.15 },
  street_offal: { calories: 1.1, proteinG: 1.5, carbsG: 0.4, fatG: 1.2 },
};

function normalize(value: string): string {
  return value
    .normalize('NFKC')
    .toLocaleLowerCase('fa')
    .replace(/[يى]/g, 'ی')
    .replace(/ك/g, 'ک')
    .replace(/[ۀة]/g, 'ه')
    .replace(/ؤ/g, 'و')
    .replace(/[إأ]/g, 'ا')
    .replace(/[\u200c\u200f\u202a-\u202e]/g, ' ')
    .replace(/[^\p{L}\p{N}\s]/gu, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function searchableText(item: Pick<FoodCatalogItem, 'nameFa' | 'nameEn' | 'aliasesFa' | 'aliasesEn'>): string {
  return normalize([item.nameFa, item.nameEn, ...item.aliasesFa, ...item.aliasesEn].join(' '));
}

function containsAny(text: string, values: readonly string[]): boolean {
  const padded = ` ${text} `;
  return values.some((raw) => {
    const substring = raw.startsWith('~');
    const value = normalize(substring ? raw.slice(1) : raw);
    if (!value) return false;
    return substring ? text.includes(value) : padded.includes(` ${value} `);
  });
}

export function classifyIranianFallbackArchetype(
  item: Pick<FoodCatalogItem, 'category' | 'nameFa' | 'nameEn' | 'aliasesFa' | 'aliasesEn'>,
): IranianFallbackArchetypeId {
  const text = searchableText(item);
  switch (item.category) {
    case 'stew':
      if (containsAny(text, ['ماهی', 'میگو', 'fish', 'shrimp'])) return 'stew_seafood';
      if (containsAny(text, ['مرغ', 'اردک', 'غاز', 'chicken', 'duck', 'poultry'])) return 'stew_poultry';
      if (containsAny(text, ['گردو', 'آغوز', 'انار', '~ناردون', '~فسنج', 'خلال', 'بادام', 'پسته', 'آلو', 'walnut', 'pomegranate', 'almond', 'nut', 'plum'])) return 'stew_nut_fruit';
      if (containsAny(text, ['بادمجان', 'کدو', 'تره', 'سبزی', 'سیر', 'اسفناج', 'کرفس', 'بامیه', 'هویج', 'vegetable', 'eggplant', 'herb', 'garlic', 'okra', 'carrot'])) return 'stew_vegetable';
      return 'stew_meat_legume';
    case 'rice':
      if (containsAny(text, ['ته چین', 'tahchin'])) return 'rice_tahchin';
      if (containsAny(text, ['مرغ', 'گوشت', 'ماهی', 'میگو', 'ماهیچه', 'chicken', 'meat', 'fish', 'shrimp', 'lamb'])) return 'rice_meat';
      if (containsAny(text, ['لوبیا', 'عدس', 'ماش', 'نخود', 'باقلا', 'سبزی', 'کلم', 'هویج', 'آلبالو', 'کشمش', 'زرشک', 'legume', 'bean', 'lentil', 'herb', 'cabbage', 'carrot', 'cherry', 'raisin'])) return 'rice_mixed_plant';
      return 'rice_plain_or_mixed';
    case 'kebab':
      if (containsAny(text, ['مرغ', 'جوجه', 'chicken', 'poultry'])) return 'kebab_poultry';
      if (containsAny(text, ['ماهی', 'میگو', 'fish', 'shrimp'])) return 'kebab_seafood';
      return 'kebab_red_meat';
    case 'soup':
      if (containsAny(text, ['آبگوشت', 'دیزی', 'abgoosht', 'dizi'])) return 'soup_abgoosht';
      if (containsAny(text, ['حلیم', 'کاچی', 'فرنی', 'شله', 'porridge', 'haleem'])) return 'soup_porridge';
      if (containsAny(text, ['سرد', 'ماست', 'خیار', 'cold', 'yogurt', 'cucumber'])) return 'soup_cold';
      if (containsAny(text, ['آش', 'رشته', 'دوغ', 'ash', 'noodle', 'doogh'])) return 'soup_ash';
      return 'soup_light';
    case 'breakfast':
      return containsAny(text, ['تخم', 'املت', 'خاگینه', 'egg', 'omelet'])
        ? 'breakfast_egg'
        : 'breakfast_other';
    case 'street_food':
      if (containsAny(text, ['دلمه', 'شکم پر', 'stuffed', 'dolma'])) return 'street_stuffed';
      if (containsAny(text, ['کوکو', 'کتلت', 'شامی', 'کوفته', 'قیمه ریزه', '~سرگنجشک', 'meatball', 'cutlet', 'kuku'])) return 'street_patty_meatball';
      if (containsAny(text, ['سمبوسه', 'فلافل', 'پیراشکی', 'سوخاری', 'سرخ', 'پکوره', 'fried', 'falafel', 'samosa', 'pakora'])) return 'street_fried';
      if (containsAny(text, ['سالاد', 'ترشی', 'شور', 'ماست', 'زیتون', 'کشک', 'چاشنی', 'سس', 'سوراغ', 'مهیاوه', 'بورانی', 'کال کباب', 'دویماج', 'salad', 'pickle', 'condiment', 'sauce', 'yogurt'])) return 'street_side_condiment';
      if (containsAny(text, ['کله', 'پاچه', 'جگر', 'دل', 'قلوه', 'سیرابی', 'جغور', 'offal'])) return 'street_offal';
      if (containsAny(text, ['مرغ', 'گوشت', 'ماهی', 'میگو', 'بریانی', 'بریان', 'تنورچه', 'تباهگ', 'roast', 'chicken', 'meat', 'fish'])) return 'street_meat_main';
      return 'street_vegetable_main';
    case 'bread':
      return containsAny(text, ['شیرمال', 'کلوچه', 'فطیر', 'قندی', 'sweet', 'milk bread', 'cookie'])
        ? 'bread_enriched'
        : 'bread_flat';
    case 'dessert':
      if (containsAny(text, ['بستنی', 'فالوده', 'یخ', 'ice', 'faloodeh'])) return 'dessert_frozen';
      if (containsAny(text, ['حلوا', 'زولبیا', 'بامیه', 'گوش فیل', 'قطاب', 'باقلوا', 'شربت', 'fried', 'baklava', 'halva'])) return 'dessert_syrup_fat';
      if (containsAny(text, ['فرنی', 'شیربرنج', 'شله زرد', 'سمنو', 'ماست', 'پودینگ', 'pudding', 'rice pudding', 'yogurt'])) return 'dessert_pudding';
      if (containsAny(text, ['خرما', 'کشمش', 'گردو', 'بادام', 'پسته', 'میوه', 'date', 'raisin', 'walnut', 'almond', 'fruit'])) return 'dessert_fruit_nut';
      if (containsAny(text, ['نان برنجی', 'سوهان', 'گز', 'پولکی', 'کیک', 'لوز', 'کلوچه', 'رشته خوشکار', 'کاک', 'قرابیه', 'نوقا', 'اریس', 'باسلوق', 'یوخه', 'کماچ', 'نان چایی', 'نخودچی', 'پنجره', 'cookie', 'cake', 'pastry', 'nougat', 'candy'])) return 'dessert_pastry';
      return 'dessert_other';
    case 'dairy_beverage':
      return containsAny(text, ['دوغ', 'شیر', 'ماست', 'پنیر', 'کشک', 'milk', 'yogurt', 'doogh', 'cheese', 'kashk'])
        ? 'beverage_dairy'
        : 'beverage_sweet_herbal';
    case 'ingredient':
    case 'custom':
      return 'street_vegetable_main';
  }
}

function median(values: readonly number[]): number {
  if (values.length === 0) throw new Error('Cannot calculate an empty median.');
  const sorted = [...values].sort((left, right) => left - right);
  const middle = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 1
    ? sorted[middle]!
    : (sorted[middle - 1]! + sorted[middle]!) / 2;
}

function round(value: number, digits = 1): number {
  const factor = 10 ** digits;
  return Math.round((value + Number.EPSILON) * factor) / factor;
}

function medianMacros(items: readonly FoodCatalogItem[]): MacroValues {
  return {
    calories: median(items.map((item) => item.calories)),
    proteinG: median(items.map((item) => item.proteinG)),
    carbsG: median(items.map((item) => item.carbsG)),
    fatG: median(items.map((item) => item.fatG)),
  };
}

const categorySamples = new Map<FoodCatalogItem['category'], FoodCatalogItem[]>();
const archetypeSamples = new Map<IranianFallbackArchetypeId, FoodCatalogItem[]>();
for (const item of IRANIAN_FOOD_SEED) {
  const categoryRows = categorySamples.get(item.category) ?? [];
  categoryRows.push(item);
  categorySamples.set(item.category, categoryRows);
  const archetype = classifyIranianFallbackArchetype(item);
  const archetypeRows = archetypeSamples.get(archetype) ?? [];
  archetypeRows.push(item);
  archetypeSamples.set(archetype, archetypeRows);
}

function blendedPrior(item: FoodCatalogItem, archetype: IranianFallbackArchetypeId): {
  readonly values: MacroValues;
  readonly archetypeSampleCount: number;
  readonly categorySampleCount: number;
} {
  const categoryRows = categorySamples.get(item.category) ?? [];
  if (categoryRows.length === 0) throw new Error(`No curated category samples for ${item.category}.`);
  const category = medianMacros(categoryRows);
  const archetypeRows = archetypeSamples.get(archetype) ?? [];
  if (archetypeRows.length === 0) {
    const multiplier = ZERO_SAMPLE_MULTIPLIERS[archetype];
    return {
      values: multiplier
        ? {
            calories: round(category.calories * multiplier.calories, 0),
            proteinG: round(category.proteinG * multiplier.proteinG),
            carbsG: round(category.carbsG * multiplier.carbsG),
            fatG: round(category.fatG * multiplier.fatG),
          }
        : category,
      archetypeSampleCount: 0,
      categorySampleCount: categoryRows.length,
    };
  }
  const archetypeValues = medianMacros(archetypeRows);
  const weight = archetype === 'beverage_sweet_herbal'
    ? 1
    : Math.min(0.8, archetypeRows.length / (archetypeRows.length + 2));
  return {
    values: {
      calories: Math.round((category.calories * (1 - weight) + archetypeValues.calories * weight) / 5) * 5,
      proteinG: round(category.proteinG * (1 - weight) + archetypeValues.proteinG * weight),
      carbsG: round(category.carbsG * (1 - weight) + archetypeValues.carbsG * weight),
      fatG: round(category.fatG * (1 - weight) + archetypeValues.fatG * weight),
    },
    archetypeSampleCount: archetypeRows.length,
    categorySampleCount: categoryRows.length,
  };
}

function variability(category: FoodCatalogItem['category'], sampleCount: number): number {
  const base = CATEGORY_VARIABILITY[category];
  if (sampleCount >= 5) return Math.max(30, base - 15);
  if (sampleCount >= 2) return Math.max(35, base - 10);
  if (sampleCount === 1) return Math.max(40, base - 5);
  return base;
}

export interface IranianFallbackArchetypeMetadata {
  readonly archetypeId: IranianFallbackArchetypeId;
  readonly archetypeSampleCount: number;
  readonly categorySampleCount: number;
  readonly servingWeightSource: 'archetype_default_estimate';
  readonly estimateModelId: 'ifkb-archetype-prior-v2';
}

export function applyIranianFallbackArchetypePrior(item: FoodCatalogItem): FoodCatalogItem {
  const archetype = classifyIranianFallbackArchetype(item);
  const prior = blendedPrior(item, archetype);
  const portion = ARCHETYPE_PORTIONS[archetype];
  return FoodCatalogItemSchema.parse({
    ...item,
    portionLabelFa: portion.labelFa,
    portionLabelEn: portion.labelEn,
    portionGrams: portion.grams,
    calories: prior.values.calories,
    proteinG: prior.values.proteinG,
    carbsG: prior.values.carbsG,
    fatG: prior.values.fatG,
    variabilityPct: variability(item.category, prior.archetypeSampleCount),
    confidence: 'low',
    sourceType: 'seeded',
    sourceLabel: `${SOURCE_PREFIX} — ${archetype}; curatedSamples=${prior.archetypeSampleCount}; not recipe-specific`,
    notesFa: `برآورد مرحله ۵ بر پایه archetype «${archetype}» و ${prior.archetypeSampleCount} نمونهٔ curated است و به میانهٔ دسته shrink شده است. وزن سهم ${portion.grams} گرم نیز تخمینی است؛ دستور، روغن و مقدار واقعی باید تأیید شود.`,
    notesEn: `Stage 5 estimate uses archetype ${archetype} with ${prior.archetypeSampleCount} curated samples, shrunk toward the category median. The ${portion.grams} g serving is also estimated; recipe, oil and actual amount must be confirmed.`,
    updatedAt: UPDATED_AT,
  });
}

export function getIranianFallbackArchetypeMetadata(item: FoodCatalogItem): IranianFallbackArchetypeMetadata {
  const archetypeId = classifyIranianFallbackArchetype(item);
  const prior = blendedPrior(item, archetypeId);
  return {
    archetypeId,
    archetypeSampleCount: prior.archetypeSampleCount,
    categorySampleCount: prior.categorySampleCount,
    servingWeightSource: 'archetype_default_estimate',
    estimateModelId: 'ifkb-archetype-prior-v2',
  };
}

export const IRANIAN_ARCHETYPE_FALLBACK_SEED: FoodCatalogItem[] = IRANIAN_FALLBACK_SEED.map(
  applyIranianFallbackArchetypePrior,
);

export const IRANIAN_FALLBACK_ARCHETYPE_COUNT = new Set(
  IRANIAN_ARCHETYPE_FALLBACK_SEED.map(classifyIranianFallbackArchetype),
).size;
