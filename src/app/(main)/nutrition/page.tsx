import { WeeklyMealPlan } from "@/components/nutrition/weekly-meal-plan";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ShoppingList } from "@/components/nutrition/shopping-list";
import { FoodLibrary } from "@/components/nutrition/food-library";

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
        <Tabs defaultValue="weekly-plan" className="w-full">
          <TabsList className="grid w-full grid-cols-3 mb-6">
            <TabsTrigger value="weekly-plan">Weekly Plan</TabsTrigger>
            <TabsTrigger value="shopping-list">Shopping List</TabsTrigger>
            <TabsTrigger value="food-library">Food Library</TabsTrigger>
          </TabsList>
          <TabsContent value="weekly-plan">
            <WeeklyMealPlan />
          </TabsContent>
          <TabsContent value="shopping-list">
            <ShoppingList />
          </TabsContent>
          <TabsContent value="food-library">
            <FoodLibrary />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
