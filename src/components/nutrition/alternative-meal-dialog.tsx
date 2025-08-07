
"use client"

import * as React from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import { Button } from "../ui/button"
import { Loader2, RefreshCw } from "lucide-react"
import { suggestMealAlternative } from "@/ai/flows/suggest-meal-alternative"
import { Card, CardContent } from "../ui/card"
import type { Meal } from "./meal-card"

type AlternativeMealDialogProps = {
  meal: Meal;
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  onSelectAlternative: (newMealName: string) => void;
};

export function AlternativeMealDialog({
  meal,
  isOpen,
  onOpenChange,
  onSelectAlternative,
}: AlternativeMealDialogProps) {
  const [isLoading, setIsLoading] = React.useState(false);
  const [alternative, setAlternative] = React.useState<{ alternativeMeal: string } | null>(null);
  const [error, setError] = React.useState<string | null>(null);

  const fetchAlternative = React.useCallback(async () => {
    setIsLoading(true);
    setError(null);
    setAlternative(null);
    try {
      const result = await suggestMealAlternative({
        userId: "12345", // In a real app, use the actual user ID
        mealId: meal.name,
        context: `User is looking for an alternative to ${meal.name}. The original meal has around ${meal.calories} calories. Suggest something similar.`,
      });
      setAlternative(result);
    } catch (e) {
      console.error(e);
      setError("Could not fetch an alternative meal. Please try again.");
    } finally {
      setIsLoading(false);
    }
  }, [meal]);
  
  React.useEffect(() => {
    if (isOpen) {
        fetchAlternative();
    }
  }, [isOpen, fetchAlternative]);

  const handleReplace = () => {
    if (alternative) {
        onSelectAlternative(alternative.alternativeMeal);
        onOpenChange(false);
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Alternative Meal Suggestion</DialogTitle>
          <DialogDescription>
            Here is a smart suggestion to replace {meal.name}.
          </DialogDescription>
        </DialogHeader>
        <div className="py-4 min-h-[10rem] flex items-center justify-center">
            {isLoading && (
                <div className="flex items-center justify-center h-24">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
            )}
            {error && <p className="text-destructive text-center">{error}</p>}
            {alternative && (
                <Card>
                    <CardContent className="p-4 text-center">
                        <h3 className="font-bold text-lg text-primary">{alternative.alternativeMeal}</h3>
                        <p className="text-sm text-muted-foreground mt-2">This meal has a similar nutritional profile and fits your goals.</p>
                    </CardContent>
                </Card>
            )}
        </div>
        <DialogFooter>
            <Button variant="secondary" onClick={fetchAlternative} disabled={isLoading}>
                <RefreshCw className="mr-2 h-4 w-4" />
                Suggest Another
            </Button>
            <Button onClick={handleReplace} disabled={!alternative}>
                Replace Meal
            </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
