'use client';

import * as React from 'react';
import { ActivityRings } from '@/components/dashboard/activity-rings';
import { DailyFeed } from '@/components/dashboard/daily-feed';
import { SpeedDial } from '@/components/dashboard/speed-dial';
import { useUserData } from '@/context/user-profile-context';
import type { ActivityLog, MealLog, WorkoutLog } from '@/context/user-profile-context';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useI18n } from '@/i18n/provider';

function dayKey(date: Date, timeZone?: string) {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: timeZone || Intl.DateTimeFormat().resolvedOptions().timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(date);
  const values = Object.fromEntries(parts.map((part) => [part.type, part.value]));
  return `${values.year}-${values.month}-${values.day}`;
}

function parseDurationMinutes(value: string) {
  const numbers = value.match(/\d+/g)?.map(Number).filter(Number.isFinite) || [];
  if (numbers.length === 0) return 0;
  return numbers.length === 1 ? numbers[0] : Math.round((numbers[0] + numbers[1]) / 2);
}

export default function TodayPage() {
  const { userProfile, isLoading, combinedLogs, nutritionPlan, workoutPlan } = useUserData();
  const { locale, t } = useI18n();
  const timeZone = userProfile?.timezone;
  const today = dayKey(new Date(), timeZone);
  const userName = userProfile?.name || (locale === 'fa' ? 'دوست من' : 'there');
  const quote = locale === 'fa'
    ? 'پیشرفت پایدار از تصمیم‌های کوچک و قابل تکرار ساخته می‌شود.'
    : 'Sustainable progress is built from small, repeatable choices.';

  const todaysLogs = React.useMemo(() => combinedLogs.filter((log) => dayKey(new Date(log.loggedAt), timeZone) === today), [combinedLogs, timeZone, today]);

  const progress = React.useMemo(() => {
    const mealLogs = todaysLogs.filter((log): log is MealLog => log.logType === 'meal');
    const calories = mealLogs.reduce((sum, log) => sum + (Number(log.calories) || 0), 0);
    const protein = mealLogs.reduce((sum, log) => sum + (Number(log.protein) || 0), 0);
    const workout = todaysLogs
      .filter((log): log is ActivityLog | WorkoutLog => log.logType === 'activity' || log.logType === 'workout')
      .reduce((sum, log) => sum + (Number(log.durationMinutes) || 0), 0);

    const calorieGoal = nutritionPlan?.length
      ? Math.round(nutritionPlan.reduce((sum, day) => sum + (Number(day.totalCalories) || 0), 0) / nutritionPlan.length)
      : 0;
    const proteinGoal = nutritionPlan?.length
      ? Math.round(nutritionPlan.reduce((weekSum, day) => weekSum + day.meals.reduce((daySum, meal) => daySum + (Number(meal.protein) || 0), 0), 0) / nutritionPlan.length)
      : 0;
    const workoutGoal = workoutPlan?.length
      ? Math.round(workoutPlan.reduce((sum, planned) => sum + parseDurationMinutes(planned.duration), 0) / workoutPlan.length)
      : 0;

    return {
      calories: { value: Math.round(calories), goal: calorieGoal },
      protein: { value: Math.round(protein), goal: proteinGoal },
      workout: { value: Math.round(workout), goal: workoutGoal },
    };
  }, [nutritionPlan, todaysLogs, workoutPlan]);

  if (isLoading && !userProfile) {
    return (
      <div className="p-4 sm:p-6 lg:p-8" aria-busy="true">
        <header className="mb-8"><Skeleton className="h-10 w-48" /><Skeleton className="mt-2 h-4 w-64" /></header>
        <main className="space-y-8 pb-24"><Skeleton className="h-48 w-full" /><Skeleton className="h-96 w-full" /></main>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen p-4 sm:p-6 lg:p-8">
      <header className="mb-8">
        <h1 className="font-headline text-4xl font-bold">{t('today.hello', { name: userName })}</h1>
        <p className="text-muted-foreground">{t('today.subtitle')}</p>
      </header>

      <main className="space-y-8 pb-24">
        {(!nutritionPlan?.length || !workoutPlan?.length) && (
          <Alert>
            <AlertDescription>
              {locale === 'fa' ? 'برای نمایش هدف‌های روزانه، ابتدا برنامه تمرین و تغذیه را بسازید.' : 'Generate workout and nutrition plans to display daily targets.'}
            </AlertDescription>
          </Alert>
        )}
        <ActivityRings progress={progress} />
        <DailyFeed quote={quote} logs={todaysLogs} />
      </main>
      <SpeedDial />
    </div>
  );
}
