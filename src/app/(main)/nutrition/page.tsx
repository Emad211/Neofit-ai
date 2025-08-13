
"use client";

import * as React from 'react';
import { WeeklyMealPlan } from "@/components/nutrition/weekly-meal-plan";
import { ShoppingList } from "@/components/nutrition/shopping-list";
import { FoodLibrary } from "@/components/nutrition/food-library";
import { FoodCameraLookup } from "@/components/nutrition/food-camera-lookup";
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Card, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ListChecks, Search, Camera } from 'lucide-react';

const NutritionToolCard = ({ icon, title, description, children }: { icon: React.ReactNode, title: string, description: string, children: React.ReactNode }) => {
    return (
        <Dialog>
            <DialogTrigger asChild>
                <Card className="cursor-pointer hover:border-primary transition-colors hover:bg-secondary/30">
                    <CardHeader className="flex flex-row items-center gap-4">
                        <div className="bg-primary/10 text-primary p-3 rounded-lg">
                            {icon}
                        </div>
                        <div>
                            <CardTitle>{title}</CardTitle>
                            <CardDescription>{description}</CardDescription>
                        </div>
                    </CardHeader>
                </Card>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[625px]">
                 <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        {icon} {title}
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
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <NutritionToolCard 
                    icon={<Search className="h-6 w-6" />}
                    title="Food Library"
                    description="Look up nutritional information for any food."
                >
                    <FoodLibrary />
                </NutritionToolCard>

                 <NutritionToolCard 
                    icon={<Camera className="h-6 w-6" />}
                    title="Scan a Meal"
                    description="Use your camera to identify food and get its details."
                >
                    <FoodCameraLookup />
                </NutritionToolCard>
            </div>
        </div>

      </main>
    </div>
  );
}
