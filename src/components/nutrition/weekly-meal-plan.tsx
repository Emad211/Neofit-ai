'use client';

import * as React from 'react';
import Link from 'next/link';
import { addDays, format, isToday, startOfWeek } from 'date-fns';
import { enUS, faIR } from 'date-fns/locale';
import { MealCard, Meal } from '@/components/nutrition/meal-card';
import type { GenerateNutritionProgramOutput, SuggestMealAlternativeOutput } from '@/ai/schemas';
import { Skeleton } from '@/components/ui/skeleton';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useUserData } from '@/context/user-profile-context';
import { useToast } from '@/hooks/use-toast';
import { useI18n } from '@/i18n/provider';

type DailyMealPlan = GenerateNutritionProgramOutput['weeklyMealPlan'][number] & { date: Date; meals: Meal[] };

function mealLogType(type: string): 'breakfast' | 'lunch' | 'dinner' | 'snack' {
  const normalized = type.toLowerCase();
  if (normalized.includes('breakfast') || normalized.includes('صبح')) return 'breakfast';
  if (normalized.includes('lunch') || normalized.includes('ناهار')) return 'lunch';
  if (normalized.includes('dinner') || normalized.includes('شام')) return 'dinner';
  return 'snack';
}

export function WeeklyMealPlan() {
  const {
    nutritionPlan,
    savePlans,
    workoutPlan,
    isLoading,
    logMeal,
    loggedMealsState,
    updateLoggedMealsState,
  } = useUserData();
  const [mealPlan, setMealPlan] = React.useState<DailyMealPlan[]>([]);
  const [error, setError] = React.useState<string | null>(null);
  const { toast } = useToast();
  const { locale, t } = useI18n();
  const label = (en: string, fa: string) => locale === 'fa' ? fa : en;

  React.useEffect(() => {
    if (isLoading) return;
    if (!nutritionPlan?.length) {
      setMealPlan([]);
      setError(label('No nutrition plan found.', 'برنامه غذایی پیدا نشد.'));
      return;
    }

    const weekStart = startOfWeek(new Date(), { weekStartsOn: 1 });
    setMealPlan(nutritionPlan.map((dayPlan, dayIndex) => ({
      ...dayPlan,
      date: addDays(weekStart, dayIndex),
      meals: dayPlan.meals.map((meal, mealIndex) => ({
        ...meal,
        id: meal.id || `meal-${dayIndex}-${mealIndex}`,
        protein: Number(meal.protein) || 0,
        carbohydrates: Number(meal.carbohydrates) || 0,
        fat: Number(meal.fat) || 0,
      })),
    })));
    setError(null);
  }, [isLoading, label, nutritionPlan]);

  const handleLogMeal = async (meal: Meal) => {
    try {
      await logMeal({
        mealType: mealLogType(meal.type),
        description: meal.name,
        calories: meal.calories,
        protein: meal.protein,
        carbohydrates: meal.carbohydrates,
        fat: meal.fat,
      });
      await updateLoggedMealsState(Array.from(new Set([...(loggedMealsState || []), meal.id])));
      toast({ title: label('Meal logged', 'وعده ثبت شد'), description: meal.name });
    } catch (caught) {
      console.error('Meal logging failed:', caught);
      toast({ variant: 'destructive', title: label('Logging failed', 'ثبت انجام نشد'), description: caught instanceof Error ? caught.message : undefined });
    }
  };

  const handleUpdateMeal = async (mealId: string, replacement: SuggestMealAlternativeOutput) => {
    if (!workoutPlan) return;
    const updatedPlan = mealPlan.map((dayPlan) => {
      const meals = dayPlan.meals.map((meal) => meal.id === mealId ? {
        ...meal,
        name: replacement.alternativeMeal,
        calories: replacement.calories,
        protein: replacement.protein,
        carbohydrates: replacement.carbohydrates,
        fat: replacement.fat,
        ingredients: replacement.ingredients,
      } : meal);
      return {
        ...dayPlan,
        meals,
        totalCalories: Math.round(meals.reduce((sum, meal) => sum + meal.calories, 0)),
      };
    });
    setMealPlan(updatedPlan);
    try {
      const nutritionPlanToSave = updatedPlan.map(({ date: _date, ...day }) => day);
      await savePlans({ nutritionPlan: nutritionPlanToSave, workoutPlan });
      toast({ title: label('Meal replaced', 'وعده جایگزین شد') });
    } catch (caught) {
      console.error('Meal replacement save failed:', caught);
      toast({ variant: 'destructive', title: label('Save failed', 'ذخیره انجام نشد') });
      setMealPlan((current) => current); // Snapshot listener will restore the persisted source of truth.
    }
  };

  if (isLoading) {
    return <div className="grid w-full grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">{Array.from({ length: 4 }, (_, index) => <Card key={index} className="h-full space-y-4 p-4"><Skeleton className="mx-auto h-6 w-24" />{Array.from({ length: 3 }, (_, mealIndex) => <Skeleton key={mealIndex} className="h-32 w-full" />)}</Card>)}</div>;
  }

  if (error) {
    return <Card className="flex flex-col items-center justify-center p-12 text-center"><h3 className="text-xl font-semibold">{label('No nutrition plan available', 'برنامه غذایی در دسترس نیست')}</h3><p className="mt-2 text-muted-foreground">{error}</p><Button asChild className="mt-4"><Link href="/profile/edit">{label('Create a plan', 'ساخت برنامه')}</Link></Button></Card>;
  }

  return (
    <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {mealPlan.map((dayPlan) => (
        <Card key={dayPlan.date.toISOString()} className="flex flex-col p-4">
          <div className="mb-4 text-center">
            <p className="font-headline text-lg font-bold">{format(dayPlan.date, 'EEEE', { locale: locale === 'fa' ? faIR : enUS })}</p>
            <p className="text-sm text-muted-foreground">{format(dayPlan.date, locale === 'fa' ? 'd MMMM' : 'MMMM do', { locale: locale === 'fa' ? faIR : enUS })}</p>
          </div>
          <div className="flex-grow space-y-4">
            {dayPlan.meals.map((meal) => <MealCard key={meal.id} meal={meal} isLogged={(loggedMealsState || []).includes(meal.id)} isToday={isToday(dayPlan.date)} onUpdateMeal={handleUpdateMeal} onLogMeal={handleLogMeal} />)}
          </div>
          <div className="mt-4 pt-2 text-center"><p className="text-sm text-muted-foreground">{label('Total calories', 'کالری کل')}</p><p className="text-xl font-bold text-primary">{dayPlan.totalCalories} kcal</p></div>
        </Card>
      ))}
    </div>
  );
}
