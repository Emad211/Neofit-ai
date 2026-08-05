"use client";

import * as React from "react";
import { Apple, Egg, Leaf, Milk, Wheat } from "lucide-react";
import type { MealIngredient } from "@/lib/neofit-models";
import { useUserData } from "@/context/user-profile-context";
import { Checkbox } from "@/components/ui/checkbox";
import { Skeleton } from "@/components/ui/skeleton";

const iconForCategory = (category: string) => {
  if (category.includes("لبنی")) return Milk;
  if (category.includes("پروتئین") || category.includes("گوشت")) return Egg;
  if (category.includes("میوه")) return Apple;
  if (category.includes("غلات") || category.includes("نان")) return Wheat;
  return Leaf;
};

export function ShoppingList() {
  const { nutritionPlan, shoppingListState, updateShoppingListState, isLoading } = useUserData();

  const ingredients = React.useMemo(() => {
    const unique = new Map<string, MealIngredient>();
    for (const day of nutritionPlan || []) {
      for (const meal of day.meals) {
        for (const ingredient of meal.ingredients) {
          const key = ingredient.name.trim();
          if (!unique.has(key)) unique.set(key, ingredient);
        }
      }
    }
    return [...unique.values()];
  }, [nutritionPlan]);

  if (isLoading) return <div className="space-y-3">{[0, 1, 2, 3].map((item) => <Skeleton key={item} className="h-14 w-full" />)}</div>;

  return (
    <div dir="rtl" className="space-y-3 pb-8">
      {ingredients.map((ingredient) => {
        const checked = Boolean(shoppingListState?.[ingredient.name]);
        const Icon = iconForCategory(ingredient.category);
        return (
          <label key={ingredient.name} className="flex cursor-pointer items-center gap-3 rounded-xl border bg-card p-4">
            <Checkbox checked={checked} onCheckedChange={(value) => updateShoppingListState({ ...(shoppingListState || {}), [ingredient.name]: Boolean(value) })} />
            <Icon className="h-5 w-5 text-primary" />
            <span className={checked ? "flex-1 line-through opacity-60" : "flex-1"}>{ingredient.name}</span>
            <span className="text-sm text-muted-foreground">{ingredient.quantity}</span>
          </label>
        );
      })}
    </div>
  );
}
