// src/components/progress/debug-data-fetcher.tsx
"use client";

import * as React from "react";
import { Button } from "../ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../ui/card";
import { Code, TestTube2, Loader2 } from "lucide-react";
import { useUserData } from "@/context/user-profile-context";
import { getUserDataForWeeklyReview } from "@/ai/tools/get-user-data";
import { Alert, AlertDescription, AlertTitle } from "../ui/alert";

export function DebugDataFetcher() {
  const [debugData, setDebugData] = React.useState<any>(null);
  const [isLoading, setIsLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const { user } = useUserData();

  const handleFetchData = async () => {
    if (!user) {
      setError("User is not logged in.");
      return;
    }
    setIsLoading(true);
    setError(null);
    setDebugData(null);
    try {
      const data = await getUserDataForWeeklyReview({ userId: user.uid });
      setDebugData(data);
    } catch (e: any) {
      console.error("Debug fetch failed:", e);
      setError(e.message || "An unknown error occurred while fetching data.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="border-destructive">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
            <TestTube2 className="text-destructive" />
            <span>Debugging Tool</span>
        </CardTitle>
        <CardDescription>
            Click the button to fetch the raw data that the AI uses to generate your report. This helps diagnose data fetching issues.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Button onClick={handleFetchData} disabled={isLoading}>
          {isLoading ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Code className="mr-2 h-4 w-4" />
          )}
          Fetch Weekly User Data
        </Button>

        {error && (
            <Alert variant="destructive">
                <AlertTitle>Error Fetching Data</AlertTitle>
                <AlertDescription>{error}</AlertDescription>
            </Alert>
        )}
        
        {debugData && (
            <div>
                <h4 className="font-semibold mb-2">Fetched Data:</h4>
                <pre className="p-4 bg-secondary rounded-md text-secondary-foreground text-xs overflow-x-auto">
                    <code>{JSON.stringify(debugData, null, 2)}</code>
                </pre>
            </div>
        )}
      </CardContent>
    </Card>
  );
}
