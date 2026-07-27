import * as React from 'react';
import { View } from 'react-native';
import { router } from 'expo-router';
import { AppText, Card, InlineNotice, PageTitle, PrimaryButton, Screen } from '@/components/ui';
import { ExerciseTutorialCard } from '@/components/exercise-tutorial-card';
import { saveWorkoutPlan } from '@/db/plan-repository';
import { useApp } from '@/providers/app-provider';
import { generateWorkoutPlan } from '@/services/ai-features';
import { AvalAiError } from '@/services/avalai-client';

function dayName(index: number, locale: 'fa' | 'en') {
  const referenceMonday = new Date(2024, 0, 1 + index);
  return new Intl.DateTimeFormat(locale === 'fa' ? 'fa-IR' : 'en-US', { weekday: 'long' }).format(referenceMonday);
}

export default function WorkoutScreen() {
  const { locale, profile, workoutPlan, hasAvalAiKey, hasYouTubeKey, t, refreshPlans } = useApp();
  const [generating, setGenerating] = React.useState(false);
  const [expandedExerciseId, setExpandedExerciseId] = React.useState<string | null>(null);
  const [notice, setNotice] = React.useState<string | null>(null);
  const [error, setError] = React.useState<string | null>(null);
  const label = (en: string, fa: string) => locale === 'fa' ? fa : en;

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
      setExpandedExerciseId(null);
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
      <PageTitle title={t('workout.title')} subtitle={label(
        'Programs, guidance, tutorial results, and workout logs stay on this phone.',
        'برنامه‌ها، راهنمای حرکت، نتیجه ویدئوها و لاگ تمرین روی همین گوشی می‌مانند.',
      )} />
      {!hasYouTubeKey ? (
        <InlineNotice tone="warning">{label(
          'Add a personal YouTube Data API key to search and embed form tutorials. Direct YouTube search remains available without it.',
          'برای جست‌وجو و نمایش آموزش فرم حرکات، کلید شخصی YouTube Data API را اضافه کنید. جست‌وجوی مستقیم YouTube بدون کلید هم در دسترس است.',
        )}</InlineNotice>
      ) : null}
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

              <View style={{ gap: 12 }}>
                {day.exercises.map((exercise, index) => {
                  const expanded = expandedExerciseId === exercise.id;
                  return (
                    <View key={exercise.id} style={{ gap: 9, borderTopWidth: index === 0 ? 0 : 1, borderTopColor: 'rgba(128,128,128,0.18)', paddingTop: index === 0 ? 0 : 12 }}>
                      <View style={{ flexDirection: 'row', justifyContent: 'space-between', gap: 12 }}>
                        <View style={{ flex: 1, gap: 2 }}>
                          <AppText size={15} weight="700">{index + 1}. {exercise.name}</AppText>
                          <AppText muted size={12}>{exercise.primaryMuscles.join(' · ') || exercise.movementPattern}</AppText>
                        </View>
                        <View style={{ alignItems: 'flex-end' }}>
                          <AppText muted size={13}>{exercise.sets} × {exercise.reps}</AppText>
                          <AppText muted size={11}>RIR {exercise.targetRir} · {exercise.tempo}</AppText>
                        </View>
                      </View>

                      <PrimaryButton
                        title={expanded ? label('Hide form and video', 'بستن فرم و ویدئو') : label('Form guide and tutorial', 'راهنمای فرم و ویدئو')}
                        variant="ghost"
                        onPress={() => setExpandedExerciseId(expanded ? null : exercise.id)}
                      />

                      {expanded ? (
                        <View style={{ gap: 10 }}>
                          {exercise.notes ? <AppText muted size={13}>{exercise.notes}</AppText> : null}
                          <View style={{ gap: 4 }}>
                            <AppText weight="700" size={14}>{label('Form cues', 'نکات اجرای صحیح')}</AppText>
                            {exercise.formCues.map((cue) => <AppText key={cue} muted size={13}>• {cue}</AppText>)}
                          </View>
                          <View style={{ gap: 4 }}>
                            <AppText weight="700" size={14}>{label('Common mistakes', 'اشتباه‌های رایج')}</AppText>
                            {exercise.commonMistakes.map((mistake) => <AppText key={mistake} muted size={13}>• {mistake}</AppText>)}
                          </View>
                          <ExerciseTutorialCard exercise={exercise} compact />
                        </View>
                      ) : null}
                    </View>
                  );
                })}
              </View>

              <PrimaryButton
                title={t('workout.start')}
                onPress={() => router.push({
                  pathname: '/workout-player/[id]',
                  params: { id: day.id },
                })}
              />
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
