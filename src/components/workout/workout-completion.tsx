"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { AlertTriangle, Award, Check, Clock, Dumbbell, Loader2, Repeat, Trophy, Weight } from "lucide-react";
import Confetti from "react-confetti";
import { useWindowSize } from "@uidotdev/usehooks";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import type { WorkoutSession } from "./workout-player";
import { useUserData, type WorkoutLog } from "@/context/user-profile-context";
import { useToast } from "@/hooks/use-toast";
import {
  detectPersonalRecords,
  formatRecord,
  persistWorkoutRecords,
  type PersonalRecord,
} from "@/lib/workout-records";

interface WorkoutCompletionProps {
  session: WorkoutSession;
  totalDuration: number;
  onSaved?: () => void;
}

function StatCard({ icon, title, value }: { icon: React.ReactNode; title: string; value: string | number }) {
  return <div className="flex flex-col items-center justify-center rounded-2xl bg-secondary p-4 text-center"><div className="mb-2 text-primary">{icon}</div><p className="text-sm font-medium text-muted-foreground">{title}</p><p className="text-2xl font-bold text-foreground">{value}</p></div>;
}

export function WorkoutCompletion({ session, totalDuration, onSaved }: WorkoutCompletionProps) {
  const router = useRouter();
  const { width, height } = useWindowSize();
  const { saveWorkoutLog, combinedLogs } = useUserData();
  const { toast } = useToast();
  const [rpe, setRpe] = React.useState(7);
  const [painScale, setPainScale] = React.useState(0);
  const [notes, setNotes] = React.useState("");
  const [isSaving, setIsSaving] = React.useState(false);
  const [saved, setSaved] = React.useState(false);
  const [newRecords, setNewRecords] = React.useState<PersonalRecord[]>([]);

  const totalVolume = React.useMemo(() => session.exercises.reduce((total, exercise) => total + exercise.logs.reduce((subtotal, log) => {
    const reps = Number.parseInt(log.reps, 10);
    const weight = Number.parseFloat(log.weight);
    return Number.isFinite(reps) && Number.isFinite(weight) ? subtotal + reps * weight : subtotal;
  }, 0), 0), [session.exercises]);

  const totalSets = session.exercises.reduce((total, exercise) => total + exercise.logs.filter((log) => log.reps.trim() && log.weight.trim()).length, 0);

  const save = async () => {
    if (isSaving || saved) return;
    setIsSaving(true);
    try {
      const achievedAt = new Date().toISOString();
      const previousLogs = combinedLogs.filter((log): log is WorkoutLog => log.logType === "workout");
      const detectedRecords = detectPersonalRecords({ session, previousLogs, achievedAt });

      await saveWorkoutLog({
        workoutId: session.id,
        workoutName: session.title,
        durationMinutes: totalDuration,
        totalVolume,
        rpe,
        painScale,
        notes: notes.trim(),
        exercises: session.exercises.map((exercise) => ({ id: exercise.id, name: exercise.name, logs: exercise.logs })),
      });

      if (detectedRecords.length) persistWorkoutRecords(detectedRecords);
      setNewRecords(detectedRecords);
      setSaved(true);
      onSaved?.();
      toast({
        title: detectedRecords.length ? `${detectedRecords.length.toLocaleString("fa-IR")} رکورد تازه ثبت شد` : "تمرین در تاریخچه ذخیره شد",
        description: detectedRecords.length ? "رکوردها در تاریخچه تمرین قابل مشاهده‌اند." : "حجم، ست‌ها و بازخورد جلسه برای بخش پیشرفت محفوظ است.",
      });
    } catch (error) {
      console.error("Failed to save workout log", error);
      toast({ variant: "destructive", title: "ذخیره تمرین ناموفق بود", description: "دوباره تلاش کن؛ جلسه فعال هنوز روی دستگاه محفوظ است." });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <>
      {saved && width && height ? <Confetti width={width} height={height} recycle={false} numberOfPieces={350} gravity={0.1} /> : null}
      <main dir="rtl" className="flex min-h-screen w-full items-center justify-center bg-gradient-to-b from-primary/10 via-background to-background p-4 text-center">
        <div className="w-full max-w-3xl py-8">
          <Award className="mx-auto h-20 w-20 text-primary" />
          <h1 className="mt-5 text-4xl font-black tracking-tight sm:text-5xl">تمرین کامل شد!</h1>
          <p className="mt-3 text-lg text-muted-foreground">خلاصه جلسه «{session.title}» را مرور کن و بازخورد واقعی‌ات را ثبت کن.</p>

          <div className="my-7 grid grid-cols-2 gap-3 md:grid-cols-4">
            <StatCard icon={<Clock className="h-7 w-7" />} title="مدت" value={`${totalDuration.toLocaleString("fa-IR")} دقیقه`} />
            <StatCard icon={<Weight className="h-7 w-7" />} title="حجم کل" value={`${Math.round(totalVolume).toLocaleString("fa-IR")} کیلوگرم`} />
            <StatCard icon={<Repeat className="h-7 w-7" />} title="ست ثبت‌شده" value={totalSets.toLocaleString("fa-IR")} />
            <StatCard icon={<Dumbbell className="h-7 w-7" />} title="حرکت‌ها" value={session.exercises.length.toLocaleString("fa-IR")} />
          </div>

          {!saved ? (
            <Card className="text-right">
              <CardHeader><CardTitle>بازخورد جلسه</CardTitle></CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2"><div className="flex items-center justify-between"><Label htmlFor="rpe">سختی ادراک‌شده تمرین</Label><span className="font-black text-primary">{rpe.toLocaleString("fa-IR")} از ۱۰</span></div><input id="rpe" type="range" min={1} max={10} value={rpe} onChange={(event) => setRpe(Number(event.target.value))} className="w-full accent-[hsl(var(--primary))]" /><p className="text-xs text-muted-foreground">عدد ۷ یعنی تمرین چالش‌برانگیز بود اما هنوز چند تکرار ذخیره داشتی.</p></div>
                <div className="space-y-2"><div className="flex items-center justify-between"><Label htmlFor="pain">درد یا ناراحتی غیرعادی</Label><span className="font-black text-primary">{painScale.toLocaleString("fa-IR")} از ۱۰</span></div><input id="pain" type="range" min={0} max={10} value={painScale} onChange={(event) => setPainScale(Number(event.target.value))} className="w-full accent-[hsl(var(--primary))]" /></div>
                {painScale >= 4 ? <div className="flex items-start gap-3 rounded-2xl border border-amber-500/30 bg-amber-500/10 p-4"><AlertTriangle className="mt-1 h-5 w-5 shrink-0 text-amber-600" /><p className="text-sm leading-7 text-muted-foreground">درد متوسط یا بیشتر ثبت شده است. این اطلاعات باید در پیشنهاد جلسه بعدی و انتخاب جایگزین‌ها اولویت داشته باشد.</p></div> : null}
                <div className="space-y-2"><Label htmlFor="workout-notes">یادداشت جلسه</Label><Textarea id="workout-notes" value={notes} onChange={(event) => setNotes(event.target.value)} placeholder="کیفیت خواب، حرکت سخت، رکورد جدید یا نکته‌ای برای جلسه بعد" className="min-h-24" /></div>
                <Button size="lg" className="w-full" onClick={save} disabled={isSaving}>{isSaving ? <Loader2 className="ml-2 h-5 w-5 animate-spin" /> : <Check className="ml-2 h-5 w-5" />}{isSaving ? "در حال ذخیره جلسه" : "ذخیره تمرین در تاریخچه"}</Button>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {newRecords.length ? (
                <Card className="border-amber-500/30 bg-amber-500/5 text-right">
                  <CardHeader><CardTitle className="flex items-center gap-2"><Trophy className="h-5 w-5 text-amber-600" />رکوردهای تازه</CardTitle></CardHeader>
                  <CardContent className="space-y-2">{newRecords.map((record) => <div key={record.id} className="rounded-2xl border bg-background/80 p-4"><p className="font-black">{record.exerciseName}</p><p className="mt-1 text-sm text-muted-foreground">{formatRecord(record)}</p></div>)}</CardContent>
                </Card>
              ) : null}
              <Card className="border-emerald-500/30 bg-emerald-500/5"><CardContent className="p-7"><div className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-emerald-500 text-white"><Check className="h-7 w-7" /></div><h2 className="mt-4 text-2xl font-black">جلسه با موفقیت ثبت شد</h2><p className="mt-2 text-sm leading-7 text-muted-foreground">بازخورد این جلسه در تاریخچه تمرین و تحلیل‌های آینده استفاده می‌شود.</p><div className="mt-6 flex flex-col justify-center gap-3 sm:flex-row"><Button onClick={() => router.push("/today")}>بازگشت به امروز</Button><Button variant="outline" onClick={() => router.push("/workout/history")}>مشاهده تاریخچه</Button></div></CardContent></Card>
            </div>
          )}
        </div>
      </main>
    </>
  );
}
