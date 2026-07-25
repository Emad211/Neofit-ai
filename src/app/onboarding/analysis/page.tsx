'use client';

import * as React from 'react';
import Link from 'next/link';
import { Apple, Dumbbell, MoveRight, ShieldAlert } from 'lucide-react';
import { generateNutritionProgram } from '@/ai/flows/generate-nutrition-program';
import { generateWorkoutProgram } from '@/ai/flows/generate-workout-program';
import type { GenerateNutritionProgramOutput, GenerateWorkoutProgramOutput } from '@/ai/schemas';
import { AnalysisAnimation } from '@/components/onboarding/analysis-animation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { UserProfileSchema, useUserData } from '@/context/user-profile-context';
import { useOnboarding } from '@/context/onboarding-context';
import { useI18n } from '@/i18n/provider';
import { AiClientError } from '@/lib/ai-client';

 type AnalysisResults = {
  nutrition: GenerateNutritionProgramOutput;
  workout: GenerateWorkoutProgramOutput;
};

export default function OnboardingAnalysisPage() {
  const { user } = useUserData();
  const { draft, isReady: draftReady, clearDraft } = useOnboarding();
  const { locale, t } = useI18n();
  const [result, setResult] = React.useState<AnalysisResults | null>(null);
  const [error, setError] = React.useState<{ message: string; upgradeRequired?: boolean } | null>(null);
  const [attempt, setAttempt] = React.useState(0);
  const startedRef = React.useRef(false);

  React.useEffect(() => {
    if (!draftReady || !user || startedRef.current) return;
    startedRef.current = true;

    const performAnalysis = async () => {
      try {
        const profile = UserProfileSchema.parse({
          ...draft,
          name: user.displayName || (locale === 'fa' ? 'کاربر' : 'User'),
        });

        const physicalSpecifications = [
          profile.gender,
          `${profile.age} years`,
          `${profile.height}cm`,
          `${profile.weight}kg`,
          profile.bodyType,
        ].join(', ');
        const eatingHabits = [
          profile.dietaryPreference && profile.dietaryPreference !== 'none'
            ? `Dietary preference: ${profile.dietaryPreference}`
            : '',
          profile.eatingHabits || '',
        ].filter(Boolean).join('; ') || 'None';

        // Workout is intentionally the monthly plan-generation accounting event.
        const workout = await generateWorkoutProgram({
          goals: profile.goal,
          performanceGoals: profile.performanceGoals,
          fitnessLevel: profile.fitnessLevel,
          trainingDays: Number(profile.trainingDays),
          trainingDuration: profile.trainingDuration,
          trainingTime: profile.trainingTime,
          workoutLocation: profile.workoutLocation,
          availableEquipment: profile.availableEquipment || 'Bodyweight only',
          medicalHistory: profile.medicalHistory || 'None',
          physicalSpecifications,
          sleepHours: profile.sleepHours,
          stressLevel: profile.stressLevel,
          locale,
        });

        const nutrition = await generateNutritionProgram({
          goals: profile.goal,
          performanceGoals: profile.performanceGoals,
          fitnessLevel: profile.fitnessLevel,
          physicalSpecifications,
          lifestyle: profile.lifestyle,
          sleepHours: profile.sleepHours,
          stressLevel: profile.stressLevel,
          eatingHabits,
          cookingSkill: profile.cookingSkill,
          costLevel: profile.costLevel,
          trainingDays: Number(profile.trainingDays),
          trainingDuration: profile.trainingDuration,
          trainingTime: profile.trainingTime,
          locale,
        });

        const token = await user.getIdToken();
        const response = await fetch('/api/onboarding/finalize', {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            profile,
            locale,
            nutritionPlan: nutrition.weeklyMealPlan,
            workoutPlan: workout.weeklyWorkoutPlan,
            summaries: { nutrition: nutrition.summary, workout: workout.summary },
          }),
          cache: 'no-store',
        });

        if (!response.ok) {
          const payload = await response.json().catch(() => null) as { error?: string } | null;
          throw new Error(payload?.error || 'Failed to save the generated plans.');
        }

        clearDraft();
        setResult({ nutrition, workout });
      } catch (caught) {
        console.error('Onboarding analysis failed:', caught);
        if (caught instanceof AiClientError && caught.status === 429) {
          setError({
            message: locale === 'fa'
              ? 'سهمیه ساخت برنامه این پلن تمام شده است. برای ادامه پلن خود را ارتقا دهید.'
              : 'This plan has reached its plan-generation limit. Upgrade to continue.',
            upgradeRequired: true,
          });
        } else {
          setError({
            message: locale === 'fa'
              ? 'ساخت یا ذخیره برنامه کامل نشد. اطلاعات شما در نشانی صفحه ذخیره نشده و می‌توانید دوباره تلاش کنید.'
              : 'Plan generation or saving did not complete. Your health data was not placed in the URL, and you can safely retry.',
          });
        }
      }
    };

    void performAnalysis();
  }, [attempt, clearDraft, draft, draftReady, locale, user]);

  const retry = () => {
    startedRef.current = false;
    setError(null);
    setAttempt((value) => value + 1);
  };

  return (
    <main className="flex min-h-screen w-full flex-col items-center justify-center bg-background p-4 sm:p-6 lg:p-8">
      {error ? (
        <ErrorDisplay message={error.message} upgradeRequired={error.upgradeRequired} onRetry={retry} />
      ) : result ? (
        <AnalysisContent result={result} />
      ) : (
        <Loading />
      )}
    </main>
  );
}

