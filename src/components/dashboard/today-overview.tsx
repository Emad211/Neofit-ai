"use client";

import * as React from "react";
import Link from "next/link";
import { format } from "date-fns";
import {
  Apple,
  ArrowLeft,
  BedDouble,
  CheckCircle2,
  Droplets,
  Dumbbell,
  Footprints,
  Minus,
  Plus,
  Scale,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useDailyMetrics } from "@/hooks/use-daily-metrics";
import {
  useUserData,
  type CombinedLog,
  type MealLog,
  type WeightLog,
} from "@/context/user-profile-context";
import type { ProgressData } from "./activity-rings";

const persianDigits: Record<string, string> = {
  "۰": "0", "۱": "1", "۲": "2", "۳": "3", "۴": "4",
  "۵": "5", "۶": "6", "۷": "7", "۸": "8", "۹": "9",
};

function parsePersianNumber(value?: string, fallback = 60) {
  if (!value) return fallback;
  const normalized = value.replace(/[۰-۹]/g, (digit) => persianDigits[digit] || digit);
  return Number.parseInt(normalized.match(/\d+/)?.[0] || String(fallback), 10);
}

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

export function TodayOverview({ logs, progress }: { logs: CombinedLog[]; progress: ProgressData }) {
  const { userProfile, nutritionPlan, workoutPlan, loggedMealsState } = useUserData();
  const { metrics, isReady, update, addWater } = useDailyMetrics();

  const todayLabel = new Intl.DateTimeFormat("fa-IR", {
    weekday: "long",
  }).format(new Date());
  const todayWorkout =
    workoutPlan?.find((workout) => workout.day === todayLabel) || workoutPlan?.[0] || null;
  const todayMeals = nutritionPlan?.[0]?.meals || [];
  const nextMeal =
    todayMeals.find((meal) => !loggedMealsState?.includes(meal.id)) || todayMeals.at(-1) || null;

  const latestWeight = React.useMemo(() => {
    const latest = logs
      .filter((log): log is WeightLog => log.logType === "weight")
      .sort((a, b) => new Date(b.loggedAt).getTime() - new Date(a.loggedAt).getTime())[0];
    return latest?.weight || userProfile?.weight || 0;
  }, [logs, userProfile?.weight]);

  const loggedMeals = logs.filter((log): log is MealLog => log.logType === "meal").length;
  const stressScore = userProfile?.stressLevel === "low" ? 30 : userProfile?.stressLevel === "high" ? 12 : 22;
  const sleepScore = clamp((metrics.sleepHours / 8) * 45, 0, 45);
  const movementScore = clamp((metrics.steps / 8000) * 25, 0, 25);
  const readiness = Math.round(sleepScore + movementScore + stressScore);
  const readinessLabel = readiness >= 80 ? "آمادهٔ فشار خوب" : readiness >= 60 ? "آمادگی متوسط" : "ریکاوری را جدی بگیر";
  const overallAdherence = Math.round(
    ([progress.calories, progress.protein, progress.workout]
      .reduce((sum, item) => sum + Math.min(1, item.value / Math.max(1, item.goal)), 0) /
      3) *
      100,
  );

  const metricCards = [
    {
      key: "water",
      title: "آب",
      value: `${metrics.waterMl.toLocaleString("fa-IR")} میلی‌لیتر`,
      detail: `هدف ۲۵۰۰ میلی‌لیتر`,
      icon: Droplets,
      percent: clamp((metrics.waterMl / 2500) * 100, 0, 100),
      decrement: () => addWater(-250),
      increment: () => addWater(250),
    },
    {
      key: "steps",
      title: "قدم",
      value: metrics.steps.toLocaleString("fa-IR"),
      detail: "هدف ۸۰۰۰ قدم",
      icon: Footprints,
      percent: clamp((metrics.steps / 8000) * 100, 0, 100),
      decrement: () => update({ steps: Math.max(0, metrics.steps - 500) }),
      increment: () => update({ steps: metrics.steps + 500 }),
    },
    {
      key: "sleep",
      title: "خواب",
      value: `${metrics.sleepHours.toLocaleString("fa-IR")} ساعت`,
      detail: "هدف ۸ ساعت",
      icon: BedDouble,
      percent: clamp((metrics.sleepHours / 8) * 100, 0, 100),
      decrement: () => update({ sleepHours: Math.max(0, Number((metrics.sleepHours - 0.5).toFixed(1))) }),
      increment: () => update({ sleepHours: Math.min(14, Number((metrics.sleepHours + 0.5).toFixed(1))) }),
    },
  ];

  return (
    <section className="space-y-6" aria-label="خلاصه امروز">
      <div className="grid gap-4 lg:grid-cols-[1.15fr_0.85fr]">
        <Card className="overflow-hidden border-primary/20 bg-gradient-to-br from-primary/15 via-card to-card">
          <CardContent className="p-5 sm:p-6">
            <div className="flex flex-wrap items-start justify-between gap-5">
              <div>
                <div className="inline-flex items-center gap-2 rounded-full bg-background/70 px-3 py-1 text-xs font-bold text-primary ring-1 ring-primary/15">
                  <Sparkles className="h-3.5 w-3.5" />
                  امتیاز آمادگی امروز
                </div>
                <p className="mt-5 text-5xl font-black tracking-tight">{isReady ? readiness.toLocaleString("fa-IR") : "—"}<span className="mr-1 text-lg text-muted-foreground">از ۱۰۰</span></p>
                <p className="mt-2 text-lg font-bold">{readinessLabel}</p>
                <p className="mt-2 max-w-lg text-sm leading-7 text-muted-foreground">
                  این امتیاز فعلاً از خواب، قدم‌های امروز و سطح استرس پروفایل ساخته می‌شود و پس از اتصال داده‌های واقعی دقیق‌تر خواهد شد.
                </p>
              </div>
              <div className="grid h-24 w-24 place-items-center rounded-full border-[10px] border-primary/20 bg-background/80 text-center shadow-inner">
                <ShieldCheck className="h-8 w-8 text-primary" />
              </div>
            </div>
            <div className="mt-6 h-2 overflow-hidden rounded-full bg-background/70"><div className="h-full rounded-full bg-primary transition-all" style={{ width: `${readiness}%` }} /></div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2"><CardTitle className="flex items-center gap-2 text-lg"><CheckCircle2 className="h-5 w-5 text-primary" />پایبندی امروز</CardTitle></CardHeader>
          <CardContent>
            <div className="flex items-end justify-between gap-4"><div><p className="text-4xl font-black">{overallAdherence.toLocaleString("fa-IR")}٪</p><p className="mt-2 text-sm text-muted-foreground">{loggedMeals.toLocaleString("fa-IR")} وعده و {logs.length.toLocaleString("fa-IR")} ثبت در تایم‌لاین</p></div><div className="rounded-2xl bg-primary/10 p-4 text-primary"><CheckCircle2 className="h-8 w-8" /></div></div>
            <div className="mt-5 h-2 overflow-hidden rounded-full bg-muted"><div className="h-full rounded-full bg-emerald-500" style={{ width: `${overallAdherence}%` }} /></div>
            <p className="mt-4 text-xs leading-6 text-muted-foreground">پایبندی از کالری، پروتئین و فعالیت ثبت‌شده محاسبه می‌شود؛ رسیدن به ۱۰۰٪ به معنی بی‌نقص‌بودن نیست.</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="overflow-hidden">
          <CardContent className="p-0">
            <div className="flex items-start gap-4 bg-gradient-to-l from-primary/10 to-transparent p-5 sm:p-6">
              <div className="rounded-2xl bg-primary p-3 text-primary-foreground"><Dumbbell className="h-6 w-6" /></div>
              <div className="min-w-0 flex-1"><p className="text-sm text-muted-foreground">تمرین امروز</p><p className="mt-1 text-xl font-black">{todayWorkout?.title || "روز استراحت"}</p><p className="mt-1 text-sm leading-6 text-muted-foreground">{todayWorkout ? `${todayWorkout.focus} · ${todayWorkout.duration}` : "ریکاوری، پیاده‌روی سبک و خواب کافی"}</p></div>
            </div>
            <div className="flex items-center justify-between gap-3 border-t p-4"><span className="text-sm text-muted-foreground">{todayWorkout ? `${todayWorkout.exercises.length} حرکت · حدود ${todayWorkout.calories} کالری` : "تمرین برنامه‌ریزی نشده"}</span>{todayWorkout ? <Button asChild><Link href={`/workout-player/${todayWorkout.id}`}>شروع تمرین<ArrowLeft className="mr-2 h-4 w-4" /></Link></Button> : <Button asChild variant="outline"><Link href="/workout">دیدن برنامه</Link></Button>}</div>
          </CardContent>
        </Card>

        <Card className="overflow-hidden">
          <CardContent className="p-0">
            <div className="flex items-start gap-4 bg-gradient-to-l from-emerald-500/10 to-transparent p-5 sm:p-6">
              <div className="rounded-2xl bg-emerald-600 p-3 text-white"><Apple className="h-6 w-6" /></div>
              <div className="min-w-0 flex-1"><p className="text-sm text-muted-foreground">وعده بعدی</p><p className="mt-1 text-xl font-black">{nextMeal?.name || "برنامه‌ای ثبت نشده"}</p><p className="mt-1 text-sm leading-6 text-muted-foreground">{nextMeal ? `${nextMeal.type} · ${nextMeal.calories} کیلوکالری` : "از بخش تغذیه برنامه را مرور کن"}</p></div>
            </div>
            <div className="flex items-center justify-between gap-3 border-t p-4"><span className="text-sm text-muted-foreground">{nextMeal ? `${nextMeal.ingredients.length} ماده غذایی` : "—"}</span><Button asChild variant="outline"><Link href="/nutrition">مشاهده تغذیه<ArrowLeft className="mr-2 h-4 w-4" /></Link></Button></div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {metricCards.map((metric) => (
          <Card key={metric.key}>
            <CardContent className="p-4">
              <div className="flex items-start justify-between gap-3"><div><p className="text-sm text-muted-foreground">{metric.title}</p><p className="mt-1 text-xl font-black">{isReady ? metric.value : "—"}</p><p className="mt-1 text-xs text-muted-foreground">{metric.detail}</p></div><div className="rounded-2xl bg-primary/10 p-2.5 text-primary"><metric.icon className="h-5 w-5" /></div></div>
              <div className="mt-4 h-1.5 overflow-hidden rounded-full bg-muted"><div className="h-full rounded-full bg-primary" style={{ width: `${metric.percent}%` }} /></div>
              <div className="mt-3 flex items-center justify-end gap-2"><Button type="button" variant="outline" size="icon" className="h-8 w-8" onClick={metric.decrement} aria-label={`کاهش ${metric.title}`}><Minus className="h-3.5 w-3.5" /></Button><Button type="button" variant="outline" size="icon" className="h-8 w-8" onClick={metric.increment} aria-label={`افزایش ${metric.title}`}><Plus className="h-3.5 w-3.5" /></Button></div>
            </CardContent>
          </Card>
        ))}

        <Card>
          <CardContent className="p-4">
            <div className="flex items-start justify-between gap-3"><div><p className="text-sm text-muted-foreground">وزن فعلی</p><p className="mt-1 text-xl font-black">{latestWeight.toLocaleString("fa-IR")} کیلوگرم</p><p className="mt-1 text-xs text-muted-foreground">آخرین ثبت یا پروفایل</p></div><div className="rounded-2xl bg-primary/10 p-2.5 text-primary"><Scale className="h-5 w-5" /></div></div>
            <p className="mt-4 text-xs leading-6 text-muted-foreground">برای مقایسه معتبر، وزن را در شرایط مشابه ثبت کن.</p>
            <Button asChild variant="outline" size="sm" className="mt-3 w-full"><Link href="/progress">روند وزن</Link></Button>
          </CardContent>
        </Card>
      </div>
    </section>
  );
}
