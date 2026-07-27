import * as React from 'react';
import { View } from 'react-native';
import { useFocusEffect } from 'expo-router';
import {
  AppText,
  Card,
  Field,
  InlineNotice,
  PrimaryButton,
  Screen,
} from '@/components/ui';
import { summarizeNutritionDiaryDate } from '@/db/nutrition-diary-repository';
import {
  getActiveNutritionGoal,
  saveNutritionGoal,
  type PersistedNutritionGoal,
} from '@/db/nutrition-goal-repository';
import { localDateFromIso } from '@/db/nutrition-meal-repository';
import { createId } from '@/lib/id';
import {
  calculateGoalProgress,
  nutritionGoalMode,
  type GoalProgressItem,
  type NutrientKey,
  type NutritionGoalMode,
  type NutritionVector,
} from '@/nutrition-core';
import { useApp } from '@/providers/app-provider';
import { useAppTheme } from '@/theme/theme';

interface NutrientFieldDefinition {
  readonly key: NutrientKey;
  readonly labelEn: string;
  readonly labelFa: string;
  readonly unit: 'kcal' | 'g' | 'mg';
  readonly keyboard: 'decimal-pad' | 'number-pad';
}

const FIELDS: readonly NutrientFieldDefinition[] = [
  { key: 'energyKcal', labelEn: 'Energy', labelFa: 'انرژی', unit: 'kcal', keyboard: 'number-pad' },
  { key: 'proteinG', labelEn: 'Protein', labelFa: 'پروتئین', unit: 'g', keyboard: 'decimal-pad' },
  { key: 'carbsG', labelEn: 'Carbohydrates', labelFa: 'کربوهیدرات', unit: 'g', keyboard: 'decimal-pad' },
  { key: 'fatG', labelEn: 'Fat', labelFa: 'چربی', unit: 'g', keyboard: 'decimal-pad' },
  { key: 'fiberG', labelEn: 'Fiber', labelFa: 'فیبر', unit: 'g', keyboard: 'decimal-pad' },
  { key: 'sugarsG', labelEn: 'Sugars', labelFa: 'قند', unit: 'g', keyboard: 'decimal-pad' },
  { key: 'sodiumMg', labelEn: 'Sodium', labelFa: 'سدیم', unit: 'mg', keyboard: 'decimal-pad' },
  { key: 'cholesterolMg', labelEn: 'Cholesterol', labelFa: 'کلسترول', unit: 'mg', keyboard: 'decimal-pad' },
  { key: 'calciumMg', labelEn: 'Calcium', labelFa: 'کلسیم', unit: 'mg', keyboard: 'decimal-pad' },
  { key: 'ironMg', labelEn: 'Iron', labelFa: 'آهن', unit: 'mg', keyboard: 'decimal-pad' },
  { key: 'potassiumMg', labelEn: 'Potassium', labelFa: 'پتاسیم', unit: 'mg', keyboard: 'decimal-pad' },
  { key: 'vitaminCMg', labelEn: 'Vitamin C', labelFa: 'ویتامین C', unit: 'mg', keyboard: 'decimal-pad' },
];

function parsePositive(value: string): number | null {
  const normalized = value
    .replace(/[۰-۹]/g, (digit) => String('۰۱۲۳۴۵۶۷۸۹'.indexOf(digit)))
    .replace(/[٠-٩]/g, (digit) => String('٠١٢٣٤٥٦٧٨٩'.indexOf(digit)));
  const parsed = Number(normalized);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
}

function formatValue(value: number, unit: NutrientFieldDefinition['unit']): string {
  if (unit === 'kcal') return Math.round(value).toLocaleString();
  if (unit === 'mg' && value >= 100) return Math.round(value).toLocaleString();
  return value.toFixed(value >= 100 ? 0 : 1);
}

function modeLabel(mode: NutritionGoalMode, locale: 'fa' | 'en'): string {
  if (locale === 'fa') {
    return mode === 'maximum' ? 'حداکثر' : mode === 'minimum' ? 'حداقل' : 'هدف';
  }
  return mode === 'maximum' ? 'Maximum' : mode === 'minimum' ? 'Minimum' : 'Target';
}

