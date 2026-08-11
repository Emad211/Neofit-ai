import type {
  LegacyCatalogFood,
  MealType,
  NutritionGoals,
} from '@neofit/nutrition-core';

export type FoodCategory =
  | 'stew'
  | 'rice'
  | 'kebab'
  | 'soup'
  | 'breakfast'
  | 'bread'
  | 'dairy_beverage'
  | 'street_food';

export type FoodFixture = LegacyCatalogFood & {
  readonly category: FoodCategory;
  readonly evidenceLabel: string;
};

export interface DiarySourceItemFixture {
  readonly foodId: string;
  readonly portionCount: number;
}

export interface DiaryFixture {
  readonly id: string;
  readonly label: string;
  readonly mealType: MealType;
  readonly portionText: string;
  readonly items: readonly DiarySourceItemFixture[];
}

const SOURCE_LABEL = 'NeoFit Stage 1 IFKB-shaped fixtures — versioned serving estimates';
const SOURCE_VERSION = 'web-stage1-fixtures-v1';

const stageOneFoodFixtures: readonly FoodFixture[] = [
  {
    id: 'ghormeh-sabzi',
    nameFa: 'قورمه‌سبزی',
    nameEn: 'Ghormeh sabzi',
    aliasesFa: ['قرمه سبزی', 'قورمه سبزی'],
    aliasesEn: ['ghormeh sabzi', 'qormeh sabzi'],
    category: 'stew',
    portionLabelFa: 'یک پرس بدون برنج',
    portionLabelEn: 'One serving without rice',
    portionGrams: null,
    calories: 330,
    proteinG: 22,
    carbsG: 14,
    fatG: 20,
    variabilityPct: 25,
    sourceType: 'seeded',
    sourceLabel: SOURCE_LABEL,
    evidenceTier: 'legacy_estimate',
    sourceRecordId: 'ghormeh-sabzi',
    sourceVersion: SOURCE_VERSION,
    evidenceLabel: 'IFKB · برآورد نسخه‌دار',
  },
  {
    id: 'chelo-sefid',
    nameFa: 'چلو سفید',
    nameEn: 'Plain Persian rice',
    aliasesFa: ['برنج سفید', 'چلو'],
    aliasesEn: ['plain rice', 'persian rice'],
    category: 'rice',
    portionLabelFa: 'حدود یک‌ونیم پیمانه پخته',
    portionLabelEn: 'About 1.5 cups cooked',
    portionGrams: null,
    calories: 380,
    proteinG: 7,
    carbsG: 82,
    fatG: 4,
    variabilityPct: 22,
    sourceType: 'seeded',
    sourceLabel: SOURCE_LABEL,
    evidenceTier: 'legacy_estimate',
    sourceRecordId: 'chelo-sefid',
    sourceVersion: SOURCE_VERSION,
    evidenceLabel: 'IFKB · برآورد نسخه‌دار',
  },
  {
    id: 'kebab-koobideh',
    nameFa: 'کباب کوبیده',
    nameEn: 'Koobideh kebab',
    aliasesFa: ['کباب كوبيده', 'کوبیده'],
    aliasesEn: ['koobideh', 'kabab koobideh'],
    category: 'kebab',
    portionLabelFa: 'دو سیخ',
    portionLabelEn: 'Two skewers',
    portionGrams: null,
    calories: 480,
    proteinG: 36,
    carbsG: 2,
    fatG: 36,
    variabilityPct: 20,
    sourceType: 'seeded',
    sourceLabel: SOURCE_LABEL,
    evidenceTier: 'legacy_estimate',
    sourceRecordId: 'kebab-koobideh',
    sourceVersion: SOURCE_VERSION,
    evidenceLabel: 'IFKB · برآورد نسخه‌دار',
  },
  {
    id: 'joojeh-kebab',
    nameFa: 'جوجه کباب',
    nameEn: 'Joojeh kebab',
    aliasesFa: ['جوجه‌کباب', 'جوجه'],
    aliasesEn: ['joojeh', 'chicken kebab'],
    category: 'kebab',
    portionLabelFa: 'یک پرس',
    portionLabelEn: 'One serving',
    portionGrams: null,
    calories: 320,
    proteinG: 40,
    carbsG: 4,
    fatG: 15,
    variabilityPct: 20,
    sourceType: 'seeded',
    sourceLabel: SOURCE_LABEL,
    evidenceTier: 'legacy_estimate',
    sourceRecordId: 'joojeh-kebab',
    sourceVersion: SOURCE_VERSION,
    evidenceLabel: 'IFKB · برآورد نسخه‌دار',
  },
  {
    id: 'ash-reshteh',
    nameFa: 'آش رشته',
    nameEn: 'Ash reshteh',
    aliasesFa: ['آش‌رشته'],
    aliasesEn: ['ash reshte'],
    category: 'soup',
    portionLabelFa: 'یک کاسه',
    portionLabelEn: 'One bowl',
    portionGrams: null,
    calories: 250,
    proteinG: 10,
    carbsG: 40,
    fatG: 6,
    variabilityPct: 20,
    sourceType: 'seeded',
    sourceLabel: SOURCE_LABEL,
    evidenceTier: 'legacy_estimate',
    sourceRecordId: 'ash-reshteh',
    sourceVersion: SOURCE_VERSION,
    evidenceLabel: 'IFKB · برآورد نسخه‌دار',
  },
  {
    id: 'boiled-egg',
    nameFa: 'تخم‌مرغ آب‌پز',
    nameEn: 'Boiled egg',
    aliasesFa: ['تخم مرغ آب پز', 'تخم‌مرغ پخته'],
    aliasesEn: ['boiled egg', 'hard boiled egg'],
    category: 'breakfast',
    portionLabelFa: 'یک عدد بزرگ',
    portionLabelEn: 'One large egg',
    portionGrams: 50,
    calories: 78,
    proteinG: 6,
    carbsG: 1,
    fatG: 5,
    variabilityPct: 18,
    sourceType: 'seeded',
    sourceLabel: SOURCE_LABEL,
    evidenceTier: 'legacy_estimate',
    sourceRecordId: 'boiled-egg',
    sourceVersion: SOURCE_VERSION,
    evidenceLabel: 'IFKB · سهم ۵۰ گرمی',
  },
];

