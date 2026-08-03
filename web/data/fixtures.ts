export type MacroSet = {
  readonly calories: number;
  readonly proteinG: number;
  readonly carbsG: number;
  readonly fatG: number;
};

export type FoodFixture = MacroSet & {
  readonly id: string;
  readonly nameFa: string;
  readonly nameEn: string;
  readonly category: 'stew' | 'rice' | 'kebab' | 'soup' | 'breakfast';
  readonly portionLabelFa: string;
  readonly evidenceLabel: string;
};

export type DiaryFixture = MacroSet & {
  readonly id: string;
  readonly label: string;
  readonly meal: 'صبحانه' | 'ناهار' | 'شام' | 'میان‌وعده';
  readonly portionText: string;
};

export const foodFixtures: readonly FoodFixture[] = [
  {
    id: 'ghormeh-sabzi',
    nameFa: 'قورمه‌سبزی',
    nameEn: 'Ghormeh sabzi',
    category: 'stew',
    portionLabelFa: 'یک پرس بدون برنج',
    calories: 330,
    proteinG: 22,
    carbsG: 14,
    fatG: 20,
    evidenceLabel: 'IFKB · برآورد نسخه‌دار',
  },
  {
    id: 'chelo-sefid',
    nameFa: 'چلو سفید',
    nameEn: 'Plain Persian rice',
    category: 'rice',
    portionLabelFa: 'حدود یک‌ونیم پیمانه پخته',
    calories: 380,
    proteinG: 7,
    carbsG: 82,
    fatG: 4,
    evidenceLabel: 'IFKB · برآورد نسخه‌دار',
  },
  {
    id: 'kebab-koobideh',
    nameFa: 'کباب کوبیده',
    nameEn: 'Koobideh kebab',
    category: 'kebab',
    portionLabelFa: 'دو سیخ',
    calories: 480,
    proteinG: 36,
    carbsG: 2,
    fatG: 36,
    evidenceLabel: 'IFKB · برآورد نسخه‌دار',
  },
  {
    id: 'joojeh-kebab',
    nameFa: 'جوجه کباب',
    nameEn: 'Joojeh kebab',
    category: 'kebab',
    portionLabelFa: 'یک پرس',
    calories: 320,
    proteinG: 40,
    carbsG: 4,
    fatG: 15,
    evidenceLabel: 'IFKB · برآورد نسخه‌دار',
  },
  {
    id: 'ash-reshteh',
    nameFa: 'آش رشته',
    nameEn: 'Ash reshteh',
    category: 'soup',
    portionLabelFa: 'یک کاسه',
    calories: 250,
    proteinG: 10,
    carbsG: 40,
    fatG: 6,
    evidenceLabel: 'IFKB · برآورد نسخه‌دار',
  },
  {
    id: 'boiled-egg',
    nameFa: 'تخم‌مرغ آب‌پز',
    nameEn: 'Boiled egg',
    category: 'breakfast',
    portionLabelFa: 'یک عدد بزرگ',
    calories: 78,
    proteinG: 6,
    carbsG: 1,
    fatG: 5,
    evidenceLabel: 'IFKB · سهم ۵۰ گرمی',
  },
];

export const initialDiary: readonly DiaryFixture[] = [
  {
    id: 'breakfast-egg',
    label: 'دو عدد تخم‌مرغ آب‌پز',
    meal: 'صبحانه',
    portionText: '۲ سهم',
    calories: 156,
    proteinG: 12,
    carbsG: 2,
    fatG: 10,
  },
  {
    id: 'lunch-ghormeh',
    label: 'قورمه‌سبزی با چلو',
    meal: 'ناهار',
    portionText: '۱ پرس خورش + ۱ سهم چلو',
    calories: 710,
    proteinG: 29,
    carbsG: 96,
    fatG: 24,
  },
];

export const dailyTargets: MacroSet = {
  calories: 2200,
  proteinG: 140,
  carbsG: 250,
  fatG: 70,
};

export const weeklyPlan = [
  { day: 'شنبه', title: 'تعادل و شروع سبک', meals: ['املت گوجه', 'عدس‌پلو', 'جوجه کباب با سبزیجات'] },
  { day: 'یکشنبه', title: 'پروتئین بیشتر', meals: ['تخم‌مرغ آب‌پز', 'چلوکباب کوبیده', 'آش رشته'] },
  { day: 'دوشنبه', title: 'غذای خانگی', meals: ['عدسی', 'قورمه‌سبزی با چلو', 'ماست و میوه'] },
] as const;
