
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
import type { MealLog, ActivityLog, WorkoutLog } from '@/context/user-profile-context';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { PartyPopper } from 'lucide-react';
import type { Meal } from '@/components/nutrition/meal-card';


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
  const { user, userProfile, isLoading, combinedLogs, nutritionPlan, workoutPlan } = useUserData();
  const [showNewPlanNotification, setShowNewPlanNotification] = React.useState(false);

  const userName = userProfile?.name || "Sara";
  const quote = getQuote(userName);

  const todaysLogs = React.useMemo(() => {
    if (!combinedLogs) return [];
    const today = format(new Date(), 'yyyy-MM-dd');
    return combinedLogs.filter(log => format(new Date(log.loggedAt), 'yyyy-MM-dd') === today);
  }, [combinedLogs]);

  const todayProgress = React.useMemo(() => {
    const calories = todaysLogs
        .filter((log): log is MealLog => log.logType === 'meal')
        .reduce((sum, log) => sum + log.calories, 0);

    const workout = todaysLogs
        .filter((log): log is ActivityLog | WorkoutLog => log.logType === 'activity' || log.logType === 'workout')
        .reduce((sum, log) => sum + log.durationMinutes, 0);
    
    // --- Dynamic Goal Calculation ---
    
    // Calculate Calorie Goal from Nutrition Plan
    const calorieGoal = nutritionPlan 
        ? Math.round(nutritionPlan.reduce((sum, day) => sum + day.totalCalories, 0) / nutritionPlan.length)
        : 2500; // Fallback

    // Calculate Protein Goal from an average day in the Nutrition Plan
    const proteinGoal = nutritionPlan && nutritionPlan.length > 0
        ? Math.round(nutritionPlan[0].meals.reduce((sum, meal: Meal) => {
            // This calculation should match the one in meal-details-sheet
            const proteinPerMeal = Math.round(meal.calories * 0.3 / 4);
            return sum + proteinPerMeal;
          }, 0))
        : 150; // Fallback

    // Calculate Workout Goal from Workout Plan
    const workoutGoal = workoutPlan && workoutPlan.length > 0
        ? parseInt(workoutPlan[0].duration.split('-')[1] || '60', 10)
        : 60; // Fallback
    
    // Calculate today's protein intake
     const protein = todaysLogs
        .filter((log): log is MealLog => log.logType === 'meal')
        .reduce((sum, log) => {
            const proteinPerMeal = Math.round(log.calories * 0.3 / 4);
            return sum + proteinPerMeal;
        }, 0);


    return {
      calories: { value: calories, goal: calorieGoal },
      protein: { value: protein, goal: proteinGoal },
      workout: { value: workout, goal: workoutGoal },
    };

  }, [todaysLogs, nutritionPlan, workoutPlan]);


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
        <DailyFeed quote={quote} logs={todaysLogs} />
      </main>

      <SpeedDial />
    </div>
  );
}
