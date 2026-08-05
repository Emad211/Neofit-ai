"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { AlertTriangle, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { InjuryBodyMap } from "@/components/onboarding/body-map/injury-body-map";
import { OnboardingLoading, OnboardingShell } from "@/components/onboarding/onboarding-shell";
import { useOnboarding } from "@/context/onboarding-context";
import type { InjuryArea } from "@/lib/onboarding-model";

export default function OnboardingInjuriesPage() {
  const router = useRouter();
  const { draft, isHydrated, updateSection, completeStep } = useOnboarding();
  const [noInjuries, setNoInjuries] = React.useState(false);
  const [areas, setAreas] = React.useState<InjuryArea[]>([]);
  const [painDuringExercise, setPainDuringExercise] = React.useState(false);
  const [painScale, setPainScale] = React.useState<number | null>(null);
  const [generalLimitations, setGeneralLimitations] = React.useState("");
  const [submitted, setSubmitted] = React.useState(false);

  React.useEffect(() => {
    if (!isHydrated) return;
    setNoInjuries(draft.injuries.noInjuries);
    setAreas(draft.injuries.areas);
    setPainDuringExercise(draft.injuries.painDuringExercise);
    setPainScale(draft.injuries.painScale);
    setGeneralLimitations(draft.injuries.generalLimitations);
  }, [draft.injuries, isHydrated]);

  if (!isHydrated) return <OnboardingLoading />;

  const setHealthy = (checked: boolean) => {
    setNoInjuries(checked);
    if (checked) {
      setAreas([]);
      setPainDuringExercise(false);
      setPainScale(null);
    }
  };

  const submit = () => {
    setSubmitted(true);
    if (!noInjuries && areas.length === 0) return;
    updateSection("injuries", {
      noInjuries,
      areas: noInjuries ? [] : areas,
      painDuringExercise: noInjuries ? false : painDuringExercise,
      painScale: noInjuries || !painDuringExercise ? null : painScale,
      generalLimitations: generalLimitations.trim(),
    });
    completeStep(6);
    router.push("/onboarding/lifestyle");
  };

  return (
    <OnboardingShell
      step={6}
      title="آسیب‌ها و محدودیت‌های حرکتی"
      description="دقیقاً روی ناحیه آسیب‌دیده در نمای کامل جلو یا پشت بدن بزن. این انتخاب برای حذف یا جایگزینی حرکت‌های نامناسب استفاده می‌شود."
      backHref="/onboarding/medical"
    >
      <Label className="mb-6 flex cursor-pointer items-start gap-3 rounded-2xl border bg-muted/20 p-5">
        <Checkbox checked={noInjuries} onCheckedChange={(checked) => setHealthy(Boolean(checked))} className="mt-1" />
        <span>
          <span className="block font-bold">در حال حاضر آسیب یا محدودیت حرکتی ندارم</span>
          <span className="mt-1 block text-sm leading-7 text-muted-foreground">در این حالت می‌توانی بدون انتخاب ناحیه ادامه بدهی.</span>
        </span>
      </Label>

      {!noInjuries ? (
        <>
          <InjuryBodyMap value={areas} onChange={setAreas} />

          {submitted && areas.length === 0 ? (
            <p className="mt-3 text-sm text-destructive">حداقل یک ناحیه را روی بدن انتخاب کن یا گزینه «آسیب ندارم» را بزن.</p>
          ) : null}

          <div className="mt-6 grid gap-5 rounded-3xl border p-5 sm:grid-cols-2">
            <Label className="flex cursor-pointer items-start gap-3">
              <Checkbox checked={painDuringExercise} onCheckedChange={(checked) => setPainDuringExercise(Boolean(checked))} className="mt-1" />
              <span>
                <span className="block font-semibold">هنگام تمرین درد فعال دارم</span>
                <span className="mt-1 block text-sm leading-6 text-muted-foreground">دردی که با حرکت یا فشار بیشتر می‌شود.</span>
              </span>
            </Label>

            {painDuringExercise ? (
              <div className="space-y-2">
                <Label htmlFor="pain-scale">شدت درد فعلی: {painScale ?? 0} از ۱۰</Label>
                <input
                  id="pain-scale"
                  type="range"
                  min={0}
                  max={10}
                  value={painScale ?? 0}
                  onChange={(event) => setPainScale(Number(event.target.value))}
                  className="w-full accent-[hsl(var(--primary))]"
                />
              </div>
            ) : (
              <div className="rounded-2xl bg-muted/50 p-4 text-sm leading-7 text-muted-foreground">
                اگر درد فعال نداری، سابقه آسیب هر ناحیه را در همان کارت روی حالت «آسیب قبلی» قرار بده.
              </div>
            )}
          </div>
        </>
      ) : null}

      <div className="mt-6 space-y-2">
        <Label htmlFor="general-limitations">توضیح کلی یا محدودیت دیگری که باید بدانیم</Label>
        <Textarea
          id="general-limitations"
          value={generalLimitations}
          onChange={(event) => setGeneralLimitations(event.target.value)}
          placeholder="مثلاً در نشستن طولانی، بالا رفتن از پله یا بلندکردن دست محدودیت دارم"
          className="min-h-28"
        />
      </div>

      {!noInjuries && areas.some((area) => area.severity === "severe" || area.status === "current") ? (
        <div className="mt-6 flex items-start gap-3 rounded-2xl border border-amber-500/30 bg-amber-500/10 p-5">
          <AlertTriangle className="mt-1 h-5 w-5 shrink-0 text-amber-600" />
          <p className="text-sm leading-7 text-muted-foreground">
            آسیب فعال یا شدید ثبت شده است. نسخه نهایی برنامه برای این نواحی محافظه‌کار خواهد بود و در صورت درد مداوم یا تشدیدشونده، ارزیابی پزشک یا فیزیوتراپیست اولویت دارد.
          </p>
        </div>
      ) : null}

      <Button type="button" size="lg" className="mt-8 h-12 w-full text-base" onClick={submit}>
        ادامه به سبک زندگی
        <ArrowLeft className="mr-2 h-5 w-5" />
      </Button>
    </OnboardingShell>
  );
}
