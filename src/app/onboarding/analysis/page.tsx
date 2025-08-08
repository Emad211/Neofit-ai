
// This file is a suspense boundary. Read more about them here:
// https://nextjs.org/docs/app/building-your-application/routing/loading-ui-and-streaming
"use client"
import React, { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';

import { generateNutritionProgram, GenerateNutritionProgramInput, GenerateNutritionProgramOutput } from '@/ai/flows/generate-nutrition-program';
import { generateWorkoutProgram, GenerateWorkoutProgramInput, GenerateWorkoutProgramOutput } from '@/ai/flows/generate-workout-program';
import { AnalysisAnimation } from '@/components/onboarding/analysis-animation';
import { Button } from '@/components/ui/button';
import { MoveRight } from 'lucide-react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Apple, Dumbbell } from 'lucide-react';
import { UserProfile, useUserData } from '@/context/user-profile-context';

type AnalysisResults = {
    nutrition: GenerateNutritionProgramOutput;
    workout: GenerateWorkoutProgramOutput;
}

function OnboardingAnalysisPage() {
  return (
    <div className="flex min-h-screen w-full flex-col items-center justify-center bg-background p-4 sm:p-6 lg:p-8">
      <Suspense fallback={<Loading />}>
        <AnalysisResult />
      </Suspense>
    </div>
  );
}

function Loading() {
  const messages = [
    "Consulting with our AI Nutritionist...",
    "Designing your personalized meal plan...",
    "Talking to the AI Strength Coach...",
    "Building your custom workout schedule...",
    "Considering your goals and preferences...",
    "Crafting the perfect plan for you...",
  ];

  const [message, setMessage] = React.useState(messages[0]);

  React.useEffect(() => {
    let i = 0;
    const interval = setInterval(() => {
      i = (i + 1) % messages.length;
      setMessage(messages[i]);
    }, 2500);
    return () => clearInterval(interval);
  }, [messages]);


  return (
      <div className="w-full max-w-2xl text-center">
        <AnalysisAnimation />
        <h1 className="mt-8 text-3xl font-bold tracking-tight text-foreground sm:text-4xl font-headline">
          Generating Your Custom Plans
        </h1>
        <p className="mt-4 text-lg text-muted-foreground transition-all duration-500">
          {message}
        </p>
      </div>
  )
}

function AnalysisResult() {
  const searchParams = useSearchParams();
  const { saveUserProfile, savePlans } = useUserData();
  const [analysisResult, setAnalysisResult] = React.useState<AnalysisResults | null>(null);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    const performAnalysis = async () => {
        const physicalSpecifications = `${searchParams.get('gender') || 'other'}, ${searchParams.get('age') || 25} years, ${searchParams.get('height') || 170}cm, ${searchParams.get('weight') || 70}kg, ${searchParams.get('bodyType') || 'mesomorph'}`;
        
        const userProfileData: UserProfile = Object.fromEntries(searchParams.entries()) as any;

        const nutritionParams: GenerateNutritionProgramInput = {
            userId: '12345',
            goals: userProfileData.goal,
            performanceGoals: userProfileData.performanceGoals,
            fitnessLevel: userProfileData.fitnessLevel,
            physicalSpecifications: physicalSpecifications,
            lifestyle: userProfileData.lifestyle,
            sleepHours: userProfileData.sleepHours,
            stressLevel: userProfileData.stressLevel,
            eatingHabits: userProfileData.eatingHabits,
            cookingSkill: userProfileData.cookingSkill,
            costLevel: userProfileData.costLevel,
            trainingDays: parseInt(userProfileData.trainingDays, 10),
            trainingDuration: userProfileData.trainingDuration,
            trainingTime: userProfileData.trainingTime,
        };

        const workoutParams: GenerateWorkoutProgramInput = {
            userId: '12345',
            goals: userProfileData.goal,
            performanceGoals: userProfileData.performanceGoals,
            fitnessLevel: userProfileData.fitnessLevel,
            trainingDays: parseInt(userProfileData.trainingDays, 10),
            trainingDuration: userProfileData.trainingDuration,
            trainingTime: userProfileData.trainingTime,
            workoutLocation: userProfileData.workoutLocation,
            availableEquipment: userProfileData.availableEquipment || 'Full gym equipment',
            medicalHistory: userProfileData.medicalHistory || 'None',
            physicalSpecifications: physicalSpecifications,
            sleepHours: userProfileData.sleepHours,
            stressLevel: userProfileData.stressLevel,
        };

      try {
        const [nutritionResult, workoutResult] = await Promise.all([
            generateNutritionProgram(nutritionParams),
            generateWorkoutProgram(workoutParams)
        ]);

        // Save the full user profile and the generated plans to Firestore
        await saveUserProfile(userProfileData);
        await savePlans({ 
            nutritionPlan: nutritionResult.weeklyMealPlan, 
            workoutPlan: workoutResult.weeklyWorkoutPlan 
        });

        setAnalysisResult({ nutrition: nutritionResult, workout: workoutResult });
      } catch (e: any) {
        console.error(e);
        if (typeof e.message === 'string' && e.message.includes('429')) {
             setError("Our AI is experiencing high traffic right now. Please try again in a few moments.");
        } else {
             setError("Our AI is currently unavailable. Please try again later.");
        }
      }
    };

    performAnalysis();
  }, [searchParams, saveUserProfile, savePlans]);

  if (error) {
    return <ErrorDisplay message={error} />
  }

  if (!analysisResult) {
    return <Loading />;
  }

  return <AnalysisContent result={analysisResult} />
}


