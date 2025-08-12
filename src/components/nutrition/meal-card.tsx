
"use client";

import * as React from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Menu, Eye, Replace, CheckCircle, Trash2, MoreVertical } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { AlternativeMealDialog } from './alternative-meal-dialog';
import { MealDetailsSheet } from './meal-details-sheet';
import { cn } from '@/lib/utils';

export interface Meal {
    id: string;
    type: string;
    name: string;
    calories: number;
    ingredients: { name: string; quantity: string; category: string }[];
}

interface MealCardProps {
    meal: Meal;
    isLogged: boolean;
    isToday: boolean;
    onUpdateMeal: (mealId: string, newMealName: string) => void;
    onLogMeal: (meal: Meal) => void;
}

export function MealCard({ meal, isLogged, isToday, onUpdateMeal, onLogMeal }: MealCardProps) {
    const [isDetailsOpen, setIsDetailsOpen] = React.useState(false);
    const [isReplaceOpen, setIsReplaceOpen] = React.useState(false);

    const handleLogAction = (e: React.MouseEvent) => {
        e.stopPropagation(); // Prevent the card's onClick from firing
        onLogMeal(meal);
    };
    
    const handleRemoveAction = (e: React.MouseEvent) => {
        e.stopPropagation();
        // This functionality could be implemented similarly to onLogMeal,
        // but for now, it's just a console log.
        console.log(`Removing from plan: ${meal.name}`);
    };

    const handleSelectAlternative = (newMealName: string) => {
        // Here we would also update the calories, image etc.
        // For now, we just update the name to show it's working.
        onUpdateMeal(meal.id, newMealName);
    }
    
    const openReplaceDialog = (e: React.MouseEvent) => {
        e.stopPropagation();
        setIsReplaceOpen(true);
    }

    const canLog = isToday && !isLogged;

  return (
    <>
        <div 
            className={cn(
                "overflow-hidden shadow-sm hover:shadow-md transition-all rounded-lg border bg-card",
                (isLogged || !isToday) ? "opacity-60 bg-secondary/30" : "cursor-pointer"
            )}
            onClick={() => (isToday && !isLogged) && setIsDetailsOpen(true)}
            onKeyDown={(e) => { if (e.key === 'Enter' && isToday && !isLogged) setIsDetailsOpen(true); }}
            role="button"
            tabIndex={isToday && !isLogged ? 0 : -1}
            aria-label={`View details for ${meal.name}`}
        >
            <CardContent className="p-4">
                <div className="flex justify-between items-center gap-4">
                    <div className="flex-grow">
                        <p className="font-semibold text-sm text-primary">{meal.type}</p>
                        <p className="font-bold text-base text-foreground leading-tight">{meal.name}</p>
                         {isLogged ? (
                            <div className="flex items-center gap-1 text-sm text-green-600 font-semibold mt-1">
                                <CheckCircle className="h-4 w-4" />
                                Logged
                            </div>
                        ) : (
                             <p className="text-sm text-muted-foreground">{meal.calories} kcal</p>
                        )}
                    </div>
                    <div className="flex items-center gap-1 flex-shrink-0">
                         <Button
                            size="sm"
                            variant="outline"
                            onClick={handleLogAction}
                            className="h-9 w-18"
                            disabled={!canLog}
                        >
                            <CheckCircle className="mr-2 h-4 w-4" />
                            Log
                        </Button>
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-9 w-9 flex-shrink-0"
                                        onClick={(e) => e.stopPropagation()} // Prevent card click
                                    >
                                        <MoreVertical className="h-4 w-4" />
                                    </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" onClick={(e) => e.stopPropagation()}>
                                <DropdownMenuItem onClick={openReplaceDialog}>
                                    <Replace className="mr-2 h-4 w-4" />
                                    <span>Replace Meal</span>
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={handleRemoveAction} className="text-destructive">
                                    <Trash2 className="mr-2 h-4 w-4" />
                                    <span>Remove from Plan</span>
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </div>
                </div>
            </CardContent>
        </div>

        <MealDetailsSheet 
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
