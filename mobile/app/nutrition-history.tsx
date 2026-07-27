import * as React from 'react';
import { View } from 'react-native';
import { useFocusEffect } from 'expo-router';
import {
  AppText,
  Card,
  ChoiceGrid,
  InlineNotice,
  MetricCard,
  PrimaryButton,
  Screen,
} from '@/components/ui';
import { listNutritionDiaryEntriesInRange } from '@/db/nutrition-diary-repository';
import { localDateFromIso } from '@/db/nutrition-meal-repository';
import {
  summarizeDiaryDay,
  type DiaryDaySummary,
  type DiaryEntry,
  type NutrientKey,
} from '@/nutrition-core';
import { useApp } from '@/providers/app-provider';
import {
  shareNutritionBackupJson,
  shareNutritionDiaryCsv,
} from '@/services/nutrition-export-service';
import { useAppTheme } from '@/theme/theme';

type RangeDays = '7' | '30' | '90';

function shiftDate(localDate: string, days: number): string {
  const [year, month, day] = localDate.split('-').map(Number);
  if (!year || !month || !day) throw new Error('Date is invalid.');
  const date = new Date(year, month - 1, day, 12, 0, 0, 0);
  date.setDate(date.getDate() + days);
  return localDateFromIso(date.toISOString());
}

