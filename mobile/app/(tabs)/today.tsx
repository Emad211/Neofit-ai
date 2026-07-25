import * as React from 'react';
import { View } from 'react-native';
import { router } from 'expo-router';
import { AppText, Card, InlineNotice, MetricCard, PageTitle, PrimaryButton, Screen } from '@/components/ui';
import { saveNutritionPlan, saveWorkoutPlan } from '@/db/plan-repository';
import { useApp } from '@/providers/app-provider';
import { generateNutritionPlan, generateWorkoutPlan } from '@/services/ai-features';
import { AvalAiError } from '@/services/avalai-client';

function mondayBasedDayIndex(date = new Date()) {
  return (date.getDay() + 6) % 7;
}

export default function TodayScreen() {
  const {
    profile,
    workoutPlan,
    nutritionPlan,
    dailySummary,
    hasAvalAiKey,
    locale,
    t,
    refreshPlans,
  } = useApp();
  const [generating, setGenerating] = React.useState(false);
  const [message, setMessage] = React.useState<string | null>(null);
  const [error, setError] = React.useState<string | null>(null);
  const label = (en: string, fa: string) => locale === 'fa' ? fa : en;
  const dayIndex = mondayBasedDayIndex();
  const todaysWorkout = workoutPlan?.days.find((day) => day.dayIndex === dayIndex) || null;
  const todaysNutrition = nutritionPlan?.days.find((day) => day.dayIndex === dayIndex) || null;

  const generateBothPlans = async () => {
    if (!profile) return;
    if (!hasAvalAiKey) {
      router.push('/ai-settings');
      return;
    }

    setGenerating(true);
    setError(null);
    setMessage(label('Generating the workout plan…', 'در حال ساخت برنامه تمرینی…'));
    try {
      const workout = await generateWorkoutPlan(profile);
      setMessage(label('Generating the nutrition plan…', 'در حال ساخت برنامه غذایی…'));
      const nutrition = await generateNutritionPlan(profile);
      setMessage(label('Saving both plans on this phone…', 'در حال ذخیره هر دو برنامه روی گوشی…'));
      await Promise.all([
        saveWorkoutPlan(workout, 'ai'),
        saveNutritionPlan(nutrition, 'ai'),
      ]);
      await refreshPlans();
      setMessage(t('ai.saved'));
    } catch (caught) {
      console.error('Plan generation failed:', caught);
      if (caught instanceof AvalAiError) {
        setError(caught.code === 'MISSING_API_KEY'
          ? t('ai.missingKey')
          : caught.status === 0 || caught.code === 'TIMEOUT'
            ? t('ai.networkError')
            : caught.code.includes('VALIDATION') || caught.code === 'INVALID_JSON'
              ? t('ai.invalidOutput')
              : caught.message);
      } else {
        setError(caught instanceof Error ? caught.message : t('ai.networkError'));
      }
      setMessage(null);
    } finally {
      setGenerating(false);
    }
  };

  return (
    <Screen>
      <PageTitle
        title={t('today.hello', { name: profile?.name || '' })}
        subtitle={t('today.subtitle')}
      />

      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}>
        <MetricCard label={t('today.calories')} value={Math.round(dailySummary?.nutrition.calories || 0)} unit="kcal" />
        <MetricCard label={t('today.protein')} value={Math.round(dailySummary?.nutrition.proteinG || 0)} unit="g" />
        <MetricCard label={t('today.activity')} value={Math.round(dailySummary?.activity.durationMinutes || 0)} unit={label('min', 'دقیقه')} />
        <MetricCard label={t('today.workout')} value={Math.round(dailySummary?.workout.durationMinutes || 0)} unit={label('min', 'دقیقه')} />
      </View>

      {!hasAvalAiKey ? (
        <InlineNotice tone="warning">{t('today.apiKeyNeeded')}</InlineNotice>
      ) : null}

      {message ? <InlineNotice tone="success">{message}</InlineNotice> : null}
      {error ? <InlineNotice tone="danger">{error}</InlineNotice> : null}

      <Card>
        <AppText size={20} weight="800">{label('Today’s workout', 'تمرین امروز')}</AppText>
        {todaysWorkout ? (
          <>
            <AppText size={18} weight="700">{todaysWorkout.title}</AppText>
            <AppText muted>{todaysWorkout.focus}</AppText>
            <AppText muted>{t('workout.minutes', { count: todaysWorkout.durationMinutes })} · {t('workout.exercises', { count: todaysWorkout.exercises.length })}</AppText>
            <PrimaryButton title={t('workout.start')} onPress={() => router.push(`/workout-player/${todaysWorkout.id}`)} />
          </>
        ) : (
          <AppText muted>{t('today.noPlan')}</AppText>
        )}
      </Card>

      <Card>
        <AppText size={20} weight="800">{label('Today’s meals', 'وعده‌های امروز')}</AppText>
        {todaysNutrition ? (
          <View style={{ gap: 10 }}>
            {todaysNutrition.meals.map((meal) => (
              <View key={meal.id} style={{ gap: 2 }}>
                <AppText weight="700">{meal.name}</AppText>
                <AppText muted size={13}>{meal.calories} kcal · {Math.round(meal.proteinG)}g {t('today.protein')}</AppText>
              </View>
            ))}
          </View>
        ) : (
          <AppText muted>{t('today.noPlan')}</AppText>
        )}
      </Card>

      <PrimaryButton
        title={hasAvalAiKey ? t('today.generatePlans') : t('settings.avalai')}
        onPress={hasAvalAiKey ? generateBothPlans : () => router.push('/ai-settings')}
        loading={generating}
      />
    </Screen>
  );
}
