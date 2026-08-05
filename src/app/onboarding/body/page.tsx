"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Camera, CircleHelp, Ruler } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { OnboardingLoading, OnboardingShell } from "@/components/onboarding/onboarding-shell";
import { useOnboarding } from "@/context/onboarding-context";

function numericOrNull(value: string) {
  if (!value.trim()) return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

export default function OnboardingBodyPage() {
  const router = useRouter();
  const { draft, isHydrated, updateSection, completeStep } = useOnboarding();
  const [waist, setWaist] = React.useState("");
  const [hip, setHip] = React.useState("");
  const [neck, setNeck] = React.useState("");
  const [bodyFat, setBodyFat] = React.useState("");
  const [targetWeight, setTargetWeight] = React.useState("");
  const [photoOptIn, setPhotoOptIn] = React.useState(false);
  const [submitted, setSubmitted] = React.useState(false);

  React.useEffect(() => {
    if (!isHydrated) return;
    setWaist(draft.body.waistCm ? String(draft.body.waistCm) : "");
    setHip(draft.body.hipCm ? String(draft.body.hipCm) : "");
    setNeck(draft.body.neckCm ? String(draft.body.neckCm) : "");
    setBodyFat(draft.body.bodyFatPercent ? String(draft.body.bodyFatPercent) : "");
    setTargetWeight(draft.body.targetWeightKg ? String(draft.body.targetWeightKg) : "");
    setPhotoOptIn(draft.body.progressPhotoOptIn);
  }, [draft.body, isHydrated]);

  if (!isHydrated) return <OnboardingLoading />;

  const currentWeight = draft.basics.weightKg || 75;
  const target = numericOrNull(targetWeight);
  const targetValid = target !== null && target >= 30 && target <= 300;
  const measurementsValid = [waist, hip, neck].every((value) => !value || (Number(value) >= 30 && Number(value) <= 250));
  const bodyFatValid = !bodyFat || (Number(bodyFat) >= 3 && Number(bodyFat) <= 70);

  const submit = () => {
    setSubmitted(true);
    if (!targetValid || !measurementsValid || !bodyFatValid) return;
    updateSection("body", {
      waistCm: numericOrNull(waist),
      hipCm: numericOrNull(hip),
      neckCm: numericOrNull(neck),
      bodyFatPercent: numericOrNull(bodyFat),
      targetWeightKg: target,
      progressPhotoOptIn: photoOptIn,
    });
    completeStep(4);
    router.push("/onboarding/medical");
  };

  return (
    <OnboardingShell
      step={4}
      title="اندازه‌های بدنی"
      description="وزن هدف ضروری است؛ سایر اندازه‌ها اختیاری‌اند اما به نمایش دقیق‌تر روند تغییرات کمک می‌کنند. برای اندازه‌گیری از متر پارچه‌ای و حالت طبیعی بدن استفاده کن."
      backHref="/onboarding/basics"
    >
      <div className="rounded-2xl border bg-primary/5 p-5">
        <div className="flex items-start gap-3">
          <CircleHelp className="mt-1 h-5 w-5 shrink-0 text-primary" />
          <div>
            <p className="font-bold">وزن فعلی ثبت‌شده: {currentWeight} کیلوگرم</p>
            <p className="mt-1 text-sm leading-6 text-muted-foreground">هدف می‌تواند بعداً تغییر کند. NeoFit از هدف‌های غیرواقعی یا تغییرات بسیار سریع پشتیبانی نخواهد کرد.</p>
          </div>
        </div>
      </div>

      <div className="mt-6 space-y-2">
        <Label htmlFor="target-weight">وزن هدف *</Label>
        <div className="relative">
          <Input id="target-weight" type="number" min={30} max={300} step="0.1" value={targetWeight} onChange={(event) => setTargetWeight(event.target.value)} className="pl-20" placeholder="مثلاً ۷۰" />
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">کیلوگرم</span>
        </div>
        {submitted && !targetValid ? <p className="text-sm text-destructive">وزن هدف معتبر وارد کن.</p> : null}
      </div>

      <div className="mt-6 grid gap-4 sm:grid-cols-3">
        {[
          { id: "waist", label: "دور کمر", value: waist, setter: setWaist, helper: "روی ناف، بدون حبس نفس" },
          { id: "hip", label: "دور لگن", value: hip, setter: setHip, helper: "پهن‌ترین بخش لگن" },
          { id: "neck", label: "دور گردن", value: neck, setter: setNeck, helper: "کمی پایین‌تر از حنجره" },
        ].map((item) => (
          <div key={item.id} className="rounded-2xl border bg-background/60 p-4">
            <div className="mb-3 flex items-center gap-2"><Ruler className="h-4 w-4 text-primary" /><Label htmlFor={item.id}>{item.label}</Label></div>
            <Input id={item.id} type="number" min={30} max={250} step="0.1" value={item.value} onChange={(event) => item.setter(event.target.value)} placeholder="اختیاری" />
            <p className="mt-2 text-xs leading-5 text-muted-foreground">{item.helper}</p>
          </div>
        ))}
      </div>
      {submitted && !measurementsValid ? <p className="mt-2 text-sm text-destructive">اندازه‌های واردشده باید بین ۳۰ تا ۲۵۰ سانتی‌متر باشند.</p> : null}

      <div className="mt-6 space-y-2">
        <Label htmlFor="body-fat">درصد چربی بدن</Label>
        <Input id="body-fat" type="number" min={3} max={70} step="0.1" value={bodyFat} onChange={(event) => setBodyFat(event.target.value)} placeholder="اختیاری؛ فقط اگر اندازه‌گیری قابل‌اعتماد داری" />
        {submitted && !bodyFatValid ? <p className="text-sm text-destructive">درصد چربی باید بین ۳ تا ۷۰ باشد.</p> : null}
      </div>

      <Label className="mt-6 flex cursor-pointer items-start gap-3 rounded-2xl border p-5">
        <Checkbox checked={photoOptIn} onCheckedChange={(checked) => setPhotoOptIn(Boolean(checked))} className="mt-1" />
        <Camera className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
        <span>
          <span className="block font-bold">مایلم بعداً عکس پیشرفت خصوصی ثبت کنم</span>
          <span className="mt-1 block text-sm leading-6 text-muted-foreground">در این مرحله عکسی دریافت نمی‌شود؛ فقط قابلیت آن در بخش پیشرفت فعال خواهد شد.</span>
        </span>
      </Label>

      <Button type="button" size="lg" className="mt-8 h-12 w-full text-base" onClick={submit}>
        ادامه
        <ArrowLeft className="mr-2 h-5 w-5" />
      </Button>
    </OnboardingShell>
  );
}
