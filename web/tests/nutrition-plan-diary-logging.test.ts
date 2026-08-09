import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseNutritionPlanDocument } from '@/lib/nutrition-plan-core';

const webRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const repoRoot = resolve(webRoot, '..');

async function web(path: string) { return readFile(resolve(webRoot, path), 'utf8'); }
async function repo(path: string) { return readFile(resolve(repoRoot, path), 'utf8'); }

test('meal ids are globally unique across a plan so diary provenance is unambiguous', () => {
  const duplicated = parseNutritionPlanDocument({
    days: [
      {
        id: 'd1', day: 'شنبه', title: 'روز ۱',
        meals: [{
          id: 'same-meal', mealType: 'breakfast', label: 'صبحانه',
          items: [{ foodId: 'boiled-egg', sourceVersion: 'web-stage1-fixtures-v1', portionCount: 1 }],
        }],
      },
      {
        id: 'd2', day: 'یکشنبه', title: 'روز ۲',
        meals: [{
          id: 'same-meal', mealType: 'lunch', label: 'ناهار',
          items: [{ foodId: 'brown-rice', sourceVersion: 'web-stage1-fixtures-v1', portionCount: 1 }],
        }],
      },
    ],
  });
  assert.equal(duplicated, null);
});

test('server action trusts only plan identity/version/meal/date and live-validates Auth', async () => {
  const action = await web('app/(main)/nutrition/plan/actions.ts');
  assert.match(action, /activeAuthSession\(supabase\)/);
  assert.match(action, /plan_id/);
  assert.match(action, /plan_version/);
  assert.match(action, /meal_id/);
  assert.match(action, /local_date/);
  assert.doesNotMatch(action, /estimate|energyKcal|proteinG|carbsG|fatG|foodFixtures/);
});

test('persistence reloads active plan under RLS and builds each estimate through Nutrition Core adapter', async () => {
  const persistence = await web('lib/supabase/nutrition-plan-persistence.ts');
  assert.match(persistence, /\.from\('nutrition_plans'\)/);
  assert.match(persistence, /\.eq\('user_id', input\.userId\)/);
  assert.match(persistence, /\.eq\('version', input\.planVersion\)/);
  assert.match(persistence, /\.eq\('status', 'active'\)/);
  assert.match(persistence, /parseNutritionPlanDocument\(row\.plan\)/);
  assert.match(persistence, /resolveNutritionPlanDocument\(parsed, foodFixtures\)/);
  assert.match(persistence, /createWebDiaryEntry\(/);
  assert.match(persistence, /NUTRITION_CORE_SCHEMA_VERSION/);
  assert.doesNotMatch(persistence, /formData|request\.json|input\.estimate/);
});

test('one meal is written as one bulk idempotent upsert without duplicate pre-read', async () => {
  const persistence = await web('lib/supabase/nutrition-plan-persistence.ts');
  assert.match(persistence, /createHash\('sha256'\)/);
  assert.match(persistence, /`plan:\$\{digest\}`/);
  assert.equal((persistence.match(/\.from\('nutrition_entries'\)/g) ?? []).length, 1);
  assert.match(persistence, /\.upsert\(rows, \{/);
  assert.match(persistence, /onConflict: 'user_id,client_mutation_id'/);
  assert.match(persistence, /ignoreDuplicates: true/);
  assert.doesNotMatch(persistence, /\.select\([^)]*nutrition_entries|\.maybeSingle\(\)[\s\S]*nutrition_entries/);
});

test('every planned diary item stores exact plan provenance', async () => {
  const persistence = await web('lib/supabase/nutrition-plan-persistence.ts');
  assert.match(persistence, /nutrition_plan_id: row\.id/);
  assert.match(persistence, /nutrition_plan_version: row\.version/);
  assert.match(persistence, /nutrition_plan_meal_id: meal\.id/);
});

test('database provenance FK binds plan id, owner and version together', async () => {
  const migration = await repo('supabase/migrations/20260809142000_harden_nutrition_entry_plan_provenance.sql');
  assert.match(migration, /unique \(id, user_id, version\)/);
  assert.match(migration, /foreign key \(nutrition_plan_id, user_id, nutrition_plan_version\)/);
  assert.match(migration, /references public\.nutrition_plans \(id, user_id, version\)/);
  assert.match(migration, /nutrition_entries_plan_provenance_shape/);
  assert.match(migration, /nutrition_plan_meal_id is not null/);
});

test('browser computes local date and disables repeat submits while pending', async () => {
  const form = await web('components/nutrition-plan-log-form.tsx');
  assert.match(form, /localDateKey\(new Date\(\)\)/);
  assert.match(form, /useFormStatus\(\)/);
  assert.match(form, /disabled=\{pending\}/);
  assert.match(form, /ثبت برای امروز/);
});

test('Guest plan UI has no meal logging control while Account plan does', async () => {
  const screen = await web('components/nutrition-plan-screen.tsx');
  const accountSection = screen.slice(screen.indexOf('function AccountPlan'), screen.indexOf('export function NutritionPlanScreen'));
  assert.match(accountSection, /NutritionPlanLogForm/);
  const guestMarker = screen.indexOf("snapshot.mode === 'guest'");
  assert.ok(guestMarker >= 0);
  const guestSlice = screen.slice(guestMarker, screen.indexOf("snapshot.mode === 'account'", guestMarker));
  assert.doesNotMatch(guestSlice, /NutritionPlanLogForm/);
});
