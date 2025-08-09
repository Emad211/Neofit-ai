
"use client"

import * as React from "react"
import Image from "next/image"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import type { Meal } from "./meal-card"
import { Checkbox } from "../ui/checkbox";
import { generateRecipe } from "@/ai/flows/generate-recipe";
import { Loader2 } from "lucide-react";
import { Skeleton } from "../ui/skeleton";
import { useUserData } from "@/context/user-profile-context"

type MealDetailsDialogProps = {
  meal: Meal | null;
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
};

const NutrientDisplay = ({ label, value, unit }: { label: string, value: number, unit: string }) => (
    <div className="text-center bg-secondary p-3 rounded-lg">
        <p className="text-sm text-muted-foreground">{label}</p>
        <p className="text-2xl font-bold text-primary">{value}<span className="text-sm text-primary/80">{unit}</span></p>
    </div>
);


export function MealDetailsDialog({ meal, isOpen, onOpenChange }: MealDetailsDialogProps) {
    const [recipe, setRecipe] = React.useState<string | null>(null);
    const [isLoadingRecipe, setIsLoadingRecipe] = React.useState(false);
    const [error, setError] = React.useState<string | null>(null);
    const { user, userProfile } = useUserData();

    React.useEffect(() => {
        if (isOpen && meal && user && userProfile) {
            const fetchRecipe = async () => {
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
            };
            fetchRecipe();
        }
    }, [isOpen, meal, user, userProfile]);

  if (!meal) return null;

  // Mock macros for display
  const macros = {
      protein: Math.round(meal.calories * 0.3 / 4), // 30% protein
      carbs: Math.round(meal.calories * 0.4 / 4), // 40% carbs
      fat: Math.round(meal.calories * 0.3 / 9), // 30% fat
  }

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <div className="relative w-full h-48 rounded-lg overflow-hidden mb-4">
              <Image src={meal.image} alt={meal.name} layout="fill" objectFit="cover" data-ai-hint={meal.dataAiHint} />
          </div>
          <DialogTitle className="text-2xl font-headline">{meal.name}</DialogTitle>
          <DialogDescription>{meal.calories} kcal · {meal.type}</DialogDescription>
        </DialogHeader>
        
        <div className="py-4 space-y-6 max-h-[60vh] overflow-y-auto pr-2">
            <div>
                <h3 className="font-semibold mb-3">Nutrition Info</h3>
                <div className="grid grid-cols-3 gap-4">
                    <NutrientDisplay label="Protein" value={macros.protein} unit="g" />
                    <NutrientDisplay label="Carbs" value={macros.carbs} unit="g" />
                    <NutrientDisplay label="Fat" value={macros.fat} unit="g" />
                </div>
            </div>

            <div>
                <h3 className="font-semibold mb-3">Ingredients</h3>
                <div className="space-y-2">
                {meal.ingredients.map((item, index) => (
                    <div key={index} className="flex items-center space-x-3 p-2 rounded-md bg-secondary/50">
                        <Checkbox id={`ing-${meal.id}-${index}`} />
                        <label
                            htmlFor={`ing-${meal.id}-${index}`}
                            className="flex-1 text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                        >
                            <span className="font-semibold text-foreground">{item.name}</span>
                            <span className="text-muted-foreground ml-2">({item.quantity})</span>
                        </label>
                    </div>
                ))}
                </div>
            </div>

             <div>
                <h3 className="font-semibold mb-3">Recipe Instructions</h3>
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
                        {recipe.split('\n').map((line, index) => (
                           <p key={index}>{line}</p>
                        ))}
                    </div>
                )}
            </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
