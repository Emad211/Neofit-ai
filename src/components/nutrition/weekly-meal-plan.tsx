
"use client"

import * as React from "react"
import { MealCard, Meal } from "./meal-card";
import { format } from 'date-fns';
import { Skeleton } from "../ui/skeleton";
import type { GenerateNutritionProgramOutput } from "@/ai/flows/generate-nutrition-program";

// Note: This component now relies on the meal plan being stored in localStorage
// after the onboarding analysis. In a real-world app, this would be fetched
// from a database.

type DailyMealPlan = GenerateNutritionProgramOutput['weeklyMealPlan'][0];

export function WeeklyMealPlan() {
  const [mealPlan, setMealPlan] = React.useState<DailyMealPlan[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    try {
      const storedPlan = localStorage.getItem('userNutritionPlan');
      if (storedPlan) {
        const parsedPlan = JSON.parse(storedPlan);
        // Add date objects to the plan
        const today = new Date();
        const planWithDates = parsedPlan.map((dayPlan: DailyMealPlan, index: number) => {
           const date = new Date();
           date.setDate(today.getDate() + index);
           return {
               ...dayPlan,
               date: date,
               meals: dayPlan.meals.map((meal: any, mealIndex: number) => ({
                   ...meal,
                   id: `${index}-${mealIndex}` // Ensure unique ID
               }))
           }
        });
        setMealPlan(planWithDates);
      } else {
        setError("No nutrition plan found. Please complete the onboarding process.");
      }
    } catch (e) {
      console.error("Failed to load or parse meal plan:", e);
      setError("Could not load your nutrition plan.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  const handleUpdateMeal = (mealIdToUpdate: string, newMealName: string) => {
    setMealPlan(currentPlan => {
      const updatedPlan = currentPlan.map(dayPlan => ({
        ...dayPlan,
        meals: dayPlan.meals.map((meal: Meal) => {
          if (meal.id === mealIdToUpdate) {
            return { ...meal, name: newMealName, calories: meal.calories + 50, image: 'https://placehold.co/600x400.png', dataAiHint: 'healthy food' };
          }
          return meal;
        }),
      }));
      // Persist the change back to localStorage
      localStorage.setItem('userNutritionPlan', JSON.stringify(updatedPlan.map(({date, ...rest}) => rest)));
      return updatedPlan;
    });
  };

  if (isLoading) {
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
  
  if (error) {
    return <div className="text-center text-destructive p-8">{error}</div>;
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
