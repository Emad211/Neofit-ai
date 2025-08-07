
// src/components/nutrition/shopping-list.tsx
"use client"

import * as React from "react";
import { getMealPlan } from "@/lib/data/static-meal-data";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Checkbox } from "../ui/checkbox";
import { Leaf, Egg, Milk, Wheat, Apple as FruitIcon } from "lucide-react";
import { Skeleton } from "../ui/skeleton";
import type { Meal } from './meal-card';

type Ingredient = {
    name: string;
    quantity: string;
    category: string;
};

type DayPlan = {
    meals: Meal[];
};

const categoryIcons: { [key: string]: React.ElementType } = {
    "Produce": Leaf,
    "Fruits": FruitIcon,
    "Protein": Egg,
    "Dairy & Alternatives": Milk,
    "Pantry": Wheat,
};

function aggregateIngredients(mealData: DayPlan[]): { [key: string]: Ingredient[] } {
    const ingredientMap: { [key: string]: { quantity: string[]; category: string } } = {};

    mealData.forEach(day => {
        day.meals.forEach(meal => {
            meal.ingredients.forEach(ingredient => {
                const key = ingredient.name.toLowerCase();
                if (!ingredientMap[key]) {
                    ingredientMap[key] = { quantity: [], category: ingredient.category };
                }
                ingredientMap[key].quantity.push(ingredient.quantity);
            });
        });
    });

    const aggregated: { [key: string]: Ingredient[] } = {};
    Object.keys(ingredientMap).forEach(key => {
        const item = ingredientMap[key];
        const combinedQuantity = item.quantity.join(', '); // Simple aggregation for now
        const name = key.charAt(0).toUpperCase() + key.slice(1); // Capitalize first letter

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

export function ShoppingList() {
    const [shoppingList, setShoppingList] = React.useState<{ [key: string]: Ingredient[] } | null>(null);

    React.useEffect(() => {
        // Simulate fetching and processing
        setTimeout(() => {
            const currentMealPlan = getMealPlan();
            const list = aggregateIngredients(currentMealPlan);
            setShoppingList(list);
        }, 500);
    }, []);

    if (!shoppingList) {
        return (
             <div className="space-y-6">
                {[...Array(4)].map((_, i) => (
                    <Card key={i}>
                        <CardHeader>
                            <Skeleton className="h-6 w-32" />
                        </CardHeader>
                        <CardContent className="space-y-4">
                           {[...Array(3)].map((_, j) => (
                                <div key={j} className="flex items-center space-x-3">
                                    <Skeleton className="h-5 w-5 rounded" />
                                    <div className="flex-1">
                                        <Skeleton className="h-5 w-full" />
                                    </div>
                                </div>
                           ))}
                        </CardContent>
                    </Card>
                ))}
            </div>
        )
    }

    return (
        <div className="space-y-6">
            {Object.entries(shoppingList).map(([category, items]) => {
                const Icon = categoryIcons[category] || Leaf;
                return (
                    <Card key={category}>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2 font-headline text-xl">
                                <Icon className="h-5 w-5 text-primary"/>
                                {category}
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-3">
                                {items.map((item, index) => (
                                    <div key={index} className="flex items-center space-x-3">
                                        <Checkbox id={`item-${category}-${index}`} />
                                        <label
                                            htmlFor={`item-${category}-${index}`}
                                            className="flex-1 text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                                        >
                                            <span className="font-semibold text-foreground">{item.name}</span>
                                            <span className="text-muted-foreground ml-2">({item.quantity})</span>
                                        </label>
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                )
            })}
        </div>
    );
}
