import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { foodFixtures } from '@/data/fixtures';
import { parseNutritionPlanDocument, resolveNutritionPlanDocument } from '@/lib/nutrition-plan-core';

const webRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const repoRoot = resolve(webRoot, '..');

async function web(path: string) { return readFile(resolve(webRoot, path), 'utf8'); }
async function repo(path: string) { return readFile(resolve(repoRoot, path), 'utf8'); }

const validPlan = {
  days: [{
    id: 'day-1',
    day: 'شنبه',
    title: 'روز اول',
    meals: [{
      id: 'breakfast-1',
      mealType: 'breakfast',
      label: 'صبحانه',
      items: [{
        foodId: 'boiled-egg',
        sourceVersion: 'web-stage1-fixtures-v1',
        portionCount: 2,
      }],
    }],
  }],
};

test('plan parser accepts only bounded identity/version/portion documents', () => {
  const parsed = parseNutritionPlanDocument(validPlan);
  assert.ok(parsed);
  const resolved = resolveNutritionPlanDocument(parsed!, foodFixtures);
  assert.ok(resolved);
  assert.equal(resolved![0]?.meals[0]?.items[0]?.foodId, 'boiled-egg');
  assert.equal(resolved![0]?.meals[0]?.items[0]?.nameFa, 'تخم‌مرغ آب‌پز');
  assert.equal(resolved![0]?.meals[0]?.items[0]?.portionCount, 2);
});

test('plan parser rejects stored nutrition claims instead of trusting them', () => {
  assert.equal(parseNutritionPlanDocument({
    ...validPlan,
    calories: 1800,
  }), null);
  assert.equal(parseNutritionPlanDocument({
    days: [{
      ...validPlan.days[0],
      meals: [{ ...validPlan.days[0]!.meals[0], macros: { proteinG: 50 } }],
    }],
  }), null);
  assert.equal(parseNutritionPlanDocument({
    days: [{
      ...validPlan.days[0],
      meals: [{
        ...validPlan.days[0]!.meals[0],
        items: [{ ...validPlan.days[0]!.meals[0]!.items[0], energyKcal: 999 }],
      }],
    }],
  }), null);
});

test('catalog resolution fails closed when source version no longer matches', () => {
  const parsed = parseNutritionPlanDocument({
    days: [{
      ...validPlan.days[0],
      meals: [{
        ...validPlan.days[0]!.meals[0],
        items: [{ ...validPlan.days[0]!.meals[0]!.items[0], sourceVersion: 'wrong-version' }],
      }],
    }],
  });
  assert.ok(parsed);
  assert.equal(resolveNutritionPlanDocument(parsed!, foodFixtures), null);
});

test('database nutrition plans are owner-scoped, versioned and immutable in content', async () => {
  const migration = await repo('supabase/migrations/20260809140618_nutrition_plan_versioning.sql');
  assert.match(migration, /create table public\.nutrition_plans/);
  assert.match(migration, /unique \(user_id, version\)/);
  assert.match(migration, /where status='active'/);
  assert.match(migration, /enable row level security/);
  assert.match(migration, /auth\.uid\(\).*user_id/);
  assert.match(migration, /security invoker/);
  assert.match(migration, /grant update \(status, activated_at, archived_at\)/);
  assert.doesNotMatch(migration, /grant update \([^)]*plan/i);
  assert.doesNotMatch(migration, /grant delete/i);
  assert.match(migration, /nutrition_plan_id uuid references public\.nutrition_plans/);
  assert.match(migration, /nutrition_plan_version integer/);
  assert.match(migration, /nutrition_plan_meal_id text/);
});

test('account plan page loads a snapshot and never imports weeklyPlan directly', async () => {
  const page = await web('app/(main)/nutrition/plan/page.tsx');
  const screen = await web('components/nutrition-plan-screen.tsx');
  const loader = await web('lib/supabase/nutrition-plan-data.ts');
  assert.match(page, /loadNutritionPlanSnapshot/);
  assert.doesNotMatch(page, /weeklyPlan|data\/fixtures/);
  assert.doesNotMatch(screen, /weeklyPlan|data\/fixtures/);
  assert.match(loader, /\.from\('nutrition_plans'\)/);
  assert.match(loader, /resolveNutritionPlanDocument\(parsed, foodFixtures\)/);
  assert.match(screen, /هنوز برنامهٔ غذایی فعالی ثبت نشده/);
  assert.match(screen, /Demo مهمان/);
});

test('plan UI does not render stored calorie or macro fields', async () => {
  const core = await web('lib/nutrition-plan-core.ts');
  const screen = await web('components/nutrition-plan-screen.tsx');
  assert.match(core, /FORBIDDEN_NUTRITION_CLAIM_KEYS/);
  assert.match(core, /energyKcal/);
  assert.match(core, /proteinG/);
  assert.doesNotMatch(screen, /\.calories|\.macros|\.energyKcal|\.proteinG|\.carbsG|\.fatG/);
  assert.match(screen, /Nutrition Core/);
});

test('generated Supabase types include nutrition plans and entry provenance', async () => {
  const types = await web('lib/supabase/database.types.ts');
  assert.match(types, /nutrition_plans:/);
  assert.match(types, /activate_nutrition_plan:/);
  assert.match(types, /create_nutrition_plan_version:/);
  assert.match(types, /nutrition_plan_id: string \| null/);
  assert.match(types, /nutrition_plan_version: number \| null/);
  assert.match(types, /nutrition_plan_meal_id: string \| null/);
});
