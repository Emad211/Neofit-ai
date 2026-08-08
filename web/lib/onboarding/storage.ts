import { parseOnboardingDraft, type OnboardingDraft } from './model';

export const ONBOARDING_GUEST_STORAGE_KEY = 'neofit:onboarding:v1';

export function readGuestOnboardingDraft(): OnboardingDraft | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = window.localStorage.getItem(ONBOARDING_GUEST_STORAGE_KEY);
    if (!raw) return null;
    return parseOnboardingDraft(JSON.parse(raw));
  } catch {
    return null;
  }
}

export function writeGuestOnboardingDraft(draft: OnboardingDraft) {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(ONBOARDING_GUEST_STORAGE_KEY, JSON.stringify(draft));
}

export function clearGuestOnboardingDraft() {
  if (typeof window === 'undefined') return;
  window.localStorage.removeItem(ONBOARDING_GUEST_STORAGE_KEY);
}
