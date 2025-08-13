
"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  ChevronLeft,
  HelpCircle,
  SkipForward,
  Check,
  History,
  Loader2,
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
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../ui/table";
import { getExerciseDetails, GetExerciseDetailsOutput } from "@/ai/flows/get-exercise-details";
import { YouTubePlayer } from "./youtube-player";
import { ScrollArea } from "../ui/scroll-area";


export type Log = { set: number; reps: string; weight: string };
export type Exercise = {
  id: string;
  name: string;
  videoUrl?: string; 
  dataAiHint?: string;
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

  // New state for AI Form Guide
  const [formGuide, setFormGuide] = React.useState<GetExerciseDetailsOutput | null>(null);
  const [isFormGuideLoading, setIsFormGuideLoading] = React.useState(false);
  const [formGuideError, setFormGuideError] = React.useState<string | null>(null);
  const [isFormGuideDialogOpen, setIsFormGuideDialogOpen] = React.useState(false);


  React.useEffect(() => {
    if (workoutPlan) {
      const activeWorkout = workoutPlan.find(w => w.id === workoutId);
      if (activeWorkout) {
        const exercisesWithLogs: Exercise[] = activeWorkout.exercises.map((ex, exIndex) => ({
          ...ex,
          id: `${workoutId}-${exIndex}`,
          rest: 90,
          sets: parseInt(ex.sets, 10) || 3,
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
  
  const currentExercise = session?.exercises[currentExerciseIndex];
  const currentLog = currentExercise?.logs[currentSetIndex];
  const isSetLogComplete = currentLog && currentLog.reps.trim() !== '' && currentLog.weight.trim() !== '';

  const handleFetchFormGuide = async () => {
    if (!currentExercise || !userProfile) return;
    setIsFormGuideLoading(true);
    setFormGuideError(null);
    setFormGuide(null);
    try {
        const details = await getExerciseDetails({
            exerciseName: currentExercise.name,
            geminiApiKey: userProfile.geminiApiKey,
        });
        setFormGuide(details);
    } catch (error) {
        console.error("Failed to fetch form guide:", error);
        setFormGuideError("Sorry, we couldn't fetch the guide right now. Please try again.");
    } finally {
        setIsFormGuideLoading(false);
    }
  };


  const handleLogChange = (field: 'reps' | 'weight', value: string) => {
    if (!session) return;
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
        // Reset form guide for the new exercise
        setFormGuide(null);
        return { ...prevSession, exercises: newExercises };
    });
  };

  const handleNextSet = () => {
    if (!isSetLogComplete || !currentExercise || !session) return;

    if (currentSetIndex < currentExercise.logs.length - 1) {
      setCurrentSetIndex(currentSetIndex + 1);
      setIsResting(true);
    } else {
      if (currentExerciseIndex < session.exercises.length - 1) {
        setCurrentExerciseIndex(currentExerciseIndex + 1);
        setCurrentSetIndex(0);
        setFormGuide(null); // Reset form guide for next exercise
        setIsResting(true);
      } else {
        setIsWorkoutComplete(true);
      }
    }
  };

  const handleNextExercise = () => {
     if (!session) return;
    if (currentExerciseIndex < session.exercises.length - 1) {
      setCurrentExerciseIndex(currentExerciseIndex + 1);
      setCurrentSetIndex(0);
      setFormGuide(null);
      setIsResting(false);
    }
  };

  const completedSets = currentExercise?.logs.filter(log => log.reps.trim() !== '' && log.weight.trim() !== '');

  if (!session || !userProfile || !currentExercise) {
    return (
        <div className="flex h-screen flex-col bg-gray-950 text-white p-4">
           <Skeleton className="h-full w-full" />
        </div>
    )
  }
  
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
      <header className="flex items-center justify-between p-4 border-b border-gray-800">
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
            Exercise {currentExerciseIndex + 1} of {session.exercises.length}
          </p>
        </div>
        <div className="flex justify-end items-center gap-2">
           <AlternativeExerciseDialog
            currentExerciseName={currentExercise.name}
            onSelectExercise={handleReplaceExercise}
            availableEquipment={userProfile.availableEquipment || 'gym'}
            medicalLimitations={userProfile.medicalHistory || 'none'}
          />
          <Dialog open={isFormGuideDialogOpen} onOpenChange={setIsFormGuideDialogOpen}>
              <DialogTrigger asChild>
                  <Button variant="ghost" size="icon" onClick={handleFetchFormGuide}>
                    <HelpCircle className="h-6 w-6" />
                  </Button>
              </DialogTrigger>
              <DialogContent className="max-w-3xl">
                  <DialogHeader>
                      <DialogTitle>Form Guide: {currentExercise.name}</DialogTitle>
                  </DialogHeader>
                  {isFormGuideLoading && (
                      <div className="flex items-center justify-center h-48">
                          <Loader2 className="h-8 w-8 animate-spin text-primary" />
                      </div>
                  )}
                  {formGuideError && <p className="text-destructive">{formGuideError}</p>}
                  {formGuide && (
                      <ScrollArea className="max-h-[60vh] pr-4">
                        <p className="whitespace-pre-wrap text-muted-foreground">{formGuide.description}</p>
                      </ScrollArea>
                  )}
              </DialogContent>
          </Dialog>
        </div>
      </header>

      <div className="flex flex-col md:flex-row flex-grow min-h-0">
          {/* Left Column: Video Player */}
          <div className="w-full md:w-1/2 lg:w-3/5 p-4 flex flex-col items-center justify-center bg-black">
              <YouTubePlayer url={formGuide?.youtubeUrl} />
          </div>

          {/* Right Column: Controls & History */}
          <main className="w-full md:w-1/2 lg:w-2/5 flex flex-col space-y-4 p-4 overflow-y-auto">
            <div className="flex justify-center gap-2">
                {Array.from({ length: currentExercise.logs.length }).map((_, index) => (
                <div
                    key={index}
                    className={`h-2 flex-1 rounded-full ${
                    index < currentSetIndex
                        ? "bg-primary"
                        : index === currentSetIndex
                        ? "bg-primary/50"
                        : "bg-gray-700"
                    }`}
                />
                ))}
            </div>

            <div className="text-center">
                <h2 className="text-5xl font-bold text-primary">
                    Set {currentSetIndex + 1}
                </h2>
            </div>
            
            <Card className="bg-gray-900/50 border-gray-800">
                <CardContent className="grid grid-cols-2 gap-4 p-4">
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
                </CardContent>
            </Card>
            
            {completedSets.length > 0 && (
                <div className="flex-grow flex flex-col min-h-0">
                    <div className="flex items-center gap-2 text-muted-foreground mb-2">
                        <History className="h-5 w-5" />
                        <h3 className="font-semibold">Set History</h3>
                    </div>
                    <div className="flex-grow rounded-lg bg-gray-900/50 p-2 overflow-y-auto">
                        <Table>
                            <TableHeader>
                                <TableRow className="border-gray-800 hover:bg-gray-800/20">
                                    <TableHead className="w-[80px]">Set</TableHead>
                                    <TableHead>Weight</TableHead>
                                    <TableHead className="text-right">Reps</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {completedSets.map((log, index) => (
                                    <TableRow key={index} className="border-gray-800 hover:bg-gray-800/20">
                                    <TableCell className="font-medium">{log.set}</TableCell>
                                    <TableCell>{log.weight} kg</TableCell>
                                    <TableCell className="text-right">{log.reps}</TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </div>
                </div>
            )}
             <div className="mt-auto flex items-center justify-between pt-4">
                <div>{/* Placeholder for alignment */}</div>
                <Button
                    className="h-20 w-20 rounded-full bg-primary text-primary-foreground shadow-lg hover:bg-primary/90 disabled:bg-gray-700"
                    onClick={handleNextSet}
                    disabled={!isSetLogComplete}
                >
                    <Check className="h-10 w-10" />
                </Button>
                <Button variant="ghost" size="icon" onClick={handleNextExercise}>
                    <SkipForward className="h-6 w-6" />
                </Button>
             </div>
          </main>
      </div>
    </div>
  );
}
