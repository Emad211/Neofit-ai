
"use client"

import * as React from "react"
import { MealCard, Meal } from "./meal-card";
import { format, isToday as fnsIsToday } from 'date-fns';
import { Skeleton } from "../ui/skeleton";
import type { GenerateNutritionProgramOutput } from "@/ai/flows/generate-nutrition-program";
import { useUserData } from "@/context/user-profile-context";
import { useToast } from "@/hooks/use-toast";
import { Button } from "../ui/button";
import Link from "next/link";
import { Card } from "../ui/card";

type DailyMealPlan = GenerateNutritionProgramOutput['weeklyMealPlan'][number] & { date: Date };

export function WeeklyMealPlan() {
  const { nutritionPlan, savePlans, workoutPlan, isLoading, logMeal, loggedMealsState, updateLoggedMealsState } = useUserData();
  const [mealPlan, setMealPlan] = React.useState<DailyMealPlan[]>([]);
  const [error, setError] = React.useState<string | null>(null);
  const { toast } = useToast();

  React.useEffect(() => {
    if (!isLoading) {
        if (nutritionPlan && nutritionPlan.length > 0) {
            // Add date objects to the plan for display purposes
            const today = new Date();
            const planWithDates = nutritionPlan.map((dayPlan: any, index: number) => {
                const date = new Date(today);
                date.setDate(today.getDate() + index);
                return {
                    ...dayPlan,
                    date: date,
                    meals: dayPlan.meals.map((meal: any, mealIndex: number) => ({
                        ...meal,
                        // Create a consistent, date-agnostic ID
                        id: `${dayPlan.day}-${meal.name.replace(/\s+/g, '-')}-${mealIndex}`
                    }))
                }
            });
            setMealPlan(planWithDates);
        } else {
             setError("No nutrition plan found.");
        }
    }
  }, [nutritionPlan, isLoading]);
  
  const handleLogMeal = async (mealToLog: Meal) => {
    try {
        await logMeal({
            mealType: mealToLog.type.toLowerCase() as any,
            description: mealToLog.name,
            calories: mealToLog.calories,
        });

        // Add the meal's ID to the logged meals state
        await updateLoggedMealsState([...(loggedMealsState || []), mealToLog.id]);

        toast({
            title: "Meal Logged!",
            description: `${mealToLog.name} has been successfully logged as eaten.`,
        });

    } catch (error) {
        console.error("Failed to log meal:", error);
        toast({
            variant: "destructive",
            title: "Logging Failed",
            description: "There was a problem logging your meal. Please try again.",
        });
    }
  };


  const handleUpdateMeal = (mealIdToUpdate: string, newMealName: string) => {
    setMealPlan(currentPlan => {
      const updatedPlan = currentPlan.map(dayPlan => ({
        ...dayPlan,
        meals: dayPlan.meals.map((meal: Meal) => {
          if (meal.id === mealIdToUpdate) {
            // Note: This only updates the local state for now.
            // A more robust solution would regenerate the meal details.
            return { ...meal, name: newMealName, calories: meal.calories + 50 };
          }
          return meal;
        }),
      }));
      
      // Persist the change back to Firestore
      const planToSave = updatedPlan.map(({ date, ...rest }) => rest);
      if(workoutPlan) {
          savePlans({ nutritionPlan: planToSave, workoutPlan });
      }

      return updatedPlan;
    });
  };

  if (isLoading) {
      return (
          <div className="w-full grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {[...Array(4)].map((_, i) => (
                  <Card key={i} className="p-4 h-full space-y-4">
                      <div className="text-center mb-4 space-y-2">
                          <Skeleton className="h-6 w-24 mx-auto" />
                          <Skeleton className="h-4 w-32 mx-auto" />
                      </div>
                      <div className="space-y-4 flex-grow">
                          {[...Array(3)].map((_, j) => (
                              <Card key={j} className="p-3">
                                  <div className="flex justify-between items-center gap-4">
                                      <div className="flex-grow space-y-2">
                                           <Skeleton className="h-4 w-1/4" />
                                           <Skeleton className="h-5 w-3/4" />
                                           <Skeleton className="h-4 w-1/2" />
                                      </div>
                                       <div className="flex-shrink-0">
                                           <Skeleton className="h-9 w-16" />
                                       </div>
                                  </div>
                              </Card>
                          ))}
                      </div>
                       <div className="text-center mt-2 space-y-1">
                          <Skeleton className="h-4 w-24 mx-auto" />
                          <Skeleton className="h-6 w-16 mx-auto" />
                      </div>
                  </Card>
              ))}
          </div>
      )
  }
  
  if (error) {
    return (
        <Card className="col-span-full flex flex-col items-center justify-center p-12 text-center">
            <h3 className="text-xl font-semibold">No Nutrition Plan Available</h3>
            <p className="text-muted-foreground mt-2">
                It seems you don't have a nutrition plan yet.
            </p>
            <Button asChild className="mt-4">
                <Link href="/profile/edit">
                    Create a New Plan
                </Link>
            </Button>
        </Card>
    )
  }


  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {mealPlan.map((dayPlan, index) => {
          const isToday = fnsIsToday(dayPlan.date);
          
          return (
          <Card key={index} className="p-4 flex flex-col">
              <div className="text-center mb-4">
                  <p className="text-lg font-bold font-headline">{dayPlan.day}</p>
                  <p className="text-sm text-muted-foreground">{format(dayPlan.date, 'do MMMM')}</p>
              </div>
              <div className="space-y-4 flex-grow">
                  {dayPlan.meals.map((meal: Meal) => {
                      const isLogged = (loggedMealsState || []).includes(meal.id);
                      return (
                      <MealCard 
                        key={meal.id} 
                        meal={meal}
                        isLogged={isLogged}
                        isToday={isToday}
                        onUpdateMeal={handleUpdateMeal} 
                        onLogMeal={handleLogMeal}
                      />
                      )
                  })}
              </div>
               <div className="text-center mt-4 pt-2">
                  <p className="text-sm text-muted-foreground">Total Calories</p>
                  <p className="text-xl font-bold text-primary">{dayPlan.totalCalories} kcal</p>
              </div>
          </Card>
          )
        })}
    </div>
  )
}
