"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Check, ChevronLeft, HelpCircle, History, SkipForward } from "lucide-react";
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

  React.useEffect(() => {
    const active = workoutPlan?.find((item) => item.id === workoutId);
    if (!active) return;
    setSession({
      id: active.id,
      title: active.title,
      exercises: active.exercises.map((exercise) => ({
        id: exercise.id,
        name: exercise.name,
        sets: exercise.sets,
        reps: exercise.reps,
        rest: Number.parseInt(exercise.rest || "90", 10) || 90,
        logs: Array.from({ length: exercise.sets }, (_, index) => ({ set: index + 1, reps: "", weight: "" })),
      })),
    });
    setStartTime(Date.now());
  }, [workoutId, workoutPlan]);

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
  if (complete && startTime) return <WorkoutCompletion session={session} totalDuration={Math.max(1, Math.round((Date.now() - startTime) / 60000))} />;
  if (resting) return <WorkoutTimer duration={exercise.rest} onComplete={() => setResting(false)} exerciseName={exercise.name} />;

  const completed = exercise.logs.filter((entry) => entry.reps.trim() && entry.weight.trim());

  return (
    <div dir="rtl" className="flex min-h-screen flex-col bg-gray-950 text-white">
      <header className="flex items-center justify-between border-b border-gray-800 p-4">
        <AlertDialog>
          <AlertDialogTrigger asChild><Button variant="ghost" size="icon"><ChevronLeft className="h-7 w-7" /></Button></AlertDialogTrigger>
          <AlertDialogContent dir="rtl"><AlertDialogHeader className="text-right"><AlertDialogTitle>پایان تمرین؟</AlertDialogTitle><AlertDialogDescription>پیشرفت ثبت‌نشدهٔ این جلسه از دست می‌رود.</AlertDialogDescription></AlertDialogHeader><AlertDialogFooter><AlertDialogCancel>ادامه تمرین</AlertDialogCancel><AlertDialogAction onClick={() => router.push("/workout")}>پایان</AlertDialogAction></AlertDialogFooter></AlertDialogContent>
        </AlertDialog>
        <div className="text-center"><h1 className="text-xl font-bold">{exercise.name}</h1><p className="text-sm text-gray-400">حرکت {exerciseIndex + 1} از {session.exercises.length}</p></div>
        <div className="flex items-center gap-2">
          <AlternativeExerciseDialog currentExerciseName={exercise.name} onSelectExercise={replaceExercise} availableEquipment={userProfile.availableEquipment || "باشگاه"} medicalLimitations={userProfile.medicalHistory || ""} />
          <Dialog>
            <DialogTrigger asChild><Button variant="ghost" size="icon" onClick={() => setGuide(getLocalExerciseDetails(exercise.name))}><HelpCircle className="h-6 w-6" /></Button></DialogTrigger>
            <DialogContent dir="rtl" className="max-w-2xl"><DialogHeader className="text-right"><DialogTitle>راهنمای فرم: {exercise.name}</DialogTitle><DialogDescription>{guide?.summary}</DialogDescription></DialogHeader>{guide && <div className="space-y-5 text-sm leading-7"><section><h3 className="font-bold">مراحل اجرا</h3><ol className="list-decimal space-y-1 pr-5">{guide.instructions.map((item) => <li key={item}>{item}</li>)}</ol></section><section><h3 className="font-bold">نکات فرم</h3><ul className="list-disc space-y-1 pr-5">{guide.formTips.map((item) => <li key={item}>{item}</li>)}</ul></section></div>}</DialogContent>
          </Dialog>
        </div>
      </header>

      <main className="flex flex-1 flex-col gap-5 overflow-y-auto p-4">
        <div className="flex gap-2">{exercise.logs.map((_, index) => <div key={index} className={`h-2 flex-1 rounded-full ${index < setIndex ? "bg-primary" : index === setIndex ? "bg-primary/50" : "bg-gray-700"}`} />)}</div>
        <h2 className="text-center text-5xl font-bold text-primary">ست {setIndex + 1}</h2>
        <Card className="border-gray-800 bg-gray-900/50"><CardContent className="grid grid-cols-2 gap-4 p-4"><label className="text-center text-sm text-gray-400">وزنه (کیلوگرم)<Input type="number" value={log.weight} onChange={(event) => updateLog("weight", event.target.value)} className="mt-2 h-20 bg-gray-800 text-center text-4xl font-bold text-white" /></label><label className="text-center text-sm text-gray-400">تکرار<Input type="number" placeholder={exercise.reps} value={log.reps} onChange={(event) => updateLog("reps", event.target.value)} className="mt-2 h-20 bg-gray-800 text-center text-4xl font-bold text-white" /></label></CardContent></Card>

        {completed.length > 0 && <section><div className="mb-2 flex items-center gap-2 text-gray-400"><History className="h-5 w-5" /><h3 className="font-semibold">ست‌های ثبت‌شده</h3></div><Table><TableHeader><TableRow><TableHead>ست</TableHead><TableHead>وزنه</TableHead><TableHead>تکرار</TableHead></TableRow></TableHeader><TableBody>{completed.map((entry) => <TableRow key={entry.set}><TableCell>{entry.set}</TableCell><TableCell>{entry.weight} kg</TableCell><TableCell>{entry.reps}</TableCell></TableRow>)}</TableBody></Table></section>}

        <div className="mt-auto flex items-center justify-between pt-4"><div /><Button className="h-20 w-20 rounded-full" onClick={nextSet} disabled={!validLog}><Check className="h-10 w-10" /></Button><Button variant="ghost" size="icon" onClick={nextExercise}><SkipForward className="h-6 w-6" /></Button></div>
      </main>
    </div>
  );
}