function starterFood(input: {
  readonly id: string;
  readonly nameFa: string;
  readonly nameEn: string;
  readonly category: FoodCategory;
  readonly portionLabelFa: string;
  readonly portionLabelEn: string;
  readonly calories: number;
  readonly proteinG: number;
  readonly carbsG: number;
  readonly fatG: number;
  readonly variabilityPct: number;
  readonly portionGrams?: number | null;
  readonly aliasesFa?: readonly string[];
  readonly aliasesEn?: readonly string[];
}): FoodFixture {
  return {
    ...input,
    aliasesFa: input.aliasesFa ?? [],
    aliasesEn: input.aliasesEn ?? [],
    portionGrams: input.portionGrams ?? null,
    sourceType: 'seeded',
    sourceLabel: 'NeoFit Iranian foods starter catalog v1 — standard serving estimates',
    evidenceTier: 'legacy_estimate',
    sourceRecordId: input.id,
    sourceVersion: 'iranian-starter-v1-2026-07-25',
    evidenceLabel: 'NeoFit · برآورد سهم استاندارد نسخه‌دار',
  };
}

const expandedIranianFoodFixtures: readonly FoodFixture[] = [
  starterFood({ id: 'adasi', nameFa: 'عدسی', nameEn: 'Lentil stew', category: 'breakfast', portionLabelFa: 'یک کاسه', portionLabelEn: 'One bowl', calories: 230, proteinG: 14, carbsG: 36, fatG: 4, variabilityPct: 18, aliasesFa: ['خوراک عدس'], aliasesEn: ['lentil stew'] }),
  starterFood({ id: 'omelet-gojeh', nameFa: 'املت گوجه', nameEn: 'Tomato omelet', category: 'breakfast', portionLabelFa: 'یک پرس', portionLabelEn: 'One serving', calories: 280, proteinG: 15, carbsG: 8, fatG: 20, variabilityPct: 18, aliasesFa: ['املت گوجه فرنگی'], aliasesEn: ['tomato omelet'] }),
  starterFood({ id: 'bread-cheese-tea', nameFa: 'نان و پنیر و چای', nameEn: 'Bread, cheese and tea', category: 'breakfast', portionLabelFa: 'یک صبحانه ساده', portionLabelEn: 'One simple breakfast', calories: 200, proteinG: 8, carbsG: 28, fatG: 6, variabilityPct: 18 }),
  starterFood({ id: 'panir', nameFa: 'پنیر سفید', nameEn: 'White cheese', category: 'dairy_beverage', portionLabelFa: 'سی گرم', portionLabelEn: '30 grams', portionGrams: 30, calories: 80, proteinG: 5, carbsG: 1, fatG: 6, variabilityPct: 12, aliasesFa: ['پنیر صبحانه'], aliasesEn: ['white cheese'] }),
  starterFood({ id: 'sangak', nameFa: 'نان سنگک', nameEn: 'Sangak bread', category: 'bread', portionLabelFa: 'یک کف دست بزرگ', portionLabelEn: 'One large palm-size piece', calories: 160, proteinG: 5, carbsG: 32, fatG: 1, variabilityPct: 12, aliasesFa: ['سنگک'], aliasesEn: ['sangak'] }),
  starterFood({ id: 'shir', nameFa: 'شیر', nameEn: 'Milk', category: 'dairy_beverage', portionLabelFa: 'یک لیوان', portionLabelEn: 'One glass', portionGrams: 240, calories: 120, proteinG: 8, carbsG: 12, fatG: 5, variabilityPct: 12 }),
  starterFood({ id: 'mast', nameFa: 'ماست', nameEn: 'Yogurt', category: 'dairy_beverage', portionLabelFa: 'یک کاسه', portionLabelEn: 'One bowl', calories: 100, proteinG: 8, carbsG: 12, fatG: 3, variabilityPct: 12 }),
  starterFood({ id: 'doogh', nameFa: 'دوغ', nameEn: 'Doogh yogurt drink', category: 'dairy_beverage', portionLabelFa: 'یک لیوان', portionLabelEn: 'One glass', portionGrams: 240, calories: 70, proteinG: 5, carbsG: 8, fatG: 2, variabilityPct: 12 }),
  starterFood({ id: 'gheimeh', nameFa: 'قیمه', nameEn: 'Gheimeh stew', category: 'stew', portionLabelFa: 'یک پرس بدون برنج', portionLabelEn: 'One serving without rice', calories: 300, proteinG: 18, carbsG: 20, fatG: 16, variabilityPct: 25, aliasesFa: ['خورش قیمه'], aliasesEn: ['split pea stew'] }),
  starterFood({ id: 'fesenjan', nameFa: 'فسنجان', nameEn: 'Fesenjan', category: 'stew', portionLabelFa: 'یک پرس بدون برنج', portionLabelEn: 'One serving without rice', calories: 450, proteinG: 20, carbsG: 18, fatG: 34, variabilityPct: 25, aliasesFa: ['فسنجون'], aliasesEn: ['walnut pomegranate stew'] }),
  starterFood({ id: 'adas-polo', nameFa: 'عدس پلو', nameEn: 'Lentil rice', category: 'rice', portionLabelFa: 'یک پرس', portionLabelEn: 'One serving', calories: 480, proteinG: 18, carbsG: 78, fatG: 12, variabilityPct: 22, aliasesFa: ['عدس‌پلو'], aliasesEn: ['lentil rice'] }),
  starterFood({ id: 'loobia-polo', nameFa: 'لوبیا پلو', nameEn: 'Green bean rice', category: 'rice', portionLabelFa: 'یک پرس', portionLabelEn: 'One serving', calories: 520, proteinG: 22, carbsG: 72, fatG: 16, variabilityPct: 22, aliasesFa: ['لوبیاپلو'], aliasesEn: ['green bean rice'] }),
  starterFood({ id: 'zereshk-polo-morgh', nameFa: 'زرشک‌پلو با مرغ', nameEn: 'Barberry rice with chicken', category: 'rice', portionLabelFa: 'یک پرس', portionLabelEn: 'One serving', calories: 560, proteinG: 35, carbsG: 70, fatG: 18, variabilityPct: 22, aliasesFa: ['زرشک پلو با مرغ'], aliasesEn: ['barberry rice chicken'] }),
  starterFood({ id: 'soup-jo', nameFa: 'سوپ جو', nameEn: 'Barley soup', category: 'soup', portionLabelFa: 'یک کاسه', portionLabelEn: 'One bowl', calories: 150, proteinG: 7, carbsG: 22, fatG: 4, variabilityPct: 20, aliasesFa: ['سوپ‌جو'], aliasesEn: ['barley soup'] }),
  starterFood({ id: 'kuku-sabzi', nameFa: 'کوکو سبزی', nameEn: 'Kuku sabzi', category: 'street_food', portionLabelFa: 'یک تکه متوسط', portionLabelEn: 'One medium piece', calories: 150, proteinG: 7, carbsG: 8, fatG: 10, variabilityPct: 24, aliasesFa: ['کوکوسبزی'], aliasesEn: ['herb frittata'] }),
  starterFood({ id: 'loobia-chiti', nameFa: 'خوراک لوبیا چیتی', nameEn: 'Pinto bean stew', category: 'street_food', portionLabelFa: 'یک کاسه', portionLabelEn: 'One bowl', calories: 280, proteinG: 14, carbsG: 40, fatG: 7, variabilityPct: 24, aliasesFa: ['لوبیا چیتی'], aliasesEn: ['pinto bean stew'] }),
  starterFood({ id: 'kotlet', nameFa: 'کتلت', nameEn: 'Kotlet', category: 'street_food', portionLabelFa: 'یک عدد متوسط', portionLabelEn: 'One medium patty', calories: 220, proteinG: 11, carbsG: 16, fatG: 12, variabilityPct: 24, aliasesFa: ['کتلت گوشت'], aliasesEn: ['Persian meat potato patty'] }),
  starterFood({ id: 'mirza-ghasemi', nameFa: 'میرزاقاسمی', nameEn: 'Mirza ghasemi', category: 'street_food', portionLabelFa: 'یک پرس', portionLabelEn: 'One serving', calories: 320, proteinG: 10, carbsG: 18, fatG: 24, variabilityPct: 24, aliasesFa: ['میرزا قاسمی'], aliasesEn: ['mirza ghasemi'] }),
];

