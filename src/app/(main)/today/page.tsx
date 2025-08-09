
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
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { PartyPopper } from 'lucide-react';


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
  const [showNewPlanNotification, setShowNewPlanNotification] = React.useState(false);

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

    // TODO: Pull goals from the user's nutrition and workout plans
    const calorieGoal = userProfile?.goal === 'lose_weight' ? 2200 : (userProfile?.goal === 'gain_muscle' ? 3000 : 2600);
    const proteinGoal = userProfile?.goal === 'gain_muscle' ? 180 : 140;
    const workoutGoal = parseInt(userProfile?.trainingDuration?.split('-')[1] || '60', 10);


    return {
      calories: { value: calories, goal: calorieGoal },
      protein: { value: protein, goal: proteinGoal },
      workout: { value: workout, goal: workoutGoal },
    };

  }, [combinedLogs, userProfile]);


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
        {/* This is where the notification for a new plan would go.
            In a real app, a flag would be set in Firestore when the new plan is generated,
            and we'd check for that flag here. For the demo, we can use a manual toggle.
        */}
        {showNewPlanNotification && (
             <Alert className="border-accent bg-accent/20">
                <PartyPopper className="h-4 w-4 text-accent-foreground" />
                <AlertTitle className="text-accent-foreground font-bold">New Week, New Plan!</AlertTitle>
                <AlertDescription className="text-accent-foreground/90">
                    Your personalized workout and nutrition plans for this week have been generated. Check them out!
                </AlertDescription>
            </Alert>
        )}

        <ActivityRings progress={todayProgress} />
        <DailyFeed quote={quote} />
      </main>

      <SpeedDial />
    </div>
  );
}
