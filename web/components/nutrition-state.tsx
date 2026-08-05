'use client';

import type { MealType } from '@neofit/nutrition-core';
import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { dailyTargets, foodFixtures, initialDiary, type FoodFixture } from '@/data/fixtures';
import {
  buildInitialWebDiary,
  createWebDiaryEntry,
  summarizeWebDiary,
  type WebDiaryEntry,
  type WebDiarySummary,
} from '@/lib/nutrition-adapter';

const STORAGE_KEY = 'neofit:web-diary:v1';
const LOCAL_DATE = new Date().toISOString().slice(0, 10);

interface NutritionStateValue {
  readonly diary: readonly WebDiaryEntry[];
  readonly summary: WebDiarySummary;
  readonly localDate: string;
  addFood: (food: FoodFixture, portionCount: number, mealType: MealType) => void;
  resetDiary: () => void;
}

const NutritionStateContext = createContext<NutritionStateValue | null>(null);

function createInitialDiary(): WebDiaryEntry[] {
  return buildInitialWebDiary({
    foods: foodFixtures,
    seeds: initialDiary,
    localDate: LOCAL_DATE,
    timestamp: new Date().toISOString(),
  });
}

export function NutritionStateProvider({ children }: { children: ReactNode }) {
  const [diary, setDiary] = useState<WebDiaryEntry[]>(createInitialDiary);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
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
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(diary));
  }, [diary, hydrated]);

  const summary = useMemo(
    () => summarizeWebDiary(diary, LOCAL_DATE, dailyTargets),
    [diary],
  );

  const value = useMemo<NutritionStateValue>(() => ({
    diary,
    summary,
    localDate: LOCAL_DATE,
    addFood(food, portionCount, mealType) {
      const timestamp = new Date().toISOString();
      const entry = createWebDiaryEntry({
        id: `${food.id}-${Date.now()}`,
        label: food.nameFa,
        mealType,
        portionText: `${new Intl.NumberFormat('fa-IR', { maximumFractionDigits: 1 }).format(portionCount)} سهم · ${food.portionLabelFa}`,
        items: [{ foodId: food.id, portionCount }],
        foods: foodFixtures,
        localDate: LOCAL_DATE,
        timestamp,
      });
      setDiary((current) => [...current, entry]);
    },
    resetDiary() {
      setDiary(createInitialDiary());
    },
  }), [diary, summary]);

  return <NutritionStateContext.Provider value={value}>{children}</NutritionStateContext.Provider>;
}

export function useNutritionState(): NutritionStateValue {
  const value = useContext(NutritionStateContext);
  if (!value) throw new Error('useNutritionState must be used inside NutritionStateProvider');
  return value;
}
