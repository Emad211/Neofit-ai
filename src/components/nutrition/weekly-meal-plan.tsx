
"use client"

import * as React from "react"
import { MealCard, Meal } from "./meal-card";
import { format } from 'date-fns';
import { Skeleton } from "../ui/skeleton";
import { getMealPlan } from "@/lib/data/static-meal-data";


export function WeeklyMealPlan() {
  const [mealPlan, setMealPlan] = React.useState<any[]>([]);

  React.useEffect(() => {
    // In a real app, this data would come from a database based on the user's generated plan.
    const dynamicMealData = getMealPlan();
    // Simulate loading
    setTimeout(() => setMealPlan(dynamicMealData), 500);
  }, []);

  const handleUpdateMeal = (mealIdToUpdate: string, newMealName: string) => {
    setMealPlan(currentPlan => {
      return currentPlan.map(dayPlan => ({
        ...dayPlan,
        meals: dayPlan.meals.map((meal: Meal) => {
          if (meal.id === mealIdToUpdate) {
            // In a real app, you'd fetch all new details for the meal from the AI/DB
            return { ...meal, name: newMealName, calories: meal.calories + 50, image: 'https://placehold.co/600x400.png', dataAiHint: 'healthy food' };
          }
          return meal;
        }),
      }));
    });
  };

  if (mealPlan.length === 0) {
      return (
          <div className="w-full grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[...Array(3)].map((_, i) => (
                  <div key={i} className="p-1">
                      <div className="bg-card border rounded-lg p-4 h-full space-y-4">
                          <div className="text-center mb-4 space-y-2">
                              <Skeleton className="h-6 w-24 mx-auto" />
                              <Skeleton className="h-4 w-32 mx-auto" />
                          </div>
                          <div className="space-y-4">
                              {[...Array(3)].map((_, j) => (
                                   <div key={j} className="flex items-center">
                                       <Skeleton className="w-24 h-24 flex-shrink-0" />
                                       <div className="p-3 flex-grow space-y-2">
                                           <Skeleton className="h-4 w-20" />
                                           <Skeleton className="h-5 w-32" />
                                           <Skeleton className="h-4 w-16" />
                                       </div>
                                   </div>
                              ))}
                          </div>
                           <div className="text-center mt-4 pt-4 border-t space-y-2">
                              <Skeleton className="h-4 w-24 mx-auto" />
                              <Skeleton className="h-6 w-16 mx-auto" />
                          </div>
                      </div>
                  </div>
              ))}
          </div>
      )
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {mealPlan.map((dayPlan, index) => (
          <div key={index}>
              <div className="bg-card border rounded-lg p-4 h-full">
                  <div className="text-center mb-4">
                      <p className="text-lg font-bold font-headline">{dayPlan.day}</p>
                      <p className="text-sm text-muted-foreground">{format(dayPlan.date, 'do MMMM')}</p>
                  </div>
                  <div className="space-y-4">
                      {dayPlan.meals.map((meal: Meal) => (
                          <MealCard 
                            key={meal.id} 
                            meal={meal}
                            onUpdateMeal={handleUpdateMeal} 
                          />
                      ))}
                  </div>
                   <div className="text-center mt-4 pt-4 border-t">
                      <p className="text-sm text-muted-foreground">Total Calories</p>
                      <p className="text-xl font-bold text-primary">{dayPlan.totalCalories} kcal</p>
                  </div>
              </div>
          </div>
        ))}
    </div>
  )
}
