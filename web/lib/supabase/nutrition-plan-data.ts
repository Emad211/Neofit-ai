import 'server-only';

import { foodFixtures } from '@/data/fixtures';
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
  readonly localWeekday: string | null;
  readonly loadError: string | null;
}

function guestSnapshot(): NutritionPlanSnapshot {
  return {
    mode: 'guest',
    userId: null,
    planId: null,
    version: null,
    schemaVersion: NUTRITION_PLAN_SCHEMA_VERSION,
    title: null,
    source: null,
    days: [],
    localWeekday: null,
    loadError: null,
  };
}

function emptyAccountSnapshot(
  userId: string | null,
  localWeekday: string | null,
  loadError: string | null = null,
): NutritionPlanSnapshot {
  return {
    mode: 'account',
    userId,
    planId: null,
    version: null,
    schemaVersion: NUTRITION_PLAN_SCHEMA_VERSION,
    title: null,
    source: null,
    days: [],
    localWeekday,
    loadError,
  };
}

function rowSnapshot(
  userId: string,
  row: NutritionPlanRow,
  localWeekday: string,
): NutritionPlanSnapshot {
  if (row.schema_version !== NUTRITION_PLAN_SCHEMA_VERSION) {
    return emptyAccountSnapshot(userId, localWeekday, 'این برنامه غذایی با نسخه فعلی NeoFit سازگار نیست.');
  }
  const parsed = parseNutritionPlanDocument(row.plan);
  if (!parsed) return emptyAccountSnapshot(userId, localWeekday, 'برنامه غذایی فعلاً قابل نمایش نیست.');
  const resolved = resolveNutritionPlanDocument(parsed, foodFixtures);
  if (!resolved) {
    return emptyAccountSnapshot(userId, localWeekday, 'یکی از غذاهای برنامه دیگر در فهرست فعلی در دسترس نیست.');
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
    localWeekday,
    loadError: null,
  };
}

export async function loadNutritionPlanSnapshot(): Promise<NutritionPlanSnapshot> {
  const identity = await loadAccountIdentity();
  if (identity.loadError) {
    return { ...emptyAccountSnapshot(null, null, identity.loadError), mode: 'unavailable' };
  }
  if (!identity.account) return guestSnapshot();

  const localWeekday = new Intl.DateTimeFormat('fa-IR', {
    weekday: 'long',
    timeZone: identity.account.timezone,
  }).format(new Date());

  try {
    const supabase = await createClient();
    const result = await supabase
      .from('nutrition_plans')
      .select('*')
      .eq('user_id', identity.account.id)
      .eq('status', 'active')
      .maybeSingle();
    if (result.error) return emptyAccountSnapshot(identity.account.id, localWeekday, 'برنامه غذایی بارگذاری نشد.');
    if (!result.data) return emptyAccountSnapshot(identity.account.id, localWeekday);
    return rowSnapshot(identity.account.id, result.data, localWeekday);
  } catch {
    return emptyAccountSnapshot(identity.account.id, localWeekday, 'برنامه غذایی در دسترس نیست.');
  }
}
