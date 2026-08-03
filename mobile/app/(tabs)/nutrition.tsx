import * as React from 'react';
import { View } from 'react-native';
import { router } from 'expo-router';
import { AppText, Card, InlineNotice, PageTitle, PrimaryButton, Screen } from '@/components/ui';
import { logMeal } from '@/db/nutrition-meal-repository';
import { saveNutritionPlan } from '@/db/plan-repository';
import { Meal } from '@/domain/models';
import { useApp } from '@/providers/app-provider';
import { generateNutritionPlan } from '@/services/ai-features';
import { AvalAiError } from '@/services/avalai-client';
import { isIfkbResolvedNutritionPlan } from '@/services/nutrition-plan-resolution-core';

function dayName(index: number, locale: 'fa' | 'en') {
  const referenceMonday = new Date(2024, 0, 1 + index);
  return new Intl.DateTimeFormat(locale === 'fa' ? 'fa-IR' : 'en-US', { weekday: 'long' }).format(referenceMonday);
}

export default function NutritionScreen() {
  const {
    locale,
    profile,
    nutritionPlan,
    hasAvalAiKey,
    t,
    refreshPlans,
    refreshDailySummary,
  } = useApp();
  const [generating, setGenerating] = React.useState(false);
  const [busyMealId, setBusyMealId] = React.useState<string | null>(null);
  const [notice, setNotice] = React.useState<string | null>(null);
  const [error, setError] = React.useState<string | null>(null);
  const label = (en: string, fa: string) => locale === 'fa' ? fa : en;
  const nutritionPlanResolved = nutritionPlan ? isIfkbResolvedNutritionPlan(nutritionPlan) : false;

  const generate = async () => {
    if (!profile) return;
    if (!hasAvalAiKey) {
      router.push('/ai-settings');
      return;
    }
    setGenerating(true);
    setError(null);
    setNotice(null);
    try {
      const plan = await generateNutritionPlan(profile);
      await saveNutritionPlan(plan, 'ai');
      await refreshPlans();
      setNotice(t('ai.saved'));
    } catch (caught) {
      console.error('Nutrition plan generation failed:', caught);
      setError(caught instanceof AvalAiError ? caught.message : t('ai.networkError'));
    } finally {
      setGenerating(false);
    }
  };

  const logPlannedMeal = async (meal: Meal) => {
    if (meal.nutritionSource !== 'ifkb_resolved') {
      setError(label(
        'This is a legacy AI plan whose nutrition was not resolved through IFKB. Regenerate the plan before logging it.',
        'این برنامهٔ قدیمی هوش مصنوعی است و تغذیهٔ آن از IFKB محاسبه نشده؛ پیش از ثبت، برنامه را دوباره تولید کنید.',
      ));
      return;
    }
    setBusyMealId(meal.id);
    setError(null);
    try {
      await logMeal({
        eatenAt: new Date().toISOString(),
        mealType: meal.type,
        description: meal.name,
        calories: meal.calories,
        proteinG: meal.proteinG,
        carbsG: meal.carbsG,
        fatG: meal.fatG,
        source: 'plan',
      });
      await refreshDailySummary();
      setNotice(label(`${meal.name} was logged locally.`, `${meal.name} به‌صورت محلی ثبت شد.`));
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : label('Meal logging failed.', 'ثبت وعده انجام نشد.'));
    } finally {
      setBusyMealId(null);
    }
  };

  return (
    <Screen>
      <PageTitle title={t('nutrition.title')} subtitle={t('settings.localDataDescription')} />
      <InlineNotice>{t('nutrition.estimateWarning')}</InlineNotice>

      <Card>
        <AppText size={20} weight="800">{label('Accurate local logging', 'ثبت دقیق‌تر و محلی')}</AppText>
        <AppText muted size={13}>{label(
          'Search Iranian foods and 13,225 official USDA records, choose a defensible serving, and save directly to the local diary.',
          'در غذاهای ایرانی و ۱۳٬۲۲۵ رکورد رسمی USDA جست‌وجو کنید، سهم قابل‌دفاع را انتخاب کنید و مستقیم در دفتر محلی ثبت کنید.',
        )}</AppText>
        <PrimaryButton
          title={label('Open complete food search', 'بازکردن جست‌وجوی جامع غذا')}
          onPress={() => router.push('/food-search')}
        />
        <PrimaryButton
          title={label('Open today’s diary', 'بازکردن دفتر امروز')}
          variant="secondary"
          onPress={() => router.push('/nutrition-diary')}
        />
        <PrimaryButton
          title={label('Open history and exports', 'بازکردن تاریخچه و خروجی‌ها')}
          variant="secondary"
          onPress={() => router.push('/nutrition-history')}
        />
        <PrimaryButton
          title={label('Open nutrition goals', 'بازکردن هدف‌های تغذیه')}
          variant="secondary"
          onPress={() => router.push('/nutrition-goals')}
        />
        <PrimaryButton
          title={label('Open recipes', 'بازکردن دستورهای غذایی')}
          variant="secondary"
          onPress={() => router.push('/recipes')}
        />
        <PrimaryButton
          title={label('Browse Iranian foods only', 'نمای تخصصی غذاهای ایرانی')}
          variant="secondary"
          onPress={() => router.push('/iranian-foods')}
        />
        <PrimaryButton
          title={label('Log a meal manually — offline', 'ثبت دستی وعده — آفلاین')}
          variant="secondary"
          onPress={() => router.push({ pathname: '/meal-estimator', params: { mode: 'manual' } })}
        />
        <View style={{ flexDirection: 'row', gap: 10 }}>
          <View style={{ flex: 1 }}>
            <PrimaryButton
              title={t('nutrition.foodText')}
              variant="ghost"
              onPress={() => router.push({ pathname: '/meal-estimator', params: { mode: 'text' } })}
            />
          </View>
          <View style={{ flex: 1 }}>
            <PrimaryButton
              title={t('nutrition.foodPhoto')}
              variant="ghost"
              onPress={() => router.push({ pathname: '/meal-estimator', params: { mode: 'photo' } })}
            />
          </View>
        </View>
      </Card>

      {notice ? <InlineNotice tone="success">{notice}</InlineNotice> : null}
      {error ? <InlineNotice tone="danger">{error}</InlineNotice> : null}
      {nutritionPlan && !nutritionPlanResolved ? (
        <InlineNotice tone="warning">{label(
          'This saved plan predates local IFKB resolution. It remains readable, but one-tap meal logging is blocked until you regenerate it.',
          'این برنامه پیش از اتصال کامل به IFKB ذخیره شده است. نمایش آن حفظ می‌شود، اما تا تولید دوباره، ثبت یک‌مرحله‌ای وعده‌ها غیرفعال است.',
        )}</InlineNotice>
      ) : null}

      {nutritionPlan ? (
        <>
          <Card>
            <AppText size={22} weight="800">{nutritionPlan.title}</AppText>
            <AppText muted>{nutritionPlan.summary}</AppText>
            <AppText weight="700">{nutritionPlan.dailyCalorieTarget} kcal / {label('day', 'روز')}</AppText>
          </Card>

          {nutritionPlan.days.map((day) => (
            <Card key={day.dayIndex}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                <AppText size={20} weight="800">{dayName(day.dayIndex, locale)}</AppText>
                <AppText muted>{day.totalCalories} kcal</AppText>
              </View>
              {day.meals.map((meal) => (
                <View key={meal.id} style={{ gap: 8, borderTopWidth: 1, borderTopColor: 'rgba(128,128,128,0.18)', paddingTop: 12 }}>
                  <AppText weight="700">{meal.name}</AppText>
                  <AppText muted size={13}>{meal.calories} kcal · P {Math.round(meal.proteinG)}g · C {Math.round(meal.carbsG)}g · F {Math.round(meal.fatG)}g</AppText>
                  <AppText muted size={12}>{meal.ingredients.map((item) => `${item.name} (${item.quantity})`).join('، ')}</AppText>
                  <PrimaryButton
                    title={t('nutrition.logMeal')}
                    variant="ghost"
                    loading={busyMealId === meal.id}
                    onPress={() => logPlannedMeal(meal)}
                  />
                </View>
              ))}
            </Card>
          ))}

          {nutritionPlan.safetyNotes.length > 0 ? (
            <InlineNotice tone="warning">{nutritionPlan.safetyNotes.join('\n')}</InlineNotice>
          ) : null}
        </>
      ) : (
        <Card>
          <AppText muted>{t('nutrition.noPlan')}</AppText>
        </Card>
      )}

      <PrimaryButton
        title={hasAvalAiKey ? t('nutrition.generate') : t('settings.avalai')}
        onPress={hasAvalAiKey ? generate : () => router.push('/ai-settings')}
        loading={generating}
      />
    </Screen>
  );
}
