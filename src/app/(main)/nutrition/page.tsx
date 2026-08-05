"use client";

import * as React from "react";
import { WeeklyMealPlan } from "@/components/nutrition/weekly-meal-plan";
import { ShoppingList } from "@/components/nutrition/shopping-list";
import { FoodLibrary } from "@/components/nutrition/food-library";
import { FoodCameraLookup } from "@/components/nutrition/food-camera-lookup";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { useUserData, type MealLog } from "@/context/user-profile-context";
import type { InitialPlanPreview } from "@/lib/onboarding-model";
import { Apple, Camera, ChevronLeft, Flame, ListChecks, Search, Utensils, Wheat } from "lucide-react";

function NutritionToolCard({ icon, title, description, children }: { icon: React.ReactNode; title: string; description: string; children: React.ReactNode }) {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <button type="button" className="group w-full rounded-2xl border bg-card p-4 text-right shadow-sm transition hover:bg-secondary/50 hover:shadow-md">
          <span className="flex items-center justify-between gap-4">
            <span className="flex items-center gap-4"><span className="rounded-2xl bg-primary/10 p-3 text-primary">{icon}</span><span><span className="block font-black">{title}</span><span className="mt-1 block text-sm leading-6 text-muted-foreground">{description}</span></span></span>
            <ChevronLeft className="h-5 w-5 text-muted-foreground transition-transform group-hover:-translate-x-1" />
          </span>
        </button>
      </DialogTrigger>
      <DialogContent dir="rtl" className="sm:max-w-[625px]">
        <DialogHeader className="text-right"><DialogTitle className="flex items-center gap-2">{icon}{title}</DialogTitle></DialogHeader>
        {children}
      </DialogContent>
    </Dialog>
  );
}

