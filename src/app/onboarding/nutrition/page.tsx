"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, ChefHat, CircleDollarSign, CookingPot, UtensilsCrossed } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { OnboardingLoading, OnboardingShell } from "@/components/onboarding/onboarding-shell";
import { TagEditor } from "@/components/onboarding/tag-editor";
import { useOnboarding } from "@/context/onboarding-context";
import type { NutritionSection } from "@/lib/onboarding-model";
import { cn } from "@/lib/utils";

const iranianFoods = ["قورمه‌سبزی", "کباب", "عدسی", "زرشک‌پلو", "آبگوشت", "ماهی", "خوراک لوبیا", "کوکو", "آش", "کشک بادمجان"];

export default function OnboardingNutritionPage() {
  const router = useRouter();
  const { draft, isHydrated, updateSection, completeStep } = useOnboarding();
  const [form, setForm] = React.useState<NutritionSection>(draft.nutrition);

  React.useEffect(() => {
    if (isHydrated) setForm(draft.nutrition);
  }, [draft.nutrition, isHydrated]);

  if (!isHydrated) return <OnboardingLoading />;
  const patch = <K extends keyof NutritionSection>(key: K, value: NutritionSection[K]) => setForm((current) => ({ ...current, [key]: value }));

  const toggleFavorite = (food: string) => {
    patch("favoriteIranianFoods", form.favoriteIranianFoods.includes(food) ? form.favoriteIranianFoods.filter((item) => item !== food) : [...form.favoriteIranianFoods, food]);
  };

  const submit = () => {
    updateSection("nutrition", { ...form, notes: form.notes.trim() });
    completeStep(8);
    router.push("/onboarding/training-history");
  };

  return (
    <OnboardingShell step={8} title="پروفایل تغذیه" description="غذاهایی که دوست داری، محدودیت‌ها و شرایط آشپزی را ثبت کن تا برنامه واقعاً قابل اجرا و متناسب با سفره ایرانی باشد." backHref="/onboarding/lifestyle">
      <div className="grid gap-5 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="meals-per-day">تعداد وعده مطلوب در روز</Label>
          <Input id="meals-per-day" type="number" min={2} max={6} value={form.mealsPerDay} onChange={(event) => patch("mealsPerDay", Math.max(2, Math.min(6, Number(event.target.value) || 3)))} />
        </div>
        <div className="space-y-2">
          <Label>الگوی غذایی</Label>
          <Select value={form.dietType} onValueChange={(value: NutritionSection["dietType"]) => patch("dietType", value)}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent><SelectItem value="balanced">متعادل و بدون محدودیت خاص</SelectItem><SelectItem value="vegetarian">گیاه‌خواری</SelectItem><SelectItem value="vegan">وگان</SelectItem><SelectItem value="pescatarian">ماهی‌خواری</SelectItem><SelectItem value="low-carb">کربوهیدرات کمتر</SelectItem><SelectItem value="other">الگوی دیگر</SelectItem></SelectContent>
          </Select>
        </div>
      </div>

      <div className="mt-6 grid gap-5 sm:grid-cols-2">
        <div className="space-y-2"><Label>حساسیت یا عدم تحمل غذایی</Label><TagEditor value={form.allergies} onChange={(value) => patch("allergies", value)} placeholder="مثلاً لاکتوز، گلوتن یا بادام‌زمینی" /></div>
        <div className="space-y-2"><Label>غذاهای غیرقابل‌مصرف یا نامطلوب</Label><TagEditor value={form.dislikedFoods} onChange={(value) => patch("dislikedFoods", value)} placeholder="مثلاً قارچ، دل و جگر یا غذای تند" /></div>
      </div>

      <div className="mt-7 space-y-3">
        <div className="flex items-center gap-2"><UtensilsCrossed className="h-5 w-5 text-primary" /><Label>غذاهای ایرانی محبوب</Label></div>
        <div className="flex flex-wrap gap-2">
          {iranianFoods.map((food) => <Button key={food} type="button" variant={form.favoriteIranianFoods.includes(food) ? "default" : "outline"} onClick={() => toggleFavorite(food)} className="rounded-full">{food}</Button>)}
        </div>
      </div>

      <div className="mt-7 grid gap-4 sm:grid-cols-3">
        {[
          { value: "economy", title: "اقتصادی", description: "مواد ساده، در دسترس و کم‌هزینه", icon: CircleDollarSign },
          { value: "balanced", title: "متعادل", description: "ترکیب قیمت و تنوع غذایی", icon: CookingPot },
          { value: "flexible", title: "انعطاف‌پذیر", description: "اولویت با تنوع و راحتی", icon: ChefHat },
        ].map((item) => (
          <Card key={item.value} onClick={() => patch("budget", item.value as NutritionSection["budget"])} className={cn("cursor-pointer transition hover:border-primary", form.budget === item.value && "border-primary ring-2 ring-primary")}>
            <CardContent className="p-4 text-center"><item.icon className="mx-auto h-6 w-6 text-primary" /><p className="mt-3 font-bold">{item.title}</p><p className="mt-1 text-xs leading-6 text-muted-foreground">{item.description}</p></CardContent>
          </Card>
        ))}
      </div>

      <div className="mt-6 grid gap-5 sm:grid-cols-2">
        <div className="space-y-2"><Label>مهارت آشپزی</Label><Select value={form.cookingAbility} onValueChange={(value: NutritionSection["cookingAbility"]) => patch("cookingAbility", value)}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="beginner">مبتدی</SelectItem><SelectItem value="intermediate">متوسط</SelectItem><SelectItem value="advanced">مسلط</SelectItem></SelectContent></Select></div>
        <div className="space-y-2"><Label>دفعات غذا خوردن بیرون از خانه</Label><Select value={form.eatingOutFrequency} onValueChange={(value: NutritionSection["eatingOutFrequency"]) => patch("eatingOutFrequency", value)}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="rare">به‌ندرت</SelectItem><SelectItem value="weekly">چند بار در هفته</SelectItem><SelectItem value="frequent">اغلب روزها</SelectItem></SelectContent></Select></div>
      </div>

      <Label className="mt-6 flex cursor-pointer items-center gap-3 rounded-2xl border p-4"><Checkbox checked={form.kitchenAccess} onCheckedChange={(checked) => patch("kitchenAccess", Boolean(checked))} /><span>به آشپزخانه یا امکان آماده‌سازی غذا دسترسی دارم</span></Label>

      <div className="mt-6 space-y-2"><Label htmlFor="nutrition-notes">توضیح تکمیلی</Label><Textarea id="nutrition-notes" value={form.notes} onChange={(event) => patch("notes", event.target.value)} placeholder="ساعت وعده‌ها، روزه‌داری، غذای خانوادگی یا هر محدودیت اجرایی" className="min-h-24" /></div>

      <Button type="button" size="lg" className="mt-8 h-12 w-full text-base" onClick={submit}>ادامه به سابقه تمرین<ArrowLeft className="mr-2 h-5 w-5" /></Button>
    </OnboardingShell>
  );
}
