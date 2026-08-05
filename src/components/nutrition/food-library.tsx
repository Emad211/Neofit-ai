"use client";

import * as React from "react";
import { CheckCircle2, Search, Wheat } from "lucide-react";
import { lookupLocalFood } from "@/lib/neofit-demo-data";
import type { FoodLookupResult } from "@/lib/neofit-models";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { useUserData, type MealLog } from "@/context/user-profile-context";
import { useToast } from "@/hooks/use-toast";

const Nutrient = ({ label, value, unit }: { label: string; value: number; unit: string }) => (
  <div className="rounded-lg bg-secondary p-3 text-center">
    <p className="text-sm text-muted-foreground">{label}</p>
    <p className="text-2xl font-bold text-primary">{value.toLocaleString("fa-IR")}<span className="text-sm"> {unit}</span></p>
  </div>
);

const portionOptions = [
  { value: 0.5, label: "نیم سهم" },
  { value: 1, label: "یک سهم" },
  { value: 1.5, label: "یک و نیم سهم" },
  { value: 2, label: "دو سهم" },
];

const mealTypeOptions: Array<{ value: MealLog["mealType"]; label: string }> = [
  { value: "breakfast", label: "صبحانه" },
  { value: "lunch", label: "ناهار" },
  { value: "dinner", label: "شام" },
  { value: "snack", label: "میان‌وعده" },
];

export function FoodLibrary() {
  const [query, setQuery] = React.useState("");
  const [result, setResult] = React.useState<FoodLookupResult | null>(null);
  const [searched, setSearched] = React.useState(false);
  const [portion, setPortion] = React.useState(1);
  const [mealType, setMealType] = React.useState<MealLog["mealType"]>("snack");
  const [isSaving, setIsSaving] = React.useState(false);
  const { logMeal } = useUserData();
  const { toast } = useToast();

  const submit = (event: React.FormEvent) => {
    event.preventDefault();
    setResult(lookupLocalFood(query));
    setSearched(true);
    setPortion(1);
  };

  const scaled = result ? {
    calories: Math.round(result.calories * portion),
    protein: Math.round(result.protein * portion),
    carbohydrates: Math.round(result.carbohydrates * portion),
    fat: Math.round(result.fat * portion),
  } : null;

  const saveFood = async () => {
    if (!result || !scaled || isSaving) return;
    setIsSaving(true);
    try {
      const portionLabel = portionOptions.find((option) => option.value === portion)?.label || `${portion} سهم`;
      await logMeal({
        mealType,
        description: `${result.foodName} — ${portionLabel} (${result.serving})`,
        calories: scaled.calories,
      });
      toast({ title: "غذا ثبت شد", description: `${result.foodName} با ${scaled.calories.toLocaleString("fa-IR")} کالری به تاریخچه اضافه شد.` });
    } catch (error) {
      console.error(error);
      toast({ variant: "destructive", title: "ثبت غذا ناموفق بود", description: "دوباره تلاش کن." });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div dir="rtl" className="mx-auto max-w-2xl">
      <form onSubmit={submit} className="mb-6 flex items-center gap-2">
        <Input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="مثلاً قورمه‌سبزی، عدسی یا تخم‌مرغ" aria-label="نام غذا" />
        <Button type="submit" size="icon" aria-label="جست‌وجوی غذا"><Search className="h-5 w-5" /></Button>
      </form>

      {result && scaled ? (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Wheat className="h-5 w-5 text-primary" />{result.foodName}</CardTitle>
            <p className="text-sm text-muted-foreground">سهم مرجع: {result.serving} · منبع: {result.source}</p>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              <Nutrient label="کالری" value={scaled.calories} unit="kcal" />
              <Nutrient label="پروتئین" value={scaled.protein} unit="g" />
              <Nutrient label="کربوهیدرات" value={scaled.carbohydrates} unit="g" />
              <Nutrient label="چربی" value={scaled.fat} unit="g" />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="food-portion">مقدار مصرف</Label>
                <select id="food-portion" value={portion} onChange={(event) => setPortion(Number(event.target.value))} className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm">
                  {portionOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
                </select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="food-meal-type">نوع وعده</Label>
                <select id="food-meal-type" value={mealType} onChange={(event) => setMealType(event.target.value as MealLog["mealType"])} className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm">
                  {mealTypeOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
                </select>
              </div>
            </div>

            <p className="rounded-xl bg-muted/50 p-3 text-xs leading-6 text-muted-foreground">کالری و ماکروهای بالا فقط از کاتالوگ محلیِ دارای مقدار مرجع محاسبه شده‌اند. غذای پیدا‌نشده با مقدار حدسی ثبت نمی‌شود.</p>
            <Button type="button" className="w-full" onClick={saveFood} disabled={isSaving}><CheckCircle2 className="ml-2 h-4 w-4" />{isSaving ? "در حال ثبت" : "ثبت این مقدار"}</Button>
          </CardContent>
        </Card>
      ) : null}

      {searched && !result ? (
        <Card className="border-dashed p-8 text-center">
          <p className="font-semibold">این غذا در کاتالوگ نمایشی پیدا نشد.</p>
          <p className="mt-2 text-sm text-muted-foreground">برای جلوگیری از دادهٔ ساختگی، تا اتصال کاتالوگ مشترک فقط غذاهای دارای مقدار مرجع قابل ثبت‌اند.</p>
        </Card>
      ) : null}
    </div>
  );
}
