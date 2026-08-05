"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Briefcase, Footprints, Moon, Sofa, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { OnboardingLoading, OnboardingShell } from "@/components/onboarding/onboarding-shell";
import { useOnboarding } from "@/context/onboarding-context";
import type { LifestyleSection } from "@/lib/onboarding-model";
import { cn } from "@/lib/utils";

const activityOptions: Array<{ id: LifestyleSection["activityLevel"]; title: string; description: string; icon: typeof Sofa }> = [
  { id: "sedentary", title: "کم‌تحرک", description: "بیشتر روز نشسته و فعالیت روزانه کم", icon: Sofa },
  { id: "light", title: "کمی فعال", description: "پیاده‌روی یا فعالیت سبک چند روز در هفته", icon: Footprints },
  { id: "moderate", title: "فعال", description: "تحرک منظم یا تمرین ۳ تا ۵ روز در هفته", icon: Sparkles },
  { id: "high", title: "بسیار فعال", description: "کار بدنی یا تمرین سنگین بیشتر روزهای هفته", icon: Briefcase },
];

export default function OnboardingLifestylePage() {
  const router = useRouter();
  const { draft, isHydrated, updateSection, completeStep } = useOnboarding();
  const [form, setForm] = React.useState<LifestyleSection>(draft.lifestyle);

  React.useEffect(() => {
    if (isHydrated) setForm(draft.lifestyle);
  }, [draft.lifestyle, isHydrated]);

  if (!isHydrated) return <OnboardingLoading />;

  const patch = <K extends keyof LifestyleSection>(key: K, value: LifestyleSection[K]) => setForm((current) => ({ ...current, [key]: value }));

  const submit = () => {
    updateSection("lifestyle", { ...form, occupation: form.occupation.trim(), routineNotes: form.routineNotes.trim() });
    completeStep(7);
    router.push("/onboarding/nutrition");
  };

  return (
    <OnboardingShell step={7} title="سبک زندگی و ریکاوری" description="میزان تحرک، خواب و استرس تعیین می‌کند برنامه چقدر فشار داشته باشد و چه مقدار ریکاوری نیاز داری." backHref="/onboarding/injuries">
      <div className="space-y-2">
        <Label htmlFor="occupation">شغل یا فعالیت اصلی روزانه</Label>
        <Input id="occupation" value={form.occupation} onChange={(event) => patch("occupation", event.target.value)} placeholder="مثلاً پزشک، برنامه‌نویس، دانشجو یا کار بدنی" />
      </div>

      <div className="mt-6 space-y-3">
        <Label>سطح فعالیت معمول روزانه</Label>
        <div className="grid gap-3 sm:grid-cols-2">
          {activityOptions.map((option) => (
            <Card key={option.id} className={cn("cursor-pointer transition hover:-translate-y-0.5 hover:border-primary", form.activityLevel === option.id && "border-primary ring-2 ring-primary")} onClick={() => patch("activityLevel", option.id)}>
              <CardContent className="flex items-start gap-4 p-4">
                <div className="rounded-2xl bg-primary/10 p-3 text-primary"><option.icon className="h-5 w-5" /></div>
                <div><p className="font-bold">{option.title}</p><p className="mt-1 text-sm leading-6 text-muted-foreground">{option.description}</p></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      <div className="mt-6 grid gap-5 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="sitting-hours">ساعت نشستن در روز</Label>
          <Input id="sitting-hours" type="number" min={0} max={20} value={form.sittingHours ?? ""} onChange={(event) => patch("sittingHours", event.target.value ? Number(event.target.value) : null)} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="daily-steps">میانگین قدم روزانه</Label>
          <Input id="daily-steps" type="number" min={0} step={500} value={form.dailySteps ?? ""} onChange={(event) => patch("dailySteps", event.target.value ? Number(event.target.value) : null)} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="sleep-hours">میانگین خواب شبانه</Label>
          <div className="relative"><Moon className="absolute right-3 top-3 h-4 w-4 text-muted-foreground" /><Input id="sleep-hours" className="pr-10" type="number" min={3} max={12} step={0.5} value={form.sleepHours ?? ""} onChange={(event) => patch("sleepHours", event.target.value ? Number(event.target.value) : null)} /></div>
        </div>
        <div className="space-y-2">
          <Label>کیفیت خواب</Label>
          <Select value={form.sleepQuality} onValueChange={(value: LifestyleSection["sleepQuality"]) => patch("sleepQuality", value)}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="poor">ضعیف و ناپیوسته</SelectItem><SelectItem value="average">متوسط</SelectItem><SelectItem value="good">خوب و کافی</SelectItem></SelectContent></Select>
        </div>
        <div className="space-y-2">
          <Label>سطح استرس معمول</Label>
          <Select value={form.stressLevel} onValueChange={(value: LifestyleSection["stressLevel"]) => patch("stressLevel", value)}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="low">کم</SelectItem><SelectItem value="medium">متوسط</SelectItem><SelectItem value="high">زیاد</SelectItem></SelectContent></Select>
        </div>
        <div className="space-y-2">
          <Label>مصرف دخانیات</Label>
          <Select value={form.smoking} onValueChange={(value: LifestyleSection["smoking"]) => patch("smoking", value)}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="never">مصرف نمی‌کنم</SelectItem><SelectItem value="sometimes">گاهی</SelectItem><SelectItem value="daily">روزانه</SelectItem></SelectContent></Select>
        </div>
      </div>

      <div className="mt-6 space-y-2">
        <Label htmlFor="routine-notes">توضیح برنامه روزانه</Label>
        <Textarea id="routine-notes" value={form.routineNotes} onChange={(event) => patch("routineNotes", event.target.value)} placeholder="ساعت کار، شیفت شب، زمان خواب نامنظم یا هر نکته‌ای که روی برنامه اثر دارد" className="min-h-24" />
      </div>

      <Button type="button" size="lg" className="mt-8 h-12 w-full text-base" onClick={submit}>ادامه به پروفایل تغذیه<ArrowLeft className="mr-2 h-5 w-5" /></Button>
    </OnboardingShell>
  );
}
