'use client';

import {
  NUTRIENT_KEYS,
  NUTRITION_CORE_SCHEMA_VERSION,
  type MealType,
  type NutritionEstimate,
  type NutritionGoals,
  type NutritionRange,
  type NutritionVector,
} from '@neofit/nutrition-core';
import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { dailyTargets, foodFixtures, initialDiary, type FoodFixture } from '@/data/fixtures';
import { useOptionalAccountState, type ClientAccount } from '@/components/account-state';
import { formatLocalDate } from '@/lib/local-date';
import {
  buildInitialWebDiary,
  createWebDiaryEntry,
  mealTypeLabelFa,
  summarizeWebDiary,
  webMacrosFromEstimate,
  type WebDiaryEntry,
  type WebDiarySummary,
} from '@/lib/nutrition-adapter';
import { createClient } from '@/lib/supabase/client';
import type { Json, Tables } from '@/lib/supabase/database.types';
import { parseStoredWebDiary, serializeStoredWebDiary } from '@/lib/web-diary-storage';

const STORAGE_KEY = 'neofit:web-diary:v1';

export type { ClientAccount } from '@/components/account-state';
export type NutritionSyncStatus = 'local' | 'synced' | 'saving' | 'error';

interface NutritionStateValue {
  readonly diary: readonly WebDiaryEntry[];
  readonly summary: WebDiarySummary;
  readonly localDate: string;
  readonly account: ClientAccount | null;
  readonly supabaseConfigured: boolean;
  readonly syncStatus: NutritionSyncStatus;
  readonly syncMessage: string;
  addFood: (food: FoodFixture, portionCount: number, mealType: MealType) => Promise<void>;
  resetDiary: () => Promise<void>;
}

interface NutritionStateProviderProps {
  readonly children: ReactNode;
  readonly account?: ClientAccount | null;
  readonly configured?: boolean;
  readonly initialDiary?: readonly WebDiaryEntry[] | null;
  readonly initialGoals?: NutritionGoals | null;
  readonly loadError?: string | null;
}

type NutritionEntryRow = Tables<'nutrition_entries'>;

const NutritionStateContext = createContext<NutritionStateValue | null>(null);

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
  return value === 'breakfast' || value === 'lunch' || value === 'dinner' || value === 'snack' ? value : null;
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

function createInitialDiary(localDate: string): WebDiaryEntry[] {
  return buildInitialWebDiary({
    foods: foodFixtures,
    seeds: initialDiary,
    localDate,
    timestamp: new Date().toISOString(),
  });
}

