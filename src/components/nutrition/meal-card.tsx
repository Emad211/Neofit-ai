'use client';

import * as React from 'react';
import { CheckCircle, Eye, MoreVertical, Replace } from 'lucide-react';
import { CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { AlternativeMealDialog } from '@/components/nutrition/alternative-meal-dialog';
import { MealDetailsSheet } from '@/components/nutrition/meal-details-sheet';
import type { SuggestMealAlternativeOutput } from '@/ai/schemas';
import { useI18n } from '@/i18n/provider';
import { cn } from '@/lib/utils';

export interface Meal {
  id: string;
  type: string;
  name: string;
  calories: number;
  protein: number;
  carbohydrates: number;
  fat: number;
  ingredients: Array<{
    name: string;
    quantity: string;
    category: 'Produce' | 'Fruits' | 'Protein' | 'Dairy & Alternatives' | 'Pantry' | 'Other';
  }>;
}

export function MealCard({
  meal,
  isLogged,
  isToday,
  onUpdateMeal,
  onLogMeal,
}: {
  meal: Meal;
  isLogged: boolean;
  isToday: boolean;
  onUpdateMeal: (mealId: string, replacement: SuggestMealAlternativeOutput) => void;
  onLogMeal: (meal: Meal) => void;
}) {
  const [isDetailsOpen, setIsDetailsOpen] = React.useState(false);
  const [isReplaceOpen, setIsReplaceOpen] = React.useState(false);
  const { locale } = useI18n();
  const canLog = isToday && !isLogged;
  const label = (en: string, fa: string) => locale === 'fa' ? fa : en;

  const openDetails = () => {
    if (isToday && !isLogged) setIsDetailsOpen(true);
  };

  return (
    <>
      <div
        className={cn(
          'group relative overflow-hidden rounded-lg border bg-card shadow-sm transition-all hover:shadow-md',
          isLogged || !isToday ? 'bg-secondary/30 opacity-70' : 'cursor-pointer',
        )}
        onClick={openDetails}
        onKeyDown={(event) => {
          if (event.key === 'Enter' || event.key === ' ') {
            event.preventDefault();
            openDetails();
          }
        }}
        role="button"
        tabIndex={canLog ? 0 : -1}
        aria-label={label(`View details for ${meal.name}`, `مشاهده جزئیات ${meal.name}`)}
      >
        <CardContent className="flex min-h-36 h-full flex-col justify-between p-4">
          <div className="flex-grow pe-8">
            <p className="text-sm font-semibold text-primary">{meal.type}</p>
            <p className="text-base font-bold leading-tight">{meal.name}</p>
            {isLogged ? (
              <div className="mt-1 flex items-center gap-1 text-sm font-semibold text-emerald-600">
                <CheckCircle className="h-4 w-4" aria-hidden="true" />{label('Logged', 'ثبت‌شده')}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">{meal.calories} kcal · {Math.round(meal.protein || 0)}g {label('protein', 'پروتئین')}</p>
            )}
          </div>

          <div className="absolute end-2 top-2">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={(event) => event.stopPropagation()} aria-label={label('Meal actions', 'عملیات وعده')}>
                  <MoreVertical className="h-4 w-4" aria-hidden="true" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" onClick={(event) => event.stopPropagation()}>
                <DropdownMenuItem onClick={() => setIsDetailsOpen(true)}><Eye className="me-2 h-4 w-4" />{label('View details', 'مشاهده جزئیات')}</DropdownMenuItem>
                <DropdownMenuItem onClick={() => setIsReplaceOpen(true)}><Replace className="me-2 h-4 w-4" />{label('Replace meal', 'جایگزینی وعده')}</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          <div className="mt-2 flex justify-end">
            <Button
              size="sm"
              variant="outline"
              onClick={(event) => {
                event.stopPropagation();
                onLogMeal(meal);
              }}
              disabled={!canLog}
            >
              <CheckCircle className="me-2 h-4 w-4" />{label('Log', 'ثبت')}
            </Button>
          </div>
        </CardContent>
      </div>

      <MealDetailsSheet meal={meal} isOpen={isDetailsOpen} onOpenChange={setIsDetailsOpen} />
      <AlternativeMealDialog
        meal={meal}
        isOpen={isReplaceOpen}
        onOpenChange={setIsReplaceOpen}
        onSelectAlternative={(replacement) => onUpdateMeal(meal.id, replacement)}
      />
    </>
  );
}
