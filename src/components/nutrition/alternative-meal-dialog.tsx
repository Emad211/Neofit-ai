'use client';

import * as React from 'react';
import { Loader2, RefreshCw } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { suggestMealAlternative } from '@/ai/flows/suggest-meal-alternative';
import type { SuggestMealAlternativeOutput } from '@/ai/schemas';
import type { Meal } from '@/components/nutrition/meal-card';
import { useUserData } from '@/context/user-profile-context';
import { useI18n } from '@/i18n/provider';

export function AlternativeMealDialog({
  meal,
  isOpen,
  onOpenChange,
  onSelectAlternative,
}: {
  meal: Meal;
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  onSelectAlternative: (replacement: SuggestMealAlternativeOutput) => void;
}) {
  const [isLoading, setIsLoading] = React.useState(false);
  const [alternative, setAlternative] = React.useState<SuggestMealAlternativeOutput | null>(null);
  const [error, setError] = React.useState<string | null>(null);
  const { user, userProfile } = useUserData();
  const { locale } = useI18n();

  const fetchAlternative = React.useCallback(async () => {
    if (!user || !userProfile) return;
    setIsLoading(true);
    setError(null);
    setAlternative(null);
    try {
      setAlternative(await suggestMealAlternative({
        mealId: meal.id,
        context: JSON.stringify({
          originalMeal: meal,
          dietaryPreference: userProfile.dietaryPreference || 'none',
          allergiesAndDislikes: userProfile.eatingHabits || 'None',
          cookingSkill: userProfile.cookingSkill,
          budget: userProfile.costLevel,
        }),
        locale,
      }));
    } catch (caught) {
      console.error('Meal alternative failed:', caught);
      setError(locale === 'fa' ? 'جایگزین کامل و قابل‌اعتباری ساخته نشد.' : 'A complete, validated alternative could not be generated.');
    } finally {
      setIsLoading(false);
    }
  }, [locale, meal, user, userProfile]);

  React.useEffect(() => {
    if (isOpen && !alternative && !isLoading) void fetchAlternative();
    if (!isOpen) {
      setAlternative(null);
      setError(null);
    }
  }, [alternative, fetchAlternative, isLoading, isOpen]);

  const replace = () => {
    if (!alternative) return;
    onSelectAlternative(alternative);
    onOpenChange(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{locale === 'fa' ? 'پیشنهاد غذای جایگزین' : 'Alternative meal suggestion'}</DialogTitle>
          <DialogDescription>{locale === 'fa' ? `جایگزین پیشنهادی برای ${meal.name}` : `A proposed replacement for ${meal.name}.`}</DialogDescription>
        </DialogHeader>
        <div className="flex min-h-40 items-center justify-center py-4">
          {isLoading && <Loader2 className="h-8 w-8 animate-spin text-primary" />}
          {error && <p className="text-center text-destructive">{error}</p>}
          {alternative && (
            <div className="w-full space-y-3">
              <Card>
                <CardContent className="space-y-2 p-4 text-center">
                  <h3 className="text-lg font-bold text-primary">{alternative.alternativeMeal}</h3>
                  <p className="text-sm text-muted-foreground">{alternative.calories} kcal · {Math.round(alternative.protein)}g {locale === 'fa' ? 'پروتئین' : 'protein'}</p>
                  <p className="text-xs text-muted-foreground">{alternative.ingredients.map((item) => `${item.name} (${item.quantity})`).join('، ')}</p>
                </CardContent>
              </Card>
              {alternative.warning && <Alert><AlertDescription>{alternative.warning}</AlertDescription></Alert>}
            </div>
          )}
        </div>
        <DialogFooter>
          <Button variant="secondary" onClick={() => void fetchAlternative()} disabled={isLoading}>
            <RefreshCw className="me-2 h-4 w-4" />{locale === 'fa' ? 'پیشنهاد دیگر' : 'Suggest another'}
          </Button>
          <Button onClick={replace} disabled={!alternative}>{locale === 'fa' ? 'جایگزین‌کردن' : 'Replace meal'}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
