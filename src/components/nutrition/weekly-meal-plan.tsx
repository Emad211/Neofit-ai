"use client";

import * as React from "react";
import Link from "next/link";
import { isToday as isTodayDate } from "date-fns";
import { MealCard, type Meal } from "./meal-card";
import type { NutritionDay } from "@/lib/neofit-models";
import { useUserData } from "@/context/user-profile-context";
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

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
    await updateLoggedMealsState(Array.from(new Set([...(loggedMealsState || []), meal.id])));
    toast({ title: "وعده ثبت شد", description: meal.name });
  };

  const handleUpdateMeal = (mealId: string, newName: string) => {
    setMealPlan((current) => {
      const updated = current.map((day) => ({ ...day, meals: day.meals.map((meal) => meal.id === mealId ? { ...meal, name: newName } : meal) }));
      if (workoutPlan) savePlans({ nutritionPlan: updated.map(({ date: _date, ...day }) => day), workoutPlan });
      return updated;
    });
  };

  if (isLoading) return <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">{[0, 1, 2].map((item) => <Skeleton key={item} className="h-[32rem] w-full rounded-3xl" />)}</div>;

  if (!mealPlan.length) {
    return <Card className="border-dashed p-10 text-center"><p className="font-black">برنامه تغذیه‌ای فعال نیست</p><p className="mt-2 text-sm text-muted-foreground">Onboarding را تکمیل کن تا برنامه نمونه فعال شود.</p><Button asChild className="mt-4"><Link href="/onboarding/analysis">مرور نتیجه اولیه</Link></Button></Card>;
  }

  return (
    <div dir="rtl" className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
      {mealPlan.map((day) => {
        const isToday = isTodayDate(day.date);
        const completedMeals = day.meals.filter((meal) => (loggedMealsState || []).includes(meal.id)).length;
        return (
          <Card key={day.day} className={isToday ? "flex flex-col border-emerald-500/40 p-4 shadow-md" : "flex flex-col p-4"}>
            <div className="mb-4 flex items-start justify-between gap-3 border-b pb-4">
              <div><div className="flex items-center gap-2"><p className="text-lg font-black">{day.day}</p>{isToday ? <Badge className="bg-emerald-600 hover:bg-emerald-600">امروز</Badge> : null}</div><p className="mt-1 text-sm text-muted-foreground">{new Intl.DateTimeFormat("fa-IR", { weekday: "long", month: "long", day: "numeric" }).format(day.date)}</p></div>
              <div className="text-left"><p className="text-xs text-muted-foreground">پایبندی</p><p className="mt-1 font-black text-emerald-700 dark:text-emerald-300">{completedMeals.toLocaleString("fa-IR")} / {day.meals.length.toLocaleString("fa-IR")}</p></div>
            </div>
            <div className="flex-grow space-y-4">{day.meals.map((meal) => <MealCard key={meal.id} meal={meal} isLogged={(loggedMealsState || []).includes(meal.id)} isToday={isToday} onUpdateMeal={handleUpdateMeal} onLogMeal={handleLogMeal} />)}</div>
            <div className="mt-4 flex items-center justify-between border-t pt-4"><span className="text-sm text-muted-foreground">مجموع برنامه روز</span><span className="text-xl font-black text-primary">{day.totalCalories.toLocaleString("fa-IR")} کالری</span></div>
          </Card>
        );
      })}
    </div>
  );
}
