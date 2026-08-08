import { notFound } from 'next/navigation';
import { OnboardingScreen } from '@/components/onboarding/onboarding-screen';
import { getOnboardingStep, onboardingSteps, type OnboardingStepSlug } from '@/lib/onboarding/model';

export function generateStaticParams() {
  return onboardingSteps.map((step) => ({ step: step.slug }));
}

export default async function OnboardingStepPage({ params }: { params: Promise<{ step: string }> }) {
  const { step } = await params;
  if (!getOnboardingStep(step)) notFound();
  return <OnboardingScreen stepSlug={step as OnboardingStepSlug} />;
}
