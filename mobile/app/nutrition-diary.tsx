import * as React from 'react';
import { Alert, View } from 'react-native';
import { useFocusEffect } from 'expo-router';
import {
  AppText,
  Card,
  InlineNotice,
  MetricCard,
  PrimaryButton,
  Screen,
} from '@/components/ui';
import {
  deleteNutritionDiaryEntry,
  listNutritionDiaryEntries,
  saveNutritionDiaryEntry,
  summarizeNutritionDiaryDate,
} from '@/db/nutrition-diary-repository';
import { localDateFromIso } from '@/db/nutrition-meal-repository';
import { createId } from '@/lib/id';
import {
  cloneDiaryEntriesToDate,
  type DiaryDaySummary,
  type DiaryEntry,
  type MealType,
} from '@/nutrition-core';
import { useApp } from '@/providers/app-provider';

const MEAL_ORDER: readonly MealType[] = ['breakfast', 'lunch', 'dinner', 'snack'];

function shiftLocalDate(localDate: string, days: number): string {
  const [year, month, day] = localDate.split('-').map(Number);
  if (!year || !month || !day) throw new Error('Local date is invalid.');
  const date = new Date(year, month - 1, day, 12, 0, 0, 0);
  date.setDate(date.getDate() + days);
  return localDateFromIso(date.toISOString());
}

function emptySummary(localDate: string): DiaryDaySummary {
  const empty = { grams: 0, center: {} } as const;
  return {
    localDate,
    total: empty,
    byMeal: { breakfast: empty, lunch: empty, dinner: empty, snack: empty },
    entryCount: 0,
  };
}