function progressStatus(
  item: GoalProgressItem,
  locale: 'fa' | 'en',
  unit: NutrientFieldDefinition['unit'],
): string {
  if (item.consumed === null || item.ratio === null || item.remaining === null) {
    return locale === 'fa'
      ? 'مقدار مصرف نامشخص است؛ حداقل یک رکورد این ماده را ندارد.'
      : 'Consumption is unknown because at least one logged item lacks this nutrient.';
  }
  if (item.mode === 'maximum') {
    if (item.remaining < 0) {
      return locale === 'fa'
        ? `${formatValue(Math.abs(item.remaining), unit)} ${unit} بیشتر از حداکثر`
        : `${formatValue(Math.abs(item.remaining), unit)} ${unit} above maximum`;
    }
    return locale === 'fa'
      ? `${formatValue(item.remaining, unit)} ${unit} تا حداکثر باقی مانده`
      : `${formatValue(item.remaining, unit)} ${unit} remaining before maximum`;
  }
  if (item.mode === 'minimum') {
    if (item.remaining === 0) return locale === 'fa' ? 'حداقل تامین شده است.' : 'Minimum reached.';
    return locale === 'fa'
      ? `${formatValue(item.remaining, unit)} ${unit} تا حداقل باقی مانده`
      : `${formatValue(item.remaining, unit)} ${unit} remaining to minimum`;
  }
  if (item.remaining < 0) {
    return locale === 'fa'
      ? `${formatValue(Math.abs(item.remaining), unit)} ${unit} بالاتر از هدف`
      : `${formatValue(Math.abs(item.remaining), unit)} ${unit} above target`;
  }
  return locale === 'fa'
    ? `${formatValue(item.remaining, unit)} ${unit} تا هدف باقی مانده`
    : `${formatValue(item.remaining, unit)} ${unit} remaining to target`;
}

function progressTone(item: GoalProgressItem): 'success' | 'warning' | 'danger' | 'neutral' {
  if (item.ratio === null) return 'neutral';
  if (item.mode === 'maximum') return item.ratio > 1 ? 'danger' : item.ratio > 0.85 ? 'warning' : 'success';
  if (item.mode === 'minimum') return item.ratio >= 1 ? 'success' : item.ratio >= 0.7 ? 'warning' : 'neutral';
  return item.ratio > 1.15 ? 'warning' : item.ratio >= 0.85 ? 'success' : 'neutral';
}

