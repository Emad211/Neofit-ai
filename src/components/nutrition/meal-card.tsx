
"use client";

import * as React from 'react';
import Image from "next/image";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Menu, Eye, Replace, CheckCircle, Trash2 } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { AlternativeMealDialog } from './alternative-meal-dialog';
import { MealDetailsDialog } from './meal-details-dialog';

export interface Meal {
    id: string;
    type: string;
    name: string;
    calories: number;
    image: string;
    dataAiHint: string;
    ingredients: { name: string; quantity: string; category: string }[];
}

interface MealCardProps {
    meal: Meal;
    onUpdateMeal: (mealId: string, newMealName: string) => void;
    onLogMeal: (meal: Meal) => void;
}

export function MealCard({ meal, onUpdateMeal, onLogMeal }: MealCardProps) {
    const [isDetailsOpen, setIsDetailsOpen] = React.useState(false);
    const [isReplaceOpen, setIsReplaceOpen] = React.useState(false);

    const handleLogAction = () => {
        onLogMeal(meal);
    };
    
    const handleRemoveAction = () => {
        // This functionality could be implemented similarly to onLogMeal,
        // but for now, it's just a console log.
        console.log(`Removing from plan: ${meal.name}`);
    };

    const handleSelectAlternative = (newMealName: string) => {
        // Here we would also update the calories, image etc.
        // For now, we just update the name to show it's working.
        onUpdateMeal(meal.id, newMealName);
    }

  return (
    <>
        <Card className="overflow-hidden shadow-none border-0 bg-secondary/50">
            <div className="flex items-center">
                <div className="w-24 h-24 relative flex-shrink-0">
                    <Image
                        src={meal.image}
                        alt={meal.name}
                        fill
                        className="object-cover"
                        data-ai-hint={meal.dataAiHint}
                    />
                </div>
                <CardContent className="p-3 flex-grow">
                    <div className="flex justify-between items-start">
                        <div>
                            <p className="font-semibold text-sm text-primary">{meal.type}</p>
                            <p className="font-bold text-base text-foreground">{meal.name}</p>
                            <p className="text-sm text-muted-foreground">{meal.calories} kcal</p>
                        </div>
                         <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                 <Button variant="ghost" size="icon" className="h-8 w-8 flex-shrink-0">
                                    <Menu className="h-4 w-4" />
                                 </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={() => setIsDetailsOpen(true)}>
                                    <Eye className="mr-2 h-4 w-4" />
                                    <span>View Details</span>
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => setIsReplaceOpen(true)}>
                                    <Replace className="mr-2 h-4 w-4" />
                                    <span>Replace Meal</span>
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={handleLogAction}>
                                    <CheckCircle className="mr-2 h-4 w-4" />
                                    <span>Log as Eaten</span>
                                </DropdownMenuItem>
                                 <DropdownMenuItem onClick={handleRemoveAction} className="text-destructive">
                                    <Trash2 className="mr-2 h-4 w-4" />
                                    <span>Remove</span>
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </div>
                </CardContent>
            </div>
        </Card>

        <MealDetailsDialog 
            meal={meal}
            isOpen={isDetailsOpen}
            onOpenChange={setIsDetailsOpen}
        />
        <AlternativeMealDialog 
            meal={meal}
            isOpen={isReplaceOpen}
            onOpenChange={setIsReplaceOpen}
            onSelectAlternative={handleSelectAlternative}
        />
    </>
  );
}
