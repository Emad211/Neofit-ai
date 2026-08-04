export const WEB_NUTRITION_ADAPTER_GOLDEN_PROVENANCE = {
  batch5Merge: 'd3c0a28ecf2596e94c86ff74e2f00a0523219433',
  webFixturesBlob: '08e623948b84e4e4e261528b1c332ae2e76af4b7',
  webPrototypeBlob: 'add0839d207e5b3b12288657fe53077c9a4fda0a',
  mobileLegacyUiAdapterBlob: 'bbacac7a376ba9edb14b14f673d3d708dfa3319e',
  coreLegacyAdapterBlob: 'eb4be071cfb3ccc6bb03261abf49aa7ae972028d',
  coreSearchBlob: '3dc081e6f22f9d98518ad7411bcbd5c6394cc983',
  coreDiaryBlob: 'e297eed728a7457b9b46529a761e450bd647e97d',
  coreTypesBlob: '62fde93f8ce534b199cfe41e28da3b9903741576',
} as const;

export const WEB_FIXTURE_DATE = '2026-08-03';
export const WEB_FIXTURE_TIMESTAMP = '2026-08-03T08:00:00.000Z';

export const WEB_FOOD_GOLDEN = {
  ghormehSabzi: {
    id: 'ghormeh-sabzi',
    base: { calories: 330, proteinG: 22, carbsG: 14, fatG: 20 },
    oneAndHalf: { calories: 495, proteinG: 33, carbsG: 21, fatG: 30, grams: null },
  },
  plainRice: {
    id: 'chelo-sefid',
    base: { calories: 380, proteinG: 7, carbsG: 82, fatG: 4 },
  },
  boiledEgg: {
    id: 'boiled-egg',
    base: { calories: 78, proteinG: 6, carbsG: 1, fatG: 5 },
    two: { calories: 156, proteinG: 12, carbsG: 2, fatG: 10, grams: 100 },
  },
  joojeh: {
    id: 'joojeh-kebab',
    oneAndHalf: { calories: 480, proteinG: 60, carbsG: 6, fatG: 22.5 },
  },
} as const;

export const WEB_INITIAL_DIARY_GOLDEN = {
  breakfast: {
    id: 'breakfast-egg',
    mealType: 'breakfast',
    sourceItems: [{ foodId: 'boiled-egg', portionCount: 2 }],
    macros: { calories: 156, proteinG: 12, carbsG: 2, fatG: 10 },
    grams: 100,
  },
  lunch: {
    id: 'lunch-ghormeh',
    mealType: 'lunch',
    sourceItems: [
      { foodId: 'ghormeh-sabzi', portionCount: 1 },
      { foodId: 'chelo-sefid', portionCount: 1 },
    ],
    macros: { calories: 710, proteinG: 29, carbsG: 96, fatG: 24 },
    grams: null,
  },
  total: {
    entryCount: 2,
    macros: { calories: 866, proteinG: 41, carbsG: 98, fatG: 34 },
    grams: null,
    remainingCalories: 1334,
    calorieProgressPercent: 39,
  },
} as const;

export const WEB_AFTER_ADD_GOLDEN = {
  added: {
    foodId: 'joojeh-kebab',
    portionCount: 1.5,
    macros: { calories: 480, proteinG: 60, carbsG: 6, fatG: 22.5 },
  },
  total: {
    entryCount: 3,
    macros: { calories: 1346, proteinG: 101, carbsG: 104, fatG: 56.5 },
    remainingCalories: 854,
    calorieProgressPercent: 61,
  },
} as const;

export const WEB_SEARCH_GOLDEN = [
  { query: 'قورمه سبزی', expectedIds: ['ghormeh-sabzi'] },
  { query: 'قرمه\u200cسبزي', expectedIds: ['ghormeh-sabzi'] },
  { query: 'كباب كوبيده', expectedIds: ['kebab-koobideh'] },
  { query: 'boiled egg', expectedIds: ['boiled-egg'] },
] as const;

export const WEB_ADAPTER_BOUNDARY_GOLDEN = {
  packageName: '@neofit/nutrition-core',
  localDependency: 'file:../packages/nutrition-core',
  transpilePackage: '@neofit/nutrition-core',
  forbiddenComponentPatterns: [
    'function sumMacros',
    '.toFixed(',
    'selectedFood.calories * portionCount',
    'selectedFood.proteinG * portionCount',
    'selectedFood.carbsG * portionCount',
    'selectedFood.fatG * portionCount',
  ],
  requiredComponentSymbols: [
    'estimateWebFood',
    'summarizeWebDiary',
    'createWebDiaryEntry',
    'filterWebFoods',
  ],
} as const;
