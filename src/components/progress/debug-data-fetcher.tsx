// src/components/progress/debug-data-fetcher.tsx
"use client";

import * as React from "react";
import { Button } from "../ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../ui/card";
import { Code, TestTube2, Loader2, Wand2, X } from "lucide-react";
import { useUserData } from "@/context/user-profile-context";
import { Alert, AlertDescription, AlertTitle } from "../ui/alert";
import { fetchDebugData, generateReportFromData } from "@/app/actions/debug-actions";
import { useToast } from "@/hooks/use-toast";
import { Textarea } from "../ui/textarea";
import { Label } from "../ui/label";

export function DebugDataFetcher({ setExternalReport, setIsLoadingExternal }: { setExternalReport: (report: any) => void, setIsLoadingExternal: (loading: boolean) => void }) {
  const [liveData, setLiveData] = React.useState<any>(null);
  const [testJson, setTestJson] = React.useState('');
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
    setLiveData(null);
    try {
      const data = await fetchDebugData({ userId: user.uid });
      setLiveData(data);
      // Also populate the textarea with the fetched data for editing
      setTestJson(JSON.stringify(data, null, 2));
    } catch (e: any) {
      console.error("Debug fetch failed:", e);
      setError(e.message || "An unknown error occurred while fetching data.");
    } finally {
      setIsFetching(false);
    }
  };

  const handleGenerateFromData = async () => {
    let dataToGenerate;
    try {
        // Prioritize the JSON from the textarea
        if (testJson.trim()) {
            dataToGenerate = JSON.parse(testJson);
        } else if (liveData) {
            dataToGenerate = liveData;
        } else {
             toast({
                variant: "destructive",
                title: "No Data",
                description: "Please fetch live data or provide test JSON before generating a report.",
            });
            return;
        }
    } catch (jsonError) {
        toast({
            variant: "destructive",
            title: "Invalid JSON",
            description: "The text in the editor is not valid JSON. Please correct it.",
        });
        return;
    }

    setIsGenerating(true);
    setIsLoadingExternal(true); 
    setExternalReport(null);    
    setError(null);

    try {
        const report = await generateReportFromData({ userData: dataToGenerate, geminiApiKey: userProfile?.geminiApiKey });
        setExternalReport(report);
        toast({
            title: "Report Generated",
            description: "The AI analysis based on the provided data is complete."
        })
    } catch(e: any) {
        console.error("Generate from data failed:", e);
        setError(e.message || "An unknown error occurred while generating the report.");
    } finally {
        setIsGenerating(false);
        setIsLoadingExternal(false);
    }
  }

  const clearJson = () => {
    setTestJson('');
    setLiveData(null);
  }

  return (
    <Card className="border-destructive">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
            <TestTube2 className="text-destructive" />
            <span>AI Analysis Debugging Tool</span>
        </CardTitle>
        <CardDescription>
            Use this tool to test the AI's analysis capabilities. You can fetch live data or paste your own JSON data below. Then, click "Generate Report" to see how the AI interprets it.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-wrap gap-4">
            <Button onClick={handleFetchData} disabled={isFetching || isGenerating}>
            {isFetching ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
                <Code className="mr-2 h-4 w-4" />
            )}
            Fetch Live Data & Populate
            </Button>
             <Button onClick={handleGenerateFromData} disabled={isGenerating} variant="secondary">
                {isGenerating ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                    <Wand2 className="mr-2 h-4 w-4" />
                )}
                Generate Report from Editor Data
            </Button>
        </div>

        {error && (
            <Alert variant="destructive">
                <AlertTitle>Error</AlertTitle>
                <AlertDescription>{error}</AlertDescription>
            </Alert>
        )}
        
        <div className="space-y-2">
            <div className="flex justify-between items-center">
                <Label htmlFor="test-json-editor">Test Data JSON Editor</Label>
                <Button variant="ghost" size="sm" onClick={clearJson}><X className="mr-2 h-4 w-4"/> Clear</Button>
            </div>
            <Textarea
                id="test-json-editor"
                placeholder="Paste your test JSON here, or click 'Fetch Live Data' to populate."
                value={testJson}
                onChange={(e) => setTestJson(e.target.value)}
                className="h-96 font-code text-xs"
            />
        </div>
      </CardContent>
    </Card>
  );
}
