'use client';

import * as React from 'react';
import { Loader2, Sparkles } from 'lucide-react';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { Checkbox } from '@/components/ui/checkbox';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { generateRecipe } from '@/ai/flows/generate-recipe';
import type { Meal } from '@/components/nutrition/meal-card';
import { useUserData } from '@/context/user-profile-context';
import { useI18n } from '@/i18n/provider';
import { cn } from '@/lib/utils';

function NutrientDisplay({ label, value, unit }: { label: string; value: number; unit: string }) {
  return <div className="flex-1 rounded-lg bg-secondary p-3 text-center"><p className="text-sm text-muted-foreground">{label}</p><p className="text-2xl font-bold text-primary">{Math.round(value)}<span className="ms-1 text-sm text-primary/80">{unit}</span></p></div>;
}

export function MealDetailsSheet({
  meal,
  isOpen,
  onOpenChange,
}: {
  meal: Meal | null;
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
}) {
  const [recipe, setRecipe] = React.useState<string | null>(null);
  const [isLoadingRecipe, setIsLoadingRecipe] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const { user, checkedIngredientsState, updateCheckedIngredientsState } = useUserData();
  const { locale, t } = useI18n();
  const label = (en: string, fa: string) => locale === 'fa' ? fa : en;

  const fetchRecipe = React.useCallback(async () => {
    if (!meal || !user) return;
    setIsLoadingRecipe(true);
    setError(null);
    setRecipe(null);
    try {
      const result = await generateRecipe({ mealName: meal.name, ingredients: meal.ingredients, locale });
      setRecipe(result.recipe);
    } catch (caught) {
      console.error('Recipe generation failed:', caught);
      setError(label('A recipe could not be generated right now.', 'در حال حاضر دستور پخت ساخته نشد.'));
    } finally {
      setIsLoadingRecipe(false);
    }
  }, [label, locale, meal, user]);

  React.useEffect(() => {
    if (isOpen && meal && !recipe && !isLoadingRecipe && !error) void fetchRecipe();
  }, [error, fetchRecipe, isLoadingRecipe, isOpen, meal, recipe]);

  const changeOpen = (open: boolean) => {
    onOpenChange(open);
    if (!open) {
      setRecipe(null);
      setError(null);
      setIsLoadingRecipe(false);
    }
  };

  if (!meal) return null;

  return (
    <Sheet open={isOpen} onOpenChange={changeOpen}>
      <SheetContent side="bottom" className="flex h-[90vh] w-full flex-col">
        <SheetHeader className="border-b p-4">
          <SheetTitle className="font-headline text-2xl">{meal.name}</SheetTitle>
          <SheetDescription>{meal.calories} kcal · {meal.type}</SheetDescription>
        </SheetHeader>
        <ScrollArea className="flex-grow">
          <div className="space-y-6 p-4">
            <section>
              <h3 className="mb-3 text-lg font-semibold">{label('Nutrition information', 'اطلاعات تغذیه‌ای')}</h3>
              <div className="grid grid-cols-3 gap-3">
                <NutrientDisplay label={t('today.protein')} value={meal.protein || 0} unit="g" />
                <NutrientDisplay label={label('Carbs', 'کربوهیدرات')} value={meal.carbohydrates || 0} unit="g" />
                <NutrientDisplay label={label('Fat', 'چربی')} value={meal.fat || 0} unit="g" />
              </div>
            </section>

            <section>
              <h3 className="mb-3 text-lg font-semibold">{label('Ingredients', 'مواد اولیه')}</h3>
              <div className="space-y-3">
                {meal.ingredients.map((item, index) => {
                  const checked = checkedIngredientsState?.[meal.id]?.[item.name] || false;
                  const id = `ingredient-${meal.id}-${index}`;
                  return (
                    <label key={id} htmlFor={id} className={cn('flex cursor-pointer items-center gap-4 rounded-lg border p-3 transition-colors', checked ? 'border-primary bg-primary/20' : 'bg-secondary/50')}>
                      <Checkbox id={id} className="h-6 w-6" checked={checked} onCheckedChange={(value) => void updateCheckedIngredientsState(meal.id, item.name, Boolean(value))} />
                      <span className={cn('flex-1 text-base font-medium', checked && 'text-muted-foreground line-through')}><span className="font-semibold text-foreground">{item.name}</span><span className="ms-2 text-muted-foreground">({item.quantity})</span></span>
                    </label>
                  );
                })}
              </div>
            </section>

            <section>
              <div className="mb-3 flex items-center justify-between gap-3">
                <h3 className="text-lg font-semibold">{label('Recipe instructions', 'دستور پخت')}</h3>
                <Button variant="ghost" size="sm" onClick={() => void fetchRecipe()} disabled={isLoadingRecipe}>
                  <Sparkles className="me-2 h-4 w-4" />{label('Regenerate', 'ساخت دوباره')}
                </Button>
              </div>
              <Alert className="mb-4"><AlertDescription>{label('Check ingredient labels for allergens and follow normal food-safety practices.', 'برای حساسیت‌ها برچسب مواد را بررسی کنید و اصول ایمنی غذا را رعایت کنید.')}</AlertDescription></Alert>
              {isLoadingRecipe && <div className="space-y-4"><Skeleton className="h-4 w-full" /><Skeleton className="h-4 w-full" /><Skeleton className="h-4 w-3/4" /></div>}
              {error && <p className="text-sm text-destructive">{error}</p>}
              {recipe && <div className="whitespace-pre-wrap text-sm leading-7">{recipe}</div>}
              {!recipe && !isLoadingRecipe && error && <Button variant="outline" className="mt-3" onClick={() => void fetchRecipe()}><Loader2 className="hidden" />{t('common.retry')}</Button>}
            </section>
          </div>
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
}
