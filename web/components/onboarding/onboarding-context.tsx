'use client';

import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { createClient } from '@/lib/supabase/client';
import { hasSupabasePublicEnv } from '@/lib/supabase/env';
import { clearGuestOnboardingDraft, readGuestOnboardingDraft, writeGuestOnboardingDraft } from '@/lib/onboarding/storage';
import { completeRemoteOnboarding, loadRemoteOnboarding, saveRemoteOnboarding } from '@/lib/onboarding/persistence';
import { createEmptyOnboardingDraft, markStepCompleted, type OnboardingDraft } from '@/lib/onboarding/model';

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
        // Direct navigation into Onboarding must not trust a stale JWT alone.
        // getUser() validates the account against the Auth server before RLS-backed writes.
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
        setDraft(remote?.draft ?? createEmptyOnboardingDraft());
        setMode('account');
        if (remote?.migratedFromVersion === 1) {
          setMessage('داده‌های قابل‌تشخیص نسخه قبلی حفظ شدند؛ پاسخ‌های مبهم باید در Onboarding v2 دوباره صریحاً انتخاب شوند.');
        } else if (remote && !remote.draft) {
          setMessage('نسخه ذخیره‌شده قابل اعتماد نیست؛ برای جلوگیری از حدس‌زدن پاسخ‌های شخصی، Onboarding از نو بررسی می‌شود.');
        } else if (remote?.status === 'completed') {
          setMessage('Onboarding v2 این حساب تکمیل شده است؛ می‌توانی اطلاعات را مرور یا اصلاح کنی.');
        } else {
          setMessage('ذخیره امن حساب با RLS فعال است.');
        }
      } catch {
        if (cancelled) return;
        setMode('error');
        setMessage('اتصال حساب برای Onboarding در دسترس نیست. برای جلوگیری از دو نسخه داده، ذخیره حساب متوقف شده است.');
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
        const supabase = createClient();
        await saveRemoteOnboarding(supabase, accountId, nextDraft, Math.min(15, step + 1));
        setMessage('این مرحله در حساب شخصی ذخیره شد.');
      } else if (mode === 'guest') {
        writeGuestOnboardingDraft(nextDraft);
        setMessage('این مرحله در همین مرورگر ذخیره شد.');
      } else {
        throw new Error('Onboarding persistence is unavailable.');
      }
      setDraft(nextDraft);
      return nextDraft;
    } finally {
      setSaving(false);
    }
  }, [accountId, draft, mode]);

  const complete = useCallback(async () => {
    const now = new Date().toISOString();
    const completedDraft = markStepCompleted({
      ...draft,
      confirmation: { ...draft.confirmation, completedAt: now },
    }, 15);
    setSaving(true);
    try {
      if (mode === 'account' && accountId) {
        const result = await completeRemoteOnboarding(createClient(), accountId, completedDraft);
        clearGuestOnboardingDraft();
        setDraft(result.draft);
        setMessage(result.metadataSyncWarning ? 'Onboarding ذخیره شد؛ همگام‌سازی بخشی از تنظیمات پروفایل نیاز به تلاش بعدی دارد.' : 'Onboarding v2 با موفقیت تکمیل شد.');
        return result;
      }
      if (mode === 'guest') {
        writeGuestOnboardingDraft(completedDraft);
        setDraft(completedDraft);
        setMessage('Onboarding مهمان تکمیل شد؛ این مسیر Demo است و برنامه AI شخصی ایجاد نمی‌کند.');
        return { draft: completedDraft, metadataSyncWarning: false };
      }
      throw new Error('Onboarding persistence is unavailable.');
    } finally {
      setSaving(false);
    }
  }, [accountId, draft, mode]);

  const value = useMemo(() => ({ draft, mode, accountId, saving, message, updateSection, saveStep, complete }), [accountId, complete, draft, message, mode, saveStep, saving, updateSection]);
  return <OnboardingContext.Provider value={value}>{children}</OnboardingContext.Provider>;
}

export function useOnboarding() {
  const context = useContext(OnboardingContext);
  if (!context) throw new Error('useOnboarding must be used inside OnboardingProvider.');
  return context;
}
