'use client';

import * as React from 'react';
import Link from 'next/link';
import { Clock, Coffee, Flame, PlayCircle } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { useUserData } from '@/context/user-profile-context';
import { useI18n } from '@/i18n/provider';

export function WorkoutPlan() {
  const { workoutPlan, isLoading } = useUserData();
  const { locale, t } = useI18n();
  const label = (en: string, fa: string) => locale === 'fa' ? fa : en;

  if (isLoading) {
    return <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">{Array.from({ length: 3 }, (_, index) => <Card key={index} className="flex h-full flex-col"><CardHeader><Skeleton className="h-4 w-24" /><Skeleton className="h-6 w-48" /><Skeleton className="h-4 w-32" /></CardHeader><CardContent className="flex-grow space-y-3">{Array.from({ length: 5 }, (_, item) => <Skeleton key={item} className="h-6 w-full" />)}</CardContent></Card>)}</div>;
  }

  if (!workoutPlan?.length) {
    return <Card className="p-10 text-center"><p className="text-muted-foreground">{t('workout.noPlan')}</p><Button asChild className="mt-4"><Link href="/profile/edit">{label('Create a plan', 'ساخت برنامه')}</Link></Button></Card>;
  }

  return (
    <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
      {workoutPlan.map((workout) => {
        const isLegacyRestDay = !workout.exercises?.length || workout.title.toLowerCase().includes('rest') || workout.title.includes('استراحت');
        return (
          <Card key={workout.id} className="flex h-full flex-col">
            <CardHeader>
              <div className="flex items-start justify-between gap-3">
                <div><CardDescription className="font-semibold text-primary">{workout.day}</CardDescription><CardTitle className="font-headline text-2xl">{workout.title}</CardTitle></div>
                {!isLegacyRestDay && <Badge variant="secondary">{workout.focus}</Badge>}
              </div>
              {!isLegacyRestDay && <div className="flex flex-wrap items-center gap-4 pt-2 text-sm text-muted-foreground"><span className="flex items-center gap-1"><Clock className="h-4 w-4" />{workout.duration}</span><span className="flex items-center gap-1"><Flame className="h-4 w-4" />{workout.calories}</span></div>}
            </CardHeader>
            <CardContent className="flex-grow">
              {isLegacyRestDay ? (
                <div className="flex h-full flex-col items-center justify-center text-center text-muted-foreground"><Coffee className="mb-4 h-12 w-12" /><p className="font-semibold">{t('workout.rest')}</p></div>
              ) : (
                <ul className="divide-y">{workout.exercises.map((exercise, index) => <li key={`${exercise.name}-${index}`} className="flex items-center justify-between gap-3 py-2"><span className="font-medium">{exercise.name}</span><span className="shrink-0 text-muted-foreground">{exercise.sets} × {exercise.reps}</span></li>)}</ul>
              )}
            </CardContent>
            {!isLegacyRestDay && <div className="mt-auto p-6 pt-0"><Button className="w-full" asChild><Link href={`/workout-player/${encodeURIComponent(workout.id)}`}><PlayCircle className="me-2 h-5 w-5" />{t('workout.start')}</Link></Button></div>}
          </Card>
        );
      })}
    </div>
  );
}
