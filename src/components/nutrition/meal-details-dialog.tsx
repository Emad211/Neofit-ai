
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
        
        <div className="py-4">
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
      </DialogContent>
    </Dialog>
  );
}
