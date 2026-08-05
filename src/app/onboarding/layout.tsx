import { Suspense } from "react";
import { OnboardingProvider } from "@/context/onboarding-context";
import { OnboardingLoading } from "@/components/onboarding/onboarding-shell";

export default function OnboardingLayout({ children }: { children: React.ReactNode }) {
  return (
    <Suspense fallback={<OnboardingLoading />}>
      <OnboardingProvider>{children}</OnboardingProvider>
    </Suspense>
  );
}
