import * as React from 'react';
import { View } from 'react-native';
import * as Haptics from 'expo-haptics';
import { router, useLocalSearchParams } from 'expo-router';
import { z } from 'zod';
import { AppText, Card, Field, InlineNotice, MetricCard, PrimaryButton, Screen } from '@/components/ui';
import { ExerciseTutorialCard } from '@/components/exercise-tutorial-card';
import { logWorkoutSession } from '@/db/log-repository';
import { deleteSetting, getSetting, setSetting } from '@/db/settings-repository';
import { WorkoutSetLogInput } from '@/domain/models';
import { createId } from '@/lib/id';
import { useApp } from '@/providers/app-provider';

const DraftSchema = z.object({
  sessionId: z.string().min(1).max(100).optional(),
  startedAt: z.string().datetime(),
  currentExerciseIndex: z.number().int().min(0),
  currentSetIndex: z.number().int().min(0),
  completedSets: z.array(z.object({
    exerciseOrder: z.number().int().min(0),
    exerciseName: z.string(),
    setNumber: z.number().int().min(1),
    reps: z.number().int().min(1),
    weightKg: z.number().min(0),
  })),
});
type Draft = z.infer<typeof DraftSchema>;

export default function WorkoutPlayerScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { workoutPlan, locale, refreshDailySummary } = useApp();
  const day = workoutPlan?.days.find((item) => item.id === id) || null;
  const [ready, setReady] = React.useState(false);
  const [sessionId, setSessionId] = React.useState(() => createId('workout'));
  const [startedAt, setStartedAt] = React.useState(new Date().toISOString());
  const [exerciseIndex, setExerciseIndex] = React.useState(0);
  const [setIndex, setSetIndex] = React.useState(0);
  const [completedSets, setCompletedSets] = React.useState<WorkoutSetLogInput[]>([]);
  const [reps, setReps] = React.useState('');
  const [weight, setWeight] = React.useState('0');
  const [restSeconds, setRestSeconds] = React.useState(0);
  const [pendingPosition, setPendingPosition] = React.useState<{ exerciseIndex: number; setIndex: number } | null>(null);
  const [saving, setSaving] = React.useState(false);
  const [advancing, setAdvancing] = React.useState(false);
  const [completed, setCompleted] = React.useState<{ durationMinutes: number; totalVolumeKg: number } | null>(null);
  const [completionWarning, setCompletionWarning] = React.useState<string | null>(null);
  const [error, setError] = React.useState<string | null>(null);
  const label = (en: string, fa: string) => locale === 'fa' ? fa : en;
  const draftKey = `workout.draft.${id || 'unknown'}`;

  const exercise = day?.exercises[exerciseIndex];

  React.useEffect(() => {
    const restore = async () => {
      const fallback: Draft = {
        sessionId: createId('workout'),
        startedAt: new Date().toISOString(),
        currentExerciseIndex: 0,
        currentSetIndex: 0,
        completedSets: [],
      };
      const draft = await getSetting(draftKey, DraftSchema, fallback);
      const resolvedSessionId = draft.sessionId || createId('workout');
      setSessionId(resolvedSessionId);
      if (day && draft.currentExerciseIndex < day.exercises.length) {
        setStartedAt(draft.startedAt);
        setExerciseIndex(draft.currentExerciseIndex);
        setSetIndex(draft.currentSetIndex);
        setCompletedSets(draft.completedSets);
      }
      setReady(true);
    };
    void restore();
  }, [day, draftKey]);

  React.useEffect(() => {
    if (restSeconds <= 0 || !pendingPosition) return;
    const timer = setTimeout(() => setRestSeconds((value) => Math.max(0, value - 1)), 1_000);
    return () => clearTimeout(timer);
  }, [pendingPosition, restSeconds]);

  React.useEffect(() => {
    if (restSeconds !== 0 || !pendingPosition) return;
    setExerciseIndex(pendingPosition.exerciseIndex);
    setSetIndex(pendingPosition.setIndex);
    setPendingPosition(null);
    setReps('');
    setWeight('0');
    void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => undefined);
  }, [pendingPosition, restSeconds]);

  React.useEffect(() => {
    if ([1, 2, 3].includes(restSeconds)) {
      void Haptics.selectionAsync().catch(() => undefined);
    }
  }, [restSeconds]);

  const persistDraft = async (next: {
    exerciseIndex: number;
    setIndex: number;
    sets: WorkoutSetLogInput[];
  }) => {
    await setSetting(draftKey, {
      sessionId,
      startedAt,
      currentExerciseIndex: next.exerciseIndex,
      currentSetIndex: next.setIndex,
      completedSets: next.sets,
    });
  };

  const finishWorkout = async (sets: WorkoutSetLogInput[]) => {
    if (!day || !workoutPlan) return;
    setSaving(true);
    setError(null);
    setCompletionWarning(null);
    try {
      const completedAt = new Date();
      const durationMinutes = Math.max(1, Math.round((completedAt.getTime() - Date.parse(startedAt)) / 60_000));
      const result = await logWorkoutSession({
        sessionId,
        workoutPlanId: workoutPlan.id,
        workoutTitle: day.title,
        startedAt,
        completedAt: completedAt.toISOString(),
        durationMinutes,
        sets,
      });

      // The SQLite transaction is the save boundary. Show completion
      // immediately after it commits; cleanup and dashboard refresh are
      // secondary operations and must never invite a duplicate save.
      setCompleted({ durationMinutes, totalVolumeKg: result.totalVolumeKg });
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => undefined);

      const warnings: string[] = [];
      try {
        await deleteSetting(draftKey);
      } catch (cleanupError) {
        console.error('Completed workout draft cleanup failed:', cleanupError);
        warnings.push(label(
          'The completed session is saved, but its local draft could not be cleared. Retrying the same draft is idempotent.',
          'جلسه کامل ذخیره شده است، اما پیش‌نویس محلی پاک نشد. ثبت دوباره همان پیش‌نویس رکورد تکراری نمی‌سازد.',
        ));
      }

      try {
        await refreshDailySummary();
      } catch (refreshError) {
        console.error('Completed workout summary refresh failed:', refreshError);
        warnings.push(label(
          'The completed session is saved, but dashboard totals will refresh when the app reloads.',
          'جلسه کامل ذخیره شده است، اما مجموع‌های داشبورد با بارگذاری بعدی برنامه تازه می‌شوند.',
        ));
      }

      if (warnings.length > 0) setCompletionWarning(warnings.join('\n'));
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : label('Workout saving failed.', 'ذخیره تمرین انجام نشد.'));
    } finally {
      setSaving(false);
    }
  };

  const completeSet = async () => {
    if (!day || !exercise || advancing || saving) return;
    const repsNumber = Number(reps);
    const weightNumber = Number(weight || 0);
    if (!Number.isInteger(repsNumber) || repsNumber < 1 || repsNumber > 1_000) {
      setError(label('Enter a valid repetition count.', 'تعداد تکرار معتبر وارد کنید.'));
      return;
    }
    if (!Number.isFinite(weightNumber) || weightNumber < 0 || weightNumber > 1_000) {
      setError(label('Enter a valid weight. Use zero for bodyweight.', 'وزن معتبر وارد کنید. برای وزن بدن عدد صفر را وارد کنید.'));
      return;
    }

    setAdvancing(true);
    setError(null);
    try {
      const entry: WorkoutSetLogInput = {
        exerciseOrder: exerciseIndex,
        exerciseName: exercise.name,
        setNumber: setIndex + 1,
        reps: repsNumber,
        weightKg: weightNumber,
      };
      const nextSets = [
        ...completedSets.filter((item) => !(item.exerciseOrder === exerciseIndex && item.setNumber === setIndex + 1)),
        entry,
      ].sort((a, b) => a.exerciseOrder - b.exerciseOrder || a.setNumber - b.setNumber);
      setCompletedSets(nextSets);

      const isLastSet = setIndex >= exercise.sets - 1;
      const isLastExercise = exerciseIndex >= day.exercises.length - 1;
      if (isLastSet && isLastExercise) {
        await persistDraft({ exerciseIndex, setIndex, sets: nextSets });
        await finishWorkout(nextSets);
        return;
      }

      const nextPosition = isLastSet
        ? { exerciseIndex: exerciseIndex + 1, setIndex: 0 }
        : { exerciseIndex, setIndex: setIndex + 1 };
      await persistDraft({ ...nextPosition, sets: nextSets });
      setPendingPosition(nextPosition);
      setRestSeconds(exercise.restSeconds);
      void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => undefined);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : label('Set saving failed.', 'ذخیره ست انجام نشد.'));
    } finally {
      setAdvancing(false);
    }
  };

  if (!ready) {
    return <Screen><AppText>{label('Loading workout…', 'در حال بارگذاری تمرین…')}</AppText></Screen>;
  }

  if (!day || !exercise) {
    return (
      <Screen>
        <InlineNotice tone="danger">{label('This workout was not found in the active local plan.', 'این تمرین در برنامه محلی فعال پیدا نشد.')}</InlineNotice>
        <PrimaryButton title={label('Back to workouts', 'بازگشت به تمرین‌ها')} onPress={() => router.replace('/(tabs)/workout')} />
      </Screen>
    );
  }

  if (completed) {
    return (
      <Screen>
        <View style={{ paddingTop: 60, gap: 16 }}>
          <AppText size={34} weight="800">{label('Workout complete', 'تمرین تمام شد')}</AppText>
          <InlineNotice tone="success">{label('The session and every completed set were saved in SQLite.', 'جلسه و تمام ست‌های کامل‌شده در SQLite ذخیره شدند.')}</InlineNotice>
          {completionWarning ? <InlineNotice tone="warning">{completionWarning}</InlineNotice> : null}
          <View style={{ flexDirection: 'row', gap: 10 }}>
            <MetricCard label={label('Duration', 'مدت')} value={completed.durationMinutes} unit={label('min', 'دقیقه')} />
            <MetricCard label={label('Volume', 'حجم')} value={Math.round(completed.totalVolumeKg)} unit="kg" />
          </View>
          <PrimaryButton title={label('Back to workouts', 'بازگشت به تمرین‌ها')} onPress={() => router.replace('/(tabs)/workout')} />
        </View>
      </Screen>
    );
  }

  if (pendingPosition && restSeconds > 0) {
    const nextExercise = day.exercises[pendingPosition.exerciseIndex];
    return (
      <Screen>
        <View style={{ minHeight: 560, justifyContent: 'center', alignItems: 'center', gap: 18 }}>
          <AppText muted size={20}>{label('Rest', 'استراحت')}</AppText>
          <AppText size={72} weight="800" style={{ fontVariant: ['tabular-nums'] }}>{restSeconds}</AppText>
          <AppText size={18} weight="700">{nextExercise?.name}</AppText>
          <AppText muted>{label(`Next set: ${pendingPosition.setIndex + 1}`, `ست بعدی: ${pendingPosition.setIndex + 1}`)}</AppText>
          <PrimaryButton title={label('Skip rest', 'ردکردن استراحت')} variant="secondary" onPress={() => setRestSeconds(0)} />
        </View>
      </Screen>
    );
  }

  const completedForExercise = completedSets.filter((item) => item.exerciseOrder === exerciseIndex);

  return (
    <Screen>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 12 }}>
        <PrimaryButton title={label('Exit', 'خروج')} variant="ghost" onPress={() => router.back()} />
        <AppText muted size={13}>{exerciseIndex + 1}/{day.exercises.length}</AppText>
      </View>

      <Card>
        <AppText muted size={13}>{day.title}</AppText>
        <AppText size={29} weight="800">{exercise.name}</AppText>
        <AppText muted>{exercise.notes}</AppText>
        <AppText muted size={13}>{exercise.primaryMuscles.join(' · ')}{exercise.equipment.length ? ` · ${exercise.equipment.join(' · ')}` : ''}</AppText>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}>
          <MetricCard label={label('Set', 'ست')} value={`${setIndex + 1}/${exercise.sets}`} />
          <MetricCard label={label('Target', 'هدف')} value={exercise.reps} />
          <MetricCard label="RIR" value={exercise.targetRir} />
          <MetricCard label={label('Tempo', 'تمپو')} value={exercise.tempo} />
          <MetricCard label={label('Rest', 'استراحت')} value={exercise.restSeconds} unit="s" />
        </View>
        <View style={{ gap: 4 }}>
          <AppText weight="800">{label('Form cues', 'نکات اجرای صحیح')}</AppText>
          {exercise.formCues.map((cue) => <AppText key={cue} muted size={13}>• {cue}</AppText>)}
        </View>
        <View style={{ gap: 4 }}>
          <AppText weight="800">{label('Avoid', 'اشتباه‌های رایج')}</AppText>
          {exercise.commonMistakes.map((mistake) => <AppText key={mistake} muted size={13}>• {mistake}</AppText>)}
        </View>
      </Card>

      <ExerciseTutorialCard key={exercise.id} exercise={exercise} autoLoad />

      <Card>
        <Field label={label('Repetitions', 'تعداد تکرار')} value={reps} onChangeText={setReps} keyboardType="number-pad" />
        <Field label={label('Weight (kg)', 'وزن (کیلوگرم)')} hint={label('Use zero for bodyweight exercises.', 'برای حرکات وزن بدن عدد صفر را وارد کنید.')} value={weight} onChangeText={setWeight} keyboardType="decimal-pad" />
        {error ? <InlineNotice tone="danger">{error}</InlineNotice> : null}
        <PrimaryButton title={label('Complete set', 'ثبت پایان ست')} onPress={completeSet} loading={saving || advancing} />
      </Card>

      {completedForExercise.length > 0 ? (
        <Card>
          <AppText size={18} weight="800">{label('Completed sets', 'ست‌های کامل‌شده')}</AppText>
          {completedForExercise.map((item) => (
            <View key={item.setNumber} style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
              <AppText>{label(`Set ${item.setNumber}`, `ست ${item.setNumber}`)}</AppText>
              <AppText muted>{item.reps} × {item.weightKg} kg</AppText>
            </View>
          ))}
        </Card>
      ) : null}
    </Screen>
  );
}