function createClientMutationId(foodId: string): string {
  const random = globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(36).slice(2, 12)}`;
  return `${foodId}:${random}`;
}

export function NutritionStateProvider({
  children,
  account: accountOverride,
  configured: configuredOverride,
  initialDiary = null,
  initialGoals = null,
  loadError = null,
}: NutritionStateProviderProps) {
  const sharedAccount = useOptionalAccountState();
  const account = accountOverride === undefined ? sharedAccount?.account ?? null : accountOverride;
  const configured = configuredOverride === undefined ? sharedAccount?.configured ?? false : configuredOverride;
  const accountMode = account !== null;
  const [localDate, setLocalDate] = useState(() => formatLocalDate(new Date(), account?.timezone));
  const [diary, setDiary] = useState<WebDiaryEntry[]>(() =>
    initialDiary ? [...initialDiary] : accountMode ? [] : createInitialDiary(localDate),
  );
  const [hydrated, setHydrated] = useState(accountMode);
  const [syncStatus, setSyncStatus] = useState<NutritionSyncStatus>(loadError ? 'error' : accountMode ? 'synced' : 'local');
  const [syncMessage, setSyncMessage] = useState(
    loadError ?? (accountMode ? 'اطلاعات حساب همگام است.' : 'داده‌ها فقط در همین مرورگر ذخیره می‌شوند.'),
  );
  const goals = accountMode ? initialGoals : (initialGoals ?? dailyTargets);

  useEffect(() => {
    const updateLocalDate = () => setLocalDate(formatLocalDate(new Date(), account?.timezone));
    updateLocalDate();
    const interval = window.setInterval(updateLocalDate, 60_000);
    window.addEventListener('focus', updateLocalDate);
    document.addEventListener('visibilitychange', updateLocalDate);
    return () => {
      window.clearInterval(interval);
      window.removeEventListener('focus', updateLocalDate);
      document.removeEventListener('visibilitychange', updateLocalDate);
    };
  }, [account?.timezone]);

  useEffect(() => {
    if (account) {
      setDiary(initialDiary ? [...initialDiary] : []);
      setHydrated(true);
      setSyncStatus(loadError ? 'error' : 'synced');
      setSyncMessage(loadError ?? 'اطلاعات حساب همگام است.');
      return;
    }

    try {
      const stored = window.localStorage.getItem(STORAGE_KEY);
      if (stored === null) {
        setDiary(createInitialDiary(localDate));
      } else {
        const parsed = parseStoredWebDiary(stored);
        if (parsed === null) {
          setDiary(createInitialDiary(localDate));
          setSyncStatus('error');
          setSyncMessage('دادهٔ محلی نامعتبر بود و با نمونهٔ امن جایگزین شد.');
        } else {
          setDiary(parsed);
          setSyncStatus('local');
          setSyncMessage('داده‌ها از همین مرورگر بازیابی شدند.');
        }
      }
    } catch {
      setDiary(createInitialDiary(localDate));
      setSyncStatus('error');
      setSyncMessage('خواندن دادهٔ محلی ممکن نشد؛ نمونهٔ امن نمایش داده شد.');
    } finally {
      setHydrated(true);
    }
  // The account identity is the boundary between Remote and local state.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [account?.id]);

  useEffect(() => {
    if (!hydrated || accountMode) return;
    try {
      window.localStorage.setItem(STORAGE_KEY, serializeStoredWebDiary(diary));
    } catch {
      setSyncStatus('error');
      setSyncMessage('ذخیرهٔ پایدار روی این مرورگر ممکن نشد.');
    }
  }, [accountMode, diary, hydrated]);

  const currentDiary = useMemo(
    () => diary.filter((entry) => entry.core.localDate === localDate),
    [diary, localDate],
  );
  const summary = useMemo(
    () => summarizeWebDiary(currentDiary, localDate, goals),
    [currentDiary, goals, localDate],
  );

  const value = useMemo<NutritionStateValue>(() => ({
    diary: currentDiary,
    summary,
    localDate,
    account,
    supabaseConfigured: configured,
    syncStatus,
    syncMessage,
    async addFood(food, portionCount, mealType) {
      const timestamp = new Date().toISOString();
      const clientMutationId = createClientMutationId(food.id);
      const entry = createWebDiaryEntry({
        id: clientMutationId,
        label: food.nameFa,
        mealType,
        portionText: `${new Intl.NumberFormat('fa-IR', { maximumFractionDigits: 1 }).format(portionCount)} سهم · ${food.portionLabelFa}`,
        items: [{ foodId: food.id, portionCount }],
        foods: foodFixtures,
        localDate,
        timestamp,
      });

      setDiary((current) => [...current, entry]);
      if (!account) {
        setSyncStatus('local');
        setSyncMessage('غذا روی همین مرورگر ثبت شد.');
        return;
      }

      setSyncStatus('saving');
      setSyncMessage('در حال ذخیره در حساب...');
      const supabase = createClient();
      const { data, error } = await supabase
        .from('nutrition_entries')
        .insert({
          user_id: account.id,
          client_mutation_id: clientMutationId,
          local_date: entry.core.localDate,
          meal_type: entry.core.mealType,
          label: entry.core.label,
          source_type: entry.core.sourceType,
          source_id: entry.core.sourceId,
          estimate: asJson(entry.core.estimate),
          core_schema_version: NUTRITION_CORE_SCHEMA_VERSION,
          logged_at: entry.core.createdAt,
        })
        .select('*')
        .single();

      if (error || !data) {
        setDiary((current) => current.filter((item) => item.core.id !== clientMutationId));
        setSyncStatus('error');
        setSyncMessage('ذخیرهٔ غذا در حساب انجام نشد؛ ثبت موقت برگردانده شد.');
        throw error ?? new Error('Nutrition entry insert returned no row.');
      }

      const persisted = rowToDiaryEntry(data);
      if (!persisted) {
        setDiary((current) => current.filter((item) => item.core.id !== clientMutationId));
        setSyncStatus('error');
        setSyncMessage('ذخیره انجام شد اما پاسخ معتبر Nutrition Core قابل بازسازی نبود؛ صفحه را تازه کن.');
        throw new Error('Persisted Nutrition entry could not be reconstructed.');
      }
      setDiary((current) => current.map((item) => item.core.id === clientMutationId ? persisted : item));
      setSyncStatus('synced');
      setSyncMessage('غذا در حساب نئوفیت ذخیره شد.');
    },
    async resetDiary() {
      if (!account) {
        const previousDates = diary.filter((entry) => entry.core.localDate !== localDate);
        setDiary([...previousDates, ...createInitialDiary(localDate)]);
        setSyncStatus('local');
        setSyncMessage('دادهٔ آزمایشی امروز مرورگر بازنشانی شد؛ روزهای دیگر دست‌نخورده ماندند.');
        return;
      }

      setSyncStatus('saving');
      setSyncMessage('در حال حذف ثبت‌های امروز از حساب...');
      const supabase = createClient();
      const { error } = await supabase
        .from('nutrition_entries')
        .delete()
        .eq('user_id', account.id)
        .eq('local_date', localDate);
      if (error) {
        setSyncStatus('error');
        setSyncMessage('حذف ثبت‌های امروز حساب انجام نشد.');
        throw error;
      }
      setDiary((current) => current.filter((entry) => entry.core.localDate !== localDate));
      setSyncStatus('synced');
      setSyncMessage('ثبت‌های امروز حساب حذف شدند؛ تاریخچهٔ روزهای دیگر حفظ شد.');
    },
  }), [account, configured, currentDiary, diary, localDate, summary, syncMessage, syncStatus]);

  return <NutritionStateContext.Provider value={value}>{children}</NutritionStateContext.Provider>;
}

export function useNutritionState(): NutritionStateValue {
  const value = useContext(NutritionStateContext);
  if (!value) throw new Error('useNutritionState must be used inside NutritionStateProvider');
  return value;
}
