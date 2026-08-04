"use client";

import * as React from "react";
import Link from "next/link";
import { format, isToday as isTodayDate } from "date-fns";
import { MealCard, type Meal } from "./meal-card";
import type { NutritionDay } from "@/lib/neofit-models";
import { useUserData } from "@/context/user-profile-context";
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

type DailyMealPlan = NutritionDay & { date: Date };

export function WeeklyMealPlan() {
  const { nutritionPlan, savePlans, workoutPlan, isLoading, logMeal, loggedMealsState, updateLoggedMealsState } = useUserData();
  const [mealPlan, setMealPlan] = React.useState<DailyMealPlan[]>([]);
  const { toast } = useToast();

  React.useEffect(() => {
    if (!nutritionPlan) return;
    const today = new Date();
    setMealPlan(nutritionPlan.map((day, index) => {
      const date = new Date(today);
      date.setDate(today.getDate() + index);
      return { ...day, date };
    }));
  }, [nutritionPlan]);

  const handleLogMeal = async (meal: Meal) => {
    await logMeal({ mealType: meal.type.includes("صبح") ? "breakfast" : meal.type.includes("ناهار") ? "lunch" : meal.type.includes("شام") ? "dinner" : "snack", description: meal.name, calories: meal.calories });
    await updateLoggedMealsState([...(loggedMealsState || []), meal.id]);
    toast({ title: "وعده ثبت شد", description: meal.name });
  };

  const handleUpdateMeal = (mealId: string, newName: string) => {
    setMealPlan((current) => {
      const updated = current.map((day) => ({ ...day, meals: day.meals.map((meal) => meal.id === mealId ? { ...meal, name: newName } : meal) }));
      if (workoutPlan) savePlans({ nutritionPlan: updated.map(({ date: _date, ...day }) => day), workoutPlan });
      return updated;
    });
  };

  if (isLoading) {
    return <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">{[0, 1, 2].map((item) => <Skeleton key={item} className="h-96 w-full" />)}</div>;
  }

  if (!mealPlan.length) {
    return <Card className="p-10 text-center"><p className="font-semibold">برنامهٔ تغذیه‌ای فعال نیست.</p><Button asChild className="mt-4"><Link href="/onboarding/analysis">فعال‌کردن برنامهٔ نمونه</Link></Button></Card>;
  }

  return (
    <div dir="rtl" className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
      {mealPlan.map((day) => {
        const isToday = isTodayDate(day.date);
        return (
          <Card key={day.day} className="flex flex-col p-4">
            <div className="mb-4 text-center">
              <p className="text-lg font-bold">{day.day}</p>
              <p className="text-sm text-muted-foreground">{format(day.date, "yyyy/MM/dd")}</p>
            </div>
            <div className="flex-grow space-y-4">
              {day.meals.map((meal) => <MealCard key={meal.id} meal={meal} isLogged={(loggedMealsState || []).includes(meal.id)} isToday={isToday} onUpdateMeal={handleUpdateMeal} onLogMeal={handleLogMeal} />)}
            </div>
            <div className="mt-4 border-t pt-3 text-center"><p className="text-sm text-muted-foreground">مجموع روز</p><p className="text-xl font-bold text-primary">{day.totalCalories} kcal</p></div>
          </Card>
        );
      })}
    </div>
  );
}
