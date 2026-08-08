import 'server-only';

import { cache } from 'react';
import {
  NUTRIENT_KEYS,
  type MealType,
  type NutritionEstimate,
  type NutritionGoals,
  type NutritionRange,
  type NutritionVector,
} from '@neofit/nutrition-core';
import {
  mealTypeLabelFa,
  webMacrosFromEstimate,
  type WebDiaryEntry,
} from '@/lib/nutrition-adapter';
import { formatLocalDate, normalizeTimeZone } from '@/lib/local-date';
import { bootstrapAccount, safeDisplayName } from './bootstrap';
import { createClient } from './server';
import type { Json, Tables } from './database.types';
import { hasSupabasePublicEnv } from './env';

export interface NeoFitAccount {
  readonly id: string;
  readonly email: string;
  readonly displayName: string;
  readonly timezone: string;
}

export interface AccountIdentitySnapshot {
  readonly configured: boolean;
  readonly account: NeoFitAccount | null;
  readonly loadError: string | null;
}

export interface NutritionSnapshot {
  readonly diary: readonly WebDiaryEntry[] | null;
  readonly goals: NutritionGoals | null;
  readonly localDate: string | null;
  readonly loadError: string | null;
}

export interface AccountSnapshot extends AccountIdentitySnapshot {
  readonly diary: readonly WebDiaryEntry[] | null;
  readonly goals: NutritionGoals | null;
}

type NutritionEntryRow = Tables<'nutrition_entries'>;

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
  if (!daily) return null;
  // A personalized Web target is configured only when all four displayed
  // macro targets are actually present. Partial/empty rows remain unconfigured.
  for (const key of ['energyKcal', 'proteinG', 'carbsG', 'fatG'] as const) {
    if (daily[key] === undefined || !Number.isFinite(daily[key])) return null;
  }
  return { daily };
}

export { bootstrapAccount } from './bootstrap';

/**
 * Shared shell identity only. React cache prevents duplicate identity work when
 * a route-level server component needs the same account during one render.
 */
export const loadAccountIdentity = cache(async (): Promise<AccountIdentitySnapshot> => {
  if (!hasSupabasePublicEnv()) {
    return { configured: false, account: null, loadError: null };
  }

  try {
    const supabase = await createClient();
    const { data: claimsData, error: claimsError } = await supabase.auth.getClaims();
    const userId = typeof claimsData?.claims?.sub === 'string' ? claimsData.claims.sub : null;
    if (claimsError || !userId) {
      return { configured: true, account: null, loadError: null };
    }

    const emailClaim = claimsData.claims?.email;
    const email = typeof emailClaim === 'string' ? emailClaim : '';
    const profileResult = await supabase
      .from('profiles')
      .select('display_name, timezone')
      .eq('id', userId)
      .maybeSingle();

    return {
      configured: true,
      account: {
        id: userId,
        email,
        displayName: safeDisplayName(profileResult.data?.display_name, email),
        timezone: normalizeTimeZone(profileResult.data?.timezone),
      },
      loadError: profileResult.error ? 'خواندن اطلاعات پایه حساب ناموفق بود.' : null,
    };
  } catch {
    return { configured: true, account: null, loadError: 'اتصال به حساب نئوفیت در دسترس نبود.' };
  }
});

/**
 * Nutrition is route-scoped and date-bounded. It is not part of the shared app
 * shell anymore, so Workout/Profile/Progress/Coach do not load the diary.
 */
export async function loadNutritionSnapshot(): Promise<NutritionSnapshot> {
  const identity = await loadAccountIdentity();
  if (!identity.account) {
    return { diary: null, goals: null, localDate: null, loadError: identity.loadError };
  }

  try {
    const supabase = await createClient();
    const localDate = formatLocalDate(new Date(), identity.account.timezone);
    const [goalsResult, entriesResult] = await Promise.all([
      supabase
        .from('nutrition_goals')
        .select('daily')
        .eq('user_id', identity.account.id)
        .maybeSingle(),
      supabase
        .from('nutrition_entries')
        .select('*')
        .eq('user_id', identity.account.id)
        .eq('local_date', localDate)
        .order('logged_at', { ascending: true }),
    ]);

    const diary = (entriesResult.data ?? [])
      .map(rowToDiaryEntry)
      .filter((entry): entry is WebDiaryEntry => entry !== null);
    const queryError = goalsResult.error ?? entriesResult.error;
    return {
      diary,
      goals: parseGoals(goalsResult.data?.daily),
      localDate,
      loadError: queryError ? 'خواندن بخشی از اطلاعات تغذیه حساب ناموفق بود.' : null,
    };
  } catch {
    return { diary: null, goals: null, localDate: null, loadError: 'خواندن تغذیه حساب در دسترس نبود.' };
  }
}

/** Backward-compatible composition used by tests/legacy callers. */
export async function loadAccountSnapshot(): Promise<AccountSnapshot> {
  const identity = await loadAccountIdentity();
  if (!identity.account) {
    return { ...identity, diary: null, goals: null };
  }
  const nutrition = await loadNutritionSnapshot();
  return {
    ...identity,
    diary: nutrition.diary,
    goals: nutrition.goals,
    loadError: identity.loadError ?? nutrition.loadError,
  };
}