export default function NutritionGoalsScreen() {
  const theme = useAppTheme();
  const { locale } = useApp();
  const label = React.useCallback((en: string, fa: string) => locale === 'fa' ? fa : en, [locale]);
  const today = localDateFromIso(new Date().toISOString());
  const [active, setActive] = React.useState<PersistedNutritionGoal | null>(null);
  const [values, setValues] = React.useState<Record<NutrientKey, string>>(() =>
    Object.fromEntries(FIELDS.map((field) => [field.key, ''])) as Record<NutrientKey, string>,
  );
  const [consumed, setConsumed] = React.useState<NutritionVector>({});
  const [loading, setLoading] = React.useState(true);
  const [saving, setSaving] = React.useState(false);
  const [notice, setNotice] = React.useState<string | null>(null);
  const [error, setError] = React.useState<string | null>(null);

  const load = React.useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [goal, summary] = await Promise.all([
        getActiveNutritionGoal(today),
        summarizeNutritionDiaryDate(today),
      ]);
      setActive(goal);
      setConsumed(summary.total.center);
      setValues(Object.fromEntries(FIELDS.map((field) => [
        field.key,
        goal?.dailyGoals[field.key] === undefined ? '' : String(goal.dailyGoals[field.key]),
      ])) as Record<NutrientKey, string>);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : label('Goals could not be loaded.', 'هدف‌ها بارگذاری نشدند.'));
    } finally {
      setLoading(false);
    }
  }, [label, today]);

  useFocusEffect(React.useCallback(() => {
    void load();
  }, [load]));

  const dailyGoals = React.useMemo<NutritionVector>(() => {
    const next: NutritionVector = {};
    for (const field of FIELDS) {
      const raw = values[field.key].trim();
      if (!raw) continue;
      const parsed = parsePositive(raw);
      if (parsed !== null) next[field.key] = parsed;
    }
    return next;
  }, [values]);

  const progress = React.useMemo(
    () => calculateGoalProgress(consumed, { daily: dailyGoals }),
    [consumed, dailyGoals],
  );
  const progressByKey = React.useMemo(
    () => new Map(progress.map((item) => [item.nutrient, item])),
    [progress],
  );

  const save = async () => {
    setSaving(true);
    setError(null);
    setNotice(null);
    try {
      for (const field of FIELDS) {
        const raw = values[field.key].trim();
        if (raw && parsePositive(raw) === null) {
          throw new Error(label(
            `${field.labelEn} must be a positive number or left blank.`,
            `${field.labelFa} باید عدد مثبت باشد یا خالی بماند.`,
          ));
        }
      }
      const now = new Date().toISOString();
      const goal: PersistedNutritionGoal = {
        id: active?.id ?? createId('nutrition-goal'),
        activeFrom: today,
        dailyGoals,
        createdAt: active?.createdAt ?? now,
        updatedAt: now,
      };
      await saveNutritionGoal(goal);
      setActive(goal);
      setNotice(label(
        'Goals were saved locally. No medical recommendation was generated.',
        'هدف‌ها به‌صورت محلی ذخیره شدند. هیچ توصیهٔ پزشکی خودکاری تولید نشد.',
      ));
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : label('Goals could not be saved.', 'هدف‌ها ذخیره نشدند.'));
    } finally {
      setSaving(false);
    }
  };

  const clear = async () => {
    setValues(Object.fromEntries(FIELDS.map((field) => [field.key, ''])) as Record<NutrientKey, string>);
    const now = new Date().toISOString();
    const goal: PersistedNutritionGoal = {
      id: active?.id ?? createId('nutrition-goal'),
      activeFrom: today,
      dailyGoals: {},
      createdAt: active?.createdAt ?? now,
      updatedAt: now,
    };
    setSaving(true);
    setError(null);
    try {
      await saveNutritionGoal(goal);
      setActive(goal);
      setNotice(label('All configured goals were cleared.', 'همهٔ هدف‌های تنظیم‌شده پاک شدند.'));
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : label('Goals could not be cleared.', 'هدف‌ها پاک نشدند.'));
    } finally {
      setSaving(false);
    }
  };

  const toneColor = (tone: ReturnType<typeof progressTone>) => ({
    success: theme.colors.success,
    warning: theme.colors.warning,
    danger: theme.colors.danger,
    neutral: theme.colors.primary,
  })[tone];

  return (
    <Screen>
      <View style={{ gap: 4 }}>
        <AppText size={30} weight="800">{label('Nutrition goals', 'هدف‌های تغذیه')}</AppText>
        <AppText muted>{label(
          'Set your own boundaries. NeoFit does not invent medical targets. Missing nutrients remain unknown rather than becoming zero.',
          'مرزهای خودتان را تنظیم کنید. NeoFit هدف پزشکی اختراع نمی‌کند. مادهٔ گمشده به‌جای صفر، نامشخص باقی می‌ماند.',
        )}</AppText>
      </View>

      <InlineNotice>{label(
        'Energy and macros are targets; sugars, sodium and cholesterol are maximums; fiber and micronutrients are minimums.',
        'انرژی و ماکروها هدف‌اند؛ قند، سدیم و کلسترول حداکثرند؛ فیبر و ریزمغذی‌ها حداقل‌اند.',
      )}</InlineNotice>
      {loading ? <AppText muted>{label('Loading goals…', 'در حال بارگذاری هدف‌ها…')}</AppText> : null}
      {notice ? <InlineNotice tone="success">{notice}</InlineNotice> : null}
      {error ? <InlineNotice tone="danger">{error}</InlineNotice> : null}

      <Card>
        <AppText size={21} weight="800">{label('Daily boundaries', 'مرزهای روزانه')}</AppText>
        {FIELDS.map((field) => (
          <Field
            key={field.key}
            label={`${locale === 'fa' ? field.labelFa : field.labelEn} · ${modeLabel(nutritionGoalMode(field.key), locale)} (${field.unit})`}
            value={values[field.key]}
            onChangeText={(value) => setValues((current) => ({ ...current, [field.key]: value }))}
            keyboardType={field.keyboard}
            placeholder={label('Leave blank to disable', 'برای غیرفعال‌بودن خالی بگذارید')}
          />
        ))}
        <PrimaryButton title={label('Save goals', 'ذخیره هدف‌ها')} onPress={save} loading={saving} />
        <PrimaryButton title={label('Clear all goals', 'پاک‌کردن همه هدف‌ها')} variant="secondary" onPress={clear} disabled={saving} />
      </Card>

      <Card>
        <AppText size={21} weight="800">{label('Today’s progress', 'پیشرفت امروز')}</AppText>
        {progress.length === 0 ? (
          <AppText muted>{label('No daily goals are configured.', 'هدف روزانه‌ای تنظیم نشده است.')}</AppText>
        ) : null}
        {FIELDS.map((field) => {
          const item = progressByKey.get(field.key);
          if (!item) return null;
          const ratio = item.ratio === null ? 0 : Math.max(0, Math.min(1, item.ratio));
          const tone = progressTone(item);
          return (
            <View key={field.key} style={{ gap: 7, borderTopWidth: 1, borderTopColor: theme.colors.border, paddingTop: 12 }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', gap: 12 }}>
                <AppText weight="800">{locale === 'fa' ? field.labelFa : field.labelEn}</AppText>
                <AppText muted size={13}>{item.consumed === null
                  ? label('Unknown', 'نامشخص')
                  : `${formatValue(item.consumed, field.unit)} / ${formatValue(item.goal, field.unit)} ${field.unit}`}</AppText>
              </View>
              <View style={{ height: 9, borderRadius: 999, backgroundColor: theme.colors.border, overflow: 'hidden' }}>
                <View style={{ height: '100%', width: `${ratio * 100}%`, backgroundColor: toneColor(tone), borderRadius: 999 }} />
              </View>
              <AppText muted size={12}>{progressStatus(item, locale, field.unit)}</AppText>
            </View>
          );
        })}
      </Card>
    </Screen>
  );
}
