"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, BellRing, BrainCircuit, Gauge, Heart, Repeat2, Salad } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { OnboardingLoading, OnboardingShell } from "@/components/onboarding/onboarding-shell";
import { useOnboarding } from "@/context/onboarding-context";
import type { PreferencesSection } from "@/lib/onboarding-model";
import { cn } from "@/lib/utils";

function ChoiceRow<T extends string>({ label, icon: Icon, value, options, onChange }: { label: string; icon: typeof Gauge; value: T; options: Array<{ id: T; title: string; description: string }>; onChange: (value: T) => void }) {
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2"><Icon className="h-5 w-5 text-primary" /><Label>{label}</Label></div>
      <div className="grid gap-3 sm:grid-cols-3">
        {options.map((option) => (
          <Card key={option.id} className={cn("cursor-pointer transition hover:border-primary", value === option.id && "border-primary ring-2 ring-primary")} onClick={() => onChange(option.id)}>
            <CardContent className="p-4 text-center"><p className="font-bold">{option.title}</p><p className="mt-1 text-xs leading-6 text-muted-foreground">{option.description}</p></CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

export default function OnboardingPreferencesPage() {
  const router = useRouter();
  const { draft, isHydrated, updateSection, completeStep } = useOnboarding();
  const [form, setForm] = React.useState<PreferencesSection>(draft.preferences);
  React.useEffect(() => { if (isHydrated) setForm(draft.preferences); }, [draft.preferences, isHydrated]);
  if (!isHydrated) return <OnboardingLoading />;
  const patch = <K extends keyof PreferencesSection>(key: K, value: PreferencesSection[K]) => setForm((current) => ({ ...current, [key]: value }));

  const submit = () => {
    updateSection("preferences", form);
    completeStep(11);
    router.push("/onboarding/review");
  };

  return (
    <OnboardingShell step={11} title="ترجیحات برنامه و همراهی" description="در این مرحله سبک فشار تمرین، میزان تنوع، سخت‌گیری تغذیه و نوع ارتباط مربی را انتخاب می‌کنی." backHref="/onboarding/availability">
      <div className="space-y-8">
        <ChoiceRow label="شدت مطلوب تمرین" icon={Gauge} value={form.intensity} onChange={(value) => patch("intensity", value)} options={[{ id: "gentle", title: "ملایم", description: "شروع محافظه‌کارانه و افزایش آهسته" }, { id: "moderate", title: "متعادل", description: "چالش کافی با ریکاوری قابل مدیریت" }, { id: "challenging", title: "چالش‌برانگیز", description: "فشار بیشتر در محدوده امن و تجربه کاربر" }]} />
        <ChoiceRow label="میزان تمرین هوازی" icon={Heart} value={form.cardioPreference} onChange={(value) => patch("cardioPreference", value)} options={[{ id: "low", title: "کم", description: "فقط برای سلامت و گرم‌کردن" }, { id: "balanced", title: "متعادل", description: "ترکیب قدرتی و هوازی" }, { id: "high", title: "زیاد", description: "تأکید بیشتر بر استقامت و مصرف انرژی" }]} />
        <ChoiceRow label="سبک اصلی تمرین" icon={BrainCircuit} value={form.trainingStyle} onChange={(value) => patch("trainingStyle", value)} options={[{ id: "resistance", title: "قدرتی", description: "تمرکز بر وزنه، عضله و پیشرفت بار" }, { id: "functional", title: "عملکردی", description: "حرکت، تعادل، استقامت و آمادگی" }, { id: "mixed", title: "ترکیبی", description: "ترکیب هدفمند هر دو سبک" }]} />
        <ChoiceRow label="تنوع برنامه" icon={Repeat2} value={form.variety} onChange={(value) => patch("variety", value)} options={[{ id: "stable", title: "ثابت", description: "حرکات کمتر با فرصت تسلط" }, { id: "balanced", title: "متعادل", description: "تغییر دوره‌ای بدون شلوغی" }, { id: "varied", title: "متنوع", description: "تنوع بیشتر برای حفظ انگیزه" }]} />
        <ChoiceRow label="ساختار برنامه غذایی" icon={Salad} value={form.nutritionStrictness} onChange={(value) => patch("nutritionStrictness", value)} options={[{ id: "flexible", title: "انعطاف‌پذیر", description: "محدوده کالری و انتخاب آزادتر" }, { id: "structured", title: "ساختاریافته", description: "وعده مشخص با جایگزین‌های کنترل‌شده" }, { id: "strict", title: "دقیق", description: "مقادیر و زمان‌بندی مشخص‌تر" }]} />
      </div>

      <div className="mt-8 grid gap-5 sm:grid-cols-2">
        <div className="space-y-2"><Label>لحن همراه NeoFit</Label><Select value={form.coachingTone} onValueChange={(value: PreferencesSection["coachingTone"]) => patch("coachingTone", value)}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="supportive">حمایتی و تشویقی</SelectItem><SelectItem value="direct">مستقیم و جدی</SelectItem><SelectItem value="analytical">تحلیلی و داده‌محور</SelectItem></SelectContent></Select></div>
        <div className="space-y-2"><div className="flex items-center gap-2"><BellRing className="h-4 w-4 text-primary" /><Label>میزان یادآوری</Label></div><Select value={form.reminderLevel} onValueChange={(value: PreferencesSection["reminderLevel"]) => patch("reminderLevel", value)}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="minimal">حداقلی</SelectItem><SelectItem value="normal">عادی</SelectItem><SelectItem value="high">پیگیری بیشتر</SelectItem></SelectContent></Select></div>
      </div>

      <Button type="button" size="lg" className="mt-8 h-12 w-full text-base" onClick={submit}>مرور همه اطلاعات<ArrowLeft className="mr-2 h-5 w-5" /></Button>
    </OnboardingShell>
  );
}
