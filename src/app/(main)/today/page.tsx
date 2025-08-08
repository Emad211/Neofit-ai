// src/app/(main)/today/page.tsx
"use client"
import * as React from 'react';
import { ActivityRings } from '@/components/dashboard/activity-rings';
import { DailyFeed } from '@/components/dashboard/daily-feed';
import { SpeedDial } from '@/components/dashboard/speed-dial';
import { getPersonalizedQuote } from "@/lib/data/static-quotes";
import { useUserData } from '@/context/user-profile-context';
import { Skeleton } from '@/components/ui/skeleton';
import { format } from 'date-fns';
import type { MealLog, ActivityLog } from '@/context/user-profile-context';


function getQuote(userName: string) {
    try {
        const quote = getPersonalizedQuote(userName);
        return quote;
    } catch (error) {
        console.error("Failed to fetch motivational quote:", error);
        // Return a fallback quote in case of an error
        return "The best time to start was yesterday. The next best time is now.";
    }
}


export default function TodayPage() {
  const { user, userProfile, isLoading, combinedLogs } = useUserData();

  // In a real app, you'd get the user's name from auth. For now, use a fallback.
  const userName = userProfile?.name || "Sara";
  const quote = getQuote(userName);

  const todayProgress = React.useMemo(() => {
    const today = format(new Date(), 'yyyy-MM-dd');
    
    const todaysLogs = combinedLogs.filter(log => log.loggedAt.startsWith(today));
    
    const calories = todaysLogs
        .filter((log): log is MealLog => log.logType === 'meal')
        .reduce((sum, log) => sum + log.calories, 0);

    const protein = 0; // Placeholder until protein is logged with meals

    const workout = todaysLogs
        .filter((log): log is ActivityLog => log.logType === 'activity')
        .reduce((sum, log) => sum + log.durationMinutes, 0);

    return {
      calories: { value: calories, goal: 2400 }, // Goal should come from user profile/plan
      protein: { value: protein, goal: 160 }, // Goal should come from user profile/plan
      workout: { value: workout, goal: 60 }, // Goal should come from user profile/plan
    };

  }, [combinedLogs]);


  if (isLoading && !userProfile) {
    return (
        <div className="p-4 sm:p-6 lg:p-8">
            <header className="mb-8">
                <Skeleton className="h-10 w-48" />
                <Skeleton className="h-4 w-64 mt-2" />
            </header>
            <main className="space-y-8 pb-24">
                <Skeleton className="h-48 w-full" />
                <Skeleton className="h-96 w-full" />
            </main>
        </div>
    )
  }

  return (
    <div className="relative min-h-screen p-4 sm:p-6 lg:p-8">
      <header className="mb-8">
        <h1 className="text-4xl font-bold font-headline text-foreground">
          Hello, {userName}
        </h1>
        <p className="text-muted-foreground">
          Ready to crush your goals today?
        </p>
      </header>
      
      <main className="space-y-8 pb-24">
        <ActivityRings progress={todayProgress} />
        <DailyFeed quote={quote} />
      </main>

      <SpeedDial />
    </div>
  );
}
