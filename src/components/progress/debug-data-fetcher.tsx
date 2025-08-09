// src/components/progress/debug-data-fetcher.tsx
"use client";

import * as React from "react";
import { Button } from "../ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../ui/card";
import { Code, TestTube2, Loader2, Wand2 } from "lucide-react";
import { useUserData } from "@/context/user-profile-context";
import { Alert, AlertDescription, AlertTitle } from "../ui/alert";
import { fetchDebugData, generateReportFromData } from "@/app/actions/debug-actions";
import { useToast } from "@/hooks/use-toast";

export function DebugDataFetcher({ setExternalReport, setIsLoadingExternal }: { setExternalReport: (report: any) => void, setIsLoadingExternal: (loading: boolean) => void }) {
  const [debugData, setDebugData] = React.useState<any>(null);
  const [isFetching, setIsFetching] = React.useState(false);
  const [isGenerating, setIsGenerating] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const { user, userProfile } = useUserData();
  const { toast } = useToast();

  const handleFetchData = async () => {
    if (!user) {
      setError("User is not logged in.");
      return;
    }
    setIsFetching(true);
    setError(null);
    setDebugData(null);
    try {
      const data = await fetchDebugData({ userId: user.uid });
      setDebugData(data);
    } catch (e: any) {
      console.error("Debug fetch failed:", e);
      setError(e.message || "An unknown error occurred while fetching data.");
    } finally {
      setIsFetching(false);
    }
  };

  const handleGenerateFromData = async () => {
    if (!debugData) {
        toast({
            variant: "destructive",
            title: "No Data",
            description: "Please fetch data before trying to generate a report.",
        });
        return;
    }
    setIsGenerating(true);
    setIsLoadingExternal(true); // Signal loading to parent
    setExternalReport(null);    // Clear previous external report
    setError(null);

    try {
        const report = await generateReportFromData({ userData: debugData, geminiApiKey: userProfile?.geminiApiKey });
        setExternalReport(report); // Pass report to parent
    } catch(e: any) {
        console.error("Generate from data failed:", e);
        setError(e.message || "An unknown error occurred while generating the report.");
    } finally {
        setIsGenerating(false);
        setIsLoadingExternal(false); // Signal end of loading to parent
    }
  }

  return (
    <Card className="border-destructive">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
            <TestTube2 className="text-destructive" />
            <span>Debugging Tool</span>
        </CardTitle>
        <CardDescription>
            Use this tool to test the AI's analysis capabilities. First, fetch the current user data, then generate a report directly from that data to see how the AI interprets it.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex gap-4">
            <Button onClick={handleFetchData} disabled={isFetching || isGenerating}>
            {isFetching ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
                <Code className="mr-2 h-4 w-4" />
            )}
            Fetch User Data
            </Button>
             <Button onClick={handleGenerateFromData} disabled={!debugData || isGenerating || isFetching} variant="secondary">
                {isGenerating ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                    <Wand2 className="mr-2 h-4 w-4" />
                )}
                Generate Report from This Data
            </Button>
        </div>


        {error && (
            <Alert variant="destructive">
                <AlertTitle>Error</AlertTitle>
                <AlertDescription>{error}</AlertDescription>
            </Alert>
        )}
        
        {debugData && (
            <div>
                <h4 className="font-semibold mb-2 mt-6">Fetched Data:</h4>
                <pre className="p-4 bg-secondary rounded-md text-secondary-foreground text-xs overflow-x-auto">
                    <code>{JSON.stringify(debugData, null, 2)}</code>
                </pre>
            </div>
        )}
      </CardContent>
    </Card>
  );
}
