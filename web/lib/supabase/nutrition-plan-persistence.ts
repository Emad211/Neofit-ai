import 'server-only';

import { createHash } from 'node:crypto';
import type { SupabaseClient } from '@supabase/supabase-js';
import { NUTRITION_CORE_SCHEMA_VERSION } from '@neofit/nutrition-core';
import { foodFixtures } from '@/data/fixtures';
import { createWebDiaryEntry } from '@/lib/nutrition-adapter';
import { parseNutritionPlanDocument, resolveNutritionPlanDocument } from '@/lib/nutrition-plan-core';
import type { Database, Json } from './database.types';

export class NutritionPlanLogError extends Error {
  readonly code: 'invalid_date' | 'plan_missing' | 'plan_invalid' | 'meal_missing' | 'write_failed';

  constructor(code: NutritionPlanLogError['code']) {
    super(code);
    this.name = 'NutritionPlanLogError';
    this.code = code;
  }
}

function validLocalDate(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const [year, month, day] = value.split('-').map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  return date.getUTCFullYear() === year && date.getUTCMonth() === month - 1 && date.getUTCDate() === day;
}

function databaseJson(value: unknown): Json {
  const serialized = JSON.stringify(value);
  if (serialized === undefined) throw new NutritionPlanLogError('plan_invalid');
  return JSON.parse(serialized) as Json;
}

function mutationId(input: {
  readonly userId: string;
  readonly planId: string;
  readonly planVersion: number;
  readonly mealId: string;
  readonly localDate: string;
  readonly itemIndex: number;
  readonly foodId: string;
  readonly sourceVersion: string;
  readonly portionCount: number;
}): string {
  const digest = createHash('sha256')
    .update([
      input.userId,
      input.planId,
      String(input.planVersion),
      input.mealId,
      input.localDate,
      String(input.itemIndex),
      input.foodId,
      input.sourceVersion,
      String(input.portionCount),
    ].join('|'))
    .digest('hex');
  return `plan:${digest}`;
}

export async function persistActiveNutritionPlanMeal(input: {
  readonly supabase: SupabaseClient<Database>;
  readonly userId: string;
  readonly planId: string;
  readonly planVersion: number;
  readonly mealId: string;
  readonly localDate: string;
}): Promise<{ readonly itemCount: number }> {
  if (!validLocalDate(input.localDate)) throw new NutritionPlanLogError('invalid_date');
  if (!input.planId || !Number.isInteger(input.planVersion) || input.planVersion < 1 || !input.mealId) {
    throw new NutritionPlanLogError('plan_missing');
  }

  const { data: row, error: planError } = await input.supabase
    .from('nutrition_plans')
    .select('id,version,schema_version,status,plan')
    .eq('id', input.planId)
    .eq('user_id', input.userId)
    .eq('version', input.planVersion)
    .eq('status', 'active')
    .maybeSingle();
  if (planError || !row) throw new NutritionPlanLogError('plan_missing');

  const parsed = parseNutritionPlanDocument(row.plan);
  if (!parsed) throw new NutritionPlanLogError('plan_invalid');
  const resolved = resolveNutritionPlanDocument(parsed, foodFixtures);
  if (!resolved) throw new NutritionPlanLogError('plan_invalid');

  const meal = resolved.flatMap((day) => day.meals).find((candidate) => candidate.id === input.mealId);
  if (!meal) throw new NutritionPlanLogError('meal_missing');

  const loggedAt = new Date().toISOString();
  const rows = meal.items.map((item, itemIndex) => {
    const food = foodFixtures.find(
      (candidate) => candidate.id === item.foodId && candidate.sourceVersion === item.sourceVersion,
    );
    if (!food) throw new NutritionPlanLogError('plan_invalid');

    const clientMutationId = mutationId({
      userId: input.userId,
      planId: row.id,
      planVersion: row.version,
      mealId: meal.id,
      localDate: input.localDate,
      itemIndex,
      foodId: item.foodId,
      sourceVersion: item.sourceVersion,
      portionCount: item.portionCount,
    });

    const diaryEntry = createWebDiaryEntry({
      id: clientMutationId,
      label: food.nameFa,
      mealType: meal.mealType,
      portionText: `${item.portionCount} × ${food.portionLabelFa}`,
      items: [{ foodId: food.id, portionCount: item.portionCount }],
      foods: foodFixtures,
      localDate: input.localDate,
      timestamp: loggedAt,
    });

    return {
      user_id: input.userId,
      client_mutation_id: clientMutationId,
      source_id: diaryEntry.core.sourceId,
      source_type: diaryEntry.core.sourceType,
      label: diaryEntry.core.label,
      meal_type: diaryEntry.core.mealType,
      local_date: diaryEntry.core.localDate,
      logged_at: loggedAt,
      core_schema_version: NUTRITION_CORE_SCHEMA_VERSION,
      estimate: databaseJson(diaryEntry.core.estimate),
      nutrition_plan_id: row.id,
      nutrition_plan_version: row.version,
      nutrition_plan_meal_id: meal.id,
    };
  });

  const { error } = await input.supabase
    .from('nutrition_entries')
    .upsert(rows, {
      onConflict: 'user_id,client_mutation_id',
      ignoreDuplicates: true,
    });
  if (error) throw new NutritionPlanLogError('write_failed');

  return { itemCount: rows.length };
}
