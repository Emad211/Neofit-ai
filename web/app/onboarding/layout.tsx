import type { ReactNode } from 'react';
import { OnboardingProvider } from '@/components/onboarding/onboarding-context';
import './onboarding-v2.css';
import './onboarding-mobile-polish.css';
import './onboarding-flow-polish.css';

export default function OnboardingLayout({ children }: { children: ReactNode }) {
  return <OnboardingProvider>{children}</OnboardingProvider>;
}