export const foodFixtures: readonly FoodFixture[] = [
  ...stageOneFoodFixtures,
  ...expandedIranianFoodFixtures,
];

export const initialDiary: readonly DiaryFixture[] = [
  {
    id: 'breakfast-egg',
    label: 'دو عدد تخم‌مرغ آب‌پز',
    mealType: 'breakfast',
    portionText: '۲ سهم',
    items: [{ foodId: 'boiled-egg', portionCount: 2 }],
  },
  {
    id: 'lunch-ghormeh',
    label: 'قورمه‌سبزی با چلو',
    mealType: 'lunch',
    portionText: '۱ پرس خورش + ۱ سهم چلو',
    items: [
      { foodId: 'ghormeh-sabzi', portionCount: 1 },
      { foodId: 'chelo-sefid', portionCount: 1 },
    ],
  },
];

export const dailyTargets: NutritionGoals = {
  daily: {
    energyKcal: 2200,
    proteinG: 140,
    carbsG: 250,
    fatG: 70,
  },
};

export const weeklyPlan = [
  { day: 'شنبه', title: 'تعادل و شروع سبک', meals: ['املت گوجه', 'عدس‌پلو', 'جوجه کباب با سبزیجات'] },
  { day: 'یکشنبه', title: 'پروتئین بیشتر', meals: ['تخم‌مرغ آب‌پز', 'چلوکباب کوبیده', 'آش رشته'] },
  { day: 'دوشنبه', title: 'غذای خانگی', meals: ['عدسی', 'قورمه‌سبزی با چلو', 'ماست و میوه'] },
] as const;
