"use client";

import * as React from "react";
import Link from "next/link";
import { AlertTriangle, ArrowRight, Clock3, Dumbbell, Flame, History, Info, PlayCircle, ShieldCheck, TimerReset } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useUserData, type WorkoutLog } from "@/context/user-profile-context";
import { getLocalExerciseDetails } from "@/lib/neofit-demo-data";

const persianDigits: Record<string, string> = { "۰": "0", "۱": "1", "۲": "2", "۳": "3", "۴": "4", "۵": "5", "۶": "6", "۷": "7", "۸": "8", "۹": "9" };
function numeric(value: string | number | undefined, fallback = 0) {
  if (typeof value === "number") return value;
  const normalized = String(value || "").replace(/[۰-۹]/g, (digit) => persianDigits[digit] || digit);
  return Number.parseInt(normalized.match(/\d+/)?.[0] || String(fallback), 10);
}

function latestPerformance(logs: WorkoutLog[], workoutId: string, exerciseName: string) {
  const previous = logs
    .filter((log) => log.workoutId === workoutId)
    .sort((a, b) => new Date(b.loggedAt).getTime() - new Date(a.loggedAt).getTime())
    .flatMap((log) => log.exercises)
    .find((exercise) => exercise.name === exerciseName);

  if (!previous) return null;
  const valid = previous.logs
    .map((log) => ({ reps: Number.parseInt(log.reps, 10), weight: Number.parseFloat(log.weight) }))
    .filter((log) => Number.isFinite(log.reps) && Number.isFinite(log.weight));
  if (!valid.length) return null;
  const heaviest = valid.reduce((best, current) => current.weight > best.weight ? current : best, valid[0]);
  return {
    setCount: valid.length,
    weight: heaviest.weight,
    reps: heaviest.reps,
  };
}

