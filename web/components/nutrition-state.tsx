'use client';

import {
  NUTRITION_CORE_SCHEMA_VERSION,
  type MealType,
  type NutritionGoals,
} from '@neofit/nutrition-core';
import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { dailyTargets, foodFixtures, initialDiary, type FoodFixture } from '@/data/fixtures';
import {
  buildInitialWebDiary,
  createWebDiaryEntry,
  summarizeWebDiary,
  type WebDiaryEntry,
  type WebDiarySummary,
} from '@/lib/nutrition-adapter';
import { createClient } from '@/lib/supabase/client';
import type { Json } from '@/lib/supabase/database.types';

const STORAGE_KEY = 'neofit:web-diary:v1';
const LOCAL_DATE = new Date().toISOString().slice(0, 10);

export interface ClientAccount {
  readonly id: string;
  readonly email: string;
  readonly displayName: string;
}

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

const NutritionStateContext = createContext<NutritionStateValue | null>(null);

function asJson(value: unknown): Json {
  return JSON.parse(JSON.stringify(value)) as Json;
}

function createInitialDiary(): WebDiaryEntry[] {
  return buildInitialWebDiary({
    foods: foodFixtures,
    seeds: initialDiary,
    localDate: LOCAL_DATE,
    timestamp: new Date().toISOString(),
  });
}

export function NutritionStateProvider({
  children,
  account = null,
  configured = false,
  initialDiary = null,
  initialGoals = null,
  loadError = null,
}: NutritionStateProviderProps) {
  const accountMode = account !== null;
  const [diary, setDiary] = useState<WebDiaryEntry[]>(() =>
    initialDiary ? [...initialDiary] : accountMode ? [] : createInitialDiary(),
  );
  const [hydrated, setHydrated] = useState(accountMode);
  const [syncStatus, setSyncStatus] = useState<NutritionSyncStatus>(
    loadError ? 'error' : accountMode ? 'synced' : 'local',
  );
  const [syncMessage, setSyncMessage] = useState(
    loadError ?? (accountMode ? 'اطلاعات حساب همگام است.' : 'داده‌ها فقط در همین مرورگر ذخیره می‌شوند.'),
  );
  const goals = initialGoals ?? dailyTargets;

  useEffect(() => {
    if (accountMode) {
      setHydrated(true);
      return;
    }

    try {
      const stored = window.localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored) as WebDiaryEntry[];
        if (Array.isArray(parsed) && parsed.length > 0) setDiary(parsed);
      }
    } catch {
      setDiary(createInitialDiary());
    } finally {
      setHydrated(true);
    }
  }, [accountMode]);

  useEffect(() => {
    if (!hydrated || accountMode) return;
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(diary));
  }, [accountMode, diary, hydrated]);

  const summary = useMemo(
    () => summarizeWebDiary(diary, LOCAL_DATE, goals),
    [diary, goals],
  );

  const value = useMemo<NutritionStateValue>(() => ({
    diary,
    summary,
    localDate: LOCAL_DATE,
    account,
    supabaseConfigured: configured,
    syncStatus,
    syncMessage,
    async addFood(food, portionCount, mealType) {
      const timestamp = new Date().toISOString();
      const clientMutationId = `${food.id}-${Date.now()}`;
      const entry = createWebDiaryEntry({
        id: clientMutationId,
        label: food.nameFa,
        mealType,
        portionText: `${new Intl.NumberFormat('fa-IR', { maximumFractionDigits: 1 }).format(portionCount)} سهم · ${food.portionLabelFa}`,
        items: [{ foodId: food.id, portionCount }],
        foods: foodFixtures,
        localDate: LOCAL_DATE,
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

      setDiary((current) => current.map((item) =>
        item.core.id === clientMutationId
          ? {
              ...item,
              core: {
                ...item.core,
                id: data.id,
                createdAt: data.created_at,
                updatedAt: data.updated_at,
              },
            }
          : item,
      ));
      setSyncStatus('synced');
      setSyncMessage('غذا در حساب نئوفیت ذخیره شد.');
    },
    async resetDiary() {
      if (!account) {
        setDiary(createInitialDiary());
        setSyncStatus('local');
        setSyncMessage('دادهٔ آزمایشی مرورگر بازنشانی شد.');
        return;
      }

      setSyncStatus('saving');
      setSyncMessage('در حال حذف ثبت‌های تغذیه حساب...');
      const supabase = createClient();
      const { error } = await supabase
        .from('nutrition_entries')
        .delete()
        .eq('user_id', account.id);
      if (error) {
        setSyncStatus('error');
        setSyncMessage('حذف ثبت‌های حساب انجام نشد.');
        throw error;
      }
      setDiary([]);
      setSyncStatus('synced');
      setSyncMessage('ثبت‌های تغذیه حساب حذف شدند.');
    },
  }), [account, configured, diary, summary, syncMessage, syncStatus]);

  return <NutritionStateContext.Provider value={value}>{children}</NutritionStateContext.Provider>;
}

export function useNutritionState(): NutritionStateValue {
  const value = useContext(NutritionStateContext);
  if (!value) throw new Error('useNutritionState must be used inside NutritionStateProvider');
  return value;
}
