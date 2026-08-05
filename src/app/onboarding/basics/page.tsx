"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Ruler, Scale } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { OnboardingLoading, OnboardingShell } from "@/components/onboarding/onboarding-shell";
import { useOnboarding } from "@/context/onboarding-context";
import type { GenderId, UnitSystem } from "@/lib/onboarding-model";

const genders: Array<{ value: GenderId; label: string }> = [
  { value: "male", label: "مرد" },
  { value: "female", label: "زن" },
  { value: "other", label: "سایر" },
  { value: "prefer-not-to-say", label: "ترجیح می‌دهم نگویم" },
];

export default function OnboardingBasicsPage() {
  const router = useRouter();
  const { draft, isHydrated, updateSection, completeStep } = useOnboarding();
  const [name, setName] = React.useState("");
  const [age, setAge] = React.useState("");
  const [gender, setGender] = React.useState<GenderId | null>(null);
  const [height, setHeight] = React.useState("176");
  const [weight, setWeight] = React.useState("75");
  const [country, setCountry] = React.useState("ایران");
  const [unitSystem, setUnitSystem] = React.useState<UnitSystem>("metric");
  const [submitted, setSubmitted] = React.useState(false);

  React.useEffect(() => {
    if (!isHydrated) return;
    setName(draft.basics.name);
    setAge(draft.basics.age ? String(draft.basics.age) : "");
    setGender(draft.basics.gender);
    setHeight(draft.basics.heightCm ? String(draft.basics.heightCm) : "176");
    setWeight(draft.basics.weightKg ? String(draft.basics.weightKg) : "75");
    setCountry(draft.basics.country || "ایران");
    setUnitSystem(draft.basics.unitSystem);
  }, [draft.basics, isHydrated]);

  if (!isHydrated) return <OnboardingLoading />;

  const ageNumber = Number(age);
  const heightNumber = Number(height);
  const weightNumber = Number(weight);
  const valid =
    name.trim().length >= 2 &&
    ageNumber >= 16 &&
    ageNumber <= 100 &&
    Boolean(gender) &&
    heightNumber >= 100 &&
    heightNumber <= 250 &&
    weightNumber >= 30 &&
    weightNumber <= 300;

  const submit = () => {
    setSubmitted(true);
    if (!valid || !gender) return;
    updateSection("basics", {
      name: name.trim(),
      age: ageNumber,
      gender,
      heightCm: heightNumber,
      weightKg: weightNumber,
      country: country.trim() || "ایران",
      unitSystem,
    });
    completeStep(3);
    router.push("/onboarding/body");
  };

  return (
    <OnboardingShell
      step={3}
      title="مشخصات پایه"
      description="این اطلاعات برای محاسبات اولیه و شخصی‌سازی نمایش برنامه استفاده می‌شوند. بعداً از پروفایل قابل ویرایش هستند."
      backHref="/onboarding/goal"
    >
      <div className="grid gap-5 sm:grid-cols-2">
        <div className="space-y-2 sm:col-span-2">
          <Label htmlFor="name">نامی که در برنامه نمایش داده شود</Label>
          <Input id="name" value={name} onChange={(event) => setName(event.target.value)} placeholder="مثلاً عماد" autoComplete="name" />
          {submitted && name.trim().length < 2 ? <p className="text-sm text-destructive">نام را کامل وارد کن.</p> : null}
        </div>

        <div className="space-y-2">
          <Label htmlFor="age">سن</Label>
          <Input id="age" type="number" min={16} max={100} value={age} onChange={(event) => setAge(event.target.value)} placeholder="۲۵" />
          {submitted && !(ageNumber >= 16 && ageNumber <= 100) ? <p className="text-sm text-destructive">سن باید بین ۱۶ تا ۱۰۰ باشد.</p> : null}
        </div>

        <div className="space-y-2">
          <Label htmlFor="country">کشور</Label>
          <Select value={country} onValueChange={setCountry}>
            <SelectTrigger id="country"><SelectValue placeholder="انتخاب کشور" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="ایران">ایران</SelectItem>
              <SelectItem value="ترکیه">ترکیه</SelectItem>
              <SelectItem value="امارات">امارات</SelectItem>
              <SelectItem value="آلمان">آلمان</SelectItem>
              <SelectItem value="سایر">سایر</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="mt-6 space-y-3">
        <Label>جنسیت</Label>
        <RadioGroup value={gender || ""} onValueChange={(value) => setGender(value as GenderId)} className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {genders.map((item) => (
            <Label key={item.value} className={cn("cursor-pointer rounded-2xl border p-4 text-center text-sm", gender === item.value && "border-primary bg-primary/5 ring-2 ring-primary/20")}>
              <RadioGroupItem value={item.value} className="sr-only" />
              {item.label}
            </Label>
          ))}
        </RadioGroup>
        {submitted && !gender ? <p className="text-sm text-destructive">یک گزینه را انتخاب کن.</p> : null}
      </div>

      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        <div className="rounded-2xl border bg-background/60 p-5">
          <div className="mb-3 flex items-center gap-2"><Ruler className="h-5 w-5 text-primary" /><Label htmlFor="height">قد به سانتی‌متر</Label></div>
          <Input id="height" type="number" min={100} max={250} value={height} onChange={(event) => setHeight(event.target.value)} />
          {submitted && !(heightNumber >= 100 && heightNumber <= 250) ? <p className="mt-2 text-sm text-destructive">قد معتبر وارد کن.</p> : null}
        </div>
        <div className="rounded-2xl border bg-background/60 p-5">
          <div className="mb-3 flex items-center gap-2"><Scale className="h-5 w-5 text-primary" /><Label htmlFor="weight">وزن به کیلوگرم</Label></div>
          <Input id="weight" type="number" min={30} max={300} step="0.1" value={weight} onChange={(event) => setWeight(event.target.value)} />
          {submitted && !(weightNumber >= 30 && weightNumber <= 300) ? <p className="mt-2 text-sm text-destructive">وزن معتبر وارد کن.</p> : null}
        </div>
      </div>

      <div className="mt-6 space-y-3">
        <Label>واحد اندازه‌گیری</Label>
        <RadioGroup value={unitSystem} onValueChange={(value) => setUnitSystem(value as UnitSystem)} className="grid grid-cols-2 gap-3">
          <Label className={cn("cursor-pointer rounded-2xl border p-4 text-center", unitSystem === "metric" && "border-primary bg-primary/5 ring-2 ring-primary/20")}>
            <RadioGroupItem value="metric" className="sr-only" />متریک؛ کیلوگرم و سانتی‌متر
          </Label>
          <Label className={cn("cursor-pointer rounded-2xl border p-4 text-center", unitSystem === "imperial" && "border-primary bg-primary/5 ring-2 ring-primary/20")}>
            <RadioGroupItem value="imperial" className="sr-only" />امپریال؛ پوند و اینچ
          </Label>
        </RadioGroup>
        <p className="text-xs leading-6 text-muted-foreground">در این نسخه داده‌ها به‌صورت استاندارد متریک ذخیره می‌شوند و نمایش امپریال در فاز تنظیمات تکمیل می‌شود.</p>
      </div>

      <Button type="button" size="lg" className="mt-8 h-12 w-full text-base" onClick={submit}>
        ادامه
        <ArrowLeft className="mr-2 h-5 w-5" />
      </Button>
    </OnboardingShell>
  );
}
