
// src/components/progress/weekly-ai-report.tsx
"use client";

import * as React from "react";
import { dynamicProgramAdaptation, DynamicProgramAdaptationOutput } from "@/ai/flows/dynamic-program-adaptation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../ui/card";
import { BrainCircuit, Flame, Activity, Dumbbell, Loader2, CalendarCheck, Apple, Wand2 } from "lucide-react";
import { Skeleton } from "../ui/skeleton";
import { useUserData } from "@/context/user-profile-context";
import { Button } from "../ui/button";
import { Alert, AlertDescription, AlertTitle } from "../ui/alert";

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

function ReportDisplay({ report }: { report: DynamicProgramAdaptationOutput }) {
    return (
    <Card className="bg-accent/20 border-accent animate-in fade-in-50">
      <CardHeader className="flex flex-row items-start gap-4 space-y-0">
        <div className="bg-secondary p-3 rounded-full">
            <BrainCircuit className="h-6 w-6 text-primary" />
        </div>
        <div className="flex-1">
            <CardTitle className="font-headline">Your Weekly AI Report</CardTitle>
            <CardDescription>A personalized analysis of your progress.</CardDescription>
        </div>
      </CardHeader>
      <CardContent>
        <p className="mb-6 text-foreground/90 italic">
          &quot;{report.analysisReport}&quot;
        </p>
        
        <div className="border-t border-accent pt-4 space-y-4">
            <h4 className="font-semibold">Your New Plan for Next Week</h4>
             <div className="space-y-3">
                <Suggestion title="New Workout Plan" text={report.nextWeekWorkoutPlanSummary} icon={CalendarCheck} />
                <Suggestion title="New Nutrition Plan" text={report.nextWeekNutritionPlanSummary} icon={Apple} />
            </div>
        </div>
      </CardContent>
    </Card>
  );
}


export function WeeklyAiReport() {
  const [report, setReport] = React.useState<DynamicProgramAdaptationOutput | null>(null);
  const [isLoading, setIsLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const { user } = useUserData();

  const handleGenerateReport = async () => {
    if (!user) {
        setError("Please log in to generate your report.");
        return;
    }
    setIsLoading(true);
    setError(null);
    setReport(null);
    
    try {
        const result = await dynamicProgramAdaptation({ userId: user.uid });
        setReport(result);
    } catch (e: any) {
        console.error("Failed to fetch weekly report", e);
        setError("Could not generate your weekly AI report. This can happen during periods of high traffic. Please try again in a moment.");
    } finally {
        setIsLoading(false);
    }
  }

  if (isLoading) {
    return (
        <Card>
            <CardHeader>
                <CardTitle className="font-headline">Generating Report...</CardTitle>
                 <CardDescription>Your AI coach is analyzing your week.</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col items-center justify-center text-center p-8 space-y-4">
                <Loader2 className="h-12 w-12 text-primary animate-spin" />
                <p className="text-muted-foreground">This may take a moment...</p>
            </CardContent>
        </Card>
    );
  }

  if (error) {
    return (
        <Alert variant="destructive">
            <AlertTitle>Generation Failed</AlertTitle>
            <AlertDescription>
                {error}
                 <Button variant="secondary" size="sm" onClick={handleGenerateReport} className="mt-4">
                    Try Again
                </Button>
            </AlertDescription>
        </Alert>
    );
  }
  
  if (report) {
    return <ReportDisplay report={report} />
  }

  return (
    <Card className="bg-secondary/50">
       <CardContent className="p-6 text-center">
            <Wand2 className="h-12 w-12 mx-auto text-primary/80 mb-4" />
            <h3 className="text-xl font-bold font-headline">Ready for your weekly check-in?</h3>
            <p className="text-muted-foreground mt-2 mb-6">Let your AI coach analyze your progress, provide insights, and adapt your plan for the week ahead.</p>
            <Button onClick={handleGenerateReport} size="lg" className="bg-accent hover:bg-accent/90 text-accent-foreground">
                <BrainCircuit className="mr-2 h-5 w-5" />
                Generate My Weekly Report
            </Button>
       </CardContent>
    </Card>
  );
}

