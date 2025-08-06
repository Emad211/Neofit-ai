import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dumbbell, HeartPulse, Scale, MoveRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { OnboardingGoalForm } from '@/components/onboarding/onboarding-goal-form';

export default function OnboardingWelcomePage() {
  return (
    <div className="flex min-h-screen w-full flex-col items-center justify-center bg-background p-4 sm:p-6 md:p-8">
      <div className="w-full max-w-2xl text-center">
        <h1 className="text-4xl font-bold tracking-tight text-foreground sm:text-5xl md:text-6xl font-headline">
          Welcome to NeoFit AI
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
