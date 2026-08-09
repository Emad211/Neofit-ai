import 'server-only';

import { foodFixtures, weeklyPlan } from '@/data/fixtures';
import {
  NUTRITION_PLAN_SCHEMA_VERSION,
  parseNutritionPlanDocument,
  resolveNutritionPlanDocument,
  type ResolvedNutritionPlanDay,
} from '@/lib/nutrition-plan-core';
import { loadAccountIdentity } from './account';
import type { Tables } from './database.types';
import { createClient } from './server';

type NutritionPlanRow = Tables<'nutrition_plans'>;

export interface NutritionPlanSnapshot {
  readonly mode: 'account' | 'guest' | 'unavailable';
  readonly userId: string | null;
  readonly planId: string | null;
  readonly version: number | null;
  readonly schemaVersion: number;
  readonly title: string | null;
  readonly source: string | null;
  readonly days: readonly ResolvedNutritionPlanDay[];
  readonly guestDays: readonly { readonly day: string; readonly title: string; readonly meals: readonly string[] }[];
  readonly loadError: string | null;
}

function guestSnapshot(): NutritionPlanSnapshot {
  return {
    mode: 'guest',
    userId: null,
    planId: null,
    version: null,
    schemaVersion: NUTRITION_PLAN_SCHEMA_VERSION,
    title: 'برنامه نمونه مهمان',
    source: 'demo',
    days: [],
    guestDays: weeklyPlan,
    loadError: null,
  };
}

function emptyAccountSnapshot(userId: string | null, loadError: string | null = null): NutritionPlanSnapshot {
  return {
    mode: 'account',
    userId,
    planId: null,
    version: null,
    schemaVersion: NUTRITION_PLAN_SCHEMA_VERSION,
    title: null,
    source: null,
    days: [],
    guestDays: [],
    loadError,
  };
}

function rowSnapshot(userId: string, row: NutritionPlanRow): NutritionPlanSnapshot {
  if (row.schema_version !== NUTRITION_PLAN_SCHEMA_VERSION) {
    return emptyAccountSnapshot(userId, 'نسخهٔ برنامه غذایی با این نسخه از NeoFit سازگار نیست.');
  }
  const parsed = parseNutritionPlanDocument(row.plan);
  if (!parsed) return emptyAccountSnapshot(userId, 'ساختار برنامه غذایی حساب معتبر نیست.');
  const resolved = resolveNutritionPlanDocument(parsed, foodFixtures);
  if (!resolved) {
    return emptyAccountSnapshot(userId, 'یک یا چند غذای برنامه دیگر با نسخهٔ کاتالوگ فعلی قابل تطبیق نیست.');
  }
  return {
    mode: 'account',
    userId,
    planId: row.id,
    version: row.version,
    schemaVersion: row.schema_version,
    title: row.title,
    source: row.source,
    days: resolved,
    guestDays: [],
    loadError: null,
  };
}

export async function loadNutritionPlanSnapshot(): Promise<NutritionPlanSnapshot> {
  const identity = await loadAccountIdentity();
  if (identity.loadError) {
    return { ...emptyAccountSnapshot(null, identity.loadError), mode: 'unavailable' };
  }
  if (!identity.account) return guestSnapshot();

  try {
    const supabase = await createClient();
    const result = await supabase
      .from('nutrition_plans')
      .select('*')
      .eq('user_id', identity.account.id)
      .eq('status', 'active')
      .maybeSingle();
    if (result.error) return emptyAccountSnapshot(identity.account.id, 'خواندن برنامه غذایی حساب ناموفق بود.');
    if (!result.data) return emptyAccountSnapshot(identity.account.id);
    return rowSnapshot(identity.account.id, result.data);
  } catch {
    return emptyAccountSnapshot(identity.account.id, 'برنامه غذایی حساب در دسترس نبود.');
  }
}
