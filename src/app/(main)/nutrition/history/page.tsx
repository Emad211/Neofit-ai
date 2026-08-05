"use client";

import * as React from "react";
import Link from "next/link";
import { Apple, ArrowRight, CalendarDays, Flame, History, Utensils } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { useUserData, type MealLog } from "@/context/user-profile-context";
import type { InitialPlanPreview } from "@/lib/onboarding-model";

type DayGroup = {
  key: string;
  date: Date;
  meals: MealLog[];
  calories: number;
};

function groupMeals(logs: MealLog[]): DayGroup[] {
  const groups = new Map<string, DayGroup>();

  logs.forEach((meal) => {
    const date = new Date(meal.loggedAt);
    const key = `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
    const current = groups.get(key) || { key, date, meals: [], calories: 0 };
    current.meals.push(meal);
    current.calories += meal.calories;
    groups.set(key, current);
  });

  return Array.from(groups.values())
    .map((group) => ({ ...group, meals: group.meals.sort((a, b) => new Date(a.loggedAt).getTime() - new Date(b.loggedAt).getTime()) }))
    .sort((a, b) => b.date.getTime() - a.date.getTime());
}

const mealTypeLabels: Record<MealLog["mealType"], string> = {
  breakfast: "صبحانه",
  lunch: "ناهار",
  dinner: "شام",
  snack: "میان‌وعده",
};

const dayFormatter = new Intl.DateTimeFormat("fa-IR", {
  weekday: "long",
  year: "numeric",
  month: "long",
  day: "numeric",
});

export default function NutritionHistoryPage() {
  const { combinedLogs, nutritionPlan } = useUserData();
  const [initialPlan, setInitialPlan] = React.useState<InitialPlanPreview | null>(null);

  React.useEffect(() => {
    try {
      const raw = window.localStorage.getItem("neofit:initial-plan:v1");
      if (raw) setInitialPlan(JSON.parse(raw));
    } catch {
      setInitialPlan(null);
    }
  }, []);

  const mealLogs = combinedLogs.filter((log): log is MealLog => log.logType === "meal");
  const groups = React.useMemo(() => groupMeals(mealLogs), [mealLogs]);
  const calorieTarget = initialPlan?.calorieTarget || nutritionPlan?.[0]?.totalCalories || 0;
  const totalCalories = mealLogs.reduce((sum, meal) => sum + meal.calories, 0);
  const averageCalories = groups.length ? Math.round(totalCalories / groups.length) : 0;
  const daysNearTarget = calorieTarget ? groups.filter((group) => Math.abs(group.calories - calorieTarget) <= calorieTarget * 0.1).length : 0;

  return (
    <main dir="rtl" className="min-h-screen bg-gradient-to-b from-emerald-500/5 via-background to-background p-4 sm:p-6 lg:p-8">
      <div className="mx-auto max-w-5xl py-3">
        <header className="mb-6 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
          <div>
            <div className="mb-2 inline-flex items-center gap-2 rounded-full border bg-card px-3 py-1 text-xs font-bold text-emerald-700 dark:text-emerald-300"><History className="h-3.5 w-3.5" />تاریخچه تغذیه</div>
            <h1 className="text-3xl font-black sm:text-4xl">ثبت‌های غذایی روزانه</h1>
            <p className="mt-2 text-muted-foreground">کالری واقعی ثبت‌شده را با هدف روزانه مقایسه کن؛ ماکروهای واقعی بعداً از Nutrition Core اضافه می‌شوند.</p>
          </div>
          <Button asChild variant="outline"><Link href="/nutrition"><ArrowRight className="ml-2 h-4 w-4" />بازگشت به برنامه</Link></Button>
        </header>

        <section className="mb-7 grid grid-cols-2 gap-3 lg:grid-cols-4" aria-label="خلاصه تاریخچه تغذیه">
          {[
            { title: "روزهای ثبت‌شده", value: groups.length.toLocaleString("fa-IR"), icon: CalendarDays },
            { title: "کل وعده‌ها", value: mealLogs.length.toLocaleString("fa-IR"), icon: Utensils },
            { title: "میانگین روزانه", value: groups.length ? `${averageCalories.toLocaleString("fa-IR")} کالری` : "—", icon: Flame },
            { title: "روزهای نزدیک هدف", value: calorieTarget ? `${daysNearTarget.toLocaleString("fa-IR")} روز` : "—", icon: Apple },
          ].map((item) => <Card key={item.title}><CardContent className="p-4"><div className="flex items-start justify-between gap-3"><div><p className="text-xs text-muted-foreground">{item.title}</p><p className="mt-2 text-xl font-black">{item.value}</p></div><div className="rounded-2xl bg-emerald-500/10 p-2.5 text-emerald-700 dark:text-emerald-300"><item.icon className="h-5 w-5" /></div></div></CardContent></Card>)}
        </section>

        {!groups.length ? (
          <Card className="border-dashed"><CardContent className="p-10 text-center"><Apple className="mx-auto h-11 w-11 text-muted-foreground" /><h2 className="mt-4 text-xl font-black">هنوز وعده‌ای ثبت نشده است</h2><p className="mt-2 text-sm text-muted-foreground">از برنامه امروز یا افزودن سریع، اولین وعده را ثبت کن.</p><Button asChild className="mt-5"><Link href="/nutrition">مشاهده برنامه امروز</Link></Button></CardContent></Card>
        ) : (
          <div className="space-y-4">
            {groups.map((group) => {
              const variance = calorieTarget ? group.calories - calorieTarget : 0;
              const percent = calorieTarget ? Math.min(100, Math.round((group.calories / calorieTarget) * 100)) : 0;
              return (
                <Card key={group.key}>
                  <CardHeader className="pb-3">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div><p className="text-xs text-muted-foreground">{dayFormatter.format(group.date)}</p><CardTitle className="mt-1 text-xl">{group.calories.toLocaleString("fa-IR")} کالری ثبت‌شده</CardTitle></div>
                      <div className={variance > 0 ? "rounded-full bg-amber-500/10 px-3 py-1.5 text-xs font-bold text-amber-700 dark:text-amber-300" : "rounded-full bg-emerald-500/10 px-3 py-1.5 text-xs font-bold text-emerald-700 dark:text-emerald-300"}>{calorieTarget ? variance === 0 ? "مطابق هدف" : variance > 0 ? `${variance.toLocaleString("fa-IR")} بیشتر از هدف` : `${Math.abs(variance).toLocaleString("fa-IR")} کمتر از هدف` : "هدف ثبت نشده"}</div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    {calorieTarget ? <div className="mb-4"><div className="mb-2 flex items-center justify-between text-xs text-muted-foreground"><span>{group.calories.toLocaleString("fa-IR")} از {calorieTarget.toLocaleString("fa-IR")}</span><span>{percent.toLocaleString("fa-IR")}٪</span></div><Progress value={percent} className="h-2" /></div> : null}
                    <div className="divide-y rounded-2xl border px-4">
                      {group.meals.map((meal) => <div key={meal.id} className="flex items-center justify-between gap-4 py-3"><div><p className="font-bold">{meal.description}</p><p className="mt-1 text-xs text-muted-foreground">{mealTypeLabels[meal.mealType]} · {new Intl.DateTimeFormat("fa-IR", { hour: "2-digit", minute: "2-digit" }).format(new Date(meal.loggedAt))}</p></div><span className="whitespace-nowrap font-black">{meal.calories.toLocaleString("fa-IR")} کالری</span></div>)}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </main>
  );
}
