// src/components/progress/weekly-ai-report.tsx
"use client";

import * as React from "react";
import { dynamicProgramAdaptation, DynamicProgramAdaptationOutput } from "@/ai/flows/dynamic-program-adaptation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../ui/card";
import { BrainCircuit, Flame, Activity, Dumbbell, Loader2, CalendarCheck, Apple } from "lucide-react";
import { Skeleton } from "../ui/skeleton";
import { useUserData } from "@/context/user-profile-context";

type AdaptationSuggestions = {
    calorieAdjustment?: string | undefined;
    cardioAdjustment?: string | undefined;
    muscleGroupAdjustment?: string | undefined;
}

function Suggestion({ text, icon: Icon, title }: { text: string | undefined; icon: React.ElementType, title: string }) {
    if (!text) return null;
    return (
        <div className="flex items-start gap-3 p-3 rounded-lg bg-background/50">
            <div className="bg-primary/10 p-2 rounded-full mt-1">
                <Icon className="h-5 w-5 text-primary" />
            </div>
            <div>
                 <p className="font-bold text-sm text-foreground">{title}</p>
                <p className="text-sm text-muted-foreground">{text}</p>
            </div>
        </div>
    );
}


export function WeeklyAiReport() {
  const [report, setReport] = React.useState<DynamicProgramAdaptationOutput | null>(null);
  const [isLoading, setIsLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const { user } = useUserData();

  React.useEffect(() => {
    async function fetchReport() {
      if (!user) {
        setError("Please log in to see your report.");
        setIsLoading(false);
        return;
      }
      try {
        const result = await dynamicProgramAdaptation({ userId: user.uid });
        setReport(result);
      } catch (e) {
        console.error("Failed to fetch weekly report", e);
        setError("Could not load your weekly AI report. Please try again later.");
      } finally {
        setIsLoading(false);
      }
    }
    fetchReport();
  }, [user]);

  if (isLoading) {
    return (
        <Card>
            <CardHeader className="flex flex-row items-center gap-4">
                <Skeleton className="h-10 w-10 rounded-full" />
                <div className="flex-1 space-y-2">
                    <Skeleton className="h-5 w-48" />
                    <Skeleton className="h-4 w-64" />
                </div>
            </CardHeader>
            <CardContent className="space-y-4">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-[90%]" />
                <div className="border-t pt-4 mt-4 space-y-3">
                    <Skeleton className="h-5 w-40" />
                     <Skeleton className="h-10 w-full" />
                     <Skeleton className="h-10 w-full" />
                </div>
            </CardContent>
        </Card>
    );
  }

  if (error) {
    return (
        <Card className="border-destructive">
            <CardHeader>
                 <CardTitle className="text-destructive">Error</CardTitle>
            </CardHeader>
            <CardContent>
                <p>{error}</p>
            </CardContent>
        </Card>
    );
  }
  
  if (!report) return null;

  return (
    <Card className="bg-accent/20 border-accent">
      <CardHeader className="flex flex-row items-start gap-4 space-y-0">
        <div className="bg-secondary p-3 rounded-full">
            <BrainCircuit className="h-6 w-6 text-primary" />
        </div>
        <div className="flex-1">
            <CardTitle className="font-headline">Weekly AI Report</CardTitle>
            <CardDescription>Your personalized analysis and suggestions.</CardDescription>
        </div>
      </CardHeader>
      <CardContent>
        <p className="mb-6 text-foreground/90 italic">
          &quot;{report.analysisReport}&quot;
        </p>
        
        <div className="border-t border-accent pt-4 space-y-4">
            <h4 className="font-semibold">Plan for Next Week</h4>
             <div className="space-y-3">
                <Suggestion title="Workout Plan" text={report.nextWeekWorkoutPlan} icon={CalendarCheck} />
                <Suggestion title="Nutrition Plan" text={report.nextWeekNutritionPlan} icon={Apple} />
            </div>

            <div className="border-t border-accent pt-4">
                <h4 className="font-semibold mb-3">Reasoning & Suggestions</h4>
                <div className="space-y-3">
                    <Suggestion title="Calorie Adjustment" text={report.adaptationSuggestions.calorieAdjustment} icon={Flame} />
                    <Suggestion title="Cardio Adjustment" text={report.adaptationSuggestions.cardioAdjustment} icon={Activity} />
                    <Suggestion title="Workout Focus" text={report.adaptationSuggestions.muscleGroupAdjustment} icon={Dumbbell} />
                    {!report.adaptationSuggestions.calorieAdjustment && !report.adaptationSuggestions.cardioAdjustment && !report.adaptationSuggestions.muscleGroupAdjustment && (
                        <p className="text-sm text-muted-foreground">No changes suggested this week. Keep up the great work!</p>
                    )}
                </div>
            </div>
        </div>
      </CardContent>
    </Card>
  );
}
