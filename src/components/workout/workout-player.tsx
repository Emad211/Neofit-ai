"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Check, ChevronLeft, HelpCircle, History, Save, SkipForward } from "lucide-react";
import { getLocalExerciseDetails } from "@/lib/neofit-demo-data";
import type { ExerciseDetails } from "@/lib/neofit-models";
import { useUserData } from "@/context/user-profile-context";
import { WorkoutTimer } from "./workout-timer";
import { AlternativeExerciseDialog } from "./alternative-exercise-dialog";
import { WorkoutCompletion } from "./workout-completion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";

export type Log = { set: number; reps: string; weight: string };
export type Exercise = { id: string; name: string; sets: number; reps: string; rest: number; logs: Log[] };
export type WorkoutSession = { id: string; title: string; exercises: Exercise[] };
type PersistedWorkoutSession = { session: WorkoutSession; exerciseIndex: number; setIndex: number; startTime: number; updatedAt: string };

const persianDigits: Record<string, string> = { "۰": "0", "۱": "1", "۲": "2", "۳": "3", "۴": "4", "۵": "5", "۶": "6", "۷": "7", "۸": "8", "۹": "9" };
function numeric(value: string | undefined, fallback: number) {
  const normalized = String(value || "").replace(/[۰-۹]/g, (digit) => persianDigits[digit] || digit);
  return Number.parseInt(normalized.match(/\d+/)?.[0] || String(fallback), 10);
}

