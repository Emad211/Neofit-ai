"use client";

import * as React from "react";
import Link from "next/link";
import { CalendarDays, Clock3, Dumbbell, Flame, History, PlayCircle, RotateCcw } from "lucide-react";
import { WorkoutPlan } from "@/components/workout/workout-plan";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useUserData, type WorkoutLog } from "@/context/user-profile-context";

const persianDigits: Record<string, string> = { "۰": "0", "۱": "1", "۲": "2", "۳": "3", "۴": "4", "۵": "5", "۶": "6", "۷": "7", "۸": "8", "۹": "9" };
function numeric(value: string | number | undefined, fallback = 0) {
  if (typeof value === "number") return value;
  const normalized = String(value || "").replace(/[۰-۹]/g, (digit) => persianDigits[digit] || digit);
  return Number.parseInt(normalized.match(/\d+/)?.[0] || String(fallback), 10);
}

type ActiveWorkoutPreview = { workoutId: string; title: string; exerciseIndex: number; setIndex: number };

export default function WorkoutPage() {
  const { workoutPlan, combinedLogs } = useUserData();
  const [activeSession, setActiveSession] = React.useState<ActiveWorkoutPreview | null>(null);

  React.useEffect(() => {
    for (let index = 0; index < window.localStorage.length; index += 1) {
      const key = window.localStorage.key(index);
      if (!key?.startsWith("neofit:active-workout:")) continue;
      try {
        const stored = JSON.parse(window.localStorage.getItem(key) || "null");
        if (stored?.session?.id) {
          setActiveSession({ workoutId: stored.session.id, title: stored.session.title, exerciseIndex: stored.exerciseIndex || 0, setIndex: stored.setIndex || 0 });
          break;
        }
      } catch {}
    }
  }, []);

  const trainingDays = workoutPlan?.filter((day) => day.exercises.length > 0) || [];
  const totalMinutes = trainingDays.reduce((sum, day) => sum + numeric(day.duration, 60), 0);
  const totalCalories = trainingDays.reduce((sum, day) => sum + numeric(day.calories, 350), 0);
  const weekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
  const completedThisWeek = combinedLogs.filter((log): log is WorkoutLog => log.logType === "workout" && new Date(log.loggedAt).getTime() >= weekAgo).length;
  const adherence = trainingDays.length ? Math.min(100, Math.round((completedThisWeek / trainingDays.length) * 100)) : 0;

  return (
    <main dir="rtl" className="min-h-screen bg-gradient-to-b from-primary/5 via-background to-background p-4 sm:p-6 lg:p-8">
      <div className="mx-auto max-w-6xl py-3">
        <header className="mb-6 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
          <div><div className="mb-2 inline-flex items-center gap-2 rounded-full border bg-card px-3 py-1 text-xs font-bold text-primary"><Dumbbell className="h-3.5 w-3.5" />برنامه تمرینی شخصی</div><h1 className="text-3xl font-black sm:text-4xl">تمرین این هفته</h1><p className="mt-2 text-muted-foreground">جلسه‌ها، روزهای استراحت و پیشرفت هفتگی را از اینجا مدیریت کن.</p></div>
          <Button asChild variant="outline"><Link href="/workout/history"><History className="ml-2 h-4 w-4" />تاریخچه و رکوردها</Link></Button>
        </header>

        {activeSession ? (
          <Card className="mb-6 border-primary/30 bg-primary/5"><CardContent className="flex flex-col justify-between gap-4 p-5 sm:flex-row sm:items-center"><div><p className="text-sm font-bold text-primary">جلسه ذخیره‌شده پیدا شد</p><p className="mt-1 text-xl font-black">{activeSession.title}</p><p className="mt-1 text-sm text-muted-foreground">حرکت {activeSession.exerciseIndex + 1}، ست {activeSession.setIndex + 1} — پیشرفت روی همین دستگاه محفوظ است.</p></div><Button asChild><Link href={`/workout-player/${activeSession.workoutId}`}><RotateCcw className="ml-2 h-4 w-4" />ادامه تمرین</Link></Button></CardContent></Card>
        ) : null}

        <section className="mb-7 grid grid-cols-2 gap-3 lg:grid-cols-4" aria-label="خلاصه برنامه تمرینی">
          {[
            { title: "جلسات برنامه", value: `${trainingDays.length.toLocaleString("fa-IR")} روز`, icon: CalendarDays },
            { title: "زمان هفتگی", value: `${totalMinutes.toLocaleString("fa-IR")} دقیقه`, icon: Clock3 },
            { title: "مصرف تقریبی", value: `${totalCalories.toLocaleString("fa-IR")} کالری`, icon: Flame },
            { title: "تکمیل هفته", value: `${adherence.toLocaleString("fa-IR")}٪`, icon: PlayCircle },
          ].map((item) => <Card key={item.title}><CardContent className="p-4"><div className="flex items-start justify-between gap-3"><div><p className="text-xs text-muted-foreground">{item.title}</p><p className="mt-2 text-xl font-black">{item.value}</p></div><div className="rounded-2xl bg-primary/10 p-2.5 text-primary"><item.icon className="h-5 w-5" /></div></div></CardContent></Card>)}
        </section>

        <WorkoutPlan />
      </div>
    </main>
  );
}
