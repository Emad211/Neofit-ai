"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { BellRing, CalendarCheck2, CheckCircle2, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { OnboardingLoading, OnboardingShell } from "@/components/onboarding/onboarding-shell";
import { useOnboarding } from "@/context/onboarding-context";
import { useUserData } from "@/context/user-profile-context";
import { demoNutritionPlan, demoWorkoutPlan } from "@/lib/neofit-demo-data";
import { deriveInitialPlan, type ConfirmationSection } from "@/lib/onboarding-model";

function tomorrowDate() {
  const date = new Date();
  date.setDate(date.getDate() + 1);
  return date.toISOString().slice(0, 10);
}

export default function OnboardingConfirmationPage() {
  const router = useRouter();
  const { draft, isHydrated, updateSection, completeStep } = useOnboarding();
  const { savePlans } = useUserData();
  const [form, setForm] = React.useState<ConfirmationSection>(draft.confirmation);
  const [submitted, setSubmitted] = React.useState(false);
  const [saving, setSaving] = React.useState(false);

  React.useEffect(() => {
    if (!isHydrated) return;
    setForm({ ...draft.confirmation, startDate: draft.confirmation.startDate || tomorrowDate() });
  }, [draft.confirmation, isHydrated]);

  if (!isHydrated) return <OnboardingLoading />;
  const patch = <K extends keyof ConfirmationSection>(key: K, value: ConfirmationSection[K]) => setForm((current) => ({ ...current, [key]: value }));

  const finish = async () => {
    setSubmitted(true);
    if (!form.startDate || !form.finalConsent) return;
    setSaving(true);
    try {
      const completedAt = new Date().toISOString();
      const confirmation = { ...form, completedAt };
      const plan = deriveInitialPlan({ ...draft, confirmation });
      updateSection("confirmation", confirmation);
      completeStep(15);
      await savePlans({ nutritionPlan: demoNutritionPlan, workoutPlan: demoWorkoutPlan });
      window.localStorage.setItem("neofit:onboarding-completed:v1", completedAt);
      window.localStorage.setItem("neofit:initial-plan:v1", JSON.stringify(plan));
      router.push("/today");
    } finally {
      setSaving(false);
    }
  };

  return (
    <OnboardingShell step={15} title="آماده شروع هستی" description="تاریخ شروع و یادآورها را تنظیم کن. بعد از تأیید، برنامه نمایشی روی داشبورد فعال می‌شود و اطلاعات Onboarding برای ویرایش‌های بعدی محفوظ می‌ماند." backHref="/onboarding/result">
      <div className="rounded-3xl border bg-primary/5 p-5 sm:p-6">
        <div className="flex items-start gap-4"><div className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-primary text-primary-foreground"><CalendarCheck2 className="h-6 w-6" /></div><div><p className="font-black">تاریخ شروع برنامه</p><p className="mt-1 text-sm leading-7 text-muted-foreground">بهتر است روزی را انتخاب کنی که زمان کافی برای مرور برنامه و آماده‌سازی وعده‌ها داشته باشی.</p></div></div>
        <div className="mt-5 space-y-2"><Label htmlFor="start-date">تاریخ شروع</Label><Input id="start-date" type="date" value={form.startDate} onChange={(event) => patch("startDate", event.target.value)} /></div>
        {submitted && !form.startDate ? <p className="mt-2 text-sm text-destructive">انتخاب تاریخ شروع ضروری است.</p> : null}
      </div>

      <div className="mt-6 rounded-3xl border p-5 sm:p-6">
        <div className="mb-5 flex items-center gap-2"><BellRing className="h-5 w-5 text-primary" /><p className="font-black">یادآورها</p></div>
        <div className="space-y-3">
          {[
            ["workoutReminders", "یادآوری تمرین", "پیش از زمان ترجیحی تمرین"],
            ["mealReminders", "یادآوری وعده‌ها", "بر اساس برنامه غذایی روز"],
            ["waterReminders", "یادآوری آب", "در فاصله‌های روزانه"],
            ["weeklyReport", "گزارش هفتگی", "خلاصه تمرین، تغذیه و پیشرفت"],
          ].map(([key, title, description]) => (
            <Label key={key} className="flex cursor-pointer items-start gap-3 rounded-2xl border p-4">
              <Checkbox checked={Boolean(form[key as keyof ConfirmationSection])} onCheckedChange={(checked) => patch(key as keyof ConfirmationSection, Boolean(checked) as never)} className="mt-1" />
              <span><span className="block font-semibold">{title}</span><span className="mt-1 block text-sm text-muted-foreground">{description}</span></span>
            </Label>
          ))}
        </div>
      </div>

      <Label className="mt-6 flex cursor-pointer items-start gap-3 rounded-2xl border border-emerald-500/30 bg-emerald-500/5 p-5">
        <Checkbox checked={form.finalConsent} onCheckedChange={(checked) => patch("finalConsent", Boolean(checked))} className="mt-1" />
        <span className="text-sm leading-7">اطلاعات واردشده و نتیجه اولیه را مرور کرده‌ام. می‌دانم برنامه قابل تغییر است و توصیه‌های سلامت جایگزین ارزیابی پزشک نیستند.</span>
      </Label>
      {submitted && !form.finalConsent ? <p className="mt-2 text-sm text-destructive">برای فعال‌کردن برنامه، این تأیید ضروری است.</p> : null}

      <div className="mt-6 flex items-start gap-3 rounded-2xl bg-muted/40 p-4 text-sm leading-7 text-muted-foreground"><CheckCircle2 className="mt-1 h-5 w-5 shrink-0 text-emerald-600" />بعد از ورود به داشبورد، برنامه تمرین و تغذیه، ثبت روزانه و ویرایش پروفایل در دسترس خواهند بود.</div>

      <Button type="button" size="lg" className="mt-8 h-12 w-full text-base" onClick={finish} disabled={saving}>{saving ? <Loader2 className="ml-2 h-5 w-5 animate-spin" /> : <CheckCircle2 className="ml-2 h-5 w-5" />}{saving ? "در حال فعال‌سازی برنامه" : "فعال‌کردن برنامه و ورود به NeoFit"}</Button>
    </OnboardingShell>
  );
}
