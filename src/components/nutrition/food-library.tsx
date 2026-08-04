"use client";

import * as React from "react";
import { Search, Wheat } from "lucide-react";
import { lookupLocalFood } from "@/lib/neofit-demo-data";
import type { FoodLookupResult } from "@/lib/neofit-models";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const Nutrient = ({ label, value, unit }: { label: string; value: number; unit: string }) => (
  <div className="rounded-lg bg-secondary p-3 text-center">
    <p className="text-sm text-muted-foreground">{label}</p>
    <p className="text-2xl font-bold text-primary">{value}<span className="text-sm"> {unit}</span></p>
  </div>
);

export function FoodLibrary() {
  const [query, setQuery] = React.useState("");
  const [result, setResult] = React.useState<FoodLookupResult | null>(null);
  const [searched, setSearched] = React.useState(false);

  const submit = (event: React.FormEvent) => {
    event.preventDefault();
    setResult(lookupLocalFood(query));
    setSearched(true);
  };

  return (
    <div dir="rtl" className="mx-auto max-w-2xl">
      <form onSubmit={submit} className="mb-6 flex items-center gap-2">
        <Input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="مثلاً قورمه‌سبزی، عدسی یا تخم‌مرغ" />
        <Button type="submit" size="icon" aria-label="جست‌وجو"><Search className="h-5 w-5" /></Button>
      </form>

      {result && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Wheat className="h-5 w-5 text-primary" />{result.foodName}</CardTitle>
            <p className="text-sm text-muted-foreground">سهم: {result.serving} · منبع: {result.source}</p>
          </CardHeader>
          <CardContent className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <Nutrient label="کالری" value={result.calories} unit="kcal" />
            <Nutrient label="پروتئین" value={result.protein} unit="g" />
            <Nutrient label="کربوهیدرات" value={result.carbohydrates} unit="g" />
            <Nutrient label="چربی" value={result.fat} unit="g" />
          </CardContent>
        </Card>
      )}

      {searched && !result && (
        <Card className="border-dashed p-8 text-center">
          <p className="font-semibold">این غذا در کاتالوگ نمایشی پیدا نشد.</p>
          <p className="mt-2 text-sm text-muted-foreground">در نسخهٔ کامل، جست‌وجو به کاتالوگ مشترک تغذیه متصل می‌شود.</p>
        </Card>
      )}
    </div>
  );
}
