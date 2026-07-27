import * as React from 'react';
import { Alert, View } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { router, useLocalSearchParams } from 'expo-router';
import { AppText, Card, ChoiceGrid, Field, InlineNotice, MetricCard, PrimaryButton, Screen } from '@/components/ui';
import { logMeal } from '@/db/nutrition-meal-repository';
import { FoodEstimate, Meal } from '@/domain/models';
import {
  decideVisionResolution,
  type VisionResolutionReason,
} from '@/nutrition-core';
import { useApp } from '@/providers/app-provider';
import { AvalAiError } from '@/services/avalai-client';
import { buildCatalogFoodEstimate } from '@/services/food-catalog-core-adapter';
import { findBestLocalFoodMatch } from '@/services/local-food-matcher';
import { prepareVisionImage } from '@/services/vision-image-preparation';
import { recognizeFoodFromPhoto, type VisionFoodCandidate } from '@/services/vision-food-recognition';

type EstimatorMode = 'manual' | 'text' | 'photo';
type LocalFoodMatch = NonNullable<Awaited<ReturnType<typeof findBestLocalFoodMatch>>>;

interface VisionResolvedChoice {
  readonly key: string;
  readonly query: string;
  readonly confidence: number;
  readonly observation: VisionFoodCandidate | undefined;
  readonly local: LocalFoodMatch;
  readonly combinedScore: number;
}

interface VisionReviewContext {
  readonly choices: readonly VisionResolvedChoice[];
  readonly reasons: readonly VisionResolutionReason[];
  readonly visibleComponents: readonly string[];
  readonly warnings: readonly string[];
  readonly prepared: {
    readonly width: number;
    readonly height: number;
    readonly byteLength: number;
  };
}

function initialMode(value: string | undefined): EstimatorMode {
  if (value === 'manual' || value === 'photo') return value;
  return 'text';
}

function parseNonNegative(value: string, label: string) {
  const number = Number(value);
  if (!Number.isFinite(number) || number < 0) throw new Error(`${label} is invalid.`);
  return number;
}

