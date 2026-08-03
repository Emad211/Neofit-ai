import type { FoodConcept, FoodVariant } from '../src';

export const MOBILE_RC_GOLDEN_PROVENANCE = {
  referenceBranch: 'agent/iranian-food-kb-foundation',
  referenceHead: '648b98cdc921beb26ccd0ff05a1f17944bb6f71d',
  sourceTestPath: 'mobile/tests/nutrition-core.test.ts',
  sourceTestBlob: '2291e1958efe5e17010230c5864c9fadc9bc47ba',
  sourceTypesBlob: '55e0100964e32b392493dd604a12e0f845b7e5e7',
  sourceNutritionBlob: '53ac392d69f351e145f51db140dd5701cdcbaeab',
  sourceRecipeBlob: '51784eb1a522eda8bee5b4ba394b67844c04db6c',
  sourceDiaryBlob: 'e297eed728a7457b9b46529a761e450bd647e97d',
  sourceGoalsBlob: '16a2d91dfa173f88f3d56b26ce58aa679df25cf3',
} as const;

export const eggWhiteConcept: FoodConcept = {
  id: 'egg-white',
  nameFa: 'سفیده تخم مرغ',
  nameEn: 'Egg white',
  aliasesFa: ['سفیده', 'تخم مرغ بدون زرده'],
  aliasesEn: ['egg whites'],
  category: 'egg',
  defaultVariantId: 'egg-white-no-fat',
};

export const eggWhiteVariant: FoodVariant = {
  id: 'egg-white-no-fat',
  conceptId: eggWhiteConcept.id,
  nameFa: 'سفیده تخم مرغ پخته بدون روغن',
  nameEn: 'Cooked egg white without added fat',
  preparationTags: ['egg_white', 'without_yolk', 'boiled', 'without_added_fat'],
  nutrientBasis: 'per_100g',
  basisGrams: 100,
  nutrientsPerBasis: {
    energyKcal: 52,
    proteinG: 10.9,
    carbsG: 0.7,
    fatG: 0.2,
  },
  portions: [
    {
      id: 'one-white',
      labelFa: 'یک سفیده',
      labelEn: 'One egg white',
      gramWeight: 33,
      basisMultiplier: 0.33,
    },
  ],
  evidenceTier: 'verified_source',
};

export const unknownWeightServingVariant: FoodVariant = {
  id: 'legacy-stew-serving',
  conceptId: 'legacy-stew',
  nameFa: 'خورش نمونه، یک پرس',
  nameEn: 'Sample stew, one serving',
  preparationTags: ['stew'],
  nutrientBasis: 'per_serving',
  basisGrams: null,
  nutrientsPerBasis: {
    energyKcal: 400,
    proteinG: 20,
    carbsG: 30,
    fatG: 20,
  },
  portions: [{
    id: 'legacy-stew-standard',
    labelFa: 'یک پرس',
    labelEn: 'One serving',
    gramWeight: null,
    basisMultiplier: 1,
  }],
  evidenceTier: 'legacy_estimate',
};

export const MOBILE_RC_EXPECTED = {
  twoEggWhitesWithOil: {
    grams: 66,
    energyKcal: 79.32,
    proteinG: 7.194,
    fatG: 5.132,
  },
  unknownWeightOneAndHalf: {
    grams: null,
    energyKcal: 600,
    proteinG: 30,
  },
  threeEggWhiteRecipe: {
    totalGrams: 90,
    perServingGrams: 30,
    per100gProteinG: 11.99,
  },
  mixedDiary: {
    grams: null,
    proteinG: 23.597,
  },
} as const;
