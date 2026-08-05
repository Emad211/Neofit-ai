"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { AlertTriangle, ArrowLeft, HeartPulse, Pill } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { OnboardingLoading, OnboardingShell } from "@/components/onboarding/onboarding-shell";
import { useOnboarding } from "@/context/onboarding-context";

const conditionOptions = [
  ["none", "هیچ‌کدام"],
  ["thyroid", "اختلال تیروئید"],
  ["metabolic", "اختلال متابولیک"],
  ["respiratory", "آسم یا بیماری تنفسی"],
  ["kidney", "بیماری کلیوی"],
  ["liver", "بیماری کبدی"],
  ["pregnancy", "بارداری یا پس از زایمان"],
  ["other", "سایر موارد"],
] as const;

export default function OnboardingMedicalPage() {
  const router = useRouter();
  const { draft, isHydrated, updateSection, completeStep } = useOnboarding();
  const [conditions, setConditions] = React.useState<string[]>([]);
  const [medications, setMedications] = React.useState("");
  const [highBloodPressure, setHighBloodPressure] = React.useState(false);
  const [diabetes, setDiabetes] = React.useState(false);
  const [cardiacHistory, setCardiacHistory] = React.useState(false);
  const [restrictions, setRestrictions] = React.useState("");
  const [acknowledged, setAcknowledged] = React.useState(false);
  const [submitted, setSubmitted] = React.useState(false);

  React.useEffect(() => {
    if (!isHydrated) return;
    setConditions(draft.medical.conditions);
    setMedications(draft.medical.medications);
    setHighBloodPressure(draft.medical.hasHighBloodPressure);
    setDiabetes(draft.medical.hasDiabetes);
    setCardiacHistory(draft.medical.hasCardiacHistory);
    setRestrictions(draft.medical.physicianRestrictions);
    setAcknowledged(draft.medical.medicalAcknowledged);
  }, [draft.medical, isHydrated]);

  if (!isHydrated) return <OnboardingLoading />;

  const toggleCondition = (id: string) => {
    setConditions((current) => {
      if (id === "none") return current.includes("none") ? [] : ["none"];
      const withoutNone = current.filter((item) => item !== "none");
      return withoutNone.includes(id) ? withoutNone.filter((item) => item !== id) : [...withoutNone, id];
    });
  };

  const submit = () => {
    setSubmitted(true);
    if (!acknowledged) return;
    updateSection("medical", {
      conditions,
      medications: medications.trim(),
      hasHighBloodPressure: highBloodPressure,
      hasDiabetes: diabetes,
      hasCardiacHistory: cardiacHistory,
      physicianRestrictions: restrictions.trim(),
      medicalAcknowledged: acknowledged,
    });
    completeStep(5);
    router.push("/onboarding/injuries");
  };

  const riskFlag = highBloodPressure || diabetes || cardiacHistory || conditions.some((item) => item !== "none");

  return (
    <OnboardingShell
      step={5}
      title="سابقه پزشکی و محدودیت‌های سلامت"
      description="این بخش برای حذف تمرین‌ها و پیشنهادهای نامناسب استفاده می‌شود. NeoFit تشخیص پزشکی نمی‌دهد و پاسخ‌ها جایگزین نظر پزشک نیستند."
      backHref="/onboarding/body"
    >
      <div className="grid gap-3 sm:grid-cols-2">
        {conditionOptions.map(([id, label]) => (
          <Label key={id} className="flex cursor-pointer items-center gap-3 rounded-2xl border p-4">
            <Checkbox checked={conditions.includes(id)} onCheckedChange={() => toggleCondition(id)} />
            <span>{label}</span>
          </Label>
        ))}
      </div>

      <div className="mt-6 grid gap-3 sm:grid-cols-3">
        {[
          { value: highBloodPressure, setter: setHighBloodPressure, label: "فشارخون بالا", icon: HeartPulse },
          { value: diabetes, setter: setDiabetes, label: "دیابت", icon: Pill },
          { value: cardiacHistory, setter: setCardiacHistory, label: "سابقه قلبی", icon: HeartPulse },
        ].map((item) => (
          <Label key={item.label} className="flex cursor-pointer items-center gap-3 rounded-2xl border p-4">
            <Checkbox checked={item.value} onCheckedChange={(checked) => item.setter(Boolean(checked))} />
            <item.icon className="h-5 w-5 text-primary" />
            <span className="font-medium">{item.label}</span>
          </Label>
        ))}
      </div>

      <div className="mt-6 grid gap-5 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="medications">داروهای مصرفی</Label>
          <Textarea id="medications" value={medications} onChange={(event) => setMedications(event.target.value)} placeholder="نام دارو، دوز یا بنویس: مصرف نمی‌کنم" className="min-h-28" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="restrictions">توصیه یا محدودیت پزشک</Label>
          <Textarea id="restrictions" value={restrictions} onChange={(event) => setRestrictions(event.target.value)} placeholder="مثلاً منع فعالیت پرفشار یا محدودیت ضربان قلب" className="min-h-28" />
        </div>
      </div>

      {riskFlag ? (
        <div className="mt-6 flex items-start gap-3 rounded-2xl border border-amber-500/30 bg-amber-500/10 p-5">
          <AlertTriangle className="mt-1 h-5 w-5 shrink-0 text-amber-600" />
          <p className="text-sm leading-7 text-muted-foreground">
            یکی از موارد نیازمند توجه انتخاب شده است. در نسخهٔ نهایی، پیش از فعال‌شدن شدت‌های بالا یا توصیه‌های حساس، تأیید پزشکی یا محدودیت محافظه‌کارانه اعمال می‌شود.
          </p>
        </div>
      ) : null}

      <Label className="mt-6 flex cursor-pointer items-start gap-3 rounded-2xl border p-5">
        <Checkbox checked={acknowledged} onCheckedChange={(checked) => setAcknowledged(Boolean(checked))} className="mt-1" />
        <span className="text-sm leading-7">
          تأیید می‌کنم اطلاعات را تا حد امکان درست وارد کرده‌ام و می‌دانم این برنامه جایگزین ارزیابی و درمان پزشکی نیست.
        </span>
      </Label>
      {submitted && !acknowledged ? <p className="mt-2 text-sm text-destructive">برای ادامه، این تأیید ضروری است.</p> : null}

      <Button type="button" size="lg" className="mt-8 h-12 w-full text-base" onClick={submit}>
        ادامه به آسیب‌ها و محدودیت حرکتی
        <ArrowLeft className="mr-2 h-5 w-5" />
      </Button>
    </OnboardingShell>
  );
}
