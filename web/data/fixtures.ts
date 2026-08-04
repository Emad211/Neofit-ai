import type {
  LegacyCatalogFood,
  MealType,
  NutritionGoals,
} from '@neofit/nutrition-core';

export type FoodCategory = 'stew' | 'rice' | 'kebab' | 'soup' | 'breakfast';

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

export const foodFixtures: readonly FoodFixture[] = [
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
