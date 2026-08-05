"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { AlertTriangle, ArrowLeft, Beef, CalendarDays, Dumbbell, Flame, Wheat } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { OnboardingLoading, OnboardingShell } from "@/components/onboarding/onboarding-shell";
import { useOnboarding } from "@/context/onboarding-context";
import { deriveInitialPlan } from "@/lib/onboarding-model";

export default function OnboardingResultPage() {
  const router = useRouter();
  const { draft, isHydrated, completeStep } = useOnboarding();
  const plan = React.useMemo(() => deriveInitialPlan(draft), [draft]);
  if (!isHydrated) return <OnboardingLoading />;

  const continueToConfirmation = () => {
    completeStep(14);
    router.push("/onboarding/confirmation");
  };

  return (
    <OnboardingShell step={14} title="نقطه شروع برنامه شما" description="این اعداد و ساختار، خروجی اولیه قابل تنظیم هستند. با ثبت عملکرد واقعی، برنامه در مراحل بعدی دقیق‌تر می‌شود." backHref="/onboarding/analysis">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { label: "کالری روزانه", value: plan.calorieTarget, unit: "کیلوکالری", icon: Flame },
          { label: "پروتئین", value: plan.proteinGrams, unit: "گرم", icon: Beef },
          { label: "کربوهیدرات", value: plan.carbohydrateGrams, unit: "گرم", icon: Wheat },
          { label: "چربی", value: plan.fatGrams, unit: "گرم", icon: Flame },
        ].map((item) => (
          <Card key={item.label}><CardContent className="p-5 text-center"><item.icon className="mx-auto h-6 w-6 text-primary" /><p className="mt-3 text-sm text-muted-foreground">{item.label}</p><p className="mt-1 text-2xl font-black">{item.value}</p><p className="text-xs text-muted-foreground">{item.unit}</p></CardContent></Card>
        ))}
      </div>

      <div className="mt-6 grid gap-5 lg:grid-cols-2">
        <Card>
          <CardHeader><CardTitle className="flex items-center gap-2"><Dumbbell className="h-5 w-5 text-primary" />ساختار تمرین هفتگی</CardTitle></CardHeader>
          <CardContent>
            <div className="mb-4 flex items-center justify-between rounded-2xl bg-muted/40 p-4"><span>{plan.trainingDays} روز تمرین</span><span>{plan.sessionMinutes} دقیقه در هر جلسه</span></div>
            <div className="space-y-3">{plan.weeklyStructure.map((session, index) => <div key={session} className="flex items-center gap-3 rounded-2xl border p-3"><div className="grid h-9 w-9 place-items-center rounded-xl bg-primary/10 font-bold text-primary">{index + 1}</div><span className="font-medium">{session}</span></div>)}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="flex items-center gap-2"><CalendarDays className="h-5 w-5 text-primary" />منطق پیشنهاد</CardTitle></CardHeader>
          <CardContent className="space-y-3">{plan.rationale.map((reason) => <p key={reason} className="rounded-2xl bg-muted/35 p-4 text-sm leading-7 text-muted-foreground">{reason}</p>)}</CardContent>
        </Card>
      </div>

      <Card className="mt-6 border-amber-500/30 bg-amber-500/5">
        <CardHeader><CardTitle className="flex items-center gap-2 text-base"><AlertTriangle className="h-5 w-5 text-amber-600" />ملاحظات سلامت و محدودیت‌ها</CardTitle></CardHeader>
        <CardContent><ul className="space-y-3">{plan.healthCautions.map((caution) => <li key={caution} className="flex gap-3 text-sm leading-7 text-muted-foreground"><span className="mt-2 h-2 w-2 shrink-0 rounded-full bg-amber-500" />{caution}</li>)}</ul></CardContent>
      </Card>

      <p className="mt-6 text-center text-sm leading-7 text-muted-foreground">این خروجی تشخیص یا توصیه پزشکی نیست. در صورت بیماری فعال، درد شدید یا محدودیت پزشک، برنامه باید با متخصص هماهنگ شود.</p>
      <Button type="button" size="lg" className="mt-8 h-12 w-full text-base" onClick={continueToConfirmation}>تأیید تنظیمات شروع<ArrowLeft className="mr-2 h-5 w-5" /></Button>
    </OnboardingShell>
  );
}
