// src/components/nutrition/shopping-list.tsx
"use client"

import * as React from "react";
import { Checkbox } from "../ui/checkbox";
import { Leaf, Egg, Milk, Wheat, Apple as FruitIcon } from "lucide-react";
import { Skeleton } from "../ui/skeleton";
import { useUserData } from "@/context/user-profile-context";
import { cn } from "@/lib/utils";
import type { GenerateNutritionProgramOutput } from "@/ai/flows/generate-nutrition-program";

type DailyMealPlan = GenerateNutritionProgramOutput['weeklyMealPlan'][0];

type Ingredient = {
    name: string;
    quantity: string;
    category: string;
    unit?: string;
    totalAmount?: number;
};

const categoryIcons: { [key: string]: React.ElementType } = {
    "Produce": Leaf,
    "Fruits": FruitIcon,
    "Protein": Egg,
    "Dairy & Alternatives": Milk,
    "Pantry": Wheat,
};


function parseQuantity(quantityStr: string): { amount: number; unit?: string } {
    const quantity = quantityStr.toLowerCase().trim();
    
    // Handle fractions like "1/2", "1/4"
    const fractionMatch = quantity.match(/^(\d+)\/(\d+)/);
    if (fractionMatch) {
        const num = parseInt(fractionMatch[1], 10);
        const den = parseInt(fractionMatch[2], 10);
        if (den !== 0) {
            const amount = num / den;
            const unit = quantity.replace(fractionMatch[0], '').trim();
            return { amount, unit: unit || undefined };
        }
    }

    // Handle numbers like "1", "1.5", "0.5"
    const numberMatch = quantity.match(/^(\d*\.?\d+)/);
    if (numberMatch) {
        const amount = parseFloat(numberMatch[0]);
        const unit = quantity.replace(numberMatch[0], '').trim();
        return { amount, unit: unit || undefined };
    }
    
    // Fallback for non-numeric quantities like "a pinch"
    return { amount: 1, unit: quantity };
}


function aggregateIngredients(mealData: DailyMealPlan[]): { [key: string]: Ingredient[] } {
    const ingredientMap: { [key: string]: { quantities: { amount: number; unit?: string }[]; category: string } } = {};

    mealData.forEach(day => {
        day.meals.forEach(meal => {
            meal.ingredients.forEach(ingredient => {
                const key = ingredient.name.toLowerCase();
                if (!ingredientMap[key]) {
                    ingredientMap[key] = { quantities: [], category: ingredient.category };
                }
                ingredientMap[key].quantities.push(parseQuantity(ingredient.quantity));
            });
        });
    });
    
    const aggregated: { [key: string]: Ingredient[] } = {};
    Object.keys(ingredientMap).forEach(key => {
        const item = ingredientMap[key];
        const name = key.charAt(0).toUpperCase() + key.slice(1);

        const aggregatedQuantities: { [unit: string]: number } = {};

        item.quantities.forEach(q => {
            const unitKey = q.unit || 'count';
            if (!aggregatedQuantities[unitKey]) {
                aggregatedQuantities[unitKey] = 0;
            }
            aggregatedQuantities[unitKey] += q.amount;
        });

        const combinedQuantity = Object.entries(aggregatedQuantities)
            .map(([unit, amount]) => {
                // Round to 2 decimal places to handle float inaccuracies
                const roundedAmount = Math.round(amount * 100) / 100;
                if (unit === 'count') return `${roundedAmount} ${name.endsWith('s') ? '' : 's'}`.trim();
                // pluralize unit
                const pluralUnit = roundedAmount > 1 && !unit.endsWith('s') ? `${unit}s` : unit;
                return `${roundedAmount} ${pluralUnit}`;
            })
            .join(', ');
            
        if (!aggregated[item.category]) {
            aggregated[item.category] = [];
        }
        aggregated[item.category].push({ name, quantity: combinedQuantity, category: item.category });
    });
    
    // Sort categories
    const orderedCategories = ["Produce", "Fruits", "Protein", "Dairy & Alternatives", "Pantry"];
    const sortedAggregated: { [key: string]: Ingredient[] } = {};
    orderedCategories.forEach(category => {
        if(aggregated[category]) {
            sortedAggregated[category] = aggregated[category].sort((a,b) => a.name.localeCompare(b.name));
        }
    });

    // Add any other category that might not be in the ordered list
    Object.keys(aggregated).forEach(category => {
        if(!sortedAggregated[category]){
            sortedAggregated[category] = aggregated[category].sort((a,b) => a.name.localeCompare(b.name));
        }
    })

    return sortedAggregated;
}


