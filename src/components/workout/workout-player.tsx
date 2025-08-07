
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
import { useRouter } from "next/navigation";

// Mock data for a single workout session
const initialWorkoutSession = {
  id: "full-body-a",
  name: "Full Body Strength A",
  exercises: [
    {
      id: "ex1",
      name: "Barbell Squats",
      videoUrl: "/placehold.co/1280x720.png",
      dataAiHint: "barbell squat",
      sets: 3,
      reps: "8-12",
      rest: 90,
      logs: [
        { set: 1, reps: "", weight: "" },
        { set: 2, reps: "", weight: "" },
        { set: 3, reps: "", weight: "" },
      ],
    },
    {
      id: "ex2",
      name: "Bench Press",
      videoUrl: "/placehold.co/1280x720.png",
      dataAiHint: "bench press",
      sets: 3,
      reps: "8-12",
      rest: 90,
      logs: [
        { set: 1, reps: "", weight: "" },
        { set: 2, reps: "", weight: "" },
        { set: 3, reps: "", weight: "" },
      ],
    },
    {
      id: "ex3",
      name: "Bent Over Rows",
      videoUrl: "/placehold.co/1280x720.png",
      dataAiHint: "bent over row",
      sets: 3,
      reps: "8-12",
      rest: 90,
      logs: [
        { set: 1, reps: "", weight: "" },
        { set: 2, reps: "", weight: "" },
        { set: 3, reps: "", weight: "" },
      ],
    },
  ],
};

type WorkoutSession = typeof initialWorkoutSession;

export function WorkoutPlayer({ workoutId }: { workoutId: string }) {
  const [session, setSession] = React.useState<WorkoutSession>(initialWorkoutSession);
  const [currentExerciseIndex, setCurrentExerciseIndex] = React.useState(0);
  const [currentSetIndex, setCurrentSetIndex] = React.useState(0);
  const [isResting, setIsResting] = React.useState(false);
  const router = useRouter();

  const currentExercise = session.exercises[currentExerciseIndex];

  const handleLogChange = (field: 'reps' | 'weight', value: string) => {
    const newSession = { ...session };
    newSession.exercises[currentExerciseIndex].logs[currentSetIndex][field] = value;
    setSession(newSession);
  }
  
  const handleReplaceExercise = (newExerciseName: string) => {
    setSession(prevSession => {
        const newExercises = [...prevSession.exercises];
        newExercises[currentExerciseIndex] = {
            ...newExercises[currentExerciseIndex],
            name: newExerciseName,
            // Optionally reset logs or adjust other properties
            logs: newExercises[currentExerciseIndex].logs.map(log => ({ ...log, reps: '', weight: '' }))
        };
        return { ...prevSession, exercises: newExercises };
    });
  };

  const handleNextSet = () => {
    // This is where you would persist the log data for the completed set
    console.log(`Logging set ${currentSetIndex + 1} for ${currentExercise.name}:`, currentExercise.logs[currentSetIndex]);

    if (currentSetIndex < currentExercise.sets - 1) {
      setCurrentSetIndex(currentSetIndex + 1);
    } else {
      // Last set of the exercise, move to next exercise
      if (currentExerciseIndex < session.exercises.length - 1) {
        setCurrentExerciseIndex(currentExerciseIndex + 1);
        setCurrentSetIndex(0);
      } else {
        // Workout finished
        alert("Workout Complete!");
        // Here you would save the entire session log
        console.log("Final workout session log:", session);
        router.push("/today");
        return; // prevent setting rest state
      }
    }
    setIsResting(true);
  };

  const handleNextExercise = () => {
    if (currentExerciseIndex < session.exercises.length - 1) {
      setCurrentExerciseIndex(currentExerciseIndex + 1);
      setCurrentSetIndex(0);
      setIsResting(false);
    }
  };

  const handlePrevExercise = () => {
    if (currentExerciseIndex > 0) {
      setCurrentExerciseIndex(currentExerciseIndex - 1);
      setCurrentSetIndex(0);
      setIsResting(false);
    }
  };

  if (isResting) {
    const nextExercise = session.exercises[currentExerciseIndex];
    const isLastSetOfExercise = currentSetIndex === 0;

    let nextUpMessage = `Next: ${nextExercise.name}`;
    if (!isLastSetOfExercise) {
       nextUpMessage = `Next: Set ${currentSetIndex + 1}`;
    }

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
      {/* Header */}
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
                so far will be saved.
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

      {/* Video */}
      <div className="relative aspect-video w-full">
        <Image
          src={`https://${currentExercise.videoUrl.replace(/^\/+/, '')}`}
          alt={currentExercise.name}
          layout="fill"
          objectFit="cover"
          data-ai-hint={currentExercise.dataAiHint}
        />
      </div>

      {/* Set Tracker */}
      <div className="flex justify-center gap-2 p-4">
        {Array.from({ length: currentExercise.sets }).map((_, index) => (
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

      {/* Inputs */}
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
              value={currentExercise.logs[currentSetIndex].weight}
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
              value={currentExercise.logs[currentSetIndex].reps}
              onChange={(e) => handleLogChange('reps', e.target.value)}
              className="mt-1 h-20 w-full bg-gray-800 text-center text-4xl font-bold text-white [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
            />
          </div>
        </div>
      </main>

      {/* Footer Actions */}
      <footer className="grid grid-cols-3 items-center gap-4 p-4">
        <div className="flex justify-start gap-2">
          <AlternativeExerciseDialog
            currentExerciseName={currentExercise.name}
            onSelectExercise={handleReplaceExercise}
          />
          <Button variant="ghost" size="icon">
            <HelpCircle className="h-6 w-6" />
          </Button>
        </div>
        <div className="text-center">
          <Button
            className="h-20 w-20 rounded-full bg-primary text-primary-foreground shadow-lg hover:bg-primary/90"
            onClick={handleNextSet}
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