export default function NutritionPage() {
  const { nutritionPlan, combinedLogs, loggedMealsState } = useUserData();
  const [initialPlan, setInitialPlan] = React.useState<InitialPlanPreview | null>(null);

  React.useEffect(() => {
    try {
      const raw = window.localStorage.getItem("neofit:initial-plan:v1");
      if (raw) setInitialPlan(JSON.parse(raw));
    } catch {
      setInitialPlan(null);
    }
  }, []);

  const today = new Date().toDateString();
  const todayMealLogs = combinedLogs.filter((log): log is MealLog => log.logType === "meal" && new Date(log.loggedAt).toDateString() === today);
  const loggedCalories = todayMealLogs.reduce((sum, log) => sum + log.calories, 0);
  const todayPlan = nutritionPlan?.[0] || null;
  const calorieTarget = initialPlan?.calorieTarget || todayPlan?.totalCalories || 0;
  const remainingCalories = Math.max(0, calorieTarget - loggedCalories);
  const plannedMealIds = todayPlan?.meals.map((meal) => meal.id) || [];
  const completedPlannedMeals = plannedMealIds.filter((id) => (loggedMealsState || []).includes(id)).length;
  const mealAdherence = plannedMealIds.length ? Math.round((completedPlannedMeals / plannedMealIds.length) * 100) : 0;
  const caloriePercent = calorieTarget ? Math.min(100, Math.round((loggedCalories / calorieTarget) * 100)) : 0;

  const summaryCards = [
    { title: "هدف امروز", value: calorieTarget ? `${calorieTarget.toLocaleString("fa-IR")} کالری` : "—", description: "بر اساس نتیجه اولیه برنامه", icon: Flame },
    { title: "ثبت‌شده", value: `${loggedCalories.toLocaleString("fa-IR")} کالری`, description: `${todayMealLogs.length.toLocaleString("fa-IR")} وعده ثبت‌شده`, icon: Apple },
    { title: "باقی‌مانده", value: `${remainingCalories.toLocaleString("fa-IR")} کالری`, description: "تا سقف هدف روز", icon: Utensils },
    { title: "پایبندی وعده‌ها", value: `${mealAdherence.toLocaleString("fa-IR")}٪`, description: `${completedPlannedMeals.toLocaleString("fa-IR")} از ${plannedMealIds.length.toLocaleString("fa-IR")} وعده برنامه`, icon: ListChecks },
  ];

  return (
    <main dir="rtl" className="min-h-screen bg-gradient-to-b from-emerald-500/5 via-background to-background p-4 sm:p-6 lg:p-8">
      <div className="mx-auto max-w-6xl py-3">
        <header className="mb-6 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
          <div><div className="mb-2 inline-flex items-center gap-2 rounded-full border bg-card px-3 py-1 text-xs font-bold text-emerald-700 dark:text-emerald-300"><Apple className="h-3.5 w-3.5" />برنامه غذایی شخصی</div><h1 className="text-3xl font-black sm:text-4xl">تغذیه امروز و هفته</h1><p className="mt-2 text-muted-foreground">وعده‌ها را مرور، ثبت یا با گزینه‌های نزدیک جایگزین کن.</p></div>
          <Sheet>
            <SheetTrigger asChild><Button className="w-full sm:w-auto"><ListChecks className="ml-2 h-4 w-4" />لیست خرید</Button></SheetTrigger>
            <SheetContent dir="rtl" className="w-full p-0 sm:w-[540px]">
              <SheetHeader className="p-6 text-right"><SheetTitle className="flex items-center gap-2"><ListChecks className="h-5 w-5" />لیست خرید برنامه</SheetTitle></SheetHeader>
              <div className="h-[calc(100vh-80px)] overflow-y-auto px-5 pb-6"><ShoppingList /></div>
            </SheetContent>
          </Sheet>
        </header>

        <section className="grid grid-cols-2 gap-3 lg:grid-cols-4" aria-label="خلاصه تغذیه امروز">
          {summaryCards.map((item) => <Card key={item.title}><CardContent className="p-4"><div className="flex items-start justify-between gap-3"><div><p className="text-xs text-muted-foreground">{item.title}</p><p className="mt-2 text-lg font-black sm:text-xl">{item.value}</p><p className="mt-1 text-xs leading-5 text-muted-foreground">{item.description}</p></div><div className="rounded-2xl bg-emerald-500/10 p-2.5 text-emerald-700 dark:text-emerald-300"><item.icon className="h-5 w-5" /></div></div></CardContent></Card>)}
        </section>

        <Card className="mt-4 border-emerald-500/20">
          <CardContent className="p-5">
            <div className="flex flex-wrap items-end justify-between gap-4"><div><p className="text-sm font-bold">پیشرفت کالری امروز</p><p className="mt-1 text-sm text-muted-foreground">{loggedCalories.toLocaleString("fa-IR")} از {calorieTarget.toLocaleString("fa-IR")} کالری</p></div><p className="text-2xl font-black text-emerald-700 dark:text-emerald-300">{caloriePercent.toLocaleString("fa-IR")}٪</p></div>
            <Progress value={caloriePercent} className="mt-4 h-2" />
            {initialPlan ? <div className="mt-4 flex flex-wrap gap-2 text-xs text-muted-foreground"><span className="rounded-full bg-muted px-3 py-1.5">پروتئین هدف: {initialPlan.proteinGrams.toLocaleString("fa-IR")} گرم</span><span className="rounded-full bg-muted px-3 py-1.5">کربوهیدرات هدف: {initialPlan.carbohydrateGrams.toLocaleString("fa-IR")} گرم</span><span className="rounded-full bg-muted px-3 py-1.5">چربی هدف: {initialPlan.fatGrams.toLocaleString("fa-IR")} گرم</span></div> : <p className="mt-4 text-xs text-muted-foreground">هدف ماکروها پس از تکمیل Onboarding نمایش داده می‌شود؛ مقدار واقعی غذاها بعداً از Nutrition Core خوانده خواهد شد.</p>}
          </CardContent>
        </Card>

        <section className="mt-10">
          <div className="mb-4 flex items-center gap-2"><Wheat className="h-5 w-5 text-emerald-700 dark:text-emerald-300" /><h2 className="text-2xl font-black">برنامه هفتگی</h2></div>
          <WeeklyMealPlan />
        </section>

        <section className="mt-10">
          <h2 className="mb-4 text-2xl font-black">ابزارهای تغذیه</h2>
          <div className="grid gap-4 md:grid-cols-2">
            <NutritionToolCard icon={<Search className="h-5 w-5" />} title="کتابخانه غذا" description="اطلاعات تغذیه‌ای غذاهای موجود در کتابخانه محلی را جست‌وجو کن."><FoodLibrary /></NutritionToolCard>
            <NutritionToolCard icon={<Camera className="h-5 w-5" />} title="ثبت با دوربین" description="فعلاً عکس را برای پیش‌نمایش انتخاب کن؛ تشخیص واقعی بعداً به API متصل می‌شود."><FoodCameraLookup /></NutritionToolCard>
          </div>
        </section>
      </div>
    </main>
  );
}
