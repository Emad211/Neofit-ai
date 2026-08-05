"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Building2, Clock3, Home, MapPin, TimerReset } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { OnboardingLoading, OnboardingShell } from "@/components/onboarding/onboarding-shell";
import { useOnboarding } from "@/context/onboarding-context";
import type { AvailabilitySection } from "@/lib/onboarding-model";
import { cn } from "@/lib/utils";

const equipmentOptions = [
  ["bodyweight", "وزن بدن"], ["mat", "زیرانداز"], ["bands", "کش تمرینی"], ["dumbbells", "دمبل"], ["barbell", "هالتر"], ["bench", "نیمکت"], ["pullup", "میله بارفیکس"], ["cardio", "دستگاه هوازی"], ["full-gym", "تجهیزات کامل باشگاه"],
] as const;
const weekDays = ["شنبه", "یکشنبه", "دوشنبه", "سه‌شنبه", "چهارشنبه", "پنجشنبه", "جمعه"];

export default function OnboardingAvailabilityPage() {
  const router = useRouter();
  const { draft, isHydrated, updateSection, completeStep } = useOnboarding();
  const [form, setForm] = React.useState<AvailabilitySection>(draft.availability);

  React.useEffect(() => { if (isHydrated) setForm(draft.availability); }, [draft.availability, isHydrated]);
  if (!isHydrated) return <OnboardingLoading />;
  const patch = <K extends keyof AvailabilitySection>(key: K, value: AvailabilitySection[K]) => setForm((current) => ({ ...current, [key]: value }));
  const toggleEquipment = (id: string) => patch("equipment", form.equipment.includes(id) ? form.equipment.filter((item) => item !== id) : [...form.equipment, id]);
  const toggleDay = (day: string) => patch("preferredDays", form.preferredDays.includes(day) ? form.preferredDays.filter((item) => item !== day) : [...form.preferredDays, day]);

  const submit = () => {
    updateSection("availability", { ...form, customEquipment: form.customEquipment.trim(), scheduleNotes: form.scheduleNotes.trim() });
    completeStep(10);
    router.push("/onboarding/preferences");
  };

  return (
    <OnboardingShell step={10} title="زمان، محل و تجهیزات تمرین" description="برنامه فقط وقتی مفید است که با زمان واقعی و وسایلی که در اختیار داری هماهنگ باشد." backHref="/onboarding/training-history">
      <div className="grid gap-4 sm:grid-cols-3">
        {[
          { id: "home", title: "خانه", icon: Home },
          { id: "gym", title: "باشگاه", icon: Building2 },
          { id: "both", title: "هر دو", icon: MapPin },
        ].map((item) => (
          <Card key={item.id} className={cn("cursor-pointer transition hover:border-primary", form.location === item.id && "border-primary ring-2 ring-primary")} onClick={() => patch("location", item.id as AvailabilitySection["location"])}>
            <CardContent className="p-5 text-center"><item.icon className="mx-auto h-7 w-7 text-primary" /><p className="mt-3 font-bold">{item.title}</p></CardContent>
          </Card>
        ))}
      </div>

      <div className="mt-7 space-y-3"><Label>تجهیزات در دسترس</Label><div className="flex flex-wrap gap-2">{equipmentOptions.map(([id, label]) => <Button key={id} type="button" variant={form.equipment.includes(id) ? "default" : "outline"} className="rounded-full" onClick={() => toggleEquipment(id)}>{label}</Button>)}</div></div>
      <div className="mt-5 space-y-2"><Label htmlFor="custom-equipment">وسیله دیگری داری؟</Label><Input id="custom-equipment" value={form.customEquipment} onChange={(event) => patch("customEquipment", event.target.value)} placeholder="مثلاً کتل‌بل، TRX یا دستگاه خاص" /></div>

      <div className="mt-7 grid gap-5 sm:grid-cols-3">
        <div className="space-y-2"><Label>تعداد روز تمرین در هفته</Label><Select value={String(form.daysPerWeek)} onValueChange={(value) => patch("daysPerWeek", Number(value))}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{[2,3,4,5,6].map((day) => <SelectItem key={day} value={String(day)}>{day} روز</SelectItem>)}</SelectContent></Select></div>
        <div className="space-y-2"><Label>مدت هر جلسه</Label><Select value={String(form.sessionDuration)} onValueChange={(value) => patch("sessionDuration", Number(value) as AvailabilitySection["sessionDuration"])}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{[30,45,60,75,90].map((duration) => <SelectItem key={duration} value={String(duration)}>{duration} دقیقه</SelectItem>)}</SelectContent></Select></div>
        <div className="space-y-2"><Label>زمان ترجیحی</Label><Select value={form.preferredTime} onValueChange={(value: AvailabilitySection["preferredTime"]) => patch("preferredTime", value)}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="morning">صبح</SelectItem><SelectItem value="afternoon">ظهر و عصر</SelectItem><SelectItem value="evening">شب</SelectItem><SelectItem value="flexible">انعطاف‌پذیر</SelectItem></SelectContent></Select></div>
      </div>

      <div className="mt-7 space-y-3"><div className="flex items-center gap-2"><Clock3 className="h-5 w-5 text-primary" /><Label>روزهای ترجیحی</Label></div><div className="grid grid-cols-4 gap-2 sm:grid-cols-7">{weekDays.map((day) => <Button key={day} type="button" variant={form.preferredDays.includes(day) ? "default" : "outline"} className="h-11 px-2 text-xs sm:text-sm" onClick={() => toggleDay(day)}>{day}</Button>)}</div><p className="text-xs text-muted-foreground">اگر انتخاب نکنی، برنامه بر اساس تعداد روزها چینش پیشنهادی می‌سازد.</p></div>

      <div className="mt-6 space-y-2"><Label htmlFor="schedule-notes">محدودیت زمانی یا برنامه متغیر</Label><Textarea id="schedule-notes" value={form.scheduleNotes} onChange={(event) => patch("scheduleNotes", event.target.value)} placeholder="مثلاً دوشنبه شیفت شب دارم یا جمعه فقط صبح آزاد هستم" className="min-h-24" /></div>
      <div className="mt-6 flex items-start gap-3 rounded-2xl border bg-muted/30 p-4 text-sm leading-7 text-muted-foreground"><TimerReset className="mt-1 h-5 w-5 shrink-0 text-primary" />در نسخه کامل، جابه‌جایی یک جلسه باعث بازچینی خودکار هفته می‌شود و برنامه از بین نمی‌رود.</div>

      <Button type="button" size="lg" className="mt-8 h-12 w-full text-base" onClick={submit}>ادامه به ترجیحات برنامه<ArrowLeft className="mr-2 h-5 w-5" /></Button>
    </OnboardingShell>
  );
}
