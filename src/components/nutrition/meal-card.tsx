"use client";

import * as React from "react";
import { CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle, Eye, MoreVertical, Replace } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { AlternativeMealDialog } from "./alternative-meal-dialog";
import { MealDetailsSheet } from "./meal-details-sheet";
import { cn } from "@/lib/utils";

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
  const canLog = isToday && !isLogged;

  const handleLogAction = (event: React.MouseEvent) => {
    event.stopPropagation();
    if (canLog) onLogMeal(meal);
  };

  const openReplaceDialog = (event?: React.MouseEvent) => {
    event?.stopPropagation();
    setIsReplaceOpen(true);
  };

  return (
    <>
      <div
        className={cn(
          "group relative overflow-hidden rounded-2xl border bg-card shadow-sm transition-all hover:shadow-md",
          isLogged && "border-emerald-500/30 bg-emerald-500/5",
        )}
        onClick={() => setIsDetailsOpen(true)}
        onKeyDown={(event) => { if (event.key === "Enter" || event.key === " ") { event.preventDefault(); setIsDetailsOpen(true); } }}
        role="button"
        tabIndex={0}
        aria-label={`مشاهده جزئیات ${meal.name}`}
      >
        <CardContent className="flex min-h-[150px] h-full flex-col justify-between p-4">
          <div className="pl-9">
            <p className="text-sm font-bold text-primary">{meal.type}</p>
            <p className="mt-1 text-base font-black leading-6 text-foreground">{meal.name}</p>
            <p className="mt-1 text-sm text-muted-foreground">حدود {meal.calories.toLocaleString("fa-IR")} کیلوکالری</p>
            <p className="mt-1 text-xs text-muted-foreground">{meal.ingredients.length.toLocaleString("fa-IR")} ماده غذایی</p>
            {isLogged ? <div className="mt-2 inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2.5 py-1 text-xs font-bold text-emerald-700 dark:text-emerald-300"><CheckCircle className="h-3.5 w-3.5" />ثبت‌شده</div> : null}
          </div>

          <div className="absolute left-2 top-2">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={(event) => event.stopPropagation()} aria-label={`گزینه‌های ${meal.name}`}><MoreVertical className="h-4 w-4" /></Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="text-right" onClick={(event) => event.stopPropagation()}>
                <DropdownMenuItem onClick={() => setIsDetailsOpen(true)}><Eye className="ml-2 h-4 w-4" />مشاهده جزئیات</DropdownMenuItem>
                <DropdownMenuItem onClick={() => setIsReplaceOpen(true)}><Replace className="ml-2 h-4 w-4" />جایگزینی وعده</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          <div className="mt-3 flex items-center justify-between gap-2">
            <Button type="button" size="sm" variant="ghost" onClick={(event) => { event.stopPropagation(); setIsDetailsOpen(true); }}><Eye className="ml-2 h-4 w-4" />جزئیات</Button>
            <div className="flex gap-2">
              <Button type="button" size="sm" variant="outline" onClick={openReplaceDialog}><Replace className="ml-2 h-4 w-4" />جایگزین</Button>
              <Button type="button" size="sm" onClick={handleLogAction} disabled={!canLog}><CheckCircle className="ml-2 h-4 w-4" />{isLogged ? "ثبت شد" : isToday ? "ثبت وعده" : "روز دیگر"}</Button>
            </div>
          </div>
        </CardContent>
      </div>

      <MealDetailsSheet meal={meal} isOpen={isDetailsOpen} onOpenChange={setIsDetailsOpen} />
      <AlternativeMealDialog meal={meal} isOpen={isReplaceOpen} onOpenChange={setIsReplaceOpen} onSelectAlternative={(name) => onUpdateMeal(meal.id, name)} />
    </>
  );
}
