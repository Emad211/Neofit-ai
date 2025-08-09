// src/components/progress/weekly-ai-report.tsx
"use client";

import * as React from "react";
import { generateReportFromData } from "@/app/actions/debug-actions";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../ui/card";
import { BrainCircuit, Loader2, Wand2 } from "lucide-react";
import { useUserData } from "@/context/user-profile-context";
import { Button } from "../ui/button";
import { Alert, AlertDescription, AlertTitle } from "../ui/alert";
import { AnimatePresence, motion } from "framer-motion";
import { fetchDebugData } from "@/app/actions/debug-actions";

type GenerateOnDemandReportOutput = {
    analysisReport: string;
}

interface WeeklyAiReportProps {
  externalReport: GenerateOnDemandReportOutput | null;
  isLoadingExternal: boolean;
  clearExternalReport: () => void;
}


function ReportDisplay({ report }: { report: GenerateOnDemandReportOutput }) {
    return (
    <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        transition={{ duration: 0.5 }}
    >
        <Card className="bg-accent/20 border-accent">
        <CardHeader className="flex flex-row items-start gap-4 space-y-0">
            <div className="bg-secondary p-3 rounded-full">
                <BrainCircuit className="h-6 w-6 text-primary" />
            </div>
            <div className="flex-1">
                <CardTitle className="font-headline">Your Progress Report</CardTitle>
                <CardDescription>A personalized analysis of your week so far.</CardDescription>
            </div>
        </CardHeader>
        <CardContent>
            <p className="mb-6 text-foreground/90 italic whitespace-pre-wrap">
             {report.analysisReport}
            </p>
             <div className="text-center">
                 <p className="text-xs text-muted-foreground">Your official weekly plan will be updated automatically at the end of the week. Keep up the great work!</p>
             </div>
        </CardContent>
        </Card>
    </motion.div>
  );
}


export function WeeklyAiReport({ externalReport, isLoadingExternal, clearExternalReport }: WeeklyAiReportProps) {
  const [internalReport, setInternalReport] = React.useState<GenerateOnDemandReportOutput | null>(null);
  const [isLoadingInternal, setIsLoadingInternal] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const { user, userProfile } = useUserData();

  const report = externalReport || internalReport;
  const isLoading = isLoadingExternal || isLoadingInternal;

  const handleGenerateReport = async () => {
    if (!user || !userProfile) {
        setError("Please log in to generate your report.");
        return;
    }
    setIsLoadingInternal(true);
    clearExternalReport();
    setError(null);
    setInternalReport(null);
    
    try {
        const userData = await fetchDebugData({ userId: user.uid });
        const result = await generateReportFromData({ userData, geminiApiKey: userProfile.geminiApiKey });
        setInternalReport(result);
    } catch (e: any) {
        console.error("Failed to fetch on-demand report", e);
        setError("Could not generate your weekly report. This can happen during periods of high traffic. Please try again in a moment.");
    } finally {
        setIsLoadingInternal(false);
    }
  }

  return (
    <div>
        <AnimatePresence mode="wait">
            {isLoading ? (
                 <motion.div key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                    <Card>
                        <CardHeader>
                            <CardTitle className="font-headline">Generating Report...</CardTitle>
                            <CardDescription>Your AI coach is analyzing your progress so far this week.</CardDescription>
                        </CardHeader>
                        <CardContent className="flex flex-col items-center justify-center text-center p-8 space-y-4">
                            <Loader2 className="h-12 w-12 text-primary animate-spin" />
                            <p className="text-muted-foreground">This may take a moment...</p>
                        </CardContent>
                    </Card>
                 </motion.div>
            ) : error ? (
                <motion.div key="error" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                     <Alert variant="destructive">
                        <AlertTitle>Generation Failed</AlertTitle>
                        <AlertDescription>
                            {error}
                            <Button variant="secondary" size="sm" onClick={handleGenerateReport} className="mt-4">
                                Try Again
                            </Button>
                        </AlertDescription>
                    </Alert>
                </motion.div>
            ) : report ? (
                 <motion.div key="report">
                    <ReportDisplay report={report} />
                 </motion.div>
            ) : (
                <motion.div key="initial" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                    <Card className="bg-secondary/50">
                    <CardContent className="p-6 text-center">
                            <Wand2 className="h-12 w-12 mx-auto text-primary/80 mb-4" />
                            <h3 className="text-xl font-bold font-headline">Check In On Your Progress</h3>
                            <p className="text-muted-foreground mt-2 mb-6">Get a real-time, AI-powered analysis of your progress so far this week.</p>
                            <Button onClick={handleGenerateReport} size="lg" className="bg-accent hover:bg-accent/90 text-accent-foreground">
                                <BrainCircuit className="mr-2 h-5 w-5" />
                                Analyze My Progress So Far
                            </Button>
                    </CardContent>
                    </Card>
                </motion.div>
            )}
        </AnimatePresence>
    </div>
  );
}
