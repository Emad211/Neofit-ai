'use client';

import { WorkoutPlan } from '@/components/workout/workout-plan';
import { useI18n } from '@/i18n/provider';

export default function WorkoutPage() {
  const { t } = useI18n();
  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <header className="mb-8">
        <h1 className="font-headline text-4xl font-bold">{t('workout.title')}</h1>
        <p className="text-muted-foreground">{t('workout.subtitle')}</p>
      </header>
      <main><WorkoutPlan /></main>
    </div>
  );
}