const ShoppingListItem = ({ item, isChecked, onCheckedChange }: { item: Ingredient, isChecked: boolean, onCheckedChange: (checked: boolean) => void }) => {
    const handleItemClick = () => {
        onCheckedChange(!isChecked);
    };

    return (
        <div 
            onClick={handleItemClick}
            className={cn(
                "flex items-center space-x-4 rounded-lg border p-3 cursor-pointer transition-colors",
                isChecked ? "bg-secondary/50" : "bg-background"
            )}
        >
            <Checkbox 
                checked={isChecked}
                onCheckedChange={onCheckedChange}
                id={`item-${item.category}-${item.name}`} 
                className="h-6 w-6" 
            />
            <label
                htmlFor={`item-${item.category}-${item.name}`}
                className={cn(
                    "flex-1 text-base font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 transition-all",
                    isChecked && "line-through text-muted-foreground"
                )}
            >
                <span className="font-semibold text-foreground">{item.name}</span>
                <span className="text-muted-foreground ml-2">({item.quantity})</span>
            </label>
        </div>
    );
};


export function ShoppingList() {
    const { nutritionPlan, isLoading, shoppingListState, updateShoppingListState } = useUserData();
    const [shoppingList, setShoppingList] = React.useState<{ [key: string]: Ingredient[] } | null>(null);
    const [error, setError] = React.useState<string | null>(null);

    React.useEffect(() => {
        if (!isLoading) {
            if (nutritionPlan && nutritionPlan.length > 0) {
                const list = aggregateIngredients(nutritionPlan);
                setShoppingList(list);
            } else {
                setError("No nutrition plan found to generate a shopping list.");
            }
        }
    }, [nutritionPlan, isLoading]);
    
    const handleCheckedChange = (itemName: string, isChecked: boolean) => {
        const lowerCaseItemName = itemName.toLowerCase();
        const currentState = shoppingListState || {};
        const newState = { ...currentState, [lowerCaseItemName]: isChecked };
        updateShoppingListState(newState);
    };


    if (isLoading) {
        return (
             <div className="space-y-8 p-4">
                {[...Array(4)].map((_, i) => (
                    <div key={i} className="space-y-4">
                        <Skeleton className="h-6 w-32" />
                        <div className="space-y-3">
                           {[...Array(3)].map((_, j) => (
                                <Skeleton key={j} className="h-14 w-full rounded-lg" />
                           ))}
                        </div>
                    </div>
                ))}
            </div>
        )
    }

    if (error) {
        return <div className="text-center text-destructive p-8">{error}</div>;
    }
    
    if (!shoppingList || Object.keys(shoppingList).length === 0) {
        return <div className="text-center text-muted-foreground p-8">Your shopping list is empty.</div>;
    }

    return (
        <div className="space-y-8 p-4">
            {Object.entries(shoppingList).map(([category, items]) => {
                const Icon = categoryIcons[category] || Leaf;
                return (
                    <div key={category} className="space-y-4">
                        <h3 className="flex items-center gap-3 text-xl font-bold font-headline">
                            <Icon className="h-6 w-6 text-primary"/>
                            {category}
                        </h3>
                        <div className="space-y-3">
                            {items.map((item, index) => (
                                <ShoppingListItem 
                                    key={`${item.name}-${index}`} 
                                    item={item} 
                                    isChecked={shoppingListState?.[item.name.toLowerCase()] || false}
                                    onCheckedChange={(checked) => handleCheckedChange(item.name, checked)}
                                />
                            ))}
                        </div>
                    </div>
                )
            })}
        </div>
    );
}
