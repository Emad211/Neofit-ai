// src/components/progress/debug-data-fetcher.tsx
"use client";

import * as React from "react";
import { Button } from "../ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../ui/card";
import { Code, TestTube2, Loader2, Wand2, X } from "lucide-react";
import { useUserData } from "@/context/user-profile-context";
import { Alert, AlertDescription, AlertTitle } from "../ui/alert";
import { generateReportFromData } from "@/app/actions/debug-actions";
import { useToast } from "@/hooks/use-toast";
import { Textarea } from "../ui/textarea";
import { Label } from "../ui/label";
import { fetchDebugData } from "@/app/actions/debug-actions";


const fullWeekTestData = {
  "userProfile": {
    "bodyType": "endomorph",
    "costLevel": "medium",
    "goal": "lose_weight",
    "trainingDuration": "45-60",
    "gender": "male",
    "timezone": "Asia/Tehran",
    "cookingSkill": "intermediate",
    "weight": "100",
    "sleepHours": "7-8",
    "stressLevel": "medium",
    "lifestyle": "very_active",
    "eatingHabits": "Dietary preference: vegetarian",
    "trainingTime": "morning",
    "availableEquipment": "Full gym equipment",
    "name": "Emad",
    "workoutLocation": "gym",
    "medicalHistory": "None",
    "trainingDays": "5",
    "age": "25",
    "fitnessLevel": "advanced",
    "height": "175",
  },
  "baseWorkoutPlan": [
    { "id": "push-a", "day": "Day 1", "title": "Push Day A", "focus": "Strength", "duration": "60 min", "calories": "450 kcal", "exercises": [ { "name": "Bench Press", "sets": "4", "reps": "8-12" }, { "name": "Overhead Press", "sets": "4", "reps": "8-12" }, { "name": "Incline Dumbbell Press", "sets": "3", "reps": "10-15" } ] },
    { "id": "pull-a", "day": "Day 2", "title": "Pull Day A", "focus": "Strength", "duration": "60 min", "calories": "420 kcal", "exercises": [ { "name": "Pull-ups", "sets": "4", "reps": "AMRAP" }, { "name": "Barbell Rows", "sets": "4", "reps": "8-12" }, { "name": "Face Pulls", "sets": "3", "reps": "15-20" } ] },
    { "id": "legs-a", "day": "Day 3", "title": "Leg Day A", "focus": "Strength", "duration": "75 min", "calories": "600 kcal", "exercises": [ { "name": "Barbell Squats", "sets": "4", "reps": "8-12" }, { "name": "Romanian Deadlifts", "sets": "3", "reps": "10-15" }, { "name": "Leg Press", "sets": "3", "reps": "12-15" } ] },
    { "id": "push-b", "day": "Day 5", "title": "Push Day B", "focus": "Hypertrophy", "duration": "60 min", "calories": "430 kcal", "exercises": [ { "name": "Incline Dumbbell Press", "sets": "4", "reps": "10-15" }, { "name": "Dumbbell Shoulder Press", "sets": "4", "reps": "10-15" }, { "name": "Chest Flyes", "sets": "3", "reps": "12-15" } ] },
    { "id": "pull-b", "day": "Day 6", "title": "Pull Day B", "focus": "Hypertrophy", "duration": "60 min", "calories": "400 kcal", "exercises": [ { "name": "Lat Pulldowns", "sets": "4", "reps": "10-15" }, { "name": "Seated Cable Rows", "sets": "4", "reps": "10-15" }, { "name": "Bicep Curls", "sets": "3", "reps": "12-15" } ] }
  ],
  "baseNutritionPlan": {
    "summary": "A balanced plan for weight loss.",
    "weeklyMealPlan": [
      { "day": "Monday", "totalCalories": 2200, "meals": [ { "name": "Scrambled Tofu", "calories": 400 }, { "name": "Lentil Soup", "calories": 600 }, { "name": "Veggie Stir-fry", "calories": 800 }, { "name": "Greek Yogurt", "calories": 400 } ] },
      { "day": "Tuesday", "totalCalories": 2250, "meals": [ { "name": "Oatmeal with Berries", "calories": 450 }, { "name": "Chickpea Salad Sandwich", "calories": 600 }, { "name": "Black Bean Burgers", "calories": 800 }, { "name": "Protein Shake", "calories": 400 } ] },
      { "day": "Wednesday", "totalCalories": 2200, "meals": [ { "name": "Scrambled Tofu", "calories": 400 }, { "name": "Quinoa Salad", "calories": 600 }, { "name": "Pasta Primavera", "calories": 800 }, { "name": "Apple with Peanut Butter", "calories": 400 } ] },
      { "day": "Thursday", "totalCalories": 2300, "meals": [ { "name": "Oatmeal with Berries", "calories": 450 }, { "name": "Lentil Soup", "calories": 650 }, { "name": "Veggie Stir-fry", "calories": 800 }, { "name": "Greek Yogurt", "calories": 400 } ] },
      { "day": "Friday", "totalCalories": 2200, "meals": [ { "name": "Scrambled Tofu", "calories": 400 }, { "name": "Chickpea Salad Sandwich", "calories": 600 }, { "name": "Black Bean Burgers", "calories": 800 }, { "name": "Protein Shake", "calories": 400 } ] },
      { "day": "Saturday", "totalCalories": 2400, "meals": [ { "name": "Oatmeal with Berries", "calories": 500 }, { "name": "Quinoa Salad", "calories": 700 }, { "name": "Pasta Primavera", "calories": 800 }, { "name": "Apple with Peanut Butter", "calories": 400 } ] },
      { "day": "Sunday", "totalCalories": 2350, "meals": [ { "name": "Scrambled Tofu", "calories": 450 }, { "name": "Lentil Soup", "calories": 600 }, { "name": "Veggie Stir-fry", "calories": 900 }, { "name": "Greek Yogurt", "calories": 400 } ] }
    ]
  },
  "historicalReports": [],
  "mealLogs": [
    { "loggedAt": "2024-05-20T08:00:00Z", "description": "Scrambled Tofu", "calories": 410, "mealType": "breakfast" },
    { "loggedAt": "2024-05-20T12:30:00Z", "description": "Lentil Soup", "calories": 590, "mealType": "lunch" },
    { "loggedAt": "2024-05-20T19:00:00Z", "description": "Veggie Stir-fry", "calories": 850, "mealType": "dinner" },
    { "loggedAt": "2024-05-21T08:15:00Z", "description": "Oatmeal with Berries", "calories": 460, "mealType": "breakfast" },
    { "loggedAt": "2024-05-21T13:00:00Z", "description": "I ate a different sandwich", "calories": 750, "mealType": "lunch" },
    { "loggedAt": "2024-05-21T20:00:00Z", "description": "Black Bean Burgers", "calories": 800, "mealType": "dinner" },
    { "loggedAt": "2024-05-22T09:00:00Z", "description": "Scrambled Tofu", "calories": 400, "mealType": "breakfast" },
    { "loggedAt": "2024-05-22T12:00:00Z", "description": "Quinoa Salad", "calories": 620, "mealType": "lunch" }
  ],
  "activityLogs": [
    { "loggedAt": "2024-05-21T10:00:00Z", "activityType": "Light Jog", "durationMinutes": 30, "intensity": "low", "caloriesBurned": 200 }
  ],
  "weightLogs": [
    { "loggedAt": "2024-05-20T07:30:00Z", "weight": 100 },
    { "loggedAt": "2024-05-23T07:35:00Z", "weight": 99.5 }
  ],
  "workoutLogs": [
    {
      "loggedAt": "2024-05-20T17:00:00Z",
      "workoutId": "push-a",
      "workoutName": "Push Day A",
      "durationMinutes": 65,
      "totalVolume": 5500,
      "exercises": [
        { "name": "Bench Press", "logs": [ {"set": 1, "weight": "70", "reps": "10"}, {"set": 2, "weight": "70", "reps": "11"}, {"set": 3, "weight": "75", "reps": "8"}, {"set": 4, "weight": "75", "reps": "8"} ] },
        { "name": "Overhead Press", "logs": [ {"set": 1, "weight": "40", "reps": "12"}, {"set": 2, "weight": "40", "reps": "12"}, {"set": 3, "weight": "45", "reps": "10"}, {"set": 4, "weight": "45", "reps": "9"} ] },
        { "name": "Incline Dumbbell Press", "logs": [ {"set": 1, "weight": "25", "reps": "14"}, {"set": 2, "weight": "25", "reps": "14"}, {"set": 3, "weight": "25", "reps": "12"} ] }
      ]
    },
    {
      "loggedAt": "2024-05-21T17:30:00Z",
      "workoutId": "pull-a",
      "workoutName": "Pull Day A",
      "durationMinutes": 58,
      "totalVolume": 4800,
      "exercises": [
        { "name": "Pull-ups", "logs": [ {"set": 1, "weight": "0", "reps": "10"}, {"set": 2, "weight": "0", "reps": "8"}, {"set": 3, "weight": "0", "reps": "8"}, {"set": 4, "weight": "0", "reps": "7"} ] },
        { "name": "Barbell Rows", "logs": [ {"set": 1, "weight": "60", "reps": "12"}, {"set": 2, "weight": "60", "reps": "12"}, {"set": 3, "weight": "65", "reps": "10"}, {"set": 4, "weight": "65", "reps": "10"} ] },
        { "name": "Goblet Squat", "logs": [ {"set": 1, "weight": "20", "reps": "15"}, {"set": 2, "weight": "20", "reps": "15"}, {"set": 3, "weight": "20", "reps": "15"} ] }
      ]
    },
    {
      "loggedAt": "2024-05-22T18:00:00Z",
      "workoutId": "legs-a",
      "workoutName": "Leg Day A",
      "durationMinutes": 72,
      "totalVolume": 7200,
      "exercises": [
        { "name": "Barbell Squats", "logs": [ {"set": 1, "weight": "100", "reps": "10"}, {"set": 2, "weight": "100", "reps": "10"}, {"set": 3, "weight": "105", "reps": "8"}, {"set": 4, "weight": "105", "reps": "8"} ] },
        { "name": "Romanian Deadlifts", "logs": [ {"set": 1, "weight": "80", "reps": "12"}, {"set": 2, "weight": "80", "reps": "12"}, {"set": 3, "weight": "80", "reps": "11"} ] },
        { "name": "Leg Press", "logs": [ {"set": 1, "weight": "150", "reps": "15"}, {"set": 2, "weight": "150", "reps": "14"}, {"set": 3, "weight": "150", "reps": "14"} ] }
      ]
    }
  ]
};

