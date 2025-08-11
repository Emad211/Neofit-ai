
"use client"

import * as React from "react"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import type { Meal } from "./meal-card"
import { Checkbox } from "../ui/checkbox";
import { generateRecipe } from "@/ai/flows/generate-recipe";
import { Loader2, Sparkles } from "lucide-react";
import { Skeleton } from "../ui/skeleton";
import { useUserData } from "@/context/user-profile-context"
import { ScrollArea } from "../ui/scroll-area";
import { Button } from "../ui/button";

type MealDetailsSheetProps = {
  meal: Meal | null;
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
};

const NutrientDisplay = ({ label, value, unit }: { label: string, value: number, unit: string }) => (
    <div className="text-center bg-secondary p-3 rounded-lg flex-1">
        <p className="text-sm text-muted-foreground">{label}</p>
        <p className="text-2xl font-bold text-primary">{value}<span className="text-sm text-primary/80">{unit}</span></p>
    </div>
);


export function MealDetailsSheet({ meal, isOpen, onOpenChange }: MealDetailsSheetProps) {
    const [recipe, setRecipe] = React.useState<string | null>(null);
    const [isLoadingRecipe, setIsLoadingRecipe] = React.useState(false);
    const [error, setError] = React.useState<string | null>(null);
    const { user, userProfile } = useUserData();

    const fetchRecipe = React.useCallback(async () => {
        if (!meal || !user || !userProfile) return;
        setIsLoadingRecipe(true);
        setError(null);
        setRecipe(null);
        try {
            const result = await generateRecipe({
                userId: user.uid,
                mealName: meal.name,
                ingredients: meal.ingredients,
                geminiApiKey: userProfile.geminiApiKey,
            });
            setRecipe(result.recipe);
        } catch (e) {
            console.error(e);
            setError("Could not generate a recipe at this time. Please try again later.");
        } finally {
            setIsLoadingRecipe(false);
        }
    }, [meal, user, userProfile]);

    React.useEffect(() => {
        if (isOpen && meal && !recipe && !isLoadingRecipe) {
            fetchRecipe();
        }
    }, [isOpen, meal, recipe, isLoadingRecipe, fetchRecipe]);

    const handleOpenChange = (open: boolean) => {
        onOpenChange(open);
        if (!open) {
            // Reset state when sheet is closed for next time
            setRecipe(null);
            setError(null);
            setIsLoadingRecipe(false);
        }
    };


  if (!meal) return null;

  // Mock macros for display
  const macros = {
      protein: Math.round(meal.calories * 0.3 / 4), // 30% protein
      carbs: Math.round(meal.calories * 0.4 / 4), // 40% carbs
      fat: Math.round(meal.calories * 0.3 / 9), // 30% fat
  }

  return (
    <Sheet open={isOpen} onOpenChange={handleOpenChange}>
      <SheetContent side="bottom" className="w-full h-[90vh] flex flex-col">
        <SheetHeader className="p-4 border-b">
          <SheetTitle className="text-2xl font-headline">{meal.name}</SheetTitle>
          <SheetDescription>{meal.calories} kcal · {meal.type}</SheetDescription>
        </SheetHeader>
        
        <ScrollArea className="flex-grow">
           <div className="p-4 space-y-6">
                 <div>
                    <h3 className="font-semibold mb-3 text-lg">Nutrition Info</h3>
                    <div className="flex gap-4">
                        <NutrientDisplay label="Protein" value={macros.protein} unit="g" />
                        <NutrientDisplay label="Carbs" value={macros.carbs} unit="g" />
                        <NutrientDisplay label="Fat" value={macros.fat} unit="g" />
                    </div>
                </div>

                <div>
                    <h3 className="font-semibold mb-3 text-lg">Ingredients</h3>
                    <div className="space-y-3">
                    {meal.ingredients.map((item, index) => (
                        <div key={index} className="flex items-center space-x-4 rounded-lg bg-secondary/50 border p-3 cursor-pointer has-[:checked]:bg-primary/20 has-[:checked]:border-primary">
                             <Checkbox id={`ing-${meal.id}-${index}`} className="h-6 w-6" />
                            <label
                                htmlFor={`ing-${meal.id}-${index}`}
                                className="flex-1 text-base font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                            >
                                <span className="font-semibold text-foreground">{item.name}</span>
                                <span className="text-muted-foreground ml-2">({item.quantity})</span>
                            </label>
                        </div>
                    ))}
                    </div>
                </div>

                <div>
                    <div className="flex justify-between items-center mb-3">
                        <h3 className="font-semibold text-lg">Recipe Instructions</h3>
                         <Button variant="ghost" size="sm" onClick={fetchRecipe} disabled={isLoadingRecipe}>
                            <Sparkles className="mr-2 h-4 w-4" />
                            Regenerate
                        </Button>
                    </div>
                    {isLoadingRecipe && (
                        <div className="space-y-4">
                            <Skeleton className="h-4 w-full" />
                            <Skeleton className="h-4 w-full" />
                            <Skeleton className="h-4 w-3/4" />
                            <Skeleton className="h-4 w-full" />
                        </div>
                    )}
                    {error && <p className="text-destructive text-sm">{error}</p>}
                    {recipe && (
                        <div className="prose prose-sm dark:prose-invert whitespace-pre-wrap">
                            {recipe.split('\\n').map((line, index) => (
                            <p key={index} className="mb-2">{line.replace(/^\d+\.\s*/, (match) => `\n\n**${match.trim()}** `).trim()}</p>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
}
