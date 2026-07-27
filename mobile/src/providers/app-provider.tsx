import * as React from 'react';
import { getLocales } from 'expo-localization';
import { z } from 'zod';
import { clearExpiredAiCache } from '@/db/ai-repository';
import { getDatabase, resetLocalDatabase } from '@/db/database';
import { clearExpiredExerciseVideoCache } from '@/db/exercise-video-repository';
import { getDailySummary } from '@/db/log-repository';
import { getActiveNutritionPlan, getActiveWorkoutPlan } from '@/db/plan-repository';
import { getProfile, saveProfile as persistProfile } from '@/db/profile-repository';
import { getSetting, setSetting } from '@/db/settings-repository';
import {
  NutritionPlan,
  Profile,
  WorkoutPlan,
  Locale,
  LocaleSchema,
} from '@/domain/models';
import { translations, TranslationKey } from '@/i18n/translations';
import {
  deletePersonalSecrets,
  getAvalAiApiKey,
  getYouTubeApiKey,
} from '@/services/secure-settings';

const LOCALE_SETTING = 'app.locale';
const LOCALE_SELECTED_SETTING = 'app.locale.selected';
const BooleanSchema = z.boolean();

type DailySummary = Awaited<ReturnType<typeof getDailySummary>>;

type AppContextValue = {
  isReady: boolean;
  error: string | null;
  locale: Locale;
  hasChosenLocale: boolean;
  direction: 'rtl' | 'ltr';
  profile: Profile | null;
  workoutPlan: WorkoutPlan | null;
  nutritionPlan: NutritionPlan | null;
  dailySummary: DailySummary | null;
  hasAvalAiKey: boolean;
  hasYouTubeKey: boolean;
  t: (key: TranslationKey, values?: Record<string, string | number>) => string;
  setLocale: (locale: Locale) => Promise<void>;
  saveProfile: (profile: Profile) => Promise<void>;
  refreshAll: () => Promise<void>;
  refreshPlans: () => Promise<void>;
  refreshDailySummary: () => Promise<void>;
  refreshApiKeyState: () => Promise<void>;
  deleteAllLocalData: () => Promise<void>;
};

const AppContext = React.createContext<AppContextValue | null>(null);

function deviceLocale(): Locale {
  const languageCode = getLocales()[0]?.languageCode;
  return languageCode === 'fa' ? 'fa' : 'en';
}

