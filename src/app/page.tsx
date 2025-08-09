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
    // This effect handles the initial routing logic for the entire app.
    if (!isLoading) {
      if (!user) {
        // If there's no user, they must authenticate.
        router.push('/auth');
      } else if (userProfile) {
        // If there IS a user AND a profile, they are an existing user.
        // Send them to the main app.
        router.push('/today');
      }
      // If there is a user but NO profile, they are a new user who needs to
      // complete onboarding. We do nothing and let this page render.
    }
  }, [user, userProfile, isLoading, router]);


  // Show a loading skeleton while we determine the user's state.
  // This covers all initial loading states.
  if (isLoading || (user && userProfile) || !user) {
    return (
      <div className="flex min-h-screen w-full flex-col items-center justify-center">
        <Skeleton className="h-12 w-12 rounded-full animate-pulse" />
      </div>
    );
  }

  // This content will ONLY be rendered for a logged-in user who does NOT have a profile.
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
