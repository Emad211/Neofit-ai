
"use client";

import * as React from 'react';
import { WeeklyMealPlan } from "@/components/nutrition/weekly-meal-plan";
import { ShoppingList } from "@/components/nutrition/shopping-list";
import { FoodLibrary } from "@/components/nutrition/food-library";
import { FoodCameraLookup } from "@/components/nutrition/food-camera-lookup";
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ListChecks, Search, Camera, ChevronRight } from 'lucide-react';

const NutritionToolCard = ({ icon, title, description, children }: { icon: React.ReactNode, title: string, description: string, children: React.ReactNode }) => {
    return (
        <Dialog>
            <DialogTrigger asChild>
                <div className="group cursor-pointer rounded-lg border bg-card text-card-foreground shadow-sm transition-colors hover:bg-secondary/50">
                    <div className="flex items-center justify-between p-4">
                        <div className="flex items-center gap-4">
                            <div className="text-primary">
                                {React.cloneElement(icon as React.ReactElement, { className: "h-6 w-6" })}
                            </div>
                            <div>
                                <p className="font-semibold">{title}</p>
                                <p className="text-sm text-muted-foreground">{description}</p>
                            </div>
                        </div>
                        <ChevronRight className="h-5 w-5 text-muted-foreground transition-transform group-hover:translate-x-1" />
                    </div>
                </div>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[625px]">
                 <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        {React.cloneElement(icon as React.ReactElement, { className: "h-5 w-5" })} {title}
                    </DialogTitle>
                </DialogHeader>
                {children}
            </DialogContent>
        </Dialog>
    )
}

export default function NutritionPage() {
  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <header className="mb-8">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-2 gap-4">
            <div className="flex-1">
                <h1 className="text-4xl font-bold font-headline text-foreground">
                Nutrition
                </h1>
                <p className="text-muted-foreground">
                Your weekly meal plan, shopping list, and tools.
                </p>
            </div>
            <Sheet>
                <SheetTrigger asChild>
                    <Button className="w-full sm:w-auto">
                        <ListChecks className="mr-2 h-4 w-4" />
                        View Shopping List
                    </Button>
                </SheetTrigger>
                <SheetContent className="w-full sm:w-[540px] p-0">
                    <SheetHeader className="p-6">
                        <SheetTitle className="flex items-center gap-2">
                             <ListChecks className="mr-2 h-5 w-5" />
                            Your Shopping List
                        </SheetTitle>
                    </SheetHeader>
                    <div className="pr-6 pl-2 h-[calc(100vh-80px)] overflow-y-auto">
                        <ShoppingList />
                    </div>
                </SheetContent>
            </Sheet>
        </div>
      </header>

      <main className="space-y-12">
        <div>
            <h2 className="text-2xl font-bold font-headline mb-4">Your Weekly Plan</h2>
            <WeeklyMealPlan />
        </div>

        <div>
            <h2 className="text-2xl font-bold font-headline mb-4">Nutrition Tools</h2>
            <div className="grid grid-cols-1 gap-4">
                <NutritionToolCard 
                    icon={<Search />}
                    title="Food Library"
                    description="Look up detailed nutritional information for any food."
                >
                    <FoodLibrary />
                </NutritionToolCard>

                 <NutritionToolCard 
                    icon={<Camera />}
                    title="Scan a Meal"
                    description="Use your camera to instantly identify food items."
                >
                    <FoodCameraLookup />
                </NutritionToolCard>
            </div>
        </div>

      </main>
    </div>
  );
}
