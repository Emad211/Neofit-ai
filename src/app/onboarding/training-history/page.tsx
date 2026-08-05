"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Bike, Dumbbell, Gauge, HeartPulse, PersonStanding } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { OnboardingLoading, OnboardingShell } from "@/components/onboarding/onboarding-shell";
import { TagEditor } from "@/components/onboarding/tag-editor";
import { useOnboarding } from "@/context/onboarding-context";
import type { TrainingHistorySection } from "@/lib/onboarding-model";
import { cn } from "@/lib/utils";

const quickSports = ["بدنسازی", "فوتبال", "دویدن", "شنا", "دوچرخه‌سواری", "ورزش رزمی", "یوگا", "کوهنوردی"];
const quickMovements = ["اسکوات", "ددلیفت", "پرس سینه", "پرس سرشانه", "بارفیکس", "لانج", "پلانک"];

export default function OnboardingTrainingHistoryPage() {
  const router = useRouter();
  const { draft, isHydrated, updateSection, completeStep } = useOnboarding();
  const [form, setForm] = React.useState<TrainingHistorySection>(draft.trainingHistory);

  React.useEffect(() => {
    if (isHydrated) setForm(draft.trainingHistory);
  }, [draft.trainingHistory, isHydrated]);

  if (!isHydrated) return <OnboardingLoading />;
  const patch = <K extends keyof TrainingHistorySection>(key: K, value: TrainingHistorySection[K]) => setForm((current) => ({ ...current, [key]: value }));
  const toggle = (key: "previousSports" | "familiarMovements", item: string) => patch(key, form[key].includes(item) ? form[key].filter((candidate) => candidate !== item) : [...form[key], item]);

  const submit = () => {
    updateSection("trainingHistory", { ...form, notes: form.notes.trim() });
    completeStep(9);
    router.push("/onboarding/availability");
  };

  return (
    <OnboardingShell step={9} title="سابقه تمرین و تجربه ورزشی" description="سطح واقعی تجربه را ثبت کن تا برنامه نه بیش از حد ساده باشد و نه با فشار نامناسب شروع شود." backHref="/onboarding/nutrition">
      <div className="grid gap-4 sm:grid-cols-3">
        {[
          { id: "beginner", title: "مبتدی", description: "کمتر از ۶ ماه تجربه منظم", icon: PersonStanding },
          { id: "intermediate", title: "متوسط", description: "۶ ماه تا ۲ سال تمرین منظم", icon: Dumbbell },
          { id: "advanced", title: "پیشرفته", description: "بیش از ۲ سال تمرین ساختاریافته", icon: Gauge },
        ].map((item) => (
          <Card key={item.id} className={cn("cursor-pointer transition hover:border-primary", form.level === item.id && "border-primary ring-2 ring-primary")} onClick={() => patch("level", item.id as TrainingHistorySection["level"])}>
            <CardContent className="p-4 text-center"><item.icon className="mx-auto h-7 w-7 text-primary" /><p className="mt-3 font-bold">{item.title}</p><p className="mt-1 text-xs leading-6 text-muted-foreground">{item.description}</p></CardContent>
          </Card>
        ))}
      </div>

      <div className="mt-6 grid gap-5 sm:grid-cols-2">
        <div className="space-y-2"><Label htmlFor="training-age">مجموع سابقه تمرین منظم به ماه</Label><Input id="training-age" type="number" min={0} max={600} value={form.trainingAgeMonths ?? ""} onChange={(event) => patch("trainingAgeMonths", event.target.value ? Number(event.target.value) : null)} /></div>
        <div className="space-y-2"><Label htmlFor="recent-break">مدت وقفه اخیر به هفته</Label><Input id="recent-break" type="number" min={0} max={260} value={form.recentBreakWeeks ?? ""} onChange={(event) => patch("recentBreakWeeks", event.target.value ? Number(event.target.value) : null)} /></div>
      </div>

      <div className="mt-7 space-y-3">
        <div className="flex items-center gap-2"><Bike className="h-5 w-5 text-primary" /><Label>ورزش‌های قبلی</Label></div>
        <div className="flex flex-wrap gap-2">{quickSports.map((sport) => <Button key={sport} type="button" variant={form.previousSports.includes(sport) ? "default" : "outline"} className="rounded-full" onClick={() => toggle("previousSports", sport)}>{sport}</Button>)}</div>
        <TagEditor value={form.previousSports.filter((item) => !quickSports.includes(item))} onChange={(custom) => patch("previousSports", [...form.previousSports.filter((item) => quickSports.includes(item)), ...custom])} placeholder="ورزش دیگری را اضافه کن" />
      </div>

      <div className="mt-7 space-y-3">
        <div className="flex items-center gap-2"><Dumbbell className="h-5 w-5 text-primary" /><Label>حرکت‌هایی که قبلاً انجام داده‌ای</Label></div>
        <div className="flex flex-wrap gap-2">{quickMovements.map((movement) => <Button key={movement} type="button" variant={form.familiarMovements.includes(movement) ? "default" : "outline"} className="rounded-full" onClick={() => toggle("familiarMovements", movement)}>{movement}</Button>)}</div>
      </div>

      <div className="mt-7 grid gap-5 sm:grid-cols-2">
        <div className="space-y-2"><Label>تجربه تمرین هوازی</Label><Select value={form.cardioExperience} onValueChange={(value: TrainingHistorySection["cardioExperience"]) => patch("cardioExperience", value)}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="none">تقریباً ندارم</SelectItem><SelectItem value="basic">مقدماتی</SelectItem><SelectItem value="regular">منظم و آشنا</SelectItem></SelectContent></Select></div>
        <div className="space-y-2"><Label>تجربه تمرین قدرتی</Label><Select value={form.strengthExperience} onValueChange={(value: TrainingHistorySection["strengthExperience"]) => patch("strengthExperience", value)}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="none">تقریباً ندارم</SelectItem><SelectItem value="basic">مقدماتی</SelectItem><SelectItem value="regular">منظم و آشنا</SelectItem></SelectContent></Select></div>
      </div>

      <div className="mt-6 space-y-2"><Label htmlFor="training-notes">توضیح تکمیلی</Label><Textarea id="training-notes" value={form.notes} onChange={(event) => patch("notes", event.target.value)} placeholder="رکوردها، تجربه مربی، حرکات مورد علاقه یا دلیل وقفه اخیر" className="min-h-24" /></div>

      <div className="mt-6 flex items-start gap-3 rounded-2xl border bg-muted/30 p-4 text-sm leading-7 text-muted-foreground"><HeartPulse className="mt-1 h-5 w-5 shrink-0 text-primary" />اگر بعد از وقفه طولانی برمی‌گردی، برنامه با حجم کمتر و افزایش تدریجی شروع می‌شود.</div>

      <Button type="button" size="lg" className="mt-8 h-12 w-full text-base" onClick={submit}>ادامه به زمان و تجهیزات<ArrowLeft className="mr-2 h-5 w-5" /></Button>
    </OnboardingShell>
  );
}
