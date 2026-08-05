"use client";

import * as React from "react";
import { ChefHat } from "lucide-react";
import { buildLocalRecipe } from "@/lib/neofit-demo-data";
import type { Meal } from "@/lib/neofit-models";
import { useUserData } from "@/context/user-profile-context";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";

export function MealDetailsSheet({ meal, isOpen, onOpenChange }: { meal: Meal | null; isOpen: boolean; onOpenChange: (open: boolean) => void }) {
  const { checkedIngredientsState, updateCheckedIngredientsState } = useUserData();
  if (!meal) return null;

  const checked = checkedIngredientsState?.[meal.id] || {};
  const recipe = buildLocalRecipe(meal);

  return (
    <Sheet open={isOpen} onOpenChange={onOpenChange}>
      <SheetContent dir="rtl" className="w-full sm:max-w-lg">
        <SheetHeader className="text-right">
          <SheetTitle>{meal.name}</SheetTitle>
          <SheetDescription>{meal.type} · حدود {meal.calories} کیلوکالری</SheetDescription>
        </SheetHeader>
        <ScrollArea className="mt-6 h-[calc(100vh-130px)] pl-3">
          <section className="space-y-3">
            <h3 className="font-bold">مواد لازم</h3>
            {meal.ingredients.map((ingredient) => (
              <label key={ingredient.name} className="flex cursor-pointer items-center gap-3 rounded-lg border p-3">
                <Checkbox checked={Boolean(checked[ingredient.name])} onCheckedChange={(value) => updateCheckedIngredientsState(meal.id, ingredient.name, Boolean(value))} />
                <span className="flex-1">{ingredient.name}</span>
                <span className="text-sm text-muted-foreground">{ingredient.quantity}</span>
              </label>
            ))}
          </section>
          <section className="mt-8 rounded-xl bg-secondary/50 p-5">
            <h3 className="flex items-center gap-2 font-bold"><ChefHat className="h-5 w-5 text-primary" />راهنمای آماده‌سازی</h3>
            <p className="mt-3 whitespace-pre-line text-sm leading-7 text-muted-foreground">{recipe}</p>
          </section>
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
}
