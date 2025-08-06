// This file is a suspense boundary. Read more about them here:
// https://nextjs.org/docs/app/building-your-application/routing/loading-ui-and-streaming
"use client"
import React, { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';

import { onboardingAnalysis, OnboardingAnalysisInput, OnboardingAnalysisOutput } from '@/ai/flows/onboarding-analysis';
import { AnalysisAnimation } from '@/components/onboarding/analysis-animation';
import { Button } from '@/components/ui/button';
import { MoveRight } from 'lucide-react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Flame, ShieldCheck, Target } from 'lucide-react';


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
    "Consulting with AI Nutrition Expert...",
    "Analyzing your goals with the Fitness Coach...",
    "Reviewing medical history with our Safety Advisor...",
    "Calculating your personalized caloric needs...",
    "Designing your initial training split...",
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
          Analyzing Your Profile
        </h1>
        <p className="mt-4 text-lg text-muted-foreground transition-all duration-500">
          {message}
        </p>
      </div>
  )
}

function AnalysisResult() {
  const searchParams = useSearchParams();
  const [analysisResult, setAnalysisResult] = React.useState<OnboardingAnalysisOutput | null>(null);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    const performAnalysis = async () => {
      // Create a default fallback for each parameter.
      const params: OnboardingAnalysisInput = {
        userId: '12345', // In a real app, this would be the logged-in user's ID
        goals: searchParams.get('goal') || 'improve_fitness',
        fitnessLevel: (searchParams.get('fitnessLevel') as 'beginner' | 'intermediate' | 'advanced') || 'beginner',
        trainingDays: searchParams.get('trainingDays') || '3',
        lifestyle: searchParams.get('lifestyle') || 'sedentary',
        eatingHabits: searchParams.get('eatingHabits') || 'None',
        medicalHistory: searchParams.get('medicalHistory') || 'None',
        physicalSpecifications: `${searchParams.get('gender') || 'other'}, ${searchParams.get('age') || 25} years, ${searchParams.get('height') || 170}cm, ${searchParams.get('weight') || 70}kg, ${searchParams.get('bodyType') || 'mesomorph'}`,
      };
      
      try {
        const result = await onboardingAnalysis(params);
        setAnalysisResult(result);
      } catch (e) {
        console.error(e);
        setError("Our AI is currently unavailable. Please try again later.");
      }
    };

    performAnalysis();
  }, [searchParams]);

  if (error) {
    return <ErrorDisplay message={error} />
  }

  if (!analysisResult) {
    return <Loading />;
  }

  return <AnalysisContent result={analysisResult} />
}


function AnalysisContent({ result }: { result: OnboardingAnalysisOutput }) {
  return (
    <div className="w-full max-w-3xl">
      <div className="text-center">
        <h1 className="mt-8 text-3xl font-bold tracking-tight text-foreground sm:text-4xl font-headline">
          Your Personal Plan is Ready!
        </h1>
        <p className="mt-4 text-lg text-muted-foreground">
          Here is the starting point our AI has created based on your profile.
        </p>
      </div>

      <div className="mt-10 grid grid-cols-1 md:grid-cols-3 gap-6 text-left">
        <Card>
          <CardHeader className="flex flex-row items-center gap-4">
            <ShieldCheck className="h-8 w-8 text-primary" />
            <CardTitle>Medical Safety</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">Risk Level:</p>
            <Badge variant={result.medical_flags.risk_level === 'low' ? 'secondary' : 'destructive'} className="capitalize">{result.medical_flags.risk_level}</Badge>
            <p className="text-sm text-muted-foreground mt-4">Contraindications:</p>
            <p className="font-medium">{result.medical_flags.contraindications}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center gap-4">
            <Flame className="h-8 w-8 text-primary" />
            <CardTitle>Nutrition</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">Daily Caloric Needs:</p>
            <p className="font-bold text-lg">{result.caloric_needs} kcal</p>
             <p className="text-sm text-muted-foreground mt-4">Macro Targets:</p>
            <p className="font-medium">{result.macro_targets}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center gap-4">
            <Target className="h-8 w-8 text-primary" />
            <CardTitle>Fitness</CardTitle>
          </CardHeader>
           <CardContent>
            <p className="text-sm text-muted-foreground">Initial Level:</p>
            <p className="font-medium capitalize">{result.initial_level}</p>
             <p className="text-sm text-muted-foreground mt-4">Training Split:</p>
            <p className="font-medium capitalize">{result.training_split.replace('_', ' ')}</p>
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
