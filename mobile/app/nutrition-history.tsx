import * as React from 'react';
import { Alert, View } from 'react-native';
import * as DocumentPicker from 'expo-document-picker';
import { File } from 'expo-file-system';
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
  IFKB_CATALOG_RELEASE,
  summarizeDiaryDay,
  type DiaryDaySummary,
  type DiaryEntry,
  type NutrientKey,
} from '@/nutrition-core';
import { useApp } from '@/providers/app-provider';
import {
  parseNutritionBackupJson,
  restoreNutritionBackup,
  type ParsedNutritionBackup,
  type NutritionBackupRestoreMode,
} from '@/services/nutrition-backup-restore';
import {
  shareNutritionBackupJson,
  shareNutritionDiaryCsv,
} from '@/services/nutrition-export-service';
import { useAppTheme } from '@/theme/theme';

type RangeDays = '7' | '30' | '90';

interface PendingBackup {
  readonly name: string;
  readonly data: ParsedNutritionBackup;
  readonly catalogCompatible: boolean;
}

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

function confirmReplacement(input: {
  readonly title: string;
  readonly message: string;
  readonly cancel: string;
  readonly replace: string;
}): Promise<boolean> {
  return new Promise((resolve) => {
    Alert.alert(input.title, input.message, [
      { text: input.cancel, style: 'cancel', onPress: () => resolve(false) },
      { text: input.replace, style: 'destructive', onPress: () => resolve(true) },
    ], { cancelable: true, onDismiss: () => resolve(false) });
  });
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
  const { locale, refreshDailySummary } = useApp();
  const theme = useAppTheme();
  const label = React.useCallback((en: string, fa: string) => locale === 'fa' ? fa : en, [locale]);
  const today = localDateFromIso(new Date().toISOString());
  const [rangeDays, setRangeDays] = React.useState<RangeDays>('30');
  const [entries, setEntries] = React.useState<DiaryEntry[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [exporting, setExporting] = React.useState<'csv' | 'json' | null>(null);
  const [selectingBackup, setSelectingBackup] = React.useState(false);
  const [restoring, setRestoring] = React.useState<NutritionBackupRestoreMode | null>(null);
  const [pendingBackup, setPendingBackup] = React.useState<PendingBackup | null>(null);
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
  const busy = exporting !== null || selectingBackup || restoring !== null;

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

  const selectBackup = async () => {
    setSelectingBackup(true);
    setError(null);
    setNotice(null);
    setPendingBackup(null);
    try {
      const picked = await DocumentPicker.getDocumentAsync({
        type: ['application/json', 'text/json', 'text/plain'],
        copyToCacheDirectory: true,
        multiple: false,
      });
      if (picked.canceled) return;
      const asset = picked.assets[0];
      if (!asset?.uri) throw new Error(label('The selected backup could not be read.', 'پشتیبان انتخاب‌شده قابل خواندن نبود.'));
      const file = new File(asset.uri);
      if (!file.exists || file.size === null || file.size <= 0) {
        throw new Error(label('The selected backup is empty or unavailable.', 'پشتیبان انتخاب‌شده خالی یا در دسترس نیست.'));
      }
      const data = parseNutritionBackupJson(await file.text());
      const catalogCompatible = data.publicCatalogReference.version === IFKB_CATALOG_RELEASE.version
        && data.publicCatalogReference.databaseSha256.toLowerCase() === IFKB_CATALOG_RELEASE.databaseSha256;
      setPendingBackup({
        name: asset.name || label('Nutrition backup', 'پشتیبان تغذیه'),
        data,
        catalogCompatible,
      });
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : label('Backup validation failed.', 'اعتبارسنجی پشتیبان انجام نشد.'));
    } finally {
      setSelectingBackup(false);
    }
  };

  const runRestore = async (mode: NutritionBackupRestoreMode) => {
    if (!pendingBackup) return;
    if (mode === 'replace') {
      const confirmed = await confirmReplacement({
        title: label('Replace nutrition data?', 'جایگزینی داده‌های تغذیه؟'),
        message: label(
          'This deletes the current Nutrition Diary, Recipes, Goals and Favorites, then restores the selected backup. API keys and the public IFKB catalog are not changed.',
          'این کار دفتر تغذیه، دستورها، هدف‌ها و علاقه‌مندی‌های فعلی را حذف و پشتیبان انتخاب‌شده را جایگزین می‌کند. کلیدهای API و کاتالوگ عمومی IFKB تغییر نمی‌کنند.',
        ),
        cancel: label('Cancel', 'انصراف'),
        replace: label('Replace and restore', 'جایگزینی و بازیابی'),
      });
      if (!confirmed) return;
    }

    setRestoring(mode);
    setError(null);
    setNotice(null);
    try {
      const summary = await restoreNutritionBackup(pendingBackup.data, mode);
      await Promise.all([load(), refreshDailySummary()]);
      setPendingBackup(null);
      const restored = label(
        `Restored ${summary.diaryEntries} Diary entries, ${summary.recipes} Recipes, ${summary.goals} Goals and ${summary.favorites} Favorites.`,
        `${summary.diaryEntries} رکورد دفتر، ${summary.recipes} دستور، ${summary.goals} هدف و ${summary.favorites} علاقه‌مندی بازیابی شد.`,
      );
      setNotice(summary.warnings.length === 0 ? restored : `${restored}\n${summary.warnings.join('\n')}`);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : label('Backup restore failed.', 'بازیابی پشتیبان انجام نشد.'));
    } finally {
      setRestoring(null);
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
          {...(averageCalories === null ? {} : { unit: 'kcal' })}
        />
      </View>

      <Card>
        <AppText size={20} weight="800">{label('Personal backup and exports', 'پشتیبان و خروجی دادهٔ شخصی')}</AppText>
        <AppText muted size={13}>{label(
          'JSON includes Diary, Recipes, Goals and Favorites. The public IFKB database and API keys are excluded; only catalog version and SHA-256 are referenced.',
          'JSON شامل دفتر، دستورها، هدف‌ها و علاقه‌مندی‌هاست. دیتابیس عمومی IFKB و کلیدهای API حذف می‌شوند و فقط نسخه و SHA-256 کاتالوگ ارجاع داده می‌شود.',
        )}</AppText>
        <PrimaryButton
          title={label('Share selected range as CSV', 'اشتراک بازهٔ انتخابی به‌صورت CSV')}
          onPress={exportCsv}
          loading={exporting === 'csv'}
          disabled={entries.length === 0 || busy}
        />
        <PrimaryButton
          title={label('Share complete personal backup as JSON', 'اشتراک پشتیبان کامل شخصی به‌صورت JSON')}
          variant="secondary"
          onPress={exportJson}
          loading={exporting === 'json'}
          disabled={busy}
        />
        <PrimaryButton
          title={label('Select and validate a JSON backup', 'انتخاب و اعتبارسنجی پشتیبان JSON')}
          variant="secondary"
          onPress={selectBackup}
          loading={selectingBackup}
          disabled={busy}
        />
      </Card>

      {pendingBackup ? (
        <Card>
          <AppText size={20} weight="800">{label('Validated backup', 'پشتیبان اعتبارسنجی‌شده')}</AppText>
          <AppText weight="700">{pendingBackup.name}</AppText>
          <AppText muted size={13}>{label(
            `Exported ${new Date(pendingBackup.data.exportedAt).toLocaleString('en-US')} · IFKB ${pendingBackup.data.publicCatalogReference.version}`,
            `تاریخ خروجی ${new Date(pendingBackup.data.exportedAt).toLocaleString('fa-IR')} · IFKB ${pendingBackup.data.publicCatalogReference.version}`,
          )}</AppText>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}>
            <MetricCard label={label('Diary', 'دفتر')} value={pendingBackup.data.personalData.diaryEntries.length} />
            <MetricCard label={label('Recipes', 'دستورها')} value={pendingBackup.data.personalData.recipes.length} />
            <MetricCard label={label('Goals', 'هدف‌ها')} value={pendingBackup.data.personalData.goals.length} />
            <MetricCard label={label('Favorites', 'علاقه‌مندی‌ها')} value={pendingBackup.data.personalData.favorites.length} />
          </View>
          {!pendingBackup.catalogCompatible ? (
            <InlineNotice tone="warning">{label(
              `This backup references IFKB ${pendingBackup.data.publicCatalogReference.version}, while the app uses ${IFKB_CATALOG_RELEASE.version}. Diary snapshots remain usable, but some old catalog source ids may not resolve.`,
              `این پشتیبان به IFKB ${pendingBackup.data.publicCatalogReference.version} ارجاع می‌دهد، درحالی‌که اپ از ${IFKB_CATALOG_RELEASE.version} استفاده می‌کند. داده‌های ثبت‌شدهٔ دفتر قابل استفاده می‌مانند، اما ممکن است بعضی شناسه‌های قدیمی کاتالوگ پیدا نشوند.`,
            )}</InlineNotice>
          ) : null}
          <PrimaryButton
            title={label('Merge with current nutrition data', 'ادغام با داده‌های تغذیهٔ فعلی')}
            onPress={() => runRestore('merge')}
            loading={restoring === 'merge'}
            disabled={busy}
          />
          <PrimaryButton
            title={label('Replace current nutrition data', 'جایگزینی داده‌های تغذیهٔ فعلی')}
            variant="danger"
            onPress={() => runRestore('replace')}
            loading={restoring === 'replace'}
            disabled={busy}
          />
          <PrimaryButton
            title={label('Cancel restore', 'لغو بازیابی')}
            variant="ghost"
            onPress={() => setPendingBackup(null)}
            disabled={busy}
          />
        </Card>
      ) : null}

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
              {...(day.summary.total.center.energyKcal === undefined ? {} : { unit: 'kcal' })}
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
