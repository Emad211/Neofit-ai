'use client';

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { createClient } from '@/lib/supabase/client';
import { hasSupabasePublicEnv } from '@/lib/supabase/env';
import { clearGuestOnboardingDraft, readGuestOnboardingDraft, writeGuestOnboardingDraft } from '@/lib/onboarding/storage';
import {
  OnboardingConflictError,
  completeRemoteOnboarding,
  loadRemoteOnboarding,
  saveRemoteOnboarding,
} from '@/lib/onboarding/persistence';
import {
  ONBOARDING_TOTAL_STEPS,
  createEmptyOnboardingDraft,
  markStepCompleted,
  parseOnboardingDraft,
  resumeStepNumber,
  type OnboardingDraft,
} from '@/lib/onboarding/model';

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
const AUTOSAVE_DELAY_MS = 650;

export function OnboardingProvider({ children }: { children: ReactNode }) {
  const [draft, setDraft] = useState<OnboardingDraft>(() => createEmptyOnboardingDraft());
  const [mode, setMode] = useState<PersistenceMode>('loading');
  const [accountId, setAccountId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('در حال بررسی محل ذخیره‌سازی...');
  const [editRevision, setEditRevision] = useState(0);

  const databaseUpdatedAtRef = useRef<string | null>(null);
  const writeQueueRef = useRef<Promise<void>>(Promise.resolve());
  const autosaveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastScheduledEditRef = useRef(0);

  const setDatabaseRevision = useCallback((revision: string | null) => {
    databaseUpdatedAtRef.current = revision;
  }, []);

  const enqueueWrite = useCallback(<T,>(operation: () => Promise<T>): Promise<T> => {
    const queued = writeQueueRef.current.then(operation);
    writeQueueRef.current = queued.then(() => undefined, () => undefined);
    return queued;
  }, []);

  const cancelAutosave = useCallback(() => {
    if (autosaveTimerRef.current) {
      clearTimeout(autosaveTimerRef.current);
      autosaveTimerRef.current = null;
    }
  }, []);

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
        setDatabaseRevision(remote?.databaseUpdatedAt ?? null);
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
    return () => {
      cancelled = true;
      cancelAutosave();
    };
  }, [cancelAutosave, setDatabaseRevision]);

  useEffect(() => {
    if (editRevision === 0 || editRevision === lastScheduledEditRef.current) return;
    lastScheduledEditRef.current = editRevision;
    cancelAutosave();

    // Only persist a structurally valid draft. Temporary typing states such as
    // an out-of-range partial number stay in memory until they become valid.
    if (!parseOnboardingDraft(draft)) return;

    autosaveTimerRef.current = setTimeout(() => {
      autosaveTimerRef.current = null;
      if (mode === 'guest') {
        writeGuestOnboardingDraft(draft);
        setMessage('پیش‌نویس به‌صورت خودکار در همین مرورگر ذخیره شد.');
        return;
      }
      if (mode !== 'account' || !accountId) return;

      void enqueueWrite(async () => {
        const result = await saveRemoteOnboarding(
          createClient(),
          accountId,
          draft,
          resumeStepNumber(draft),
          databaseUpdatedAtRef.current,
        );
        setDatabaseRevision(result.databaseUpdatedAt);
      }).then(() => {
        setMessage('پیش‌نویس به‌صورت خودکار ذخیره شد.');
      }).catch((error) => {
        if (error instanceof OnboardingConflictError) {
          setMode('error');
          setMessage('این Onboarding در تب یا دستگاه دیگری تغییر کرده است. صفحه را تازه کن تا نسخه جدید جایگزین نشود.');
          return;
        }
        setMessage('ذخیره خودکار موقتاً انجام نشد؛ با «ادامه» دوباره تلاش می‌کنیم.');
      });
    }, AUTOSAVE_DELAY_MS);

    return cancelAutosave;
  }, [accountId, cancelAutosave, draft, editRevision, enqueueWrite, mode, setDatabaseRevision]);

  const updateSection = useCallback(<K extends keyof OnboardingDraft>(key: K, value: OnboardingDraft[K]) => {
    setDraft((current) => ({ ...current, [key]: value, updatedAt: new Date().toISOString() }));
    setEditRevision((current) => current + 1);
  }, []);

  const saveStep = useCallback(async (step: number) => {
    cancelAutosave();
    const nextDraft = markStepCompleted(draft, step);
    setSaving(true);
    try {
      if (mode === 'account' && accountId) {
        const result = await enqueueWrite(() => saveRemoteOnboarding(
          createClient(),
          accountId,
          nextDraft,
          Math.min(ONBOARDING_TOTAL_STEPS, step + 1),
          databaseUpdatedAtRef.current,
        ));
        setDatabaseRevision(result.databaseUpdatedAt);
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
        setMode('error');
        setMessage('این Onboarding در تب یا دستگاه دیگری تغییر کرده است. صفحه را تازه کن تا نسخه جدید جایگزین نشود.');
      }
      throw error;
    } finally {
      setSaving(false);
    }
  }, [accountId, cancelAutosave, draft, enqueueWrite, mode, setDatabaseRevision]);

  const complete = useCallback(async () => {
    cancelAutosave();
    const now = new Date().toISOString();
    const completedDraft = markStepCompleted({
      ...draft,
      confirmation: { ...draft.confirmation, completedAt: now },
    }, ONBOARDING_TOTAL_STEPS);
    setSaving(true);
    try {
      if (mode === 'account' && accountId) {
        const result = await enqueueWrite(() => completeRemoteOnboarding(
          createClient(),
          accountId,
          completedDraft,
          databaseUpdatedAtRef.current,
        ));
        setDatabaseRevision(result.databaseUpdatedAt);
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
        setMode('error');
        setMessage('قبل از تکمیل، داده در تب یا دستگاه دیگری تغییر کرده است. صفحه را تازه کن تا نسخه جدید از بین نرود.');
      }
      throw error;
    } finally {
      setSaving(false);
    }
  }, [accountId, cancelAutosave, draft, enqueueWrite, mode, setDatabaseRevision]);

  const value = useMemo(() => ({ draft, mode, accountId, saving, message, updateSection, saveStep, complete }), [accountId, complete, draft, message, mode, saveStep, saving, updateSection]);
  return <OnboardingContext.Provider value={value}>{children}</OnboardingContext.Provider>;
}

export function useOnboarding() {
  const context = useContext(OnboardingContext);
  if (!context) throw new Error('useOnboarding must be used inside OnboardingProvider.');
  return context;
}