function AnalysisContent({ result }: { result: AnalysisResults }) {
  return (
    <div className="w-full max-w-3xl">
      <div className="text-center">
        <h1 className="mt-8 text-3xl font-bold tracking-tight text-foreground sm:text-4xl font-headline">
          Your Personal Plans are Ready!
        </h1>
        <p className="mt-4 text-lg text-muted-foreground">
          Here is a summary of what our AI experts have created for you.
        </p>
      </div>

      <div className="mt-10 grid grid-cols-1 md:grid-cols-2 gap-6 text-left">
        <Card className="flex flex-col">
          <CardHeader className="flex flex-row items-center gap-4">
            <Apple className="h-8 w-8 text-primary" />
            <CardTitle>Nutrition Plan</CardTitle>
          </CardHeader>
          <CardContent className="flex-grow">
            <p className="text-muted-foreground">{result.nutrition.summary}</p>
          </CardContent>
        </Card>
        <Card className="flex flex-col">
          <CardHeader className="flex flex-row items-center gap-4">
            <Dumbbell className="h-8 w-8 text-primary" />
            <CardTitle>Workout Plan</CardTitle>
          </CardHeader>
           <CardContent className="flex-grow">
            <p className="text-muted-foreground">{result.workout.summary}</p>
          </CardContent>
        </Card>
      </div>

      <div className="mt-10 text-center">
        <Button size="lg" asChild className="bg-accent hover:bg-accent/90 text-accent-foreground">
          <Link href="/today">
            Start Your Journey <MoveRight className="ml-2 h-5 w-5" />
          </Link>
        </Button>
      </div>
    </div>
  );
}

function ErrorDisplay({ message }: { message: string }) {
  return (
     <div className="w-full max-w-2xl text-center">
        <h1 className="mt-8 text-3xl font-bold tracking-tight text-destructive sm:text-4xl font-headline">
          Analysis Failed
        </h1>
        <p className="mt-4 text-lg text-muted-foreground">
          {message}
        </p>
        <div className="mt-10">
          <Button size="lg" asChild variant="secondary">
            <Link href="/">
              Return to Start
            </Link>
          </Button>
      </div>
     </div>
  )
}

export default OnboardingAnalysisPage;
