import type { ReactNode } from 'react';
import { OnboardingProvider } from '@/components/onboarding/onboarding-context';

export default function OnboardingStepLayout({ children }: { children: ReactNode }) {
  return <OnboardingProvider>{children}</OnboardingProvider>;
}