function confirmVisionUpload(input: {
  readonly title: string;
  readonly message: string;
  readonly cancel: string;
  readonly send: string;
}): Promise<boolean> {
  return new Promise((resolve) => {
    Alert.alert(input.title, input.message, [
      { text: input.cancel, style: 'cancel', onPress: () => resolve(false) },
      { text: input.send, onPress: () => resolve(true) },
    ], { cancelable: true, onDismiss: () => resolve(false) });
  });
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
  const [visionReview, setVisionReview] = React.useState<VisionReviewContext | null>(null);
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
    setVisionReview(null);
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
    local: LocalFoodMatch;
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

  const buildVisionAssumptions = (
    choice: VisionResolvedChoice,
    context: Omit<VisionReviewContext, 'choices'>,
    confirmed: boolean,
  ): string[] => {
    const assumptions = [
      label(
        `Vision API candidate: ${choice.query}. Nutrition was calculated locally, not by the API.`,
        `کاندید API بینایی: ${choice.query}. مقدارهای تغذیه‌ای در گوشی محاسبه شدند، نه توسط API.`,
      ),
      label(
        `Prepared JPEG: ${context.prepared.width}×${context.prepared.height} px, ${Math.round(context.prepared.byteLength / 1_000)} KB.`,
        `JPEG آماده‌شده: ${context.prepared.width}×${context.prepared.height} پیکسل، ${Math.round(context.prepared.byteLength / 1_000)} کیلوبایت.`,
      ),
    ];
    if (confirmed) {
      assumptions.push(label(
        'The user confirmed this identity before nutrition was shown.',
        'کاربر پیش از نمایش مقدارهای تغذیه‌ای، این هویت را تأیید کرد.',
      ));
    }
    if (context.visibleComponents.length > 1) {
      assumptions.push(label(
        `Mixed plate detected: ${context.visibleComponents.join(', ')}. Only the confirmed component is included; log the other components separately.`,
        `بشقاب چندجزئی تشخیص داده شد: ${context.visibleComponents.join('، ')}. فقط جزء تأییدشده محاسبه شده است؛ اجزای دیگر را جداگانه ثبت کنید.`,
      ));
    } else if (choice.observation?.visibleComponents.length) {
      assumptions.push(label(
        `Visible components: ${choice.observation.visibleComponents.join(', ')}`,
        `اجزای قابل‌مشاهده: ${choice.observation.visibleComponents.join('، ')}`,
      ));
    }
    if (choice.observation?.preparationHints.length) {
      assumptions.push(label(
        `Visible preparation cues: ${choice.observation.preparationHints.join(', ')}`,
        `نشانه‌های قابل‌مشاهدهٔ پخت: ${choice.observation.preparationHints.join('، ')}`,
      ));
    }
    assumptions.push(...context.warnings);
    return assumptions;
  };

  const confirmVisionChoice = (choice: VisionResolvedChoice) => {
    if (!visionReview) return;
    const context = {
      reasons: visionReview.reasons,
      visibleComponents: visionReview.visibleComponents,
      warnings: visionReview.warnings,
      prepared: visionReview.prepared,
    };
    applyLocalMatch({
      local: choice.local,
      assumptions: buildVisionAssumptions(choice, context, true),
      fromVision: true,
    });
    setVisionReview(null);
    setError(null);
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
        ? await ImagePicker.launchCameraAsync({ mediaTypes: ['images'], base64: false, quality: 0.9, allowsEditing: false })
        : await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], base64: false, quality: 0.9, allowsEditing: false });

      if (pickerResult.canceled) return;
      const asset = pickerResult.assets[0];
      if (!asset?.uri || !asset.width || !asset.height) {
        throw new Error(label('The selected image could not be read.', 'تصویر انتخاب‌شده قابل خواندن نبود.'));
      }
      const consented = await confirmVisionUpload({
        title: label('Send prepared photo?', 'ارسال نسخهٔ آماده‌شدهٔ تصویر؟'),
        message: label(
          'NeoFit will resize and compress this photo on your phone, then send only that JPEG to the configured Vision API for food identification. The API is not used to calculate nutrition.',
          'NeoFit تصویر را روی گوشی کوچک و فشرده می‌کند و فقط همان JPEG را برای شناسایی غذا به API بینایی تنظیم‌شده می‌فرستد. محاسبهٔ تغذیه توسط API انجام نمی‌شود.',
        ),
        cancel: label('Cancel', 'انصراف'),
        send: label('Prepare and send', 'آماده‌سازی و ارسال'),
      });
      if (!consented) return;
      const prepared = await prepareVisionImage({
        uri: asset.uri,
        width: asset.width,
        height: asset.height,
      });
      const observation = await recognizeFoodFromPhoto({
        imageDataUrl: prepared.imageDataUrl,
        description,
        locale,
      });
      const labels = observation.candidates.map((candidate) => candidate.label);
      setVisionLabels(labels);

      const candidates: Array<{ query: string; confidence: number; observation: VisionFoodCandidate | undefined }> = observation.candidates.map((candidate) => ({
        query: candidate.label,
        confidence: candidate.confidence ?? 0.35,
        observation: candidate,
      }));
      if (description.trim().length >= 2) {
        candidates.unshift({ query: description.trim(), confidence: 1, observation: undefined });
      }

      const resolved: VisionResolvedChoice[] = (await Promise.all(candidates.map(async (candidate, index) => ({
        candidate,
        index,
        local: await findBestLocalFoodMatch(candidate.query),
      }))))
        .filter((item): item is typeof item & { local: LocalFoodMatch } => item.local !== null)
        .map((item) => ({
          key: `${item.local.item.id}:${item.index}`,
          query: item.candidate.query,
          confidence: item.candidate.confidence,
          observation: item.candidate.observation,
          local: item.local,
          combinedScore: item.local.score + item.candidate.confidence * 120,
        }))
        .sort((left, right) => right.combinedScore - left.combinedScore);

      const decision = decideVisionResolution({
        candidates: resolved.map((item) => ({
          localId: item.local.item.id,
          label: item.query,
          localScore: item.local.score,
          confidence: item.confidence,
          visibleComponents: item.observation?.visibleComponents ?? [],
        })),
        providerWarnings: observation.warnings,
      });
      if (decision.mode === 'no_match' || decision.bestIndex === null) {
        const names = labels.length > 0 ? labels.join('، ') : label('no reliable candidate', 'بدون کاندید قابل‌اعتماد');
        setError(label(
          `The Vision API suggested: ${names}. None maps reliably to the local catalog. Type the exact food name or use manual logging.`,
          `پیشنهادهای API بینایی: ${names}. هیچ‌کدام با اطمینان به کاتالوگ محلی متصل نشدند. نام دقیق غذا را بنویسید یا ثبت دستی را انتخاب کنید.`,
        ));
        return;
      }

      const context = {
        reasons: decision.reasons,
        visibleComponents: decision.visibleComponents,
        warnings: observation.warnings,
        prepared: {
          width: prepared.width,
          height: prepared.height,
          byteLength: prepared.byteLength,
        },
      };
      const best = resolved[decision.bestIndex];
      if (!best) throw new Error('Vision resolution selected an unavailable candidate.');

      if (decision.mode === 'auto_select') {
        applyLocalMatch({
          local: best.local,
          assumptions: buildVisionAssumptions(best, context, false),
          fromVision: true,
        });
        return;
      }

      const choices = decision.choiceIndexes
        .map((index) => resolved[index])
        .filter((item): item is VisionResolvedChoice => item !== undefined);
      setVisionReview({ ...context, choices });
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

  const visionReasonSummary = visionReview?.reasons.map((reason) => ({
    multiple_visible_components: label('multiple visible components', 'چند جزء قابل‌مشاهده'),
    close_alternative: label('two or more close matches', 'چند تطبیق نزدیک'),
    low_provider_confidence: label('low Vision confidence', 'اطمینان پایین بینایی'),
    weak_local_match: label('a weak local catalog match', 'تطبیق ضعیف با کاتالوگ محلی'),
    provider_warning: label('a provider ambiguity warning', 'هشدار ابهام از API'),
  })[reason]).join('، ') ?? '';

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

          {visionReview ? (
            <Card>
              <AppText size={21} weight="800">{label('Confirm the food to log', 'غذای موردنظر برای ثبت را تأیید کنید')}</AppText>
              <InlineNotice tone="warning">{label(
                `NeoFit did not choose automatically because it found ${visionReasonSummary}. Choose one food below. On a mixed plate, only that component will be calculated.`,
                `NeoFit به‌دلیل ${visionReasonSummary} نتیجه را خودکار انتخاب نکرد. یکی از غذاهای زیر را انتخاب کنید. در بشقاب چندجزئی فقط همان جزء محاسبه می‌شود.`,
              )}</InlineNotice>
              {visionReview.visibleComponents.length > 1 ? (
                <AppText muted size={13}>{label(
                  `Visible components: ${visionReview.visibleComponents.join(', ')}`,
                  `اجزای قابل‌مشاهده: ${visionReview.visibleComponents.join('، ')}`,
                )}</AppText>
              ) : null}
              {visionReview.choices.map((choice) => (
                <View key={choice.key} style={{ gap: 7 }}>
                  <AppText weight="700">{locale === 'fa' ? choice.local.item.nameFa : choice.local.item.nameEn}</AppText>
                  <AppText muted size={12}>{label(
                    `Vision label: ${choice.query} · local score ${Math.round(choice.local.score)} · confidence ${Math.round(choice.confidence * 100)}%`,
                    `برچسب بینایی: ${choice.query} · امتیاز محلی ${Math.round(choice.local.score)} · اطمینان ${Math.round(choice.confidence * 100)}٪`,
                  )}</AppText>
                  <PrimaryButton
                    title={label(`Use ${choice.local.item.nameEn}`, `انتخاب ${choice.local.item.nameFa}`)}
                    variant="secondary"
                    onPress={() => confirmVisionChoice(choice)}
                  />
                </View>
              ))}
              <PrimaryButton
                title={label('None of these — enter the name manually', 'هیچ‌کدام — نام را دستی وارد می‌کنم')}
                variant="ghost"
                onPress={() => { setVisionReview(null); setMode('text'); setResult(null); }}
              />
            </Card>
          ) : null}

          {visionLabels.length > 0 && !result && !visionReview ? <InlineNotice>{label(`Vision candidates: ${visionLabels.join(', ')}`, `کاندیدهای بینایی: ${visionLabels.join('، ')}`)}</InlineNotice> : null}
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
