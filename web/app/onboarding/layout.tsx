import type { ReactNode } from 'react';
import { OnboardingProvider } from '@/components/onboarding/onboarding-context';
import './onboarding-v2.css';

export default function OnboardingLayout({ children }: { children: ReactNode }) {
  return <OnboardingProvider>{children}</OnboardingProvider>;
}