function Loading() {
  const { locale, t } = useI18n();
  const messages = React.useMemo(() => locale === 'fa'
    ? ['بررسی محدودیت‌های ایمنی…', 'ساخت برنامه تمرینی…', 'طراحی برنامه غذایی…', 'اعتبارسنجی خروجی‌ها…']
    : ['Reviewing safety constraints…', 'Building the workout plan…', 'Designing the meal plan…', 'Validating the results…'], [locale]);
  const [index, setIndex] = React.useState(0);

  React.useEffect(() => {
    const interval = window.setInterval(() => setIndex((value) => (value + 1) % messages.length), 2_500);
    return () => window.clearInterval(interval);
  }, [messages.length]);

  return (
    <div className="w-full max-w-2xl text-center" aria-live="polite" aria-busy="true">
      <AnalysisAnimation />
      <h1 className="mt-8 font-headline text-3xl font-bold tracking-tight sm:text-4xl">{t('onboarding.generating')}</h1>
      <p className="mt-4 text-lg text-muted-foreground">{messages[index]}</p>
      <p className="mt-2 text-sm text-muted-foreground">{t('onboarding.generatingDescription')}</p>
    </div>
  );
}

function AnalysisContent({ result }: { result: AnalysisResults }) {
  const { locale, t } = useI18n();
  const safetyNotes = [...result.workout.safetyNotes, ...result.nutrition.safetyNotes];

  return (
    <div className="w-full max-w-3xl">
      <header className="text-center">
        <h1 className="mt-8 font-headline text-3xl font-bold tracking-tight sm:text-4xl">{t('onboarding.ready')}</h1>
        <p className="mt-4 text-lg text-muted-foreground">
          {locale === 'fa' ? 'خلاصه برنامه هفته اول را بررسی کنید.' : 'Review the summary of your first week.'}
        </p>
      </header>

      <div className="mt-10 grid gap-6 text-start md:grid-cols-2">
        <Card className="flex flex-col">
          <CardHeader className="flex flex-row items-center gap-4">
            <Apple className="h-8 w-8 text-primary" aria-hidden="true" />
            <CardTitle>{locale === 'fa' ? 'برنامه غذایی' : 'Nutrition plan'}</CardTitle>
          </CardHeader>
          <CardContent className="flex-grow"><p className="text-muted-foreground">{result.nutrition.summary}</p></CardContent>
        </Card>
        <Card className="flex flex-col">
          <CardHeader className="flex flex-row items-center gap-4">
            <Dumbbell className="h-8 w-8 text-primary" aria-hidden="true" />
            <CardTitle>{locale === 'fa' ? 'برنامه تمرینی' : 'Workout plan'}</CardTitle>
          </CardHeader>
          <CardContent className="flex-grow"><p className="text-muted-foreground">{result.workout.summary}</p></CardContent>
        </Card>
      </div>

      {safetyNotes.length > 0 && (
        <Alert className="mt-6">
          <ShieldAlert className="h-4 w-4" aria-hidden="true" />
          <AlertDescription>
            <ul className="list-disc space-y-1 ps-5">{safetyNotes.map((note) => <li key={note}>{note}</li>)}</ul>
          </AlertDescription>
        </Alert>
      )}

      <p className="mt-6 text-center text-sm text-muted-foreground">{t('legal.medicalDisclaimer')}</p>
      <div className="mt-8 text-center">
        <Button size="lg" asChild className="bg-accent text-accent-foreground hover:bg-accent/90">
          <Link href="/today">{t('onboarding.start')} <MoveRight className="ms-2 h-5 w-5 rtl:rotate-180" aria-hidden="true" /></Link>
        </Button>
      </div>
    </div>
  );
}

function ErrorDisplay({
  message,
  upgradeRequired,
  onRetry,
}: {
  message: string;
  upgradeRequired?: boolean;
  onRetry: () => void;
}) {
  const { locale, t } = useI18n();
  return (
    <div className="w-full max-w-2xl text-center">
      <h1 className="font-headline text-3xl font-bold text-destructive sm:text-4xl">
        {locale === 'fa' ? 'ساخت برنامه کامل نشد' : 'Plan generation did not complete'}
      </h1>
      <p className="mt-4 text-lg text-muted-foreground">{message}</p>
      <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
        {upgradeRequired && <Button asChild><Link href="/pricing">{t('common.upgrade')}</Link></Button>}
        <Button variant={upgradeRequired ? 'outline' : 'default'} onClick={onRetry}>{t('common.retry')}</Button>
        <Button variant="ghost" asChild><Link href="/">{t('common.back')}</Link></Button>
      </div>
    </div>
  );
}
