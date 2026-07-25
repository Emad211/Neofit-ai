'use client';

import { useUserData } from '@/context/user-profile-context';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { OnboardingGoalForm } from '@/components/onboarding/onboarding-goal-form';
import { Skeleton } from '@/components/ui/skeleton';
import { useI18n } from '@/i18n/provider';

export default function OnboardingWelcomePage() {
  const { user, userProfile, isLoading } = useUserData();
  const router = useRouter();
  const { t } = useI18n();

  useEffect(() => {
    if (!isLoading) {
      if (!user) router.replace('/auth');
      else if (userProfile) router.replace('/today');
    }
  }, [user, userProfile, isLoading, router]);

  if (isLoading || (user && userProfile) || !user) {
    return (
      <div className="flex min-h-screen w-full flex-col items-center justify-center" aria-busy="true">
        <Skeleton className="h-12 w-12 animate-pulse rounded-full" />
      </div>
    );
  }

  return (
    <main className="flex min-h-screen w-full flex-col items-center justify-center bg-background p-4 sm:p-6 md:p-8">
      <div className="w-full max-w-2xl text-center">
        <h1 className="font-headline text-4xl font-bold tracking-tight sm:text-5xl md:text-6xl">
          {t('onboarding.welcome', { name: user.displayName || (t('profile.title')) })}
        </h1>
        <p className="mt-4 text-lg text-muted-foreground sm:text-xl">
          {t('onboarding.subtitle')}
        </p>
      </div>
      <div className="mt-12 w-full max-w-xl">
        <OnboardingGoalForm />
      </div>
    </main>
  );
}
