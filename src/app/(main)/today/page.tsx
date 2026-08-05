"use client";

import * as React from "react";
import { format } from "date-fns";
import { CalendarDays, Sparkles } from "lucide-react";
import { ActivityRings, type ProgressData } from "@/components/dashboard/activity-rings";
import { DailyFeed } from "@/components/dashboard/daily-feed";
import { SpeedDial } from "@/components/dashboard/speed-dial";
import { TodayOverview } from "@/components/dashboard/today-overview";
import {
  useUserData,
  type ActivityLog,
  type MealLog,
  type WorkoutLog,
} from "@/context/user-profile-context";

const persianDigits: Record<string, string> = {
  "۰": "0", "۱": "1", "۲": "2", "۳": "3", "۴": "4",
  "۵": "5", "۶": "6", "۷": "7", "۸": "8", "۹": "9",
};

function parseDuration(value?: string) {
  if (!value) return 60;
  const normalized = value.replace(/[۰-۹]/g, (digit) => persianDigits[digit] || digit);
  const values = normalized.match(/\d+/g)?.map(Number) || [];
  return values.at(-1) || 60;
}

export default function TodayPage() {
  const { userProfile, combinedLogs, nutritionPlan, workoutPlan } = useUserData();
  const userName = userProfile?.name || "کاربر";

  const todaysLogs = React.useMemo(() => {
    const today = format(new Date(), "yyyy-MM-dd");
    return combinedLogs.filter((log) => format(new Date(log.loggedAt), "yyyy-MM-dd") === today);
  }, [combinedLogs]);

  const progress = React.useMemo<ProgressData>(() => {
    const calories = todaysLogs
      .filter((log): log is MealLog => log.logType === "meal")
      .reduce((sum, log) => sum + log.calories, 0);
    const protein = Math.round((calories * 0.2) / 4);
    const workout = todaysLogs
      .filter((log): log is ActivityLog | WorkoutLog => log.logType === "activity" || log.logType === "workout")
      .reduce((sum, log) => sum + log.durationMinutes, 0);
    const calorieGoal = nutritionPlan?.[0]?.totalCalories || 2200;
    const initialPlan = typeof window !== "undefined" ? window.localStorage.getItem("neofit:initial-plan:v1") : null;
    let proteinGoal = 140;
    if (initialPlan) {
      try { proteinGoal = JSON.parse(initialPlan).proteinGrams || proteinGoal; } catch {}
    }
    const workoutGoal = parseDuration(workoutPlan?.[0]?.duration);
    return {
      calories: { value: calories, goal: calorieGoal },
      protein: { value: protein, goal: proteinGoal },
      workout: { value: workout, goal: workoutGoal },
    };
  }, [todaysLogs, nutritionPlan, workoutPlan]);

  const dateLabel = new Intl.DateTimeFormat("fa-IR", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(new Date());

  return (
    <div dir="rtl" className="relative min-h-screen bg-gradient-to-b from-primary/5 via-background to-background p-4 sm:p-6 lg:p-8">
      <header className="mx-auto mb-6 max-w-6xl py-2">
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
          <div>
            <div className="mb-2 inline-flex items-center gap-2 rounded-full border bg-card/80 px-3 py-1 text-xs font-medium text-primary shadow-sm">
              <Sparkles className="h-3.5 w-3.5" />
              برنامه روزانه شخصی شما
            </div>
            <h1 className="text-3xl font-extrabold tracking-tight text-foreground sm:text-4xl font-headline">سلام {userName} 👋</h1>
            <p className="mt-2 text-muted-foreground">امروز را بر اساس آمادگی واقعی‌ات مدیریت کن؛ نه صرفاً طبق برنامه ثابت.</p>
          </div>
          <div className="inline-flex items-center gap-2 self-start rounded-2xl border bg-card/80 px-4 py-3 text-sm shadow-sm backdrop-blur sm:self-auto">
            <CalendarDays className="h-5 w-5 text-primary" />
            <span className="font-medium">{dateLabel}</span>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl space-y-7 pb-24">
        <TodayOverview logs={todaysLogs} progress={progress} />
        <ActivityRings progress={progress} />
        <DailyFeed quote="ثبات در کارهای کوچک، نتیجه‌های بزرگ می‌سازد." logs={todaysLogs} />
      </main>

      <SpeedDial />
    </div>
  );
}