function dateLabel(localDate: string, locale: 'fa' | 'en'): string {
  const [year, month, day] = localDate.split('-').map(Number);
  if (!year || !month || !day) return localDate;
  return new Intl.DateTimeFormat(locale === 'fa' ? 'fa-IR' : 'en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  }).format(new Date(year, month - 1, day, 12, 0, 0, 0));
}

function nutrientText(
  summary: DiaryDaySummary,
  nutrient: NutrientKey,
  unit: string,
  locale: 'fa' | 'en',
): string {
  const value = summary.total.center[nutrient];
  if (value === undefined) return locale === 'fa' ? 'نامشخص' : 'Unknown';
  return `${value.toFixed(value >= 100 ? 0 : 1)} ${unit}`;
}

interface HistoryDay {
  readonly localDate: string;
  readonly entries: readonly DiaryEntry[];
  readonly summary: DiaryDaySummary;
}

function groupHistory(entries: readonly DiaryEntry[]): HistoryDay[] {
  const grouped = new Map<string, DiaryEntry[]>();
  for (const entry of entries) {
    const values = grouped.get(entry.localDate) ?? [];
    values.push(entry);
    grouped.set(entry.localDate, values);
  }
  return [...grouped.entries()]
    .sort(([left], [right]) => right.localeCompare(left))
    .map(([localDate, values]) => ({
      localDate,
      entries: values,
      summary: summarizeDiaryDay(values, localDate),
    }));
}

export default function NutritionHistoryScreen() {
  const { locale } = useApp();
  const theme = useAppTheme();
  const label = React.useCallback((en: string, fa: string) => locale === 'fa' ? fa : en, [locale]);
  const today = localDateFromIso(new Date().toISOString());
  const [rangeDays, setRangeDays] = React.useState<RangeDays>('30');
  const [entries, setEntries] = React.useState<DiaryEntry[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [exporting, setExporting] = React.useState<'csv' | 'json' | null>(null);
  const [notice, setNotice] = React.useState<string | null>(null);
  const [error, setError] = React.useState<string | null>(null);

  const dateFrom = React.useMemo(
    () => shiftDate(today, -(Number(rangeDays) - 1)),
    [rangeDays, today],
  );

  const load = React.useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setEntries(await listNutritionDiaryEntriesInRange({
        dateFrom,
        dateTo: today,
        limit: 50_000,
      }));
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : label('History could not be loaded.', 'تاریخچه بارگذاری نشد.'));
    } finally {
      setLoading(false);
    }
  }, [dateFrom, label, today]);

  useFocusEffect(React.useCallback(() => {
    void load();
  }, [load]));

  const days = React.useMemo(() => groupHistory(entries), [entries]);
  const periodSummary = React.useMemo(
    () => summarizeDiaryDay(entries, 'period'),
    [entries],
  );
  const activeDays = days.length;
  const averageCalories = activeDays === 0
    ? null
    : (periodSummary.total.center.energyKcal ?? null) === null
      ? null
      : (periodSummary.total.center.energyKcal ?? 0) / activeDays;

  const exportCsv = async () => {
    setExporting('csv');
    setError(null);
    setNotice(null);
    try {
      await shareNutritionDiaryCsv(entries, { dateFrom, dateTo: today });
      setNotice(label('Diary CSV was prepared for sharing.', 'فایل CSV دفتر برای اشتراک آماده شد.'));
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : label('CSV export failed.', 'خروجی CSV انجام نشد.'));
    } finally {
      setExporting(null);
    }
  };

  const exportJson = async () => {
    setExporting('json');
    setError(null);
    setNotice(null);
    try {
      await shareNutritionBackupJson();
      setNotice(label('Personal nutrition backup was prepared for sharing.', 'پشتیبان شخصی تغذیه برای اشتراک آماده شد.'));
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : label('JSON backup failed.', 'پشتیبان JSON ساخته نشد.'));
    } finally {
      setExporting(null);
    }
  };

  return (
    <Screen>
      <View style={{ gap: 4 }}>
        <AppText size={30} weight="800">{label('Nutrition history', 'تاریخچه تغذیه')}</AppText>
        <AppText muted>{label(
          'History is calculated from the local Nutrition Diary. Missing nutrients stay unknown in summaries and blank in CSV.',
          'تاریخچه از دفتر تغذیهٔ محلی محاسبه می‌شود. مادهٔ گمشده در خلاصه نامشخص و در CSV خالی باقی می‌ماند.',
        )}</AppText>
      </View>

      <ChoiceGrid
        value={rangeDays}
        onChange={setRangeDays}
        columns={3}
        options={[
          { value: '7', label: label('7 days', '۷ روز') },
          { value: '30', label: label('30 days', '۳۰ روز') },
          { value: '90', label: label('90 days', '۹۰ روز') },
        ]}
      />

      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}>
        <MetricCard label={label('Logged foods', 'غذاهای ثبت‌شده')} value={entries.length} />
        <MetricCard label={label('Active days', 'روزهای دارای ثبت')} value={activeDays} />
        <MetricCard
          label={label('Average calories', 'میانگین کالری')}
          value={averageCalories === null ? label('Unknown', 'نامشخص') : Math.round(averageCalories)}
          unit={averageCalories === null ? undefined : 'kcal'}
        />
      </View>

      <Card>
        <AppText size={20} weight="800">{label('Personal exports', 'خروجی دادهٔ شخصی')}</AppText>
        <AppText muted size={13}>{label(
          'JSON includes Diary, Recipes, Goals and Favorites. The public IFKB database and API keys are excluded; only catalog version and SHA-256 are referenced.',
          'JSON شامل دفتر، دستورها، هدف‌ها و علاقه‌مندی‌هاست. دیتابیس عمومی IFKB و کلیدهای API حذف می‌شوند و فقط نسخه و SHA-256 کاتالوگ ارجاع داده می‌شود.',
        )}</AppText>
        <PrimaryButton
          title={label('Share selected range as CSV', 'اشتراک بازهٔ انتخابی به‌صورت CSV')}
          onPress={exportCsv}
          loading={exporting === 'csv'}
          disabled={entries.length === 0 || exporting !== null}
        />
        <PrimaryButton
          title={label('Share complete personal backup as JSON', 'اشتراک پشتیبان کامل شخصی به‌صورت JSON')}
          variant="secondary"
          onPress={exportJson}
          loading={exporting === 'json'}
          disabled={exporting !== null}
        />
      </Card>

      {loading ? <AppText muted>{label('Loading history…', 'در حال بارگذاری تاریخچه…')}</AppText> : null}
      {notice ? <InlineNotice tone="success">{notice}</InlineNotice> : null}
      {error ? <InlineNotice tone="danger">{error}</InlineNotice> : null}

      {!loading && days.length === 0 ? (
        <InlineNotice>{label(
          'There are no Diary entries in this range.',
          'در این بازه رکوردی در دفتر وجود ندارد.',
        )}</InlineNotice>
      ) : null}

      {days.map((day) => (
        <Card key={day.localDate}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', gap: 12 }}>
            <AppText size={19} weight="800">{dateLabel(day.localDate, locale)}</AppText>
            <AppText muted>{day.entries.length} {label('items', 'رکورد')}</AppText>
          </View>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}>
            <MetricCard
              label={label('Calories', 'کالری')}
              value={day.summary.total.center.energyKcal === undefined
                ? label('Unknown', 'نامشخص')
                : Math.round(day.summary.total.center.energyKcal)}
              unit={day.summary.total.center.energyKcal === undefined ? undefined : 'kcal'}
            />
            <MetricCard label={label('Protein', 'پروتئین')} value={nutrientText(day.summary, 'proteinG', 'g', locale)} />
            <MetricCard label={label('Fiber', 'فیبر')} value={nutrientText(day.summary, 'fiberG', 'g', locale)} />
            <MetricCard label={label('Calcium', 'کلسیم')} value={nutrientText(day.summary, 'calciumMg', 'mg', locale)} />
          </View>
          {day.entries.map((entry) => (
            <View
              key={entry.id}
              style={{ gap: 4, borderTopWidth: 1, borderTopColor: theme.colors.border, paddingTop: 10 }}
            >
              <AppText weight="700">{entry.label}</AppText>
              <AppText muted size={12}>{entry.mealType} · {entry.sourceType} · {entry.sourceId}</AppText>
            </View>
          ))}
        </Card>
      ))}
    </Screen>
  );
}
