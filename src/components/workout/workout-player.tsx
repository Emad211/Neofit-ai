
"use client";

import * as React from "react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  ChevronLeft,
  HelpCircle,
  SkipForward,
  Check,
} from "lucide-react";
import { WorkoutTimer } from "./workout-timer";
import { AlternativeExerciseDialog } from "./alternative-exercise-dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "../ui/alert-dialog";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { useRouter } from "next/navigation";
import { WorkoutCompletion } from "./workout-completion";
import { useUserData } from "@/context/user-profile-context";
import { Skeleton } from "../ui/skeleton";


export type Log = { set: number; reps: string; weight: string };
export type Exercise = {
  id: string;
  name: string;
  videoUrl?: string; // Made optional for robustness
  dataAiHint?: string; // Made optional
  sets: number;
  reps: string;
  rest: number;
  logs: Log[];
};

export type WorkoutSession = {
  id: string;
  title: string;
  exercises: Exercise[];
}


export function WorkoutPlayer({ workoutId }: { workoutId: string }) {
  const { workoutPlan, userProfile } = useUserData();
  const router = useRouter();
  
  const [session, setSession] = React.useState<WorkoutSession | null>(null);
  const [currentExerciseIndex, setCurrentExerciseIndex] = React.useState(0);
  const [currentSetIndex, setCurrentSetIndex] = React.useState(0);
  const [isResting, setIsResting] = React.useState(false);
  const [isWorkoutComplete, setIsWorkoutComplete] = React.useState(false);
  const [startTime, setStartTime] = React.useState<number | null>(null);

  React.useEffect(() => {
    if (workoutPlan) {
      const activeWorkout = workoutPlan.find(w => w.id === workoutId);
      if (activeWorkout) {
        // Initialize the session with logs placeholder
        const exercisesWithLogs: Exercise[] = activeWorkout.exercises.map((ex, exIndex) => ({
          ...ex,
          id: `${workoutId}-${exIndex}`, // Create a unique ID for the exercise instance
          videoUrl: "/placehold.co/1280x720.png", // Placeholder
          dataAiHint: ex.name.toLowerCase(), // Basic hint
          rest: 90, // Default rest
          sets: parseInt(ex.sets, 10) || 3, // Ensure sets is a number
          logs: Array.from({ length: parseInt(ex.sets, 10) || 3 }, (_, i) => ({
            set: i + 1,
            reps: '',
            weight: ''
          }))
        }));

        setSession({
          id: activeWorkout.id,
          title: activeWorkout.title,
          exercises: exercisesWithLogs,
        });
        setStartTime(Date.now());
      }
    }
  }, [workoutId, workoutPlan]);
  
  if (!session || !userProfile) {
    return (
        <div className="flex h-screen flex-col bg-gray-950 text-white">
            <header className="flex items-center justify-between p-4"><Skeleton className="h-8 w-8 rounded-full" /><Skeleton className="h-6 w-32" /><Skeleton className="h-8 w-10" /></header>
            <Skeleton className="relative aspect-video w-full" />
            <div className="flex justify-center gap-2 p-4"><Skeleton className="h-2 w-8 rounded-full" /><Skeleton className="h-2 w-8 rounded-full" /><Skeleton className="h-2 w-8 rounded-full" /></div>
            <main className="flex-grow space-y-6 p-4">
                <Skeleton className="h-10 w-24 mx-auto" />
                <div className="grid grid-cols-2 gap-4">
                     <Skeleton className="h-28 w-full" />
                     <Skeleton className="h-28 w-full" />
                </div>
            </main>
            <footer className="grid grid-cols-3 items-center gap-4 p-4"><Skeleton className="h-10 w-24" /><Skeleton className="h-20 w-20 rounded-full" /><Skeleton className="h-10 w-10 justify-self-end" /></footer>
        </div>
    )
  }

  const currentExercise = session.exercises[currentExerciseIndex];
  const currentLog = currentExercise.logs[currentSetIndex];
  const isSetLogComplete = currentLog && currentLog.reps.trim() !== '' && currentLog.weight.trim() !== '';


  const handleLogChange = (field: 'reps' | 'weight', value: string) => {
    const newSession = { ...session };
    newSession.exercises[currentExerciseIndex].logs[currentSetIndex][field] = value;
    setSession(newSession as WorkoutSession);
  }
  
  const handleReplaceExercise = (newExerciseName: string) => {
    setSession(prevSession => {
        if (!prevSession) return null;
        const newExercises = [...prevSession.exercises];
        newExercises[currentExerciseIndex] = {
            ...newExercises[currentExerciseIndex],
            name: newExerciseName,
            logs: newExercises[currentExerciseIndex].logs.map(log => ({ ...log, reps: '', weight: '' }))
        };
        return { ...prevSession, exercises: newExercises };
    });
  };

  const handleNextSet = () => {
    if (!isSetLogComplete) return; // Prevent advancing without logging

    if (currentSetIndex < currentExercise.logs.length - 1) {
      setCurrentSetIndex(currentSetIndex + 1);
      setIsResting(true);
    } else {
      if (currentExerciseIndex < session.exercises.length - 1) {
        setCurrentExerciseIndex(currentExerciseIndex + 1);
        setCurrentSetIndex(0);
        setIsResting(true);
      } else {
        setIsWorkoutComplete(true);
      }
    }
  };

  const handleNextExercise = () => {
    if (currentExerciseIndex < session.exercises.length - 1) {
      setCurrentExerciseIndex(currentExerciseIndex + 1);
      setCurrentSetIndex(0);
      setIsResting(false);
    }
  };

  if(isWorkoutComplete && startTime) {
    const totalDuration = Math.round((Date.now() - startTime) / 60000); // in minutes
    return <WorkoutCompletion session={session} totalDuration={totalDuration} />
  }

  if (isResting) {
    const isLastSetOfExercise = currentSetIndex === currentExercise.logs.length;
    const nextExercise = currentExerciseIndex < session.exercises.length - 1 && isLastSetOfExercise
      ? session.exercises[currentExerciseIndex + 1] 
      : currentExercise;
    
    let nextUpMessage = isLastSetOfExercise ? `Next: ${nextExercise.name}` : `Next: Set ${currentSetIndex + 1}`;

    return (
      <WorkoutTimer
        duration={currentExercise.rest}
        onComplete={() => setIsResting(false)}
        exerciseName={nextUpMessage}
      />
    );
  }

  return (
    <div className="flex h-screen flex-col bg-gray-950 text-white">
      <header className="flex items-center justify-between p-4">
        <AlertDialog>
          <AlertDialogTrigger asChild>
             <Button variant="ghost" size="icon">
              <ChevronLeft className="h-8 w-8" />
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>End Workout?</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to end your workout session? Your progress
                so far will not be saved.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={() => router.push("/workout")}>
                End Workout
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
        <div className="text-center">
          <h1 className="text-xl font-bold">{currentExercise.name}</h1>
          <p className="text-sm text-gray-400">
            {currentExerciseIndex + 1} / {session.exercises.length}
          </p>
        </div>
        <div className="w-10"></div>
      </header>

      <div className="relative aspect-video w-full">
        <Image
          src={currentExercise.videoUrl || `https://placehold.co/1280x720.png`}
          alt={currentExercise.name}
          layout="fill"
          objectFit="cover"
          data-ai-hint={currentExercise.dataAiHint || 'exercise video'}
        />
      </div>

      <div className="flex justify-center gap-2 p-4">
        {Array.from({ length: currentExercise.logs.length }).map((_, index) => (
          <div
            key={index}
            className={`h-2 w-8 rounded-full ${
              index < currentSetIndex
                ? "bg-primary"
                : index === currentSetIndex
                ? "bg-primary/50"
                : "bg-gray-700"
            }`}
          />
        ))}
      </div>

      <main className="flex-grow space-y-6 p-4">
        <div className="text-center">
          <h2 className="text-4xl font-bold text-primary">
            Set {currentSetIndex + 1}
          </h2>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div className="text-center">
            <label
              htmlFor="weight"
              className="text-sm font-medium text-gray-400"
            >
              Weight (kg)
            </label>
            <Input
              id="weight"
              type="number"
              placeholder="--"
              value={currentLog.weight}
              onChange={(e) => handleLogChange('weight', e.target.value)}
              className="mt-1 h-20 w-full bg-gray-800 text-center text-4xl font-bold text-white [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
            />
          </div>
          <div className="text-center">
            <label
              htmlFor="reps"
              className="text-sm font-medium text-gray-400"
            >
              Reps
            </label>
            <Input
              id="reps"
              type="number"
              placeholder={currentExercise.reps}
              value={currentLog.reps}
              onChange={(e) => handleLogChange('reps', e.target.value)}
              className="mt-1 h-20 w-full bg-gray-800 text-center text-4xl font-bold text-white [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
            />
          </div>
        </div>
      </main>

      <footer className="grid grid-cols-3 items-center gap-4 p-4">
        <div className="flex justify-start gap-2">
          <AlternativeExerciseDialog
            currentExerciseName={currentExercise.name}
            onSelectExercise={handleReplaceExercise}
            availableEquipment={userProfile.availableEquipment || 'gym'}
            medicalLimitations={userProfile.medicalHistory || 'none'}
          />
          <Dialog>
              <DialogTrigger asChild>
                  <Button variant="ghost" size="icon">
                    <HelpCircle className="h-6 w-6" />
                  </Button>
              </DialogTrigger>
              <DialogContent>
                  <DialogHeader>
                      <DialogTitle>Form Guide: {currentExercise.name}</DialogTitle>
                      <DialogDescription>
                          A detailed video with audio commentary explaining the correct form for this exercise would be displayed here to ensure safety and effectiveness.
                      </DialogDescription>
                  </DialogHeader>
              </DialogContent>
          </Dialog>
        </div>
        <div className="text-center">
          <Button
            className="h-20 w-20 rounded-full bg-primary text-primary-foreground shadow-lg hover:bg-primary/90 disabled:bg-gray-700"
            onClick={handleNextSet}
            disabled={!isSetLogComplete}
          >
            <Check className="h-10 w-10" />
          </Button>
        </div>
        <div className="flex justify-end">
          <Button variant="ghost" size="icon" onClick={handleNextExercise}>
            <SkipForward className="h-6 w-6" />
          </Button>
        </div>
      </footer>
    </div>
  );
}
