'use client';

import * as React from 'react';
import { Camera, ChevronRight, ListChecks, Search } from 'lucide-react';
import { WeeklyMealPlan } from '@/components/nutrition/weekly-meal-plan';
import { ShoppingList } from '@/components/nutrition/shopping-list';
import { FoodLibrary } from '@/components/nutrition/food-library';
import { FoodCameraLookup } from '@/components/nutrition/food-camera-lookup';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useI18n } from '@/i18n/provider';

function NutritionToolCard({
  icon,
  title,
  description,
  children,
}: {
  icon: React.ReactElement;
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <button type="button" className="group w-full rounded-lg border bg-card text-start text-card-foreground shadow-sm transition-colors hover:bg-secondary/50">
          <span className="flex items-center justify-between p-4">
            <span className="flex items-center gap-4">
              <span className="text-primary">{React.cloneElement(icon, { className: 'h-6 w-6' })}</span>
              <span><span className="block font-semibold">{title}</span><span className="block text-sm text-muted-foreground">{description}</span></span>
            </span>
            <ChevronRight className="h-5 w-5 text-muted-foreground transition-transform group-hover:translate-x-1 rtl:rotate-180 rtl:group-hover:-translate-x-1" aria-hidden="true" />
          </span>
        </button>
      </DialogTrigger>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-[700px]">
        <DialogHeader><DialogTitle className="flex items-center gap-2">{React.cloneElement(icon, { className: 'h-5 w-5' })}{title}</DialogTitle></DialogHeader>
        {children}
      </DialogContent>
    </Dialog>
  );
}

export default function NutritionPage() {
  const { t } = useI18n();
  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <header className="mb-8">
        <div className="mb-2 flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
          <div className="flex-1"><h1 className="font-headline text-4xl font-bold">{t('nutrition.title')}</h1><p className="text-muted-foreground">{t('nutrition.subtitle')}</p></div>
          <Sheet>
            <SheetTrigger asChild><Button className="w-full sm:w-auto"><ListChecks className="me-2 h-4 w-4" />{t('nutrition.viewShoppingList')}</Button></SheetTrigger>
            <SheetContent side="right" className="w-full p-0 sm:w-[540px]">
              <SheetHeader className="p-6"><SheetTitle className="flex items-center gap-2"><ListChecks className="h-5 w-5" />{t('nutrition.shoppingList')}</SheetTitle></SheetHeader>
              <div className="h-[calc(100vh-80px)] overflow-y-auto px-4 pb-6"><ShoppingList /></div>
            </SheetContent>
          </Sheet>
        </div>
      </header>

      <main className="space-y-12">
        <section><h2 className="mb-4 font-headline text-2xl font-bold">{t('nutrition.weeklyPlan')}</h2><WeeklyMealPlan /></section>
        <section>
          <h2 className="mb-4 font-headline text-2xl font-bold">{t('nutrition.tools')}</h2>
          <div className="grid grid-cols-1 gap-4">
            <NutritionToolCard icon={<Search />} title={t('nutrition.foodLibrary')} description={t('nutrition.foodLibraryDescription')}><FoodLibrary /></NutritionToolCard>
            <NutritionToolCard icon={<Camera />} title={t('nutrition.scanMeal')} description={t('nutrition.scanMealDescription')}><FoodCameraLookup /></NutritionToolCard>
          </div>
        </section>
      </main>
    </div>
  );
}