function localDayRange(date = new Date()) {
  const start = new Date(date);
  start.setHours(0, 0, 0, 0);
  const end = new Date(start);
  end.setDate(end.getDate() + 1);
  return { startIso: start.toISOString(), endIso: end.toISOString() };
}

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [isReady, setIsReady] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [locale, setLocaleState] = React.useState<Locale>('en');
  const [hasChosenLocale, setHasChosenLocale] = React.useState(false);
  const [profile, setProfile] = React.useState<Profile | null>(null);
  const [workoutPlan, setWorkoutPlan] = React.useState<WorkoutPlan | null>(null);
  const [nutritionPlan, setNutritionPlan] = React.useState<NutritionPlan | null>(null);
  const [dailySummary, setDailySummary] = React.useState<DailySummary | null>(null);
  const [hasAvalAiKey, setHasAvalAiKey] = React.useState(false);
  const [hasYouTubeKey, setHasYouTubeKey] = React.useState(false);

  const refreshPlans = React.useCallback(async () => {
    const [workout, nutrition] = await Promise.all([
      getActiveWorkoutPlan(),
      getActiveNutritionPlan(),
    ]);
    setWorkoutPlan(workout);
    setNutritionPlan(nutrition);
  }, []);

  const refreshDailySummary = React.useCallback(async () => {
    const range = localDayRange();
    setDailySummary(await getDailySummary(range.startIso, range.endIso));
  }, []);

  const refreshApiKeyState = React.useCallback(async () => {
    const [avalAiKey, youTubeKey] = await Promise.all([
      getAvalAiApiKey(),
      getYouTubeApiKey(),
    ]);
    setHasAvalAiKey(Boolean(avalAiKey));
    setHasYouTubeKey(Boolean(youTubeKey));
  }, []);

  const refreshAll = React.useCallback(async () => {
    const [storedProfile] = await Promise.all([
      getProfile(),
      refreshPlans(),
      refreshDailySummary(),
      refreshApiKeyState(),
    ]);
    setProfile(storedProfile);
    if (storedProfile) {
      setLocaleState(storedProfile.locale);
      setHasChosenLocale(true);
    }
  }, [refreshApiKeyState, refreshDailySummary, refreshPlans]);

  React.useEffect(() => {
    let active = true;
    const initialize = async () => {
      try {
        await getDatabase();
        await Promise.all([
          clearExpiredAiCache(),
          clearExpiredExerciseVideoCache(),
        ]);
        const [storedLocale, localeSelected] = await Promise.all([
          getSetting(LOCALE_SETTING, LocaleSchema, deviceLocale()),
          getSetting(LOCALE_SELECTED_SETTING, BooleanSchema, false),
        ]);
        if (!active) return;
        setLocaleState(storedLocale);
        setHasChosenLocale(localeSelected);
        await refreshAll();
      } catch (caught) {
        console.error('Application initialization failed:', caught);
        if (active) {
          setError(caught instanceof Error ? caught.message : 'Application initialization failed.');
        }
      } finally {
        if (active) setIsReady(true);
      }
    };
    void initialize();
    return () => {
      active = false;
    };
  }, [refreshAll]);

  const setLocale = React.useCallback(async (nextLocale: Locale) => {
    const validated = LocaleSchema.parse(nextLocale);
    await Promise.all([
      setSetting(LOCALE_SETTING, validated),
      setSetting(LOCALE_SELECTED_SETTING, true),
    ]);
    setLocaleState(validated);
    setHasChosenLocale(true);
    if (profile) {
      const updated = { ...profile, locale: validated };
      await persistProfile(updated);
      setProfile(updated);
    }
  }, [profile]);

  const saveProfile = React.useCallback(async (nextProfile: Profile) => {
    const stored = await persistProfile(nextProfile);
    await Promise.all([
      setSetting(LOCALE_SETTING, stored.locale),
      setSetting(LOCALE_SELECTED_SETTING, true),
    ]);
    setProfile(stored);
    setLocaleState(stored.locale);
    setHasChosenLocale(true);
    await refreshDailySummary();
  }, [refreshDailySummary]);

  const deleteAllLocalData = React.useCallback(async () => {
    await deletePersonalSecrets();
    await resetLocalDatabase();
    setProfile(null);
    setWorkoutPlan(null);
    setNutritionPlan(null);
    setDailySummary(null);
    setHasAvalAiKey(false);
    setHasYouTubeKey(false);
    setHasChosenLocale(false);
    setLocaleState(deviceLocale());
  }, []);

  const t = React.useCallback((key: TranslationKey, values?: Record<string, string | number>) => {
    let message: string = translations[locale][key] || translations.en[key] || key;
    if (values) {
      for (const [name, value] of Object.entries(values)) {
        message = message.replaceAll(`{${name}}`, String(value));
      }
    }
    return message;
  }, [locale]);

  const value = React.useMemo<AppContextValue>(() => ({
    isReady,
    error,
    locale,
    hasChosenLocale,
    direction: locale === 'fa' ? 'rtl' : 'ltr',
    profile,
    workoutPlan,
    nutritionPlan,
    dailySummary,
    hasAvalAiKey,
    hasYouTubeKey,
    t,
    setLocale,
    saveProfile,
    refreshAll,
    refreshPlans,
    refreshDailySummary,
    refreshApiKeyState,
    deleteAllLocalData,
  }), [
    dailySummary,
    deleteAllLocalData,
    error,
    hasAvalAiKey,
    hasChosenLocale,
    hasYouTubeKey,
    isReady,
    locale,
    nutritionPlan,
    profile,
    refreshAll,
    refreshApiKeyState,
    refreshDailySummary,
    refreshPlans,
    saveProfile,
    setLocale,
    t,
    workoutPlan,
  ]);

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp() {
  const context = React.use(AppContext);
  if (!context) throw new Error('useApp must be used within AppProvider.');
  return context;
}
