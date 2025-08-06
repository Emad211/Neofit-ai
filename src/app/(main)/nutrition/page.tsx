import { WeeklyMealPlan } from "@/components/nutrition/weekly-meal-plan";

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
        <WeeklyMealPlan />
      </main>
    </div>
  );
}
