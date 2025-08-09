// src/app/page.tsx
"use client";

import { useUserData } from '@/context/user-profile-context';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { OnboardingGoalForm } from '@/components/onboarding/onboarding-goal-form';
import { Skeleton } from '@/components/ui/skeleton';

export default function OnboardingWelcomePage() {
  const { user, userProfile, isLoading } = useUserData();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading) {
      if (!user) {
        // Not logged in, send to auth page
        router.push('/auth');
      } else if (userProfile) {
        // Logged in and has a profile, send to dashboard
        router.push('/today');
      }
      // If user is logged in but no profile, they stay here for onboarding.
    }
  }, [user, userProfile, isLoading, router]);

  if (isLoading || (user && !userProfile === undefined)) {
    return (
      <div className="flex min-h-screen w-full flex-col items-center justify-center">
        <Skeleton className="h-12 w-12 rounded-full animate-pulse" />
      </div>
    );
  }

  // Only show onboarding if user is logged in but has no profile
  if (user && !userProfile) {
    return (
      <div className="flex min-h-screen w-full flex-col items-center justify-center bg-background p-4 sm:p-6 md:p-8">
        <div className="w-full max-w-2xl text-center">
          <h1 className="text-4xl font-bold tracking-tight text-foreground sm:text-5xl md:text-6xl font-headline">
            Welcome, {user.displayName || 'Friend'}!
          </h1>
          <p className="mt-4 text-lg text-muted-foreground sm:text-xl">
            Your personal AI-powered fitness and nutrition coach.
          </p>
          <p className="mt-2 text-lg text-muted-foreground sm:text-xl">
            Let's start by setting your primary goal.
          </p>
        </div>

        <div className="mt-12 w-full max-w-xl">
          <OnboardingGoalForm />
        </div>
      </div>
    );
  }

  // Fallback for any other state (should be covered by redirects, but good practice)
  return (
     <div className="flex min-h-screen w-full flex-col items-center justify-center">
        <Skeleton className="h-12 w-12 rounded-full animate-pulse" />
     </div>
  );
}
