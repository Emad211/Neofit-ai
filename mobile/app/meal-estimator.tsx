import * as React from 'react';
import { View } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { router, useLocalSearchParams } from 'expo-router';
import { AppText, Card, ChoiceGrid, Field, InlineNotice, MetricCard, PrimaryButton, Screen } from '@/components/ui';
import { logMeal } from '@/db/log-repository';
import { FoodEstimate, Meal } from '@/domain/models';
import { useApp } from '@/providers/app-provider';
import { estimateFoodFromPhoto, estimateFoodFromText } from '@/services/ai-features';
import { AvalAiError } from '@/services/avalai-client';
import { findBestLocalFoodMatch } from '@/services/local-food-matcher';

type EstimatorMode = 'manual' | 'text' | 'photo';
type ResultSource = 'catalog' | 'ai_text' | 'ai_photo';

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
  const [resultSource, setResultSource] = React.useState<ResultSource>('ai_text');
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

  const handleError = (caught: unknown) => {
    console.error('Meal estimate failed:', caught);
    if (caught instanceof AvalAiError) {
      setError(caught.code === 'MISSING_API_KEY' ? t('ai.missingKey') : caught.message);
    } else {
      setError(caught instanceof Error ? caught.message : t('ai.networkError'));
    }
  };

  const estimateTextWithAi = async () => {
    if (!hasAvalAiKey) {
      setError(label('No close local match was found. Add an AvalAI key or use the Iranian food catalog.', 'نتیجه محلی نزدیک پیدا نشد. کلید AvalAI را اضافه کنید یا از کاتالوگ غذاهای ایرانی استفاده کنید.'));
      return;
    }
    setLoading(true);
    setError(null);
    setLocalRange(null);
    try {
      setResult(await estimateFoodFromText({ description, locale }));
      setResultSource('ai_text');
    } catch (caught) {
      handleError(caught);
    } finally {
      setLoading(false);
    }
  };

  const estimateText = async () => {
    if (description.trim().length < 2) {
      setError(label('Describe the food and serving size.', 'نام غذا و مقدار آن را بنویسید.'));
      return;
    }
    setLoading(true);
    setError(null);
    setResult(null);
    setLocalRange(null);
    try {
      const local = await findBestLocalFoodMatch(description);
      if (local && local.score >= 500) {
        setResult({
          itemName: locale === 'fa' ? local.item.nameFa : local.item.nameEn,
          servingSize: `${locale === 'fa' ? local.item.portionLabelFa : local.item.portionLabelEn} × ${local.multiplier}`,
          calories: local.scaled.calories,
          proteinG: local.scaled.proteinG,
          carbsG: local.scaled.carbsG,
          fatG: local.scaled.fatG,
          confidence: local.item.confidence,
          assumptions: [
            locale === 'fa' ? local.item.notesFa : local.item.notesEn,
            label('Matched against the on-device Iranian food catalog.', 'با کاتالوگ غذاهای ایرانی روی گوشی تطبیق داده شد.'),
          ].filter(Boolean),
        });
        setResultSource('catalog');
        setLocalRange({ low: local.scaled.caloriesLow, high: local.scaled.caloriesHigh });
        return;
      }
      if (hasAvalAiKey) {
        setResult(await estimateFoodFromText({ description, locale }));
        setResultSource('ai_text');
      } else {
        setError(label('No close local match was found. Search the catalog or enter nutrition manually.', 'نتیجه محلی نزدیک پیدا نشد. در کاتالوگ جست‌وجو کنید یا مقدارها را دستی وارد کنید.'));
      }
    } catch (caught) {
      handleError(caught);
    } finally {
      setLoading(false);
    }
  };

  const estimatePhoto = async (source: 'camera' | 'library') => {
    setLoading(true);
    setError(null);
    setResult(null);
    setLocalRange(null);
    try {
      if (source === 'camera') {
        const permission = await ImagePicker.requestCameraPermissionsAsync();
        if (!permission.granted) throw new Error(label('Camera permission was not granted.', 'اجازه دسترسی به دوربین داده نشد.'));
      }

      const pickerResult = source === 'camera'
        ? await ImagePicker.launchCameraAsync({
            mediaTypes: ['images'],
            base64: true,
            quality: 0.65,
            allowsEditing: false,
          })
        : await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ['images'],
            base64: true,
            quality: 0.65,
            allowsEditing: false,
          });

      if (pickerResult.canceled) return;
      const asset = pickerResult.assets[0];
      if (!asset?.base64) throw new Error(label('The selected image could not be read.', 'تصویر انتخاب‌شده قابل خواندن نبود.'));
      const mime = asset.mimeType || 'image/jpeg';
      const imageDataUrl = `data:${mime};base64,${asset.base64}`;
      setResult(await estimateFoodFromPhoto({ imageDataUrl, description, locale }));
      setResultSource('ai_photo');
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
        source: resultSource,
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
      <ChoiceGrid
        value={mealType}
        onChange={setMealType}
        options={[
          { value: 'breakfast', label: label('Breakfast', 'صبحانه') },
          { value: 'lunch', label: label('Lunch', 'ناهار') },
          { value: 'dinner', label: label('Dinner', 'شام') },
          { value: 'snack', label: label('Snack', 'میان‌وعده') },
        ]}
      />
    </>
  );

  return (
    <Screen>
      {mode === 'manual' ? (
        <InlineNotice>{label('Manual logging works completely offline and sends nothing outside this phone.', 'ثبت دستی کاملاً آفلاین است و هیچ اطلاعاتی از گوشی خارج نمی‌شود.')}</InlineNotice>
      ) : mode === 'text' ? (
        <InlineNotice>{label('Text lookup checks the local Iranian-food catalog first. AvalAI is used only when no strong local match exists.', 'جست‌وجوی متنی ابتدا کاتالوگ محلی غذاهای ایرانی را بررسی می‌کند و فقط نبودِ تطبیق قوی به AvalAI می‌رود.')}</InlineNotice>
      ) : (
        <InlineNotice>{t('nutrition.estimateWarning')}</InlineNotice>
      )}
      <ChoiceGrid
        value={mode}
        onChange={(value) => {
          setMode(value);
          setResult(null);
          setLocalRange(null);
          setError(null);
        }}
        options={[
          { value: 'manual', label: label('Manual', 'دستی') },
          { value: 'text', label: t('nutrition.foodText') },
          { value: 'photo', label: t('nutrition.foodPhoto') },
        ]}
        columns={1}
      />

      {mode === 'manual' ? (
        <Card>
          <Field
            label={label('Meal description', 'توضیح وعده')}
            value={description}
            onChangeText={setDescription}
            placeholder={label('Example: chicken and rice', 'مثلاً مرغ و برنج')}
          />
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
                <PrimaryButton title={label('Check local catalog / estimate', 'بررسی کاتالوگ محلی / تخمین')} onPress={estimateText} loading={loading} />
                <PrimaryButton title={label('Browse Iranian food catalog', 'مرور کاتالوگ غذاهای ایرانی')} variant="secondary" onPress={() => router.push('/iranian-foods')} />
              </View>
            ) : (
              <View style={{ gap: 10 }}>
                <PrimaryButton title={label('Take a photo', 'گرفتن عکس')} onPress={() => estimatePhoto('camera')} loading={loading} />
                <PrimaryButton title={label('Choose from gallery', 'انتخاب از گالری')} variant="secondary" onPress={() => estimatePhoto('library')} disabled={loading} />
              </View>
            )}
          </Card>

          {error ? <InlineNotice tone="danger">{error}</InlineNotice> : null}

          {result ? (
            <Card>
              <View style={{ gap: 3 }}>
                <AppText size={23} weight="800">{result.itemName}</AppText>
                <AppText muted>{result.servingSize}</AppText>
                <AppText muted size={13}>{resultSource === 'catalog'
                  ? label('Source: local Iranian food catalog', 'منبع: کاتالوگ محلی غذاهای ایرانی')
                  : label(`Confidence: ${result.confidence}`, `میزان اطمینان: ${result.confidence === 'high' ? 'زیاد' : result.confidence === 'medium' ? 'متوسط' : 'کم'}`)}</AppText>
              </View>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}>
                <MetricCard label={t('today.calories')} value={result.calories} unit="kcal" />
                {localRange ? <MetricCard label={label('Likely range', 'بازه محتمل')} value={`${localRange.low}–${localRange.high}`} unit="kcal" /> : null}
                <MetricCard label={t('today.protein')} value={Math.round(result.proteinG)} unit="g" />
                <MetricCard label={label('Carbs', 'کربوهیدرات')} value={Math.round(result.carbsG)} unit="g" />
                <MetricCard label={label('Fat', 'چربی')} value={Math.round(result.fatG)} unit="g" />
              </View>
              {result.assumptions.length > 0 ? (
                <InlineNotice tone="warning">{result.assumptions.join('\n')}</InlineNotice>
              ) : null}
              {resultSource === 'catalog' && hasAvalAiKey ? (
                <PrimaryButton title={label('Compare with AvalAI estimate', 'مقایسه با تخمین AvalAI')} variant="secondary" onPress={estimateTextWithAi} loading={loading} />
              ) : null}
              {mealTypeSelector}
              <PrimaryButton title={t('nutrition.logMeal')} onPress={saveEstimatedLog} loading={logging} />
            </Card>
          ) : null}
        </>
      )}
    </Screen>
  );
}
