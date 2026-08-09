import { migrateLegacyOnboardingDraft, parseOnboardingDraft, type OnboardingDraft } from './model';

export const ONBOARDING_GUEST_STORAGE_KEY = 'neofit:onboarding:v2';
const LEGACY_ONBOARDING_GUEST_STORAGE_KEY = 'neofit:onboarding:v1';

export function readGuestOnboardingDraft(): OnboardingDraft | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = window.localStorage.getItem(ONBOARDING_GUEST_STORAGE_KEY);
    if (raw) return parseOnboardingDraft(JSON.parse(raw));

    const legacyRaw = window.localStorage.getItem(LEGACY_ONBOARDING_GUEST_STORAGE_KEY);
    if (!legacyRaw) return null;
    const migrated = migrateLegacyOnboardingDraft(JSON.parse(legacyRaw));
    if (!migrated) return null;
    window.localStorage.setItem(ONBOARDING_GUEST_STORAGE_KEY, JSON.stringify(migrated));
    window.localStorage.removeItem(LEGACY_ONBOARDING_GUEST_STORAGE_KEY);
    return migrated;
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
  window.localStorage.removeItem(LEGACY_ONBOARDING_GUEST_STORAGE_KEY);
}
