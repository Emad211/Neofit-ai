
"use client";

import * as React from 'react';
import { WeeklyMealPlan } from "@/components/nutrition/weekly-meal-plan";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ShoppingList } from "@/components/nutrition/shopping-list";
import { FoodLibrary } from "@/components/nutrition/food-library";
import { FoodCameraLookup } from "@/components/nutrition/food-camera-lookup";
import { useIsMobile } from '@/hooks/use-mobile';


const tabs = [
    { value: "weekly-plan", label: "Weekly Plan" },
    { value: "shopping-list", label: "Shopping List" },
    { value: "food-library", label: "Food Library" },
    { value: "scan-meal", label: "Scan Meal" },
]

function NutritionTabs() {
    const isMobile = useIsMobile();
    const [activeTab, setActiveTab] = React.useState(tabs[0].value);

    const handleValueChange = (value: string) => {
        setActiveTab(value);
    }

    return (
        <Tabs defaultValue={tabs[0].value} value={activeTab} onValueChange={handleValueChange} className="w-full">
            <div className="mb-6">
                {isMobile ? (
                     <Select onValueChange={handleValueChange} defaultValue={activeTab}>
                        <SelectTrigger className="w-full">
                            <SelectValue placeholder="Select a view" />
                        </SelectTrigger>
                        <SelectContent>
                            {tabs.map(tab => (
                                <SelectItem key={tab.value} value={tab.value}>{tab.label}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                ) : (
                    <TabsList>
                        {tabs.map(tab => (
                            <TabsTrigger key={tab.value} value={tab.value}>{tab.label}</TabsTrigger>
                        ))}
                    </TabsList>
                )}
            </div>

            <TabsContent value="weekly-plan" className="m-0">
                <WeeklyMealPlan />
            </TabsContent>
            <TabsContent value="shopping-list" className="m-0">
                <ShoppingList />
            </TabsContent>
            <TabsContent value="food-library" className="m-0">
                <FoodLibrary />
            </TabsContent>
            <TabsContent value="scan-meal" className="m-0">
                <FoodCameraLookup />
            </TabsContent>
        </Tabs>
    )
}


export default function NutritionPage() {
  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <header className="mb-8">
        <h1 className="text-4xl font-bold font-headline text-foreground">
          Nutrition
        </h1>
        <p className="text-muted-foreground">
          Your weekly meal plan and food library.
        </p>
      </header>
      <main>
        <NutritionTabs />
      </main>
    </div>
  );
}