export function WorkoutPlayer({ workoutId }: { workoutId: string }) {
  const { workoutPlan, userProfile } = useUserData();
  const router = useRouter();
  const [session, setSession] = React.useState<WorkoutSession | null>(null);
  const [exerciseIndex, setExerciseIndex] = React.useState(0);
  const [setIndex, setSetIndex] = React.useState(0);
  const [resting, setResting] = React.useState(false);
  const [complete, setComplete] = React.useState(false);
  const [startTime, setStartTime] = React.useState<number | null>(null);
  const [guide, setGuide] = React.useState<ExerciseDetails | null>(null);
  const [resumed, setResumed] = React.useState(false);
  const storageKey = React.useMemo(() => `neofit:active-workout:${workoutId}`, [workoutId]);

  React.useEffect(() => {
    const active = workoutPlan?.find((item) => item.id === workoutId);
    if (!active) return;

    try {
      const raw = window.localStorage.getItem(storageKey);
      if (raw) {
        const stored = JSON.parse(raw) as PersistedWorkoutSession;
        if (stored.session?.id === workoutId && stored.session.exercises?.length) {
          setSession(stored.session);
          setExerciseIndex(Math.min(stored.exerciseIndex || 0, stored.session.exercises.length - 1));
          const activeExercise = stored.session.exercises[Math.min(stored.exerciseIndex || 0, stored.session.exercises.length - 1)];
          setSetIndex(Math.min(stored.setIndex || 0, Math.max(0, activeExercise.logs.length - 1)));
          setStartTime(stored.startTime || Date.now());
          setResumed(true);
          return;
        }
      }
    } catch {
      window.localStorage.removeItem(storageKey);
    }

    setSession({
      id: active.id,
      title: active.title,
      exercises: active.exercises.map((exercise) => ({
        id: exercise.id,
        name: exercise.name,
        sets: exercise.sets,
        reps: exercise.reps,
        rest: numeric(exercise.rest, 90),
        logs: Array.from({ length: exercise.sets }, (_, index) => ({ set: index + 1, reps: "", weight: "" })),
      })),
    });
    setExerciseIndex(0);
    setSetIndex(0);
    setStartTime(Date.now());
    setResumed(false);
  }, [storageKey, workoutId, workoutPlan]);

  React.useEffect(() => {
    if (!session || !startTime || complete) return;
    const value: PersistedWorkoutSession = { session, exerciseIndex, setIndex, startTime, updatedAt: new Date().toISOString() };
    window.localStorage.setItem(storageKey, JSON.stringify(value));
    window.dispatchEvent(new CustomEvent("neofit:active-workout-changed", { detail: value }));
  }, [complete, exerciseIndex, session, setIndex, startTime, storageKey]);

  const clearSession = React.useCallback(() => {
    window.localStorage.removeItem(storageKey);
    window.dispatchEvent(new CustomEvent("neofit:active-workout-changed", { detail: null }));
  }, [storageKey]);

  const exercise = session?.exercises[exerciseIndex];
  const log = exercise?.logs[setIndex];
  const validLog = Boolean(log?.reps.trim() && log?.weight.trim());

  const updateLog = (field: "reps" | "weight", value: string) => {
    setSession((current) => {
      if (!current) return current;
      const exercises = current.exercises.map((item, itemIndex) => itemIndex !== exerciseIndex ? item : {
        ...item,
        logs: item.logs.map((entry, entryIndex) => entryIndex === setIndex ? { ...entry, [field]: value } : entry),
      });
      return { ...current, exercises };
    });
  };

  const nextSet = () => {
    if (!session || !exercise || !validLog) return;
    if (setIndex < exercise.logs.length - 1) {
      setSetIndex((value) => value + 1);
      setResting(true);
      return;
    }
    if (exerciseIndex < session.exercises.length - 1) {
      setExerciseIndex((value) => value + 1);
      setSetIndex(0);
      setGuide(null);
      setResting(true);
      return;
    }
    setComplete(true);
  };

  const nextExercise = () => {
    if (!session || exerciseIndex >= session.exercises.length - 1) return;
    setExerciseIndex((value) => value + 1);
    setSetIndex(0);
    setGuide(null);
    setResting(false);
  };

  const replaceExercise = (name: string) => {
    setSession((current) => {
      if (!current) return current;
      return { ...current, exercises: current.exercises.map((item, index) => index === exerciseIndex ? { ...item, name, logs: item.logs.map((entry) => ({ ...entry, reps: "", weight: "" })) } : item) };
    });
    setGuide(null);
  };

  if (!session || !exercise || !log || !userProfile) return <div className="h-screen bg-gray-950 p-4"><Skeleton className="h-full w-full" /></div>;
  if (complete && startTime) return <WorkoutCompletion session={session} totalDuration={Math.max(1, Math.round((Date.now() - startTime) / 60000))} onSaved={clearSession} />;
  if (resting) return <WorkoutTimer duration={exercise.rest} onComplete={() => setResting(false)} exerciseName={exercise.name} />;

  const completed = exercise.logs.filter((entry) => entry.reps.trim() && entry.weight.trim());

  return (
    <div dir="rtl" className="flex min-h-screen flex-col bg-gray-950 text-white">
      <header className="flex items-center justify-between border-b border-gray-800 p-4">
        <AlertDialog>
          <AlertDialogTrigger asChild><Button variant="ghost" size="icon" aria-label="خروج از تمرین"><ChevronLeft className="h-7 w-7" /></Button></AlertDialogTrigger>
          <AlertDialogContent dir="rtl">
            <AlertDialogHeader className="text-right"><AlertDialogTitle>از تمرین خارج می‌شوی؟</AlertDialogTitle><AlertDialogDescription>ست‌ها و جایگاه فعلی خودکار روی همین دستگاه ذخیره شده‌اند و می‌توانی بعداً ادامه بدهی.</AlertDialogDescription></AlertDialogHeader>
            <AlertDialogFooter className="gap-2"><AlertDialogCancel>بازگشت به تمرین</AlertDialogCancel><Button variant="outline" onClick={() => router.push("/workout")}>خروج و ادامه بعداً</Button><AlertDialogAction onClick={() => { clearSession(); router.push("/workout"); }}>حذف این جلسه</AlertDialogAction></AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
        <div className="text-center"><h1 className="text-xl font-bold">{exercise.name}</h1><p className="text-sm text-gray-400">حرکت {exerciseIndex + 1} از {session.exercises.length}</p><p className="mt-1 inline-flex items-center gap-1 text-[11px] text-emerald-400"><Save className="h-3 w-3" />{resumed ? "جلسه بازیابی و ذخیره خودکار فعال است" : "ذخیره خودکار فعال است"}</p></div>
        <div className="flex items-center gap-2">
          <AlternativeExerciseDialog currentExerciseName={exercise.name} onSelectExercise={replaceExercise} availableEquipment={userProfile.availableEquipment || "باشگاه"} medicalLimitations={userProfile.medicalHistory || ""} />
          <Dialog>
            <DialogTrigger asChild><Button variant="ghost" size="icon" onClick={() => setGuide(getLocalExerciseDetails(exercise.name))} aria-label="راهنمای حرکت"><HelpCircle className="h-6 w-6" /></Button></DialogTrigger>
            <DialogContent dir="rtl" className="max-w-2xl"><DialogHeader className="text-right"><DialogTitle>راهنمای فرم: {exercise.name}</DialogTitle><DialogDescription>{guide?.summary}</DialogDescription></DialogHeader>{guide ? <div className="space-y-5 text-sm leading-7"><section><h3 className="font-bold">مراحل اجرا</h3><ol className="list-decimal space-y-1 pr-5">{guide.instructions.map((item) => <li key={item}>{item}</li>)}</ol></section><section><h3 className="font-bold">نکات فرم</h3><ul className="list-disc space-y-1 pr-5">{guide.formTips.map((item) => <li key={item}>{item}</li>)}</ul></section></div> : null}</DialogContent>
          </Dialog>
        </div>
      </header>

      <main className="flex flex-1 flex-col gap-5 overflow-y-auto p-4">
        <div className="flex gap-2">{exercise.logs.map((_, index) => <div key={index} className={`h-2 flex-1 rounded-full ${index < setIndex ? "bg-primary" : index === setIndex ? "bg-primary/50" : "bg-gray-700"}`} />)}</div>
        <h2 className="text-center text-5xl font-bold text-primary">ست {setIndex + 1}</h2>
        <Card className="border-gray-800 bg-gray-900/50"><CardContent className="grid grid-cols-2 gap-4 p-4"><label className="text-center text-sm text-gray-400">وزنه (کیلوگرم)<Input type="number" min={0} value={log.weight} onChange={(event) => updateLog("weight", event.target.value)} className="mt-2 h-20 bg-gray-800 text-center text-4xl font-bold text-white" /></label><label className="text-center text-sm text-gray-400">تکرار<Input type="number" min={1} placeholder={exercise.reps} value={log.reps} onChange={(event) => updateLog("reps", event.target.value)} className="mt-2 h-20 bg-gray-800 text-center text-4xl font-bold text-white" /></label></CardContent></Card>

        {completed.length > 0 ? <section><div className="mb-2 flex items-center gap-2 text-gray-400"><History className="h-5 w-5" /><h3 className="font-semibold">ست‌های ثبت‌شده</h3></div><Table><TableHeader><TableRow><TableHead>ست</TableHead><TableHead>وزنه</TableHead><TableHead>تکرار</TableHead></TableRow></TableHeader><TableBody>{completed.map((entry) => <TableRow key={entry.set}><TableCell>{entry.set}</TableCell><TableCell>{entry.weight} کیلوگرم</TableCell><TableCell>{entry.reps}</TableCell></TableRow>)}</TableBody></Table></section> : null}

        <div className="mt-auto flex items-center justify-between pt-4"><div /><Button className="h-20 w-20 rounded-full" onClick={nextSet} disabled={!validLog} aria-label="ثبت ست و ادامه"><Check className="h-10 w-10" /></Button><Button variant="ghost" size="icon" onClick={nextExercise} disabled={exerciseIndex >= session.exercises.length - 1} aria-label="رفتن به حرکت بعد"><SkipForward className="h-6 w-6" /></Button></div>
      </main>
    </div>
  );
}
