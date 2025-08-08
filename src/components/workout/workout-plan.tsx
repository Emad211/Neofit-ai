
"use client"

import * as React from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "../ui/card";
import { Button } from "../ui/button";
import { PlayCircle, Flame, Clock } from "lucide-react";
import { Badge } from "../ui/badge";
import Link from "next/link";
import { Skeleton } from "../ui/skeleton";
import type { GenerateWorkoutProgramOutput } from "@/ai/flows/generate-workout-program";

// Note: This component now relies on the workout plan being stored in localStorage
// after the onboarding analysis. In a real-world app, this would be fetched
// from a database.

type DailyWorkout = GenerateWorkoutProgramOutput['weeklyWorkoutPlan'][0];

export function WorkoutPlan() {
    const [workoutPlan, setWorkoutPlan] = React.useState<DailyWorkout[]>([]);
    const [isLoading, setIsLoading] = React.useState(true);
    const [error, setError] = React.useState<string | null>(null);

    React.useEffect(() => {
        try {
            const storedPlan = localStorage.getItem('userWorkoutPlan');
            if (storedPlan) {
                setWorkoutPlan(JSON.parse(storedPlan));
            } else {
                setError("No workout plan found. Please complete the onboarding process.");
            }
        } catch (e) {
            console.error("Failed to load or parse workout plan:", e);
            setError("Could not load your workout plan.");
        } finally {
            setIsLoading(false);
        }
    }, []);

    if (isLoading) {
        return (
             <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[...Array(3)].map((_, i) => (
                    <Card key={i} className="flex flex-col h-full">
                         <CardHeader>
                            <div className="flex justify-between items-start">
                                <div className="space-y-2">
                                    <Skeleton className="h-4 w-24" />
                                    <Skeleton className="h-6 w-48" />
                                </div>
                                <Skeleton className="h-6 w-20" />
                            </div>
                            <div className="flex items-center gap-4 pt-2">
                                <Skeleton className="h-4 w-24" />
                                <Skeleton className="h-4 w-20" />
                            </div>
                        </CardHeader>
                        <CardContent className="flex-grow space-y-2">
                            {[...Array(5)].map((_, j) => (
                                <div key={j} className="flex justify-between items-center py-2">
                                    <Skeleton className="h-5 w-3/5" />
                                    <Skeleton className="h-5 w-1/5" />
                                </div>
                            ))}
                        </CardContent>
                         <div className="p-6 pt-0 mt-auto">
                            <Skeleton className="h-11 w-full" />
                         </div>
                    </Card>
                ))}
             </div>
        )
    }

    if (error) {
        return <div className="text-center text-destructive p-8">{error}</div>;
    }
    
    if (workoutPlan.length === 0 && !isLoading) {
       return <div className="text-center text-muted-foreground p-8">Your workout plan is empty for this week. Maybe it's a rest week?</div>;
    }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {workoutPlan.map((workout, index) => (
          <div key={index} className="h-full">
              <Card className="flex flex-col h-full">
                  <CardHeader>
                      <div className="flex justify-between items-start">
                          <div>
                              <CardDescription className="text-primary font-semibold">{workout.day}</CardDescription>
                              <CardTitle className="font-headline text-2xl">{workout.title}</CardTitle>
                          </div>
                          <Badge variant="secondary">{workout.focus}</Badge>
                      </div>
                       <div className="flex items-center text-sm text-muted-foreground gap-4 pt-2">
                          <div className="flex items-center gap-1">
                              <Clock className="h-4 w-4" />
                              <span>{workout.duration}</span>
                          </div>
                          <div className="flex items-center gap-1">
                              <Flame className="h-4 w-4" />
                              <span>{workout.calories}</span>
                          </div>
                      </div>
                  </CardHeader>
                  <CardContent className="flex-grow">
                      <ul className="divide-y">
                          {workout.exercises.map((exercise, exIndex) => (
                              <li key={exIndex} className="py-2 flex justify-between items-center">
                                  <span className="font-medium">{exercise.name}</span>
                                  <span className="text-muted-foreground">{exercise.sets} x {exercise.reps}</span>
                              </li>
                          ))}
                      </ul>
                  </CardContent>
                  <div className="p-6 pt-0 mt-auto">
                      <Button className="w-full bg-accent hover:bg-accent/90 text-accent-foreground" asChild>
                          <Link href={`/workout-player/${workout.id}`}>
                              <PlayCircle className="mr-2 h-5 w-5" />
                              Start Workout
                          </Link>
                      </Button>
                  </div>
              </Card>
          </div>
        ))}
    </div>
  )
}
