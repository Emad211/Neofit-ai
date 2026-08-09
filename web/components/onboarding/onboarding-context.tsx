'use client';

import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { createClient } from '@/lib/supabase/client';
import { hasSupabasePublicEnv } from '@/lib/supabase/env';
import { clearGuestOnboardingDraft, readGuestOnboardingDraft, writeGuestOnboardingDraft } from '@/lib/onboarding/storage';
import {
  OnboardingConflictError,
  completeRemoteOnboarding,
  loadRemoteOnboarding,
  saveRemoteOnboarding,
} from '@/lib/onboarding/persistence';
import { ONBOARDING_TOTAL_STEPS, createEmptyOnboardingDraft, markStepCompleted, type OnboardingDraft } from '@/lib/onboarding/model';

type PersistenceMode = 'loading' | 'account' | 'guest' | 'error';

interface OnboardingContextValue {
  readonly draft: OnboardingDraft;
  readonly mode: PersistenceMode;
  readonly accountId: string | null;
  readonly saving: boolean;
  readonly message: string;
  updateSection<K extends keyof OnboardingDraft>(key: K, value: OnboardingDraft[K]): void;
  saveStep(step: number): Promise<OnboardingDraft>;
  complete(): Promise<{ draft: OnboardingDraft; metadataSyncWarning: boolean }>;
}

const OnboardingContext = createContext<OnboardingContextValue | null>(null);

export function OnboardingProvider({ children }: { children: ReactNode }) {
  const [draft, setDraft] = useState<OnboardingDraft>(() => createEmptyOnboardingDraft());
  const [mode, setMode] = useState<PersistenceMode>('loading');
  const [accountId, setAccountId] = useState<string | null>(null);
  const [databaseUpdatedAt, setDatabaseUpdatedAt] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('در حال بررسی محل ذخیره‌سازی...');

  useEffect(() => {
    let cancelled = false;
    async function initialize() {
      const configured = hasSupabasePublicEnv({
        NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
        NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
      });
      if (!configured) {
        if (cancelled) return;
        setDraft(readGuestOnboardingDraft() ?? createEmptyOnboardingDraft());
        setMode('guest');
        setMessage('حالت مهمان: پیشرفت فقط در همین مرورگر ذخیره می‌شود.');
        return;
      }

      try {
        const supabase = createClient();
        const { data: userData, error: userError } = await supabase.auth.getUser();
        const userId = userData.user?.id ?? null;
        if (userError || !userId) {
          if (cancelled) return;
          setDraft(readGuestOnboardingDraft() ?? createEmptyOnboardingDraft());
          setMode('guest');
          setMessage('حالت مهمان: برای ساخت دوره AI شخصی وارد حساب شو.');
          return;
        }

        const remote = await loadRemoteOnboarding(supabase, userId);
        if (cancelled) return;
        setAccountId(userId);
        setDatabaseUpdatedAt(remote?.databaseUpdatedAt ?? null);
        setDraft(remote?.draft ?? createEmptyOnboardingDraft());
        setMode('account');
        if (remote?.migratedFromVersion === 1) {
          setMessage('داده‌های قابل‌تشخیص نسخه قبلی حفظ شدند؛ پاسخ‌های مبهم باید دوباره انتخاب شوند.');
        } else if (remote && !remote.draft) {
          setMessage('نسخه ذخیره‌شده قابل اعتماد نیست؛ پاسخ‌های شخصی دوباره بررسی می‌شوند.');
        } else if (remote?.status === 'completed') {
          setMessage('Onboarding این حساب تکمیل شده است؛ اطلاعات قابل مرور و اصلاح‌اند.');
        } else {
          setMessage('پیشرفت در حساب شخصی ذخیره می‌شود.');
        }
      } catch {
        if (cancelled) return;
        setMode('error');
        setMessage('اتصال حساب در دسترس نیست؛ برای جلوگیری از دو نسخه داده، ذخیره متوقف شده است.');
      }
    }
    void initialize();
    return () => { cancelled = true; };
  }, []);

  const updateSection = useCallback(<K extends keyof OnboardingDraft>(key: K, value: OnboardingDraft[K]) => {
    setDraft((current) => ({ ...current, [key]: value, updatedAt: new Date().toISOString() }));
  }, []);

  const saveStep = useCallback(async (step: number) => {
    const nextDraft = markStepCompleted(draft, step);
    setSaving(true);
    try {
      if (mode === 'account' && accountId) {
        const result = await saveRemoteOnboarding(
          createClient(),
          accountId,
          nextDraft,
          Math.min(ONBOARDING_TOTAL_STEPS, step + 1),
          databaseUpdatedAt,
        );
        setDatabaseUpdatedAt(result.databaseUpdatedAt);
        setMessage('ذخیره شد.');
      } else if (mode === 'guest') {
        writeGuestOnboardingDraft(nextDraft);
        setMessage('در همین مرورگر ذخیره شد.');
      } else {
        throw new Error('Onboarding persistence is unavailable.');
      }
      setDraft(nextDraft);
      return nextDraft;
    } catch (error) {
      if (error instanceof OnboardingConflictError) {
        setMessage('این Onboarding در تب یا دستگاه دیگری تغییر کرده است. صفحه را تازه کن تا نسخه جدید جایگزین نشود.');
      }
      throw error;
    } finally {
      setSaving(false);
    }
  }, [accountId, databaseUpdatedAt, draft, mode]);

  const complete = useCallback(async () => {
    const now = new Date().toISOString();
    const completedDraft = markStepCompleted({
      ...draft,
      confirmation: { ...draft.confirmation, completedAt: now },
    }, ONBOARDING_TOTAL_STEPS);
    setSaving(true);
    try {
      if (mode === 'account' && accountId) {
        const result = await completeRemoteOnboarding(createClient(), accountId, completedDraft, databaseUpdatedAt);
        setDatabaseUpdatedAt(result.databaseUpdatedAt);
        clearGuestOnboardingDraft();
        setDraft(result.draft);
        setMessage(result.metadataSyncWarning ? 'Onboarding ذخیره شد؛ همگام‌سازی بخشی از پروفایل بعداً تکرار می‌شود.' : 'Onboarding با موفقیت تکمیل شد.');
        return { draft: result.draft, metadataSyncWarning: result.metadataSyncWarning };
      }
      if (mode === 'guest') {
        writeGuestOnboardingDraft(completedDraft);
        setDraft(completedDraft);
        setMessage('Onboarding مهمان تکمیل شد؛ این مسیر Demo است و برنامه AI شخصی ایجاد نمی‌کند.');
        return { draft: completedDraft, metadataSyncWarning: false };
      }
      throw new Error('Onboarding persistence is unavailable.');
    } catch (error) {
      if (error instanceof OnboardingConflictError) {
        setMessage('قبل از تکمیل، داده در تب یا دستگاه دیگری تغییر کرده است. صفحه را تازه کن تا نسخه جدید از بین نرود.');
      }
      throw error;
    } finally {
      setSaving(false);
    }
  }, [accountId, databaseUpdatedAt, draft, mode]);

  const value = useMemo(() => ({ draft, mode, accountId, saving, message, updateSection, saveStep, complete }), [accountId, complete, draft, message, mode, saveStep, saving, updateSection]);
  return <OnboardingContext.Provider value={value}>{children}</OnboardingContext.Provider>;
}

export function useOnboarding() {
  const context = useContext(OnboardingContext);
  if (!context) throw new Error('useOnboarding must be used inside OnboardingProvider.');
  return context;
}
