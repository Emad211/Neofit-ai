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
        const { data: claimsData, error: claimsError } = await supabase.auth.getClaims();
        const userId = typeof claimsData?.claims?.sub === 'string' ? claimsData.claims.sub : null;
        if (claimsError || !userId) {
          if (cancelled) return;
          setDraft(readGuestOnboardingDraft() ?? createEmptyOnboardingDraft());
          setMode('guest');
          setMessage('حالت مهمان: با ورود، Onboarding در حساب شخصی ذخیره می‌شود.');
          return;
        }

        const remote = await loadRemoteOnboarding(supabase, userId);
        if (cancelled) return;
        setAccountId(userId);
        setDraft(remote?.draft ?? createEmptyOnboardingDraft());
        setMode('account');
        setMessage(remote?.status === 'completed' ? 'Onboarding این حساب قبلاً تکمیل شده است؛ می‌توانی اطلاعات را مرور یا اصلاح کنی.' : 'ذخیره امن حساب با RLS فعال است.');
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
        setMessage(result.metadataSyncWarning ? 'Onboarding ذخیره شد؛ همگام‌سازی بخشی از تنظیمات پروفایل نیاز به تلاش بعدی دارد.' : 'Onboarding با موفقیت در حساب تکمیل شد.');
        return result;
      }
      if (mode === 'guest') {
        writeGuestOnboardingDraft(completedDraft);
        setDraft(completedDraft);
        setMessage('Onboarding مهمان تکمیل شد و در همین مرورگر باقی می‌ماند.');
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
