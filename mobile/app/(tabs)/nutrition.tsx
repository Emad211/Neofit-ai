import * as React from 'react';
import { View } from 'react-native';
import { router } from 'expo-router';
import { AppText, Card, InlineNotice, PageTitle, PrimaryButton, Screen } from '@/components/ui';
import { logMeal } from '@/db/log-repository';
import { saveNutritionPlan } from '@/db/plan-repository';
import { Meal } from '@/domain/models';
import { useApp } from '@/providers/app-provider';
import { generateNutritionPlan } from '@/services/ai-features';
import { AvalAiError } from '@/services/avalai-client';

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

      <View style={{ gap: 10 }}>
        <PrimaryButton
          title={label('Log a meal manually — offline', 'ثبت دستی وعده — آفلاین')}
          onPress={() => router.push({ pathname: '/meal-estimator', params: { mode: 'manual' } })}
        />
        <View style={{ flexDirection: 'row', gap: 10 }}>
          <View style={{ flex: 1 }}>
            <PrimaryButton
              title={t('nutrition.foodText')}
              variant="secondary"
              onPress={() => router.push({ pathname: '/meal-estimator', params: { mode: 'text' } })}
            />
          </View>
          <View style={{ flex: 1 }}>
            <PrimaryButton
              title={t('nutrition.foodPhoto')}
              variant="secondary"
              onPress={() => router.push({ pathname: '/meal-estimator', params: { mode: 'photo' } })}
            />
          </View>
        </View>
      </View>

      {notice ? <InlineNotice tone="success">{notice}</InlineNotice> : null}
      {error ? <InlineNotice tone="danger">{error}</InlineNotice> : null}

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
