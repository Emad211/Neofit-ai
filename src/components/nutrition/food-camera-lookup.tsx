// src/components/nutrition/food-camera-lookup.tsx
"use client";

import * as React from "react";
import { foodLookup, FoodLookupOutput } from "@/ai/flows/food-lookup";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Camera,
  Loader2,
  AlertTriangle,
  CheckCircle,
  RefreshCw,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Alert, AlertDescription, AlertTitle } from "../ui/alert";
import { useUserData } from "@/context/user-profile-context";

const NutrientDisplay = ({
  label,
  value,
  unit,
}: {
  label: string;
  value: number;
  unit: string;
}) => (
  <div className="text-center bg-secondary p-3 rounded-lg">
    <p className="text-sm text-muted-foreground">{label}</p>
    <p className="text-2xl font-bold text-primary">
      {value}
      <span className="text-sm text-primary/80">{unit}</span>
    </p>
  </div>
);

export function FoodCameraLookup() {
  const [result, setResult] = React.useState<FoodLookupOutput | null>(null);
  const [isLoading, setIsLoading] = React.useState<boolean>(false);
  const [hasCameraPermission, setHasCameraPermission] = React.useState<boolean | null>(null);
  const videoRef = React.useRef<HTMLVideoElement>(null);
  const canvasRef = React.useRef<HTMLCanvasElement>(null);
  const { toast } = useToast();
  const { user, userProfile } = useUserData();

  React.useEffect(() => {
    const getCameraPermission = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: "environment" },
        });
        setHasCameraPermission(true);

        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      } catch (error) {
        console.error("Error accessing camera:", error);
        setHasCameraPermission(false);
      }
    };

    getCameraPermission();
    
    return () => {
        // Stop camera stream on component unmount
        if (videoRef.current && videoRef.current.srcObject) {
            const stream = videoRef.current.srcObject as MediaStream;
            stream.getTracks().forEach(track => track.stop());
        }
    }
  }, []);

  const handleAnalyze = async () => {
    if (!videoRef.current || !canvasRef.current || !user || !userProfile) {
        if (!user || !userProfile) {
            toast({
                variant: 'destructive',
                title: 'User not found',
                description: 'Please log in to use this feature.'
            });
        }
        return;
    };

    setIsLoading(true);
    setResult(null);

    const video = videoRef.current;
    const canvas = canvasRef.current;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const context = canvas.getContext("2d");
    if (!context) return;
    context.drawImage(video, 0, 0, video.videoWidth, video.videoHeight);

    const dataUri = canvas.toDataURL("image/jpeg");

    try {
      const response = await foodLookup({ userId: user.uid, foodName: "", photoDataUri: dataUri, geminiApiKey: userProfile.geminiApiKey });
      setResult(response);
    } catch (e) {
      console.error(e);
      toast({
        variant: "destructive",
        title: "Analysis Failed",
        description: "Could not identify the food. Please try again.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogMeal = () => {
     if (!result) return;
     // In a real app, this would add the meal to the user's daily log.
     console.log("Logging meal:", result);
     toast({
        title: "Meal Logged!",
        description: `${result.itemName} has been added to your daily log.`,
     });
     setResult(null); // Clear result after logging
  }
  
  const reset = () => {
    setResult(null);
    setIsLoading(false);
  }

  const renderContent = () => {
    if (hasCameraPermission === null) {
      return (
        <div className="flex flex-col items-center justify-center p-8 border-2 border-dashed rounded-lg h-96">
          <Loader2 className="h-12 w-12 text-muted-foreground animate-spin" />
          <p className="mt-4 text-muted-foreground">Accessing camera...</p>
        </div>
      );
    }

    if (hasCameraPermission === false) {
      return (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Camera Access Denied</AlertTitle>
          <AlertDescription>
            Please enable camera permissions in your browser settings to use
            this feature.
          </AlertDescription>
        </Alert>
      );
    }

    return (
      <div className="space-y-6">
        <div className="relative aspect-video w-full overflow-hidden rounded-lg border">
          <video
            ref={videoRef}
            className="h-full w-full object-cover"
            autoPlay
            playsInline
            muted
          />
          <canvas ref={canvasRef} className="hidden" />
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2">
            <Button
              size="lg"
              className="h-16 w-16 rounded-full"
              onClick={handleAnalyze}
              disabled={isLoading}
            >
              {isLoading ? (
                <Loader2 className="h-8 w-8 animate-spin" />
              ) : (
                <Camera className="h-8 w-8" />
              )}
            </Button>
          </div>
        </div>

        {result && (
           <Card className="animate-in fade-in-50">
            <CardHeader>
                <CardTitle className="font-headline text-2xl">{result.itemName}</CardTitle>
                <p className="text-muted-foreground">Serving Size: {result.servingSize}</p>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <NutrientDisplay label="Calories" value={result.calories} unit="kcal" />
                    <NutrientDisplay label="Protein" value={result.protein} unit="g" />
                    <NutrientDisplay label="Carbs" value={result.carbohydrates} unit="g" />
                    <NutrientDisplay label="Fat" value={result.fat} unit="g" />
                </div>
                <div className="flex gap-2 pt-4">
                    <Button onClick={handleLogMeal} className="w-full">
                        <CheckCircle className="mr-2 h-4 w-4" />
                        Log Meal
                    </Button>
                     <Button onClick={reset} variant="outline" className="w-full">
                        <RefreshCw className="mr-2 h-4 w-4" />
                        Scan Another
                    </Button>
                </div>
            </CardContent>
          </Card>
        )}
      </div>
    );
  };

  return <div className="max-w-2xl mx-auto">{renderContent()}</div>;
}
