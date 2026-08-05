"use client";

import Link from "next/link";
import { format } from "date-fns";
import { Activity, ArrowRight, CalendarDays, Dumbbell, Gauge, History, RefreshCw, Weight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useUserData, type WorkoutLog } from "@/context/user-profile-context";

export default function WorkoutHistoryPage() {
  const { combinedLogs } = useUserData();
  const workouts = combinedLogs
    .filter((log): log is WorkoutLog => log.logType === "workout")
    .sort((a, b) => new Date(b.loggedAt).getTime() - new Date(a.loggedAt).getTime());

  const totalMinutes = workouts.reduce((sum, workout) => sum + workout.durationMinutes, 0);
  const totalVolume = workouts.reduce((sum, workout) => sum + workout.totalVolume, 0);
  const averageRpe = workouts.filter((workout) => workout.rpe).length
    ? workouts.filter((workout) => workout.rpe).reduce((sum, workout) => sum + (workout.rpe || 0), 0) / workouts.filter((workout) => workout.rpe).length
    : 0;

  return (
    <main dir="rtl" className="min-h-screen bg-gradient-to-b from-primary/5 via-background to-background p-4 sm:p-6 lg:p-8">
      <div className="mx-auto max-w-5xl py-3">
        <header className="mb-6 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
          <div><div className="mb-2 inline-flex items-center gap-2 rounded-full border bg-card px-3 py-1 text-xs font-bold text-primary"><History className="h-3.5 w-3.5" />تاریخچه تمرین</div><h1 className="text-3xl font-black sm:text-4xl">جلسه‌ها و رکوردها</h1><p className="mt-2 text-muted-foreground">حجم، سختی، درد و جزئیات هر تمرین ذخیره‌شده را مرور کن.</p></div>
          <Button asChild variant="outline"><Link href="/workout"><ArrowRight className="ml-2 h-4 w-4" />بازگشت به برنامه</Link></Button>
        </header>

        <section className="mb-7 grid grid-cols-2 gap-3 lg:grid-cols-4">
          {[
            { title: "جلسه‌های ثبت‌شده", value: workouts.length.toLocaleString("fa-IR"), icon: CalendarDays },
            { title: "زمان تمرین", value: `${totalMinutes.toLocaleString("fa-IR")} دقیقه`, icon: Activity },
            { title: "حجم کل", value: `${Math.round(totalVolume).toLocaleString("fa-IR")} کیلوگرم`, icon: Weight },
            { title: "میانگین سختی", value: averageRpe ? `${averageRpe.toFixed(1)} از ۱۰` : "—", icon: Gauge },
          ].map((item) => <Card key={item.title}><CardContent className="p-4"><div className="flex items-start justify-between gap-3"><div><p className="text-xs text-muted-foreground">{item.title}</p><p className="mt-2 text-xl font-black">{item.value}</p></div><div className="rounded-2xl bg-primary/10 p-2.5 text-primary"><item.icon className="h-5 w-5" /></div></div></CardContent></Card>)}
        </section>

        {workouts.length === 0 ? (
          <Card className="border-dashed"><CardContent className="p-10 text-center"><Dumbbell className="mx-auto h-11 w-11 text-muted-foreground" /><h2 className="mt-4 text-xl font-black">هنوز تمرینی ثبت نشده است</h2><p className="mt-2 text-sm text-muted-foreground">پس از پایان اولین جلسه، خلاصه کامل آن اینجا ظاهر می‌شود.</p><Button asChild className="mt-5"><Link href="/workout">شروع اولین جلسه</Link></Button></CardContent></Card>
        ) : (
          <div className="space-y-4">
            {workouts.map((workout) => {
              const validSets = workout.exercises.reduce((sum, exercise) => sum + exercise.logs.filter((log) => log.reps && log.weight).length, 0);
              return (
                <Card key={workout.id}>
                  <CardHeader className="pb-3"><div className="flex flex-wrap items-start justify-between gap-3"><div><p className="text-xs text-muted-foreground">{new Intl.DateTimeFormat("fa-IR", { dateStyle: "medium", timeStyle: "short" }).format(new Date(workout.loggedAt))}</p><CardTitle className="mt-1 text-xl">{workout.workoutName}</CardTitle></div><Button asChild variant="outline" size="sm"><Link href={`/workout-player/${workout.workoutId}`}><RefreshCw className="ml-2 h-4 w-4" />تکرار جلسه</Link></Button></div></CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 gap-3 rounded-2xl bg-muted/35 p-4 sm:grid-cols-4"><div><p className="text-xs text-muted-foreground">مدت</p><p className="mt-1 font-black">{workout.durationMinutes.toLocaleString("fa-IR")} دقیقه</p></div><div><p className="text-xs text-muted-foreground">حجم</p><p className="mt-1 font-black">{Math.round(workout.totalVolume).toLocaleString("fa-IR")} کیلوگرم</p></div><div><p className="text-xs text-muted-foreground">ست‌ها</p><p className="mt-1 font-black">{validSets.toLocaleString("fa-IR")}</p></div><div><p className="text-xs text-muted-foreground">سختی / درد</p><p className="mt-1 font-black">{workout.rpe ?? "—"} / {workout.painScale ?? 0}</p></div></div>
                    <div className="mt-4 space-y-2">{workout.exercises.map((exercise) => <div key={exercise.id} className="flex items-center justify-between gap-3 border-b py-2 text-sm last:border-0"><span className="font-medium">{exercise.name}</span><span className="text-muted-foreground">{exercise.logs.filter((log) => log.reps && log.weight).length.toLocaleString("fa-IR")} ست</span></div>)}</div>
                    {workout.notes ? <p className="mt-4 rounded-2xl border-r-4 border-primary bg-primary/5 p-4 text-sm leading-7 text-muted-foreground">{workout.notes}</p> : null}
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
