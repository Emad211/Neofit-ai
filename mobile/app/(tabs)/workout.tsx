import * as React from 'react';
import { View } from 'react-native';
import { router } from 'expo-router';
import { AppText, Card, InlineNotice, PageTitle, PrimaryButton, Screen } from '@/components/ui';
import { saveWorkoutPlan } from '@/db/plan-repository';
import { useApp } from '@/providers/app-provider';
import { generateWorkoutPlan } from '@/services/ai-features';
import { AvalAiError } from '@/services/avalai-client';

function dayName(index: number, locale: 'fa' | 'en') {
  const referenceMonday = new Date(2024, 0, 1 + index);
  return new Intl.DateTimeFormat(locale === 'fa' ? 'fa-IR' : 'en-US', { weekday: 'long' }).format(referenceMonday);
}

export default function WorkoutScreen() {
  const { locale, profile, workoutPlan, hasAvalAiKey, t, refreshPlans } = useApp();
  const [generating, setGenerating] = React.useState(false);
  const [notice, setNotice] = React.useState<string | null>(null);
  const [error, setError] = React.useState<string | null>(null);

  const generate = async () => {
    if (!profile) return;
    if (!hasAvalAiKey) {
      router.push('/ai-settings');
      return;
    }

    setGenerating(true);
    setNotice(null);
    setError(null);
    try {
      const plan = await generateWorkoutPlan(profile);
      await saveWorkoutPlan(plan, 'ai');
      await refreshPlans();
      setNotice(t('ai.saved'));
    } catch (caught) {
      console.error('Workout plan generation failed:', caught);
      setError(caught instanceof AvalAiError ? caught.message : t('ai.networkError'));
    } finally {
      setGenerating(false);
    }
  };

  return (
    <Screen>
      <PageTitle title={t('workout.title')} subtitle={t('settings.localDataDescription')} />
      {notice ? <InlineNotice tone="success">{notice}</InlineNotice> : null}
      {error ? <InlineNotice tone="danger">{error}</InlineNotice> : null}

      {workoutPlan ? (
        <>
          <Card>
            <AppText size={23} weight="800">{workoutPlan.title}</AppText>
            <AppText muted>{workoutPlan.summary}</AppText>
          </Card>
          {workoutPlan.days.map((day) => (
            <Card key={day.id}>
              <View style={{ gap: 4 }}>
                <AppText muted size={13}>{dayName(day.dayIndex, locale)}</AppText>
                <AppText size={21} weight="800">{day.title}</AppText>
                <AppText muted>{day.focus}</AppText>
                <AppText muted size={13}>{t('workout.minutes', { count: day.durationMinutes })} · {t('workout.exercises', { count: day.exercises.length })}</AppText>
              </View>
              <View style={{ gap: 8 }}>
                {day.exercises.map((exercise, index) => (
                  <View key={exercise.id} style={{ flexDirection: 'row', justifyContent: 'space-between', gap: 12 }}>
                    <AppText size={14} weight="600">{index + 1}. {exercise.name}</AppText>
                    <AppText muted size={13}>{exercise.sets} × {exercise.reps}</AppText>
                  </View>
                ))}
              </View>
              <PrimaryButton title={t('workout.start')} onPress={() => router.push(`/workout-player/${day.id}`)} />
            </Card>
          ))}
          {workoutPlan.safetyNotes.length > 0 ? (
            <InlineNotice tone="warning">{workoutPlan.safetyNotes.join('\n')}</InlineNotice>
          ) : null}
        </>
      ) : (
        <Card><AppText muted>{t('workout.noPlan')}</AppText></Card>
      )}

      <PrimaryButton
        title={hasAvalAiKey ? t('workout.generate') : t('settings.avalai')}
        onPress={hasAvalAiKey ? generate : () => router.push('/ai-settings')}
        loading={generating}
      />
    </Screen>
  );
}
