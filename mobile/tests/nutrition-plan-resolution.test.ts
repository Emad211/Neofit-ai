import assert from 'node:assert/strict';
import test from 'node:test';
import {
  assertIfkbResolvedNutritionPlan,
  isIfkbResolvedNutritionPlan,
  resolveNutritionPlanDraftWithCatalog,
  type NutritionPlanCatalog,
  type NutritionPlanDraft,
} from '../src/services/nutrition-plan-resolution-core';

function draft(): NutritionPlanDraft {
  return {
    title: 'Local catalog plan',
    summary: 'All nutrition is calculated after catalog resolution.',
    safetyNotes: [],
    days: Array.from({ length: 7 }, (_, dayIndex) => ({
      dayIndex,
      meals: [
        {
          type: 'breakfast' as const,
          name: 'Breakfast',
          ingredients: [{
            name: 'Eggs',
            quantity: '2 eggs',
            catalogQuery: 'egg, whole, cooked',
            grams: 100,
            category: 'protein' as const,
          }],
        },
        {
          type: 'lunch' as const,
          name: 'Lunch',
          ingredients: [{
            name: 'Rice plate',
            quantity: '1 plate',
            catalogQuery: 'چلو سفید',
            grams: 300,
            category: 'pantry' as const,
          }],
        },
      ],
    })),
  };
}

const catalog: NutritionPlanCatalog = {
  async resolveIngredient(query, grams) {
    if (query === 'egg, whole, cooked') {
      assert.equal(grams, 100);
      return {
        source: 'sr_legacy',
        foodId: 'egg-1',
        resolvedName: 'Egg, whole, cooked',
        nutrition: { energyKcal: 300, proteinG: 24, carbsG: 2, fatG: 21 },
      };
    }
    if (query === 'چلو سفید') {
      assert.equal(grams, 300);
      return {
        source: 'ifkb',
        foodId: 'iranian-chelo-sefid:default',
        resolvedName: 'چلو سفید',
        nutrition: { energyKcal: 500, proteinG: 10, carbsG: 105, fatG: 4 },
      };
    }
    return null;
  },
};

test('resolves every planned ingredient before building calories and macros', async () => {
  const result = await resolveNutritionPlanDraftWithCatalog({
    draft: draft(),
    dailyCalorieTarget: 1_900,
    catalog,
    createdAt: '2026-08-03T00:00:00.000Z',
  });

  assert.equal(result.ok, true);
  if (!result.ok) return;
  assert.equal(result.plan.days.length, 7);
  assert.equal(result.plan.days[0]?.totalCalories, 800);
  assert.equal(result.plan.days[0]?.meals[0]?.nutritionSource, 'ifkb_resolved');
  assert.equal(result.plan.days[0]?.meals[0]?.ingredients[0]?.catalogSource, 'sr_legacy');
  assert.equal(result.plan.days[0]?.meals[1]?.ingredients[0]?.catalogFoodId, 'iranian-chelo-sefid:default');
  assert.equal(isIfkbResolvedNutritionPlan(result.plan), true);
  assert.doesNotThrow(() => assertIfkbResolvedNutritionPlan(result.plan));
});

test('fails the whole plan when one catalog query is unresolved', async () => {
  const broken = structuredClone(draft()) as unknown as {
    days: Array<{ meals: Array<{ ingredients: Array<{ catalogQuery: string }> }> }>;
  };
  broken.days[3]!.meals[1]!.ingredients[0]!.catalogQuery = 'not-a-real-food';
  const result = await resolveNutritionPlanDraftWithCatalog({
    draft: broken,
    dailyCalorieTarget: 1_900,
    catalog,
  });
  assert.equal(result.ok, false);
  if (result.ok) return;
  assert.match(result.issues.join('\n'), /not-a-real-food/);
});

test('rejects a catalog record with incomplete local macros', async () => {
  const incomplete: NutritionPlanCatalog = {
    async resolveIngredient(query) {
      return {
        source: 'ifkb',
        foodId: query,
        resolvedName: query,
        nutrition: { energyKcal: 300, proteinG: 20, fatG: 10 },
      };
    },
  };
  const result = await resolveNutritionPlanDraftWithCatalog({
    draft: draft(),
    dailyCalorieTarget: 1_900,
    catalog: incomplete,
  });
  assert.equal(result.ok, false);
  if (result.ok) return;
  assert.match(result.issues.join('\n'), /complete local calories\/macros/);
});

test('legacy plan payloads are readable but are not treated as IFKB-resolved', () => {
  const legacy = {
    id: 'legacy-plan',
    title: 'Legacy',
    summary: 'Legacy AI nutrition',
    dailyCalorieTarget: 1_800,
    safetyNotes: [],
    createdAt: '2026-08-03T00:00:00.000Z',
    days: Array.from({ length: 7 }, (_, dayIndex) => ({
      dayIndex,
      totalCalories: 800,
      meals: [
        {
          id: `a-${dayIndex}`,
          type: 'breakfast' as const,
          name: 'A',
          calories: 400,
          proteinG: 20,
          carbsG: 40,
          fatG: 15,
          ingredients: [{ name: 'A', quantity: '1', category: 'other' as const }],
        },
        {
          id: `b-${dayIndex}`,
          type: 'lunch' as const,
          name: 'B',
          calories: 400,
          proteinG: 20,
          carbsG: 40,
          fatG: 15,
          ingredients: [{ name: 'B', quantity: '1', category: 'other' as const }],
        },
      ],
    })),
  };
  assert.equal(isIfkbResolvedNutritionPlan(legacy), false);
  assert.throws(() => assertIfkbResolvedNutritionPlan(legacy), /must be fully resolved/);
});
