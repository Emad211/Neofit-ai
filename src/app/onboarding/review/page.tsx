"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, CheckCircle2, Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { OnboardingLoading, OnboardingShell } from "@/components/onboarding/onboarding-shell";
import { useOnboarding } from "@/context/onboarding-context";
import { goalLabels, timelineLabels } from "@/lib/onboarding-model";

function ReviewCard({ title, href, rows }: { title: string; href: string; rows: Array<[string, React.ReactNode]> }) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between gap-3 pb-3">
        <CardTitle className="text-lg">{title}</CardTitle>
        <Button asChild variant="ghost" size="sm"><Link href={href}><Pencil className="ml-2 h-4 w-4" />ویرایش</Link></Button>
      </CardHeader>
      <CardContent className="space-y-3">
        {rows.map(([label, value]) => <div key={label} className="grid grid-cols-[minmax(100px,0.75fr)_1.5fr] gap-3 border-b pb-3 text-sm last:border-0 last:pb-0"><span className="text-muted-foreground">{label}</span><span className="font-medium leading-6">{value || "—"}</span></div>)}
      </CardContent>
    </Card>
  );
}

export default function OnboardingReviewPage() {
  const router = useRouter();
  const { draft, isHydrated, completeStep } = useOnboarding();
  if (!isHydrated) return <OnboardingLoading />;

  const boolean = (value: boolean) => value ? "بله" : "خیر";
  const submit = () => { completeStep(12); router.push("/onboarding/analysis"); };

  return (
    <OnboardingShell step={12} title="مرور اطلاعات قبل از تحلیل" description="همه پاسخ‌ها را یک‌جا بررسی کن. هر بخش را می‌توانی ویرایش کنی و سپس تحلیل اولیه برنامه را ببینی." backHref="/onboarding/preferences">
      <div className="grid gap-4 lg:grid-cols-2">
        <ReviewCard title="هدف" href="/onboarding/goal" rows={[["هدف اصلی", draft.goal.primaryGoal ? goalLabels[draft.goal.primaryGoal] : "—"], ["اهداف فرعی", draft.goal.secondaryGoals.map((goal) => goalLabels[goal]).join("، ") || "ندارد"], ["سرعت پیشرفت", timelineLabels[draft.goal.targetTimeline]]]} />
        <ReviewCard title="مشخصات پایه" href="/onboarding/basics" rows={[["نام", draft.basics.name], ["سن", draft.basics.age ? `${draft.basics.age} سال` : "—"], ["قد و وزن", `${draft.basics.heightCm ?? "—"} سانتی‌متر / ${draft.basics.weightKg ?? "—"} کیلوگرم`], ["کشور", draft.basics.country]]} />
        <ReviewCard title="اندازه‌های بدنی" href="/onboarding/body" rows={[["وزن هدف", draft.body.targetWeightKg ? `${draft.body.targetWeightKg} کیلوگرم` : "—"], ["دور کمر", draft.body.waistCm ? `${draft.body.waistCm} سانتی‌متر` : "—"], ["لگن / گردن", `${draft.body.hipCm ?? "—"} / ${draft.body.neckCm ?? "—"} سانتی‌متر`], ["ثبت عکس پیشرفت", boolean(draft.body.progressPhotoOptIn)]]} />
        <ReviewCard title="سلامت" href="/onboarding/medical" rows={[["شرایط ثبت‌شده", draft.medical.conditions.join("، ") || "موردی ثبت نشده"], ["دارو", draft.medical.medications || "مصرفی ثبت نشده"], ["فشارخون / دیابت / قلب", `${boolean(draft.medical.hasHighBloodPressure)} / ${boolean(draft.medical.hasDiabetes)} / ${boolean(draft.medical.hasCardiacHistory)}`], ["محدودیت پزشک", draft.medical.physicianRestrictions || "ندارد"]]} />
        <ReviewCard title="آسیب‌ها" href="/onboarding/injuries" rows={[["وضعیت", draft.injuries.noInjuries ? "آسیب یا محدودیت گزارش نشده" : `${draft.injuries.areas.length} ناحیه انتخاب شده`], ["ناحیه‌ها", draft.injuries.areas.map((area) => area.label).join("، ") || "—"], ["درد هنگام تمرین", draft.injuries.painDuringExercise ? `${draft.injuries.painScale ?? 0} از ۱۰` : "خیر"], ["توضیح کلی", draft.injuries.generalLimitations || "ندارد"]]} />
        <ReviewCard title="سبک زندگی" href="/onboarding/lifestyle" rows={[["شغل", draft.lifestyle.occupation || "—"], ["تحرک", ({ sedentary: "کم‌تحرک", light: "کمی فعال", moderate: "فعال", high: "بسیار فعال" } as const)[draft.lifestyle.activityLevel]], ["قدم و نشستن", `${draft.lifestyle.dailySteps ?? "—"} قدم / ${draft.lifestyle.sittingHours ?? "—"} ساعت نشستن`], ["خواب و استرس", `${draft.lifestyle.sleepHours ?? "—"} ساعت / ${draft.lifestyle.stressLevel === "high" ? "زیاد" : draft.lifestyle.stressLevel === "medium" ? "متوسط" : "کم"}`]]} />
        <ReviewCard title="تغذیه" href="/onboarding/nutrition" rows={[["وعده روزانه", `${draft.nutrition.mealsPerDay} وعده`], ["حساسیت‌ها", draft.nutrition.allergies.join("، ") || "ندارد"], ["غذاهای محبوب", draft.nutrition.favoriteIranianFoods.join("، ") || "انتخاب نشده"], ["بودجه و آشپزی", `${draft.nutrition.budget === "economy" ? "اقتصادی" : draft.nutrition.budget === "balanced" ? "متعادل" : "انعطاف‌پذیر"} / ${draft.nutrition.cookingAbility === "advanced" ? "مسلط" : draft.nutrition.cookingAbility === "intermediate" ? "متوسط" : "مبتدی"}`]]} />
        <ReviewCard title="سابقه تمرین" href="/onboarding/training-history" rows={[["سطح", draft.trainingHistory.level === "advanced" ? "پیشرفته" : draft.trainingHistory.level === "intermediate" ? "متوسط" : "مبتدی"], ["سابقه", `${draft.trainingHistory.trainingAgeMonths ?? 0} ماه`], ["وقفه اخیر", `${draft.trainingHistory.recentBreakWeeks ?? 0} هفته`], ["ورزش‌های قبلی", draft.trainingHistory.previousSports.join("، ") || "ندارد"]]} />
        <ReviewCard title="زمان و تجهیزات" href="/onboarding/availability" rows={[["محل تمرین", draft.availability.location === "home" ? "خانه" : draft.availability.location === "gym" ? "باشگاه" : "خانه و باشگاه"], ["روز و مدت", `${draft.availability.daysPerWeek} روز / ${draft.availability.sessionDuration} دقیقه`], ["روزهای ترجیحی", draft.availability.preferredDays.join("، ") || "چینش خودکار"], ["تجهیزات", draft.availability.equipment.join("، ") || "وزن بدن"]]} />
        <ReviewCard title="ترجیحات" href="/onboarding/preferences" rows={[["شدت", draft.preferences.intensity === "challenging" ? "چالش‌برانگیز" : draft.preferences.intensity === "moderate" ? "متعادل" : "ملایم"], ["سبک", draft.preferences.trainingStyle === "mixed" ? "ترکیبی" : draft.preferences.trainingStyle === "resistance" ? "قدرتی" : "عملکردی"], ["تغذیه", draft.preferences.nutritionStrictness === "strict" ? "دقیق" : draft.preferences.nutritionStrictness === "structured" ? "ساختاریافته" : "انعطاف‌پذیر"], ["لحن همراه", draft.preferences.coachingTone === "direct" ? "مستقیم" : draft.preferences.coachingTone === "analytical" ? "تحلیلی" : "حمایتی"]]} />
      </div>

      <div className="mt-6 flex items-start gap-3 rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-5"><CheckCircle2 className="mt-1 h-5 w-5 shrink-0 text-emerald-600" /><p className="text-sm leading-7 text-muted-foreground">تحلیل فعلی برای تکمیل تجربه فرانت به‌صورت محلی و قابل توضیح انجام می‌شود. در فاز اتصال بک‌اند، همین قرارداد داده به موتورهای واقعی برنامه تمرین و تغذیه متصل خواهد شد.</p></div>
      <Button type="button" size="lg" className="mt-8 h-12 w-full text-base" onClick={submit}>شروع تحلیل اطلاعات<ArrowLeft className="mr-2 h-5 w-5" /></Button>
    </OnboardingShell>
  );
}
