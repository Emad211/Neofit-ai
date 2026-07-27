import * as React from 'react';
import { View } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { router, useLocalSearchParams } from 'expo-router';
import { AppText, Card, ChoiceGrid, Field, InlineNotice, MetricCard, PrimaryButton, Screen } from '@/components/ui';
import { logMeal } from '@/db/log-repository';
import { FoodEstimate, Meal } from '@/domain/models';
import { useApp } from '@/providers/app-provider';
import { AvalAiError } from '@/services/avalai-client';
import { buildCatalogFoodEstimate } from '@/services/food-catalog-core-adapter';
import { findBestLocalFoodMatch } from '@/services/local-food-matcher';
import { recognizeFoodFromPhoto, type VisionFoodCandidate } from '@/services/vision-food-recognition';

type EstimatorMode = 'manual' | 'text' | 'photo';

function initialMode(value: string | undefined): EstimatorMode {
  if (value === 'manual' || value === 'photo') return value;
  return 'text';
}

function parseNonNegative(value: string, label: string) {
  const number = Number(value);
  if (!Number.isFinite(number) || number < 0) throw new Error(`${label} is invalid.`);
  return number;
}

export default function MealEstimatorScreen() {
  const params = useLocalSearchParams<{ mode?: string }>();
  const { locale, hasAvalAiKey, t, refreshDailySummary } = useApp();
  const [mode, setMode] = React.useState<EstimatorMode>(initialMode(params.mode));
  const [description, setDescription] = React.useState('');
  const [mealType, setMealType] = React.useState<Meal['type']>('snack');
  const [result, setResult] = React.useState<FoodEstimate | null>(null);
  const [identifiedByVision, setIdentifiedByVision] = React.useState(false);
  const [visionLabels, setVisionLabels] = React.useState<string[]>([]);
  const [localRange, setLocalRange] = React.useState<{ low: number; high: number } | null>(null);
  const [manualCalories, setManualCalories] = React.useState('');
  const [manualProtein, setManualProtein] = React.useState('');
  const [manualCarbs, setManualCarbs] = React.useState('');
  const [manualFat, setManualFat] = React.useState('');
  const [loading, setLoading] = React.useState(false);
  const [logging, setLogging] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const label = (en: string, fa: string) => locale === 'fa' ? fa : en;

  React.useEffect(() => {
    if (mode === 'photo' && !hasAvalAiKey) router.replace('/ai-settings');
  }, [hasAvalAiKey, mode]);

  const resetResult = () => {
    setResult(null);
    setLocalRange(null);
    setIdentifiedByVision(false);
    setVisionLabels([]);
  };

  const handleError = (caught: unknown) => {
    console.error('Meal identification failed:', caught);
    if (caught instanceof AvalAiError) {
      setError(caught.code === 'MISSING_API_KEY' ? t('ai.missingKey') : caught.message);
    } else {
      setError(caught instanceof Error ? caught.message : t('ai.networkError'));
    }
  };

  const applyLocalMatch = (input: {
    local: NonNullable<Awaited<ReturnType<typeof findBestLocalFoodMatch>>>;
    assumptions: readonly string[];
    fromVision: boolean;
  }) => {
    const built = buildCatalogFoodEstimate({
      item: input.local.item,
      multiplier: input.local.multiplier,
      locale,
      assumptions: input.assumptions,
    });
    setResult(built.estimate);
    setLocalRange(built.calorieRange);
    setIdentifiedByVision(input.fromVision);
  };

  const estimateText = async () => {
    if (description.trim().length < 2) {
      setError(label('Describe the food and serving size.', 'نام غذا و مقدار آن را بنویسید.'));
      return;
    }
    setLoading(true);
    setError(null);
    resetResult();
    try {
      const local = await findBestLocalFoodMatch(description);
      if (!local || local.score < 500) {
        setError(label(
          'No strong local match was found. Search the catalog or enter the food manually; AI is not used to invent nutrition values.',
          'تطبیق محلی قابل‌اعتماد پیدا نشد. در کاتالوگ جست‌وجو کنید یا غذا را دستی وارد کنید؛ هوش مصنوعی برای ساخت مقدار تغذیه استفاده نمی‌شود.',
        ));
        return;
      }
      applyLocalMatch({
        local,
        fromVision: false,
        assumptions: [label(
          'Matched and calculated entirely from the on-device food catalog.',
          'تطبیق و محاسبه کاملاً با کاتالوگ غذایی روی گوشی انجام شد.',
        )],
      });
    } catch (caught) {
      handleError(caught);
    } finally {
      setLoading(false);
    }
  };

  const estimatePhoto = async (source: 'camera' | 'library') => {
    if (!hasAvalAiKey) {
      router.push('/ai-settings');
      return;
    }
    setLoading(true);
    setError(null);
    resetResult();
    try {
      if (source === 'camera') {
        const permission = await ImagePicker.requestCameraPermissionsAsync();
        if (!permission.granted) throw new Error(label('Camera permission was not granted.', 'اجازه دسترسی به دوربین داده نشد.'));
      }

      const pickerResult = source === 'camera'
        ? await ImagePicker.launchCameraAsync({ mediaTypes: ['images'], base64: true, quality: 0.5, allowsEditing: false })
        : await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], base64: true, quality: 0.5, allowsEditing: false });

      if (pickerResult.canceled) return;
      const asset = pickerResult.assets[0];
      if (!asset?.base64) throw new Error(label('The selected image could not be read.', 'تصویر انتخاب‌شده قابل خواندن نبود.'));
      const mime = asset.mimeType || 'image/jpeg';
      const observation = await recognizeFoodFromPhoto({
        imageDataUrl: `data:${mime};base64,${asset.base64}`,
        description,
        locale,
      });
      const labels = observation.candidates.map((candidate) => candidate.label);
      setVisionLabels(labels);

      const candidates: Array<{ query: string; confidence: number; observation?: VisionFoodCandidate }> = observation.candidates.map((candidate) => ({
        query: candidate.label,
        confidence: candidate.confidence ?? 0.35,
        observation: candidate,
      }));
      if (description.trim().length >= 2) candidates.unshift({ query: description.trim(), confidence: 1 });

      const resolved = (await Promise.all(candidates.map(async (candidate) => ({ candidate, local: await findBestLocalFoodMatch(candidate.query) }))))
        .filter((item): item is typeof item & { local: NonNullable<typeof item.local> } => item.local !== null)
        .map((item) => ({ ...item, combinedScore: item.local.score + item.candidate.confidence * 120 }))
        .sort((left, right) => right.combinedScore - left.combinedScore);

      const best = resolved[0];
      if (!best || best.local.score < 220) {
        const names = labels.length > 0 ? labels.join('، ') : label('no reliable candidate', 'بدون کاندید قابل‌اعتماد');
        setError(label(
          `The Vision API suggested: ${names}. None maps reliably to the local catalog. Type the exact food name or use manual logging.`,
          `پیشنهادهای API بینایی: ${names}. هیچ‌کدام با اطمینان به کاتالوگ محلی متصل نشدند. نام دقیق غذا را بنویسید یا ثبت دستی را انتخاب کنید.`,
        ));
        return;
      }

      const visual = best.candidate.observation;
      const assumptions = [
        label(
          `Vision API candidate: ${best.candidate.query}. Nutrition was calculated locally, not by the API.`,
          `کاندید API بینایی: ${best.candidate.query}. مقدارهای تغذیه‌ای در گوشی محاسبه شدند، نه توسط API.`,
        ),
        ...(visual?.visibleComponents.length
          ? [label(`Visible components: ${visual.visibleComponents.join(', ')}`, `اجزای قابل‌مشاهده: ${visual.visibleComponents.join('، ')}`)]
          : []),
        ...(visual?.preparationHints.length
          ? [label(`Visible preparation cues: ${visual.preparationHints.join(', ')}`, `نشانه‌های قابل‌مشاهدهٔ پخت: ${visual.preparationHints.join('، ')}`)]
          : []),
        ...observation.warnings,
      ];
      applyLocalMatch({ local: best.local, assumptions, fromVision: true });
    } catch (caught) {
      handleError(caught);
    } finally {
      setLoading(false);
    }
  };

  const saveEstimatedLog = async () => {
    if (!result) return;
    setLogging(true);
    setError(null);
    try {
      await logMeal({
        eatenAt: new Date().toISOString(),
        mealType,
        description: `${result.itemName} — ${result.servingSize}`,
        calories: result.calories,
        proteinG: result.proteinG,
        carbsG: result.carbsG,
        fatG: result.fatG,
        source: 'catalog',
      });
      await refreshDailySummary();
      router.back();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : label('Meal logging failed.', 'ثبت وعده انجام نشد.'));
    } finally {
      setLogging(false);
    }
  };

  const saveManualLog = async () => {
    if (description.trim().length < 2) {
      setError(label('Enter a meal description.', 'توضیح وعده را وارد کنید.'));
      return;
    }
    setLogging(true);
    setError(null);
    try {
      const calories = parseNonNegative(manualCalories, label('Calories', 'کالری'));
      const proteinG = parseNonNegative(manualProtein || '0', label('Protein', 'پروتئین'));
      const carbsG = parseNonNegative(manualCarbs || '0', label('Carbohydrates', 'کربوهیدرات'));
      const fatG = parseNonNegative(manualFat || '0', label('Fat', 'چربی'));
      if (calories > 10_000 || proteinG > 1_000 || carbsG > 2_000 || fatG > 1_000) {
        throw new Error(label('One or more nutrition values are outside the supported range.', 'یک یا چند مقدار تغذیه‌ای خارج از محدوده قابل قبول است.'));
      }
      await logMeal({
        eatenAt: new Date().toISOString(),
        mealType,
        description: description.trim(),
        calories: Math.round(calories),
        proteinG,
        carbsG,
        fatG,
        source: 'manual',
      });
      await refreshDailySummary();
      router.back();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : label('Meal logging failed.', 'ثبت وعده انجام نشد.'));
    } finally {
      setLogging(false);
    }
  };

  const mealTypeSelector = (
    <>
      <AppText weight="600">{label('Meal type', 'نوع وعده')}</AppText>
      <ChoiceGrid value={mealType} onChange={setMealType} options={[
        { value: 'breakfast', label: label('Breakfast', 'صبحانه') },
        { value: 'lunch', label: label('Lunch', 'ناهار') },
        { value: 'dinner', label: label('Dinner', 'شام') },
        { value: 'snack', label: label('Snack', 'میان‌وعده') },
      ]} />
    </>
  );

  return (
    <Screen>
      {mode === 'manual' ? (
        <InlineNotice>{label('Manual logging works completely offline and sends nothing outside this phone.', 'ثبت دستی کاملاً آفلاین است و هیچ اطلاعاتی از گوشی خارج نمی‌شود.')}</InlineNotice>
      ) : mode === 'text' ? (
        <InlineNotice>{label('Text search and nutrition calculation are fully local. AI is not used to invent calories or macros.', 'جست‌وجوی متنی و محاسبهٔ تغذیه کاملاً محلی است. هوش مصنوعی برای ساخت کالری یا ماکرو استفاده نمی‌شود.')}</InlineNotice>
      ) : (
        <InlineNotice>{label('The image is sent to the configured Vision API only to identify food. Nutrition is resolved and calculated from the local IFKB catalog.', 'تصویر فقط برای شناسایی غذا به API بینایی تنظیم‌شده ارسال می‌شود. مقدارهای تغذیه‌ای از کاتالوگ محلی IFKB انتخاب و محاسبه می‌شوند.')}</InlineNotice>
      )}
      <ChoiceGrid
        value={mode}
        onChange={(value) => { setMode(value); resetResult(); setError(null); }}
        options={[
          { value: 'manual', label: label('Manual', 'دستی') },
          { value: 'text', label: t('nutrition.foodText') },
          { value: 'photo', label: t('nutrition.foodPhoto') },
        ]}
        columns={1}
      />

      {mode === 'manual' ? (
        <Card>
          <Field label={label('Meal description', 'توضیح وعده')} value={description} onChangeText={setDescription} placeholder={label('Example: chicken and rice', 'مثلاً مرغ و برنج')} />
          <Field label={t('today.calories')} value={manualCalories} onChangeText={setManualCalories} keyboardType="number-pad" />
          <View style={{ flexDirection: 'row', gap: 10 }}>
            <View style={{ flex: 1 }}><Field label={`${t('today.protein')} (g)`} value={manualProtein} onChangeText={setManualProtein} keyboardType="decimal-pad" /></View>
            <View style={{ flex: 1 }}><Field label={`${label('Carbs', 'کربوهیدرات')} (g)`} value={manualCarbs} onChangeText={setManualCarbs} keyboardType="decimal-pad" /></View>
            <View style={{ flex: 1 }}><Field label={`${label('Fat', 'چربی')} (g)`} value={manualFat} onChangeText={setManualFat} keyboardType="decimal-pad" /></View>
          </View>
          {mealTypeSelector}
          {error ? <InlineNotice tone="danger">{error}</InlineNotice> : null}
          <PrimaryButton title={t('nutrition.logMeal')} onPress={saveManualLog} loading={logging} />
        </Card>
      ) : (
        <>
          <Card>
            <Field
              label={label('Food description or portion notes', 'توضیح غذا یا مقدار سهم')}
              value={description}
              onChangeText={setDescription}
              multiline={mode === 'photo'}
              placeholder={label('Example: 2 bowls of ghormeh sabzi or 100 g bread', 'مثلاً دو کاسه قورمه‌سبزی یا ۱۰۰ گرم نان')}
            />
            {mode === 'text' ? (
              <View style={{ gap: 8 }}>
                <PrimaryButton title={label('Search local catalog', 'جست‌وجو در کاتالوگ محلی')} onPress={estimateText} loading={loading} />
                <PrimaryButton title={label('Browse Iranian food catalog', 'مرور کاتالوگ غذاهای ایرانی')} variant="secondary" onPress={() => router.push('/iranian-foods')} />
              </View>
            ) : (
              <View style={{ gap: 10 }}>
                <PrimaryButton title={label('Take a photo', 'گرفتن عکس')} onPress={() => estimatePhoto('camera')} loading={loading} />
                <PrimaryButton title={label('Choose from gallery', 'انتخاب از گالری')} variant="secondary" onPress={() => estimatePhoto('library')} disabled={loading} />
              </View>
            )}
          </Card>

          {visionLabels.length > 0 && !result ? <InlineNotice>{label(`Vision candidates: ${visionLabels.join(', ')}`, `کاندیدهای بینایی: ${visionLabels.join('، ')}`)}</InlineNotice> : null}
          {error ? <InlineNotice tone="danger">{error}</InlineNotice> : null}

          {result ? (
            <Card>
              <View style={{ gap: 3 }}>
                <AppText size={23} weight="800">{result.itemName}</AppText>
                <AppText muted>{result.servingSize}</AppText>
                <AppText muted size={13}>{identifiedByVision
                  ? label('Identity: Vision API · Nutrition: local IFKB catalog', 'هویت: API بینایی · تغذیه: کاتالوگ محلی IFKB')
                  : label('Source: local IFKB catalog', 'منبع: کاتالوگ محلی IFKB')}</AppText>
              </View>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}>
                <MetricCard label={t('today.calories')} value={result.calories} unit="kcal" />
                {localRange ? <MetricCard label={label('Likely range', 'بازه محتمل')} value={`${localRange.low}–${localRange.high}`} unit="kcal" /> : null}
                <MetricCard label={t('today.protein')} value={Math.round(result.proteinG)} unit="g" />
                <MetricCard label={label('Carbs', 'کربوهیدرات')} value={Math.round(result.carbsG)} unit="g" />
                <MetricCard label={label('Fat', 'چربی')} value={Math.round(result.fatG)} unit="g" />
              </View>
              {result.assumptions.length > 0 ? <InlineNotice tone="warning">{result.assumptions.join('\n')}</InlineNotice> : null}
              {mealTypeSelector}
              <PrimaryButton title={t('nutrition.logMeal')} onPress={saveEstimatedLog} loading={logging} />
            </Card>
          ) : null}
        </>
      )}
    </Screen>
  );
}