export function WorkoutDayDetails({ workoutId }: { workoutId: string }) {
  const { workoutPlan, combinedLogs, userProfile, isLoading } = useUserData();
  const [injuryAreas, setInjuryAreas] = React.useState<string[]>([]);
  const workout = workoutPlan?.find((item) => item.id === workoutId) || null;
  const history = combinedLogs.filter((log): log is WorkoutLog => log.logType === "workout");

  React.useEffect(() => {
    try {
      const draft = JSON.parse(window.localStorage.getItem("neofit:onboarding-draft:v1") || "{}");
      const areas = Array.isArray(draft?.injuries?.areas) ? draft.injuries.areas : [];
      setInjuryAreas(areas.filter((area: any) => area.status === "current" || area.severity === "severe").map((area: any) => area.label).filter(Boolean));
    } catch {
      setInjuryAreas([]);
    }
  }, []);

  if (isLoading) return <div className="mx-auto max-w-5xl animate-pulse space-y-4 p-5"><div className="h-10 w-64 rounded-xl bg-muted" /><div className="h-48 rounded-3xl bg-muted" /><div className="h-80 rounded-3xl bg-muted" /></div>;

  if (!workout) {
    return (
      <main dir="rtl" className="grid min-h-[70vh] place-items-center p-4">
        <Card className="w-full max-w-lg border-dashed"><CardContent className="p-10 text-center"><Dumbbell className="mx-auto h-12 w-12 text-muted-foreground" /><h1 className="mt-4 text-2xl font-black">جلسه تمرینی پیدا نشد</h1><p className="mt-2 text-sm text-muted-foreground">ممکن است برنامه تغییر کرده باشد. به صفحه هفتگی برگرد و جلسه فعال را انتخاب کن.</p><Button asChild className="mt-5"><Link href="/workout">بازگشت به برنامه</Link></Button></CardContent></Card>
      </main>
    );
  }

  const isRest = workout.exercises.length === 0 || workout.title.includes("استراحت");
  const previousSession = history.filter((log) => log.workoutId === workout.id).sort((a, b) => new Date(b.loggedAt).getTime() - new Date(a.loggedAt).getTime())[0];
  const warmup = [
    `۵ تا ۸ دقیقه ${workout.focus.includes("پا") ? "دوچرخه ثابت یا راه‌رفتن شیب‌دار" : "هوازی سبک و حرکت دست‌ها"}`,
    `حرکت‌دادن کنترل‌شده مفاصل مرتبط با ${workout.focus}`,
    workout.exercises[0] ? `دو ست آماده‌سازی سبک برای «${workout.exercises[0].name}»` : "پیاده‌روی و کشش پویا",
  ];

  return (
    <main dir="rtl" className="min-h-screen bg-gradient-to-b from-primary/5 via-background to-background p-4 sm:p-6 lg:p-8">
      <div className="mx-auto max-w-5xl py-3">
        <header className="mb-6 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
          <div><Button asChild variant="ghost" size="sm" className="mb-3 px-0"><Link href="/workout"><ArrowRight className="ml-2 h-4 w-4" />برنامه هفتگی</Link></Button><p className="text-sm font-bold text-primary">{workout.day}</p><h1 className="mt-1 text-3xl font-black sm:text-4xl">{workout.title}</h1><p className="mt-2 text-muted-foreground">تمرکز جلسه: {workout.focus}</p></div>
          {!isRest ? <Button asChild size="lg"><Link href={`/workout-player/${workout.id}`}><PlayCircle className="ml-2 h-5 w-5" />شروع تمرین</Link></Button> : null}
        </header>

        <section className="mb-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
          {[
            { label: "مدت برنامه", value: workout.duration, icon: Clock3 },
            { label: "کالری تقریبی", value: `${numeric(workout.calories, 350).toLocaleString("fa-IR")} کیلوکالری`, icon: Flame },
            { label: "تعداد حرکات", value: workout.exercises.length.toLocaleString("fa-IR"), icon: Dumbbell },
            { label: "استراحت بین ست", value: workout.exercises.length ? `${Math.round(workout.exercises.reduce((sum, exercise) => sum + numeric(exercise.rest, 90), 0) / workout.exercises.length).toLocaleString("fa-IR")} ثانیه` : "ریکاوری", icon: TimerReset },
          ].map((item) => <Card key={item.label}><CardContent className="p-4"><div className="flex items-start justify-between gap-2"><div><p className="text-xs text-muted-foreground">{item.label}</p><p className="mt-2 font-black">{item.value}</p></div><div className="rounded-2xl bg-primary/10 p-2 text-primary"><item.icon className="h-5 w-5" /></div></div></CardContent></Card>)}
        </section>

        {isRest ? (
          <Card className="border-dashed"><CardContent className="p-10 text-center"><ShieldCheck className="mx-auto h-12 w-12 text-primary" /><h2 className="mt-4 text-2xl font-black">روز ریکاوری</h2><p className="mx-auto mt-3 max-w-xl text-sm leading-7 text-muted-foreground">خواب کافی، آب، غذای منظم و فعالیت سبک را در اولویت بگذار. تمرین جبرانی سنگین بدون بازچینی هفته توصیه نمی‌شود.</p><Button asChild variant="outline" className="mt-5"><Link href="/today">بازگشت به امروز</Link></Button></CardContent></Card>
        ) : (
          <div className="grid gap-6 lg:grid-cols-[0.7fr_1.3fr]">
            <div className="space-y-5">
              <Card>
                <CardHeader><CardTitle className="text-lg">گرم‌کردن پیشنهادی</CardTitle></CardHeader>
                <CardContent><ol className="space-y-3">{warmup.map((item, index) => <li key={item} className="flex gap-3 text-sm leading-7"><span className="grid h-7 w-7 shrink-0 place-items-center rounded-xl bg-primary/10 font-bold text-primary">{index + 1}</span><span>{item}</span></li>)}</ol></CardContent>
              </Card>

              {previousSession ? <Card><CardHeader><CardTitle className="flex items-center gap-2 text-lg"><History className="h-5 w-5 text-primary" />جلسه قبلی</CardTitle></CardHeader><CardContent className="space-y-2 text-sm"><p><span className="text-muted-foreground">تاریخ:</span> {new Intl.DateTimeFormat("fa-IR", { dateStyle: "medium" }).format(new Date(previousSession.loggedAt))}</p><p><span className="text-muted-foreground">حجم:</span> {Math.round(previousSession.totalVolume).toLocaleString("fa-IR")} کیلوگرم</p><p><span className="text-muted-foreground">سختی / درد:</span> {previousSession.rpe ?? "—"} / {previousSession.painScale ?? 0}</p></CardContent></Card> : null}

              {(injuryAreas.length > 0 || userProfile?.medicalHistory) ? <Card className="border-amber-500/30 bg-amber-500/5"><CardContent className="p-5"><div className="flex items-start gap-3"><AlertTriangle className="mt-1 h-5 w-5 shrink-0 text-amber-600" /><div><p className="font-bold">ملاحظات ایمنی شخصی</p>{injuryAreas.length ? <p className="mt-2 text-sm leading-7 text-muted-foreground">ناحیه‌های فعال/شدید: {injuryAreas.join("، ")}</p> : null}{userProfile?.medicalHistory ? <p className="mt-1 text-sm leading-7 text-muted-foreground">{userProfile.medicalHistory}</p> : null}</div></div></CardContent></Card> : null}
            </div>

            <Card>
              <CardHeader><CardTitle>ترتیب حرکات جلسه</CardTitle></CardHeader>
              <CardContent className="space-y-3">
                {workout.exercises.map((exercise, index) => {
                  const guide = getLocalExerciseDetails(exercise.name);
                  const previous = latestPerformance(history, workout.id, exercise.name);
                  return (
                    <div key={exercise.id} className="rounded-2xl border p-4">
                      <div className="flex items-start gap-4"><div className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl bg-primary font-black text-primary-foreground">{index + 1}</div><div className="min-w-0 flex-1"><div className="flex flex-wrap items-start justify-between gap-3"><div><h3 className="font-black">{exercise.name}</h3><p className="mt-1 text-sm leading-6 text-muted-foreground">{guide.summary}</p></div><Dialog><DialogTrigger asChild><Button variant="ghost" size="sm"><Info className="ml-2 h-4 w-4" />راهنما</Button></DialogTrigger><DialogContent dir="rtl" className="max-w-2xl"><DialogHeader className="text-right"><DialogTitle>{exercise.name}</DialogTitle><DialogDescription>{guide.summary}</DialogDescription></DialogHeader><div className="space-y-5 text-sm leading-7"><section><h4 className="font-bold">مراحل اجرا</h4><ol className="list-decimal space-y-1 pr-5">{guide.instructions.map((item) => <li key={item}>{item}</li>)}</ol></section><section><h4 className="font-bold">نکات فرم</h4><ul className="list-disc space-y-1 pr-5">{guide.formTips.map((item) => <li key={item}>{item}</li>)}</ul></section></div></DialogContent></Dialog></div>
                      <div className="mt-3 flex flex-wrap gap-2"><Badge>{exercise.sets} ست</Badge><Badge variant="secondary">{exercise.reps} تکرار</Badge><Badge variant="outline">{exercise.rest} استراحت</Badge></div>
                      {previous ? <p className="mt-3 rounded-xl bg-muted/40 px-3 py-2 text-xs text-muted-foreground">آخرین عملکرد: {previous.setCount.toLocaleString("fa-IR")} ست؛ سنگین‌ترین ست {previous.weight.toLocaleString("fa-IR")} کیلوگرم × {previous.reps.toLocaleString("fa-IR")}</p> : <p className="mt-3 text-xs text-muted-foreground">عملکرد قبلی ثبت نشده است.</p>}</div></div>
                    </div>
                  );
                })}
              </CardContent>
            </Card>
          </div>
        )}

        {!isRest ? <div className="sticky bottom-4 mt-7 rounded-2xl border bg-background/95 p-3 shadow-xl backdrop-blur sm:static sm:border-0 sm:bg-transparent sm:p-0 sm:shadow-none"><Button asChild size="lg" className="w-full"><Link href={`/workout-player/${workout.id}`}><PlayCircle className="ml-2 h-5 w-5" />شروع «{workout.title}»</Link></Button></div> : null}
      </div>
    </main>
  );
}
