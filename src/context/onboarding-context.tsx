"use client";

import * as React from "react";
import {
  createEmptyOnboardingDraft,
  type OnboardingDraft,
} from "@/lib/onboarding-model";

const STORAGE_KEY = "neofit:onboarding-draft:v1";

type SectionName = "goal" | "basics" | "body" | "medical";

type OnboardingContextValue = {
  draft: OnboardingDraft;
  isHydrated: boolean;
  updateSection: <T extends SectionName>(section: T, value: OnboardingDraft[T]) => void;
  completeStep: (step: number) => void;
  resetDraft: () => void;
};

const OnboardingContext = React.createContext<OnboardingContextValue | null>(null);

function readStoredDraft(): OnboardingDraft {
  if (typeof window === "undefined") return createEmptyOnboardingDraft();

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return createEmptyOnboardingDraft();
    const parsed = JSON.parse(raw) as Partial<OnboardingDraft>;
    const empty = createEmptyOnboardingDraft();

    return {
      ...empty,
      ...parsed,
      goal: { ...empty.goal, ...parsed.goal },
      basics: { ...empty.basics, ...parsed.basics },
      body: { ...empty.body, ...parsed.body },
      medical: { ...empty.medical, ...parsed.medical },
      completedSteps: Array.isArray(parsed.completedSteps) ? parsed.completedSteps : [],
    };
  } catch {
    return createEmptyOnboardingDraft();
  }
}

export function OnboardingProvider({ children }: { children: React.ReactNode }) {
  const [draft, setDraft] = React.useState<OnboardingDraft>(() => createEmptyOnboardingDraft());
  const [isHydrated, setIsHydrated] = React.useState(false);

  React.useEffect(() => {
    setDraft(readStoredDraft());
    setIsHydrated(true);
  }, []);

  React.useEffect(() => {
    if (!isHydrated) return;
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(draft));
  }, [draft, isHydrated]);

  const updateSection = React.useCallback(
    <T extends SectionName>(section: T, value: OnboardingDraft[T]) => {
      setDraft((current) => ({
        ...current,
        [section]: value,
        updatedAt: new Date().toISOString(),
      }));
    },
    [],
  );

  const completeStep = React.useCallback((step: number) => {
    setDraft((current) => ({
      ...current,
      completedSteps: current.completedSteps.includes(step)
        ? current.completedSteps
        : [...current.completedSteps, step].sort((a, b) => a - b),
      updatedAt: new Date().toISOString(),
    }));
  }, []);

  const resetDraft = React.useCallback(() => {
    const empty = createEmptyOnboardingDraft();
    setDraft(empty);
    if (typeof window !== "undefined") window.localStorage.removeItem(STORAGE_KEY);
  }, []);

  const value = React.useMemo(
    () => ({ draft, isHydrated, updateSection, completeStep, resetDraft }),
    [draft, isHydrated, updateSection, completeStep, resetDraft],
  );

  return <OnboardingContext.Provider value={value}>{children}</OnboardingContext.Provider>;
}

export function useOnboarding() {
  const value = React.useContext(OnboardingContext);
  if (!value) throw new Error("useOnboarding must be used inside OnboardingProvider");
  return value;
}
