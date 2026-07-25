'use client';

import * as React from 'react';
import type { UserProfile } from '@/context/user-profile-context';

const STORAGE_KEY = 'neofit-onboarding-draft';

export type OnboardingDraft = Partial<Omit<UserProfile, 'name'>>;

type OnboardingContextValue = {
  draft: OnboardingDraft;
  isReady: boolean;
  updateDraft: (patch: OnboardingDraft) => void;
  replaceDraft: (draft: OnboardingDraft) => void;
  clearDraft: () => void;
};

const OnboardingContext = React.createContext<OnboardingContextValue | null>(null);

function readStoredDraft(): OnboardingDraft {
  try {
    const value = window.sessionStorage.getItem(STORAGE_KEY);
    if (!value) return {};
    const parsed = JSON.parse(value);
    return parsed && typeof parsed === 'object' ? parsed : {};
  } catch {
    return {};
  }
}

export function OnboardingProvider({ children }: { children: React.ReactNode }) {
  const [draft, setDraft] = React.useState<OnboardingDraft>({});
  const [isReady, setIsReady] = React.useState(false);

  React.useEffect(() => {
    setDraft(readStoredDraft());
    setIsReady(true);
  }, []);

  const persist = React.useCallback((nextDraft: OnboardingDraft) => {
    setDraft(nextDraft);
    window.sessionStorage.setItem(STORAGE_KEY, JSON.stringify(nextDraft));
  }, []);

  const updateDraft = React.useCallback((patch: OnboardingDraft) => {
    setDraft((current) => {
      const next = { ...current, ...patch };
      window.sessionStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      return next;
    });
  }, []);

  const replaceDraft = React.useCallback((nextDraft: OnboardingDraft) => {
    persist(nextDraft);
  }, [persist]);

  const clearDraft = React.useCallback(() => {
    setDraft({});
    window.sessionStorage.removeItem(STORAGE_KEY);
  }, []);

  const value = React.useMemo(() => ({
    draft,
    isReady,
    updateDraft,
    replaceDraft,
    clearDraft,
  }), [draft, isReady, updateDraft, replaceDraft, clearDraft]);

  return <OnboardingContext.Provider value={value}>{children}</OnboardingContext.Provider>;
}

export function useOnboarding() {
  const context = React.useContext(OnboardingContext);
  if (!context) throw new Error('useOnboarding must be used within OnboardingProvider.');
  return context;
}
