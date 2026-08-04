"use client";

import * as React from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "../ui/card";
import { Button } from "../ui/button";
import { PlayCircle, Flame, Clock, Coffee } from "lucide-react";
import { Badge } from "../ui/badge";
import Link from "next/link";
import { Skeleton } from "../ui/skeleton";
import { useUserData } from "@/context/user-profile-context";

export function WorkoutPlan() {
  const { workoutPlan, isLoading } = useUserData();
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (!isLoading && !workoutPlan) setError("برنامهٔ تمرینی پیدا نشد.");
  }, [workoutPlan, isLoading]);

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
        {[...Array(3)].map((_, i) => (
          <Card key={i} className="flex h-full flex-col">
            <CardHeader><Skeleton className="h-6 w-48" /><Skeleton className="h-4 w-32" /></CardHeader>
            <CardContent className="flex-grow space-y-3">{[...Array(4)].map((_, j) => <Skeleton key={j} className="h-8 w-full" />)}</CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (error) return <div className="p-8 text-center text-destructive">{error}</div>;
  if (!workoutPlan || workoutPlan.length === 0) return <div className="p-8 text-center text-muted-foreground">این هفته برنامهٔ تمرینی خالی است.</div>;

  return (
    <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3" dir="rtl">
      {workoutPlan.map((workout: any, index: number) => {
        const title = workout.title || workout.name || "تمرین روز";
        const isRestDay = title.toLowerCase().includes("rest") || title.includes("استراحت");
        const focus = workout.focus || title.split("—")[1]?.trim() || "تمرین قدرتی";
        const duration = workout.duration || "۶۰ دقیقه";
        const calories = workout.calories || "۳۵۰ کیلوکالری";
        const exercises = Array.isArray(workout.exercises) ? workout.exercises : [];

        return (
          <div key={workout.id || index} className="h-full">
            <Card className="flex h-full flex-col overflow-hidden">
              <CardHeader className="bg-gradient-to-br from-primary/10 to-transparent">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <CardDescription className="font-semibold text-primary">{workout.day || `روز ${index + 1}`}</CardDescription>
                    <CardTitle className="font-headline text-2xl">{title}</CardTitle>
                  </div>
                  {!isRestDay && <Badge variant="secondary">{focus}</Badge>}
                </div>
                {!isRestDay && (
                  <div className="flex items-center gap-4 pt-2 text-sm text-muted-foreground">
                    <div className="flex items-center gap-1"><Clock className="h-4 w-4" /><span>{duration}</span></div>
                    <div className="flex items-center gap-1"><Flame className="h-4 w-4" /><span>{calories}</span></div>
                  </div>
                )}
              </CardHeader>
              <CardContent className="flex-grow">
                {isRestDay ? (
                  <div className="flex h-full flex-col items-center justify-center text-center text-muted-foreground"><Coffee className="mb-4 h-12 w-12" /><p className="font-semibold">استراحت و ریکاوری</p></div>
                ) : (
                  <ul className="divide-y">
                    {exercises.map((exercise: any, exIndex: number) => (
                      <li key={exercise.id || exIndex} className="flex items-center justify-between gap-3 py-3">
                        <span className="font-medium">{exercise.name || "حرکت تمرینی"}</span>
                        <span className="whitespace-nowrap text-muted-foreground">{exercise.sets || 3} × {exercise.reps || "۱۰–۱۲"}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </CardContent>
              {!isRestDay && (
                <div className="mt-auto p-6 pt-0">
                  <Button className="w-full" asChild>
                    <Link href={`/workout-player/${workout.id || `workout-${index}`}`}><PlayCircle className="ml-2 h-5 w-5" />شروع تمرین</Link>
                  </Button>
                </div>
              )}
            </Card>
          </div>
        );
      })}
    </div>
  );
}