export default function NutritionDiaryScreen() {
  const { locale, refreshDailySummary } = useApp();
  const label = React.useCallback((en: string, fa: string) => locale === 'fa' ? fa : en, [locale]);
  const today = localDateFromIso(new Date().toISOString());
  const yesterday = shiftLocalDate(today, -1);
  const [entries, setEntries] = React.useState<DiaryEntry[]>([]);
  const [yesterdayEntries, setYesterdayEntries] = React.useState<DiaryEntry[]>([]);
  const [summary, setSummary] = React.useState<DiaryDaySummary>(() => emptySummary(today));
  const [loading, setLoading] = React.useState(true);
  const [busyId, setBusyId] = React.useState<string | null>(null);
  const [copying, setCopying] = React.useState(false);
  const [notice, setNotice] = React.useState<string | null>(null);
  const [error, setError] = React.useState<string | null>(null);

  const mealLabel = React.useCallback((meal: MealType) => ({
    breakfast: label('Breakfast', 'صبحانه'),
    lunch: label('Lunch', 'ناهار'),
    dinner: label('Dinner', 'شام'),
    snack: label('Snacks', 'میان‌وعده'),
  })[meal], [label]);

  const load = React.useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [todayRows, previousRows, todaySummary] = await Promise.all([
        listNutritionDiaryEntries({ localDate: today, limit: 2_000 }),
        listNutritionDiaryEntries({ localDate: yesterday, limit: 2_000 }),
        summarizeNutritionDiaryDate(today),
      ]);
      setEntries(todayRows);
      setYesterdayEntries(previousRows);
      setSummary(todaySummary);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : label('Diary could not be loaded.', 'دفتر تغذیه بارگذاری نشد.'));
    } finally {
      setLoading(false);
    }
  }, [label, today, yesterday]);

  useFocusEffect(React.useCallback(() => {
    void load();
  }, [load]));

  const remove = (entry: DiaryEntry) => {
    Alert.alert(
      label('Delete diary entry?', 'رکورد از دفتر حذف شود؟'),
      entry.label,
      [
        { text: label('Cancel', 'انصراف'), style: 'cancel' },
        {
          text: label('Delete', 'حذف'),
          style: 'destructive',
          onPress: () => {
            setBusyId(entry.id);
            setError(null);
            void deleteNutritionDiaryEntry(entry.id)
              .then(async () => {
                await Promise.all([load(), refreshDailySummary()]);
                setNotice(label('Entry was deleted.', 'رکورد حذف شد.'));
              })
              .catch((caught) => {
                setError(caught instanceof Error ? caught.message : label('Entry could not be deleted.', 'رکورد حذف نشد.'));
              })
              .finally(() => setBusyId(null));
          },
        },
      ],
    );
  };

  const copyYesterday = () => {
    if (yesterdayEntries.length === 0) return;
    const message = entries.length > 0
      ? label(
          `Today already has ${entries.length} entries. Copy yesterday as additional entries?`,
          `امروز از قبل ${entries.length} رکورد دارد. رکوردهای دیروز به‌صورت اضافه کپی شوند؟`,
        )
      : label(
          `Copy ${yesterdayEntries.length} entries from yesterday?`,
          `${yesterdayEntries.length} رکورد دیروز کپی شود؟`,
        );
    Alert.alert(
      label('Copy yesterday', 'کپی دیروز'),
      message,
      [
        { text: label('Cancel', 'انصراف'), style: 'cancel' },
        {
          text: label('Copy', 'کپی'),
          onPress: () => {
            setCopying(true);
            setError(null);
            const timestamp = new Date().toISOString();
            const clones = cloneDiaryEntriesToDate(
              yesterdayEntries,
              yesterday,
              today,
              () => createId('meal'),
              timestamp,
            );
            void (async () => {
              for (const entry of clones) await saveNutritionDiaryEntry(entry);
              await Promise.all([load(), refreshDailySummary()]);
              setNotice(label('Yesterday was copied to today.', 'رکوردهای دیروز به امروز کپی شدند.'));
            })().catch((caught) => {
              setError(caught instanceof Error ? caught.message : label('Yesterday could not be copied.', 'کپی دیروز انجام نشد.'));
            }).finally(() => setCopying(false));
          },
        },
      ],
    );
  };

  return (
    <Screen>
      <View style={{ gap: 4 }}>
        <AppText size={30} weight="800">{label('Today’s nutrition diary', 'دفتر تغذیه امروز')}</AppText>
        <AppText muted>{label(
          'All current meal logging paths use this local Diary. Older meal records are migrated once without duplication.',
          'تمام مسیرهای ثبت فعلی از این دفتر محلی استفاده می‌کنند. رکوردهای قدیمی یک‌بار و بدون تکرار منتقل می‌شوند.',
        )}</AppText>
      </View>

      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}>
        <MetricCard label={label('Calories', 'کالری')} value={Math.round(summary.total.center.energyKcal ?? 0)} unit="kcal" />
        <MetricCard label={label('Protein', 'پروتئین')} value={(summary.total.center.proteinG ?? 0).toFixed(1)} unit="g" />
        <MetricCard label={label('Carbs', 'کربوهیدرات')} value={(summary.total.center.carbsG ?? 0).toFixed(1)} unit="g" />
        <MetricCard label={label('Fat', 'چربی')} value={(summary.total.center.fatG ?? 0).toFixed(1)} unit="g" />
      </View>

      <Card>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 12 }}>
          <View style={{ flex: 1, gap: 2 }}>
            <AppText weight="800">{label('Entries', 'رکوردها')}</AppText>
            <AppText muted size={13}>{summary.entryCount} {label('foods logged today', 'غذا در امروز')}</AppText>
          </View>
          <View style={{ minWidth: 150 }}>
            <PrimaryButton
              title={label('Copy yesterday', 'کپی دیروز')}
              variant="secondary"
              disabled={yesterdayEntries.length === 0}
              loading={copying}
              onPress={copyYesterday}
            />
          </View>
        </View>
        {yesterdayEntries.length === 0 ? (
          <AppText muted size={12}>{label('Yesterday has no diary entries.', 'دیروز رکوردی در دفتر ندارد.')}</AppText>
        ) : null}
      </Card>

      {loading ? <AppText muted>{label('Loading diary…', 'در حال بارگذاری دفتر…')}</AppText> : null}
      {notice ? <InlineNotice tone="success">{notice}</InlineNotice> : null}
      {error ? <InlineNotice tone="danger">{error}</InlineNotice> : null}

      {!loading && entries.length === 0 ? (
        <InlineNotice>{label(
          'No food has been logged today. Use complete food search, manual logging, or photo identification.',
          'امروز غذایی ثبت نشده است. از جست‌وجوی جامع، ثبت دستی یا شناسایی عکس استفاده کنید.',
        )}</InlineNotice>
      ) : null}

      {MEAL_ORDER.map((meal) => {
        const rows = entries.filter((entry) => entry.mealType === meal);
        if (rows.length === 0) return null;
        const mealSummary = summary.byMeal[meal];
        return (
          <Card key={meal}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', gap: 12 }}>
              <AppText size={20} weight="800">{mealLabel(meal)}</AppText>
              <AppText muted size={13}>{Math.round(mealSummary.center.energyKcal ?? 0)} kcal</AppText>
            </View>
            {rows.map((entry) => (
              <View
                key={entry.id}
                style={{ gap: 6, borderTopWidth: 1, borderTopColor: 'rgba(128,128,128,0.18)', paddingTop: 12 }}
              >
                <AppText weight="700">{entry.label}</AppText>
                <AppText muted size={13} selectable>
                  {Math.round(entry.estimate.center.energyKcal ?? 0)} kcal · P {(entry.estimate.center.proteinG ?? 0).toFixed(1)}g · C {(entry.estimate.center.carbsG ?? 0).toFixed(1)}g · F {(entry.estimate.center.fatG ?? 0).toFixed(1)}g
                </AppText>
                <AppText muted size={11}>{entry.sourceId}</AppText>
                <PrimaryButton
                  title={label('Delete', 'حذف')}
                  variant="danger"
                  loading={busyId === entry.id}
                  onPress={() => remove(entry)}
                />
              </View>
            ))}
          </Card>
        );
      })}
    </Screen>
  );
}
