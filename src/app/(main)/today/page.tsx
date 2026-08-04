"use client";

import * as React from "react";
import { ActivityRings } from "@/components/dashboard/activity-rings";
import { DailyFeed } from "@/components/dashboard/daily-feed";
import { SpeedDial } from "@/components/dashboard/speed-dial";
import { useUserData, type ActivityLog, type MealLog, type WorkoutLog } from "@/context/user-profile-context";
import { format } from "date-fns";
import { Sparkles } from "lucide-react";

export default function TodayPage() {
  const { userProfile, combinedLogs, nutritionPlan, workoutPlan } = useUserData();
  const userName = userProfile?.name || "عماد";

  const todaysLogs = React.useMemo(() => {
    const today = format(new Date(), "yyyy-MM-dd");
    return combinedLogs.filter((log) => format(new Date(log.loggedAt), "yyyy-MM-dd") === today);
  }, [combinedLogs]);

  const progress = React.useMemo(() => {
    const calories = todaysLogs
      .filter((log): log is MealLog => log.logType === "meal")
      .reduce((sum, log) => sum + log.calories, 0);
    const workout = todaysLogs
      .filter((log): log is ActivityLog | WorkoutLog => log.logType === "activity" || log.logType === "workout")
      .reduce((sum, log) => sum + log.durationMinutes, 0);
    const calorieGoal = nutritionPlan?.[0]?.totalCalories || 2200;
    const workoutGoal = Number.parseInt(workoutPlan?.[0]?.duration?.split("-")?.[1] || "60", 10);
    return {
      calories: { value: calories, goal: calorieGoal },
      protein: { value: 41, goal: 140 },
      workout: { value: workout, goal: workoutGoal },
    };
  }, [todaysLogs, nutritionPlan, workoutPlan]);

  return (
    <div dir="rtl" className="relative min-h-screen bg-gradient-to-b from-primary/5 via-background to-background p-4 sm:p-6 lg:p-8">
      <header className="mx-auto mb-8 max-w-6xl pt-8 lg:pt-2">
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
          <div>
            <div className="mb-2 inline-flex items-center gap-2 rounded-full border bg-card/80 px-3 py-1 text-xs font-medium text-primary shadow-sm">
              <Sparkles className="h-3.5 w-3.5" />
              نسخهٔ احیای رابط کامل نئوفیت
            </div>
            <h1 className="text-4xl font-extrabold tracking-tight text-foreground sm:text-5xl font-headline">
              سلام {userName} 👋
            </h1>
            <p className="mt-2 text-muted-foreground">امروز یک قدم دیگر به هدف نزدیک‌تر می‌شوی.</p>
          </div>
          <div className="rounded-2xl border bg-card/80 px-4 py-3 text-sm shadow-sm backdrop-blur">
            <span className="block font-bold">داده‌های فعلی</span>
            <span className="text-muted-foreground">نمایش آزمایشی؛ اتصال Supabase در حال جایگزینی است.</span>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl space-y-8 pb-28">
        <ActivityRings progress={progress} />
        <DailyFeed quote="ثبات در کارهای کوچک، نتیجه‌های بزرگ می‌سازد." logs={todaysLogs} />
      </main>

      <SpeedDial />
    </div>
  );
}
