import * as React from 'react';
import { View } from 'react-native';
import { useFocusEffect } from 'expo-router';
import { AppText, Card, ChoiceGrid, Field, InlineNotice, MetricCard, PageTitle, PrimaryButton, Screen } from '@/components/ui';
import {
  getRecentActivities,
  getRecentWorkoutSessions,
  getWeightHistory,
  logActivity,
  logWeight,
} from '@/db/log-repository';
import { useApp } from '@/providers/app-provider';
import { ActivityIntensity, estimateActivityCalories } from '@/services/activity-calories';

type WeightRow = Awaited<ReturnType<typeof getWeightHistory>>[number];
type ActivityRow = Awaited<ReturnType<typeof getRecentActivities>>[number];
type WorkoutRow = Awaited<ReturnType<typeof getRecentWorkoutSessions>>[number];

export default function ProgressScreen() {
  const { locale, profile, t, refreshDailySummary, refreshAll } = useApp();
  const [weights, setWeights] = React.useState<WeightRow[]>([]);
  const [activities, setActivities] = React.useState<ActivityRow[]>([]);
  const [workouts, setWorkouts] = React.useState<WorkoutRow[]>([]);
  const [weightInput, setWeightInput] = React.useState(String(profile?.weightKg || ''));
  const [activityType, setActivityType] = React.useState('');
  const [duration, setDuration] = React.useState('30');
  const [intensity, setIntensity] = React.useState<ActivityIntensity>('medium');
  const [saving, setSaving] = React.useState<'weight' | 'activity' | null>(null);
  const [notice, setNotice] = React.useState<string | null>(null);
  const [error, setError] = React.useState<string | null>(null);
  const label = (en: string, fa: string) => locale === 'fa' ? fa : en;
  const dateFormatter = React.useMemo(() => new Intl.DateTimeFormat(locale === 'fa' ? 'fa-IR' : 'en-US', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }), [locale]);

  const load = React.useCallback(async () => {
    const [weightRows, activityRows, workoutRows] = await Promise.all([
      getWeightHistory(100),
      getRecentActivities(50),
      getRecentWorkoutSessions(50),
    ]);
    setWeights(weightRows);
    setActivities(activityRows);
    setWorkouts(workoutRows);
  }, []);

  useFocusEffect(React.useCallback(() => {
    void load();
  }, [load]));

  const saveWeight = async () => {
    const value = Number(weightInput);
    if (!Number.isFinite(value) || value < 20 || value > 500) {
      setError(label('Enter a valid weight.', 'وزن معتبر وارد کنید.'));
      return;
    }
    setSaving('weight');
    setError(null);
    setNotice(null);
    try {
      await logWeight({ measuredAt: new Date().toISOString(), weightKg: value });
      await Promise.all([load(), refreshAll()]);
      setNotice(label('Weight was saved on this phone.', 'وزن روی همین گوشی ذخیره شد.'));
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : label('Weight saving failed.', 'ذخیره وزن انجام نشد.'));
    } finally {
      setSaving(null);
    }
  };

  const saveActivity = async () => {
    if (!profile) return;
    const durationMinutes = Number(duration);
    if (activityType.trim().length < 2 || !Number.isFinite(durationMinutes) || durationMinutes < 1 || durationMinutes > 1_440) {
      setError(label('Enter a valid activity and duration.', 'نام فعالیت و مدت معتبر وارد کنید.'));
      return;
    }
    setSaving('activity');
    setError(null);
    setNotice(null);
    try {
      const estimate = estimateActivityCalories({
        activityType,
        durationMinutes,
        intensity,
        weightKg: profile.weightKg,
      });
      await logActivity({
        startedAt: new Date().toISOString(),
        activityType,
        durationMinutes,
        intensity,
        caloriesBurned: estimate.caloriesBurned,
        source: 'met',
      });
      await Promise.all([load(), refreshDailySummary()]);
      setNotice(label(
        `Activity saved. Estimated ${estimate.caloriesBurned} kcal using MET (${estimate.confidence} confidence).`,
        `فعالیت ذخیره شد. ${estimate.caloriesBurned} کیلوکالری با روش MET تخمین زده شد (اطمینان ${estimate.confidence === 'medium' ? 'متوسط' : 'کم'}).`,
      ));
      setActivityType('');
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : label('Activity saving failed.', 'ذخیره فعالیت انجام نشد.'));
    } finally {
      setSaving(null);
    }
  };

  const latestWeight = weights[0]?.weightKg ?? profile?.weightKg ?? 0;
  const previousWeight = weights[1]?.weightKg;
  const weightDelta = previousWeight === undefined ? null : latestWeight - previousWeight;
  const totalActivityMinutes = activities.reduce((sum, item) => sum + item.durationMinutes, 0);
  const totalWorkoutVolume = workouts.reduce((sum, item) => sum + item.totalVolumeKg, 0);

  return (
    <Screen>
      <PageTitle title={t('progress.title')} subtitle={t('progress.empty')} />

      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}>
        <MetricCard label={label('Latest weight', 'آخرین وزن')} value={latestWeight ? latestWeight.toFixed(1) : '—'} unit="kg" />
        <MetricCard label={label('Weight change', 'تغییر وزن')} value={weightDelta === null ? '—' : `${weightDelta > 0 ? '+' : ''}${weightDelta.toFixed(1)}`} unit="kg" />
        <MetricCard label={label('Activity history', 'کل فعالیت')} value={totalActivityMinutes} unit={label('min', 'دقیقه')} />
        <MetricCard label={label('Training volume', 'حجم تمرین')} value={Math.round(totalWorkoutVolume)} unit="kg" />
      </View>

      {notice ? <InlineNotice tone="success">{notice}</InlineNotice> : null}
      {error ? <InlineNotice tone="danger">{error}</InlineNotice> : null}

      <Card>
        <AppText size={20} weight="800">{label('Log weight', 'ثبت وزن')}</AppText>
        <Field label={t('onboarding.weight')} value={weightInput} onChangeText={setWeightInput} keyboardType="decimal-pad" />
        <PrimaryButton title={t('common.save')} onPress={saveWeight} loading={saving === 'weight'} />
      </Card>

      <Card>
        <AppText size={20} weight="800">{label('Log activity', 'ثبت فعالیت')}</AppText>
        <Field label={label('Activity', 'فعالیت')} value={activityType} onChangeText={setActivityType} placeholder={label('Walking, cycling, swimming…', 'پیاده‌روی، دوچرخه، شنا و…')} />
        <Field label={label('Duration (minutes)', 'مدت (دقیقه)')} value={duration} onChangeText={setDuration} keyboardType="number-pad" />
        <AppText weight="600">{label('Intensity', 'شدت')}</AppText>
        <ChoiceGrid value={intensity} onChange={setIntensity} options={[
          { value: 'low', label: label('Low', 'کم') },
          { value: 'medium', label: label('Medium', 'متوسط') },
          { value: 'high', label: label('High', 'زیاد') },
        ]} columns={3} />
        <PrimaryButton title={t('common.save')} onPress={saveActivity} loading={saving === 'activity'} />
      </Card>

      <Card>
        <AppText size={20} weight="800">{t('progress.weight')}</AppText>
        {weights.length === 0 ? <AppText muted>{t('progress.empty')}</AppText> : weights.slice(0, 12).map((item) => (
          <View key={item.id} style={{ flexDirection: 'row', justifyContent: 'space-between', gap: 12 }}>
            <AppText muted size={13}>{dateFormatter.format(new Date(item.measuredAt))}</AppText>
            <AppText weight="700">{item.weightKg.toFixed(1)} kg</AppText>
          </View>
        ))}
      </Card>

      <Card>
        <AppText size={20} weight="800">{t('progress.activity')}</AppText>
        {activities.length === 0 ? <AppText muted>{t('progress.empty')}</AppText> : activities.slice(0, 12).map((item) => (
          <View key={item.id} style={{ gap: 2 }}>
            <AppText weight="700">{item.activityType}</AppText>
            <AppText muted size={13}>{dateFormatter.format(new Date(item.startedAt))} · {item.durationMinutes} {label('min', 'دقیقه')} · {item.caloriesBurned} kcal</AppText>
          </View>
        ))}
      </Card>

      <Card>
        <AppText size={20} weight="800">{t('progress.workouts')}</AppText>
        {workouts.length === 0 ? <AppText muted>{t('progress.empty')}</AppText> : workouts.slice(0, 12).map((item) => (
          <View key={item.id} style={{ gap: 2 }}>
            <AppText weight="700">{item.workoutTitle}</AppText>
            <AppText muted size={13}>{dateFormatter.format(new Date(item.completedAt))} · {item.durationMinutes} {label('min', 'دقیقه')} · {Math.round(item.totalVolumeKg)} kg</AppText>
          </View>
        ))}
      </Card>
    </Screen>
  );
}
