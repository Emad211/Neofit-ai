import 'server-only';

import {
  NUTRIENT_KEYS,
  NUTRITION_CORE_SCHEMA_VERSION,
  type MealType,
  type NutritionEstimate,
  type NutritionGoals,
  type NutritionRange,
  type NutritionVector,
} from '@neofit/nutrition-core';
import type { SupabaseClient } from '@supabase/supabase-js';
import { dailyTargets } from '@/data/fixtures';
import {
  mealTypeLabelFa,
  webMacrosFromEstimate,
  type WebDiaryEntry,
} from '@/lib/nutrition-adapter';
import { createClient } from './server';
import type { Database, Json, Tables } from './database.types';
import { hasSupabasePublicEnv } from './env';

export interface NeoFitAccount {
  readonly id: string;
  readonly email: string;
  readonly displayName: string;
}

export interface AccountSnapshot {
  readonly configured: boolean;
  readonly account: NeoFitAccount | null;
  readonly diary: readonly WebDiaryEntry[] | null;
  readonly goals: NutritionGoals | null;
  readonly loadError: string | null;
}

type NutritionEntryRow = Tables<'nutrition_entries'>;

function asJson(value: unknown): Json {
  return JSON.parse(JSON.stringify(value)) as Json;
}

function isJsonObject(value: Json | undefined): value is { [key: string]: Json | undefined } {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function parseNutritionVector(value: Json | undefined): NutritionVector | null {
  if (!isJsonObject(value)) return null;
  const vector: Partial<Record<(typeof NUTRIENT_KEYS)[number], number>> = {};

  for (const key of NUTRIENT_KEYS) {
    const nutrient = value[key];
    if (nutrient === undefined) continue;
    if (typeof nutrient !== 'number' || !Number.isFinite(nutrient)) return null;
    vector[key] = nutrient;
  }

  return vector;
}

function parseNutritionRange(value: Json | undefined): NutritionRange | undefined | null {
  if (value === undefined) return undefined;
  if (!isJsonObject(value)) return null;

  const p10 = parseNutritionVector(value.p10);
  const p50 = parseNutritionVector(value.p50);
  const p90 = parseNutritionVector(value.p90);
  if (!p10 || !p50 || !p90) return null;
  return { p10, p50, p90 };
}

function parseNutritionEstimate(value: Json): NutritionEstimate | null {
  if (!isJsonObject(value)) return null;
  const gramsValue = value.grams;
  const grams = gramsValue === null
    ? null
    : typeof gramsValue === 'number' && Number.isFinite(gramsValue) && gramsValue >= 0
      ? gramsValue
      : undefined;
  if (grams === undefined) return null;

  const center = parseNutritionVector(value.center);
  if (!center) return null;
  const range = parseNutritionRange(value.range);
  if (range === null) return null;

  return range ? { grams, center, range } : { grams, center };
}

function parseMealType(value: string): MealType | null {
  return value === 'breakfast' || value === 'lunch' || value === 'dinner' || value === 'snack'
    ? value
    : null;
}

function parseSourceType(value: string): 'food' | 'recipe' | 'custom' | null {
  return value === 'food' || value === 'recipe' || value === 'custom' ? value : null;
}

function rowToDiaryEntry(row: NutritionEntryRow): WebDiaryEntry | null {
  const mealType = parseMealType(row.meal_type);
  const sourceType = parseSourceType(row.source_type);
  const estimate = parseNutritionEstimate(row.estimate);
  if (!mealType || !sourceType || !estimate) return null;

  try {
    return {
      core: {
        id: row.id,
        localDate: row.local_date,
        mealType,
        label: row.label,
        sourceType,
        sourceId: row.source_id,
        estimate,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
      },
      mealLabelFa: mealTypeLabelFa(mealType),
      portionText: estimate.grams === null
        ? 'سهم ثبت‌شده'
        : `${new Intl.NumberFormat('fa-IR', { maximumFractionDigits: 1 }).format(estimate.grams)} گرم`,
      macros: webMacrosFromEstimate(estimate),
    };
  } catch {
    return null;
  }
}

function parseGoals(value: Json | null | undefined): NutritionGoals | null {
  const daily = parseNutritionVector(value ?? undefined);
  return daily ? { daily } : null;
}

function safeDisplayName(value: string | null | undefined, email: string): string {
  const candidate = value?.trim() || email.split('@')[0] || 'کاربر نئوفیت';
  return candidate.slice(0, 80);
}

export async function bootstrapAccount(
  supabase: SupabaseClient<Database>,
  input: { readonly userId: string; readonly email: string; readonly displayName?: string | null },
): Promise<void> {
  const displayName = safeDisplayName(input.displayName, input.email);
  const [profile, settings, goals] = await Promise.all([
    supabase.from('profiles').upsert({
      id: input.userId,
      display_name: displayName,
      locale: 'fa',
      timezone: 'Asia/Tehran',
    }),
    supabase.from('user_settings').upsert({
      user_id: input.userId,
      theme: 'system',
      units: 'metric',
    }),
    supabase.from('nutrition_goals').upsert({
      user_id: input.userId,
      daily: asJson(dailyTargets.daily),
      core_schema_version: NUTRITION_CORE_SCHEMA_VERSION,
    }),
  ]);

  const error = profile.error ?? settings.error ?? goals.error;
  if (error) throw error;
}

export async function loadAccountSnapshot(): Promise<AccountSnapshot> {
  if (!hasSupabasePublicEnv()) {
    return { configured: false, account: null, diary: null, goals: null, loadError: null };
  }

  try {
    const supabase = await createClient();
    const { data: claimsData, error: claimsError } = await supabase.auth.getClaims();
    const claims = claimsData?.claims;
    const userId = typeof claims?.sub === 'string' ? claims.sub : null;
    if (claimsError || !userId) {
      return { configured: true, account: null, diary: null, goals: null, loadError: null };
    }

    const emailClaim = claimsData?.claims?.email;
    const email = typeof emailClaim === 'string' ? emailClaim : '';
    const [profileResult, goalsResult, entriesResult] = await Promise.all([
      supabase.from('profiles').select('display_name').eq('id', userId).maybeSingle(),
      supabase.from('nutrition_goals').select('daily').eq('user_id', userId).maybeSingle(),
      supabase
        .from('nutrition_entries')
        .select('*')
        .eq('user_id', userId)
        .order('logged_at', { ascending: true }),
    ]);

    const queryError = profileResult.error ?? goalsResult.error ?? entriesResult.error;
    const diary = (entriesResult.data ?? [])
      .map(rowToDiaryEntry)
      .filter((entry): entry is WebDiaryEntry => entry !== null);

    return {
      configured: true,
      account: {
        id: userId,
        email,
        displayName: safeDisplayName(profileResult.data?.display_name, email),
      },
      diary,
      goals: parseGoals(goalsResult.data?.daily) ?? dailyTargets,
      loadError: queryError ? 'خواندن بخشی از اطلاعات حساب ناموفق بود.' : null,
    };
  } catch {
    return {
      configured: true,
      account: null,
      diary: null,
      goals: null,
      loadError: 'اتصال به حساب نئوفیت در دسترس نبود.',
    };
  }
}