export function DebugDataFetcher({ setExternalReport, setIsLoadingExternal }: { setExternalReport: (report: any) => void, setIsLoadingExternal: (loading: boolean) => void }) {
  const [liveData, setLiveData] = React.useState<any>(null);
  const [testJson, setTestJson] = React.useState(JSON.stringify(fullWeekTestData, null, 2));
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
      setTestJson(JSON.stringify(data, null, 2));
      toast({
        title: "Live Data Fetched",
        description: "The editor has been populated with your current weekly data.",
      });
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
        if (testJson.trim()) {
            dataToGenerate = JSON.parse(testJson);
        } else if (liveData) {
            dataToGenerate = liveData;
        } else {
             toast({
                variant: "destructive",
                title: "No Data",
                description: "Please provide test JSON or fetch live data before generating a report.",
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
            Use this tool to test the AI's analysis capabilities. You can edit the pre-filled JSON data below, paste your own, or fetch your live data. Then, click "Generate Report from Editor" to see how the AI interprets it.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-wrap gap-4">
            <Button onClick={handleFetchData} disabled={isFetching || !user}>
              {isFetching ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Code className="mr-2 h-4 w-4" />
                )}
              Fetch User Data
            </Button>
            <Button onClick={handleGenerateFromData} disabled={isGenerating} variant="secondary">
              {isGenerating ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                  <Wand2 className="mr-2 h-4 w-4" />
              )}
              Generate Report from Editor
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
                placeholder="Paste your test JSON here, or click 'Fetch User Data' to populate."
                value={testJson}
                onChange={(e) => setTestJson(e.target.value)}
                className="h-96 font-code text-xs"
            />
        </div>
      </CardContent>
    </Card>
  );
}
