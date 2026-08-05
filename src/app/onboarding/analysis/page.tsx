"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Activity, ArrowLeft, CheckCircle2, Dumbbell, HeartPulse, Salad, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { OnboardingLoading, OnboardingShell } from "@/components/onboarding/onboarding-shell";
import { useOnboarding } from "@/context/onboarding-context";
import { cn } from "@/lib/utils";

const stages = [
  { title: "بررسی هدف و سرعت پیشرفت", description: "تطبیق هدف اصلی با وزن فعلی و وزن هدف", icon: Sparkles },
  { title: "اعمال ملاحظات سلامت", description: "اولویت‌دادن به سابقه پزشکی، آسیب‌ها و محدودیت پزشک", icon: HeartPulse },
  { title: "برآورد انرژی و درشت‌مغذی‌ها", description: "محاسبه نقطه شروع کالری، پروتئین، چربی و کربوهیدرات", icon: Salad },
  { title: "چینش ساختار تمرین", description: "هماهنگ‌سازی تعداد روز، تجهیزات، تجربه و زمان جلسه", icon: Dumbbell },
  { title: "کنترل قابلیت اجرا", description: "بررسی خواب، استرس، بودجه، آشپزی و برنامه روزانه", icon: Activity },
];

export default function OnboardingAnalysisPage() {
  const router = useRouter();
  const { isHydrated, completeStep } = useOnboarding();
  const [activeStage, setActiveStage] = React.useState(0);

  React.useEffect(() => {
    if (!isHydrated || activeStage >= stages.length) return;
    const timer = window.setTimeout(() => setActiveStage((current) => current + 1), 650);
    return () => window.clearTimeout(timer);
  }, [activeStage, isHydrated]);

  if (!isHydrated) return <OnboardingLoading />;
  const finished = activeStage >= stages.length;
  const percent = Math.min(100, Math.round((activeStage / stages.length) * 100));

  const continueToResult = () => {
    completeStep(13);
    router.push("/onboarding/result");
  };

  return (
    <OnboardingShell step={13} title={finished ? "تحلیل اولیه کامل شد" : "در حال تحلیل اطلاعات شما"} description={finished ? "خروجی مرحله بعد یک نقطه شروع شفاف و قابل ویرایش است؛ نه نسخه پزشکی و نه تصمیم غیرقابل تغییر." : "هر بخش جداگانه بررسی می‌شود تا نتیجه فقط یک عدد کالری یا برنامه عمومی نباشد."} backHref="/onboarding/review">
      <div className="rounded-3xl border bg-muted/20 p-5 sm:p-6">
        <div className="mb-5 flex items-center justify-between text-sm"><span className="font-bold">پیشرفت تحلیل</span><span className="text-muted-foreground">{percent}٪</span></div>
        <div className="mb-7 h-2 overflow-hidden rounded-full bg-muted"><div className="h-full rounded-full bg-primary transition-all duration-500" style={{ width: `${percent}%` }} /></div>

        <div className="space-y-3">
          {stages.map((stage, index) => {
            const isDone = index < activeStage;
            const isActive = index === activeStage && !finished;
            return (
              <div key={stage.title} className={cn("flex items-start gap-4 rounded-2xl border p-4 transition", isDone && "border-emerald-500/30 bg-emerald-500/5", isActive && "border-primary bg-primary/5 shadow-sm", index > activeStage && "opacity-50")}>
                <div className={cn("grid h-10 w-10 shrink-0 place-items-center rounded-2xl bg-muted text-muted-foreground", isDone && "bg-emerald-500 text-white", isActive && "bg-primary text-primary-foreground")}>
                  {isDone ? <CheckCircle2 className="h-5 w-5" /> : <stage.icon className={cn("h-5 w-5", isActive && "animate-pulse")} />}
                </div>
                <div><p className="font-bold">{stage.title}</p><p className="mt-1 text-sm leading-6 text-muted-foreground">{stage.description}</p></div>
              </div>
            );
          })}
        </div>
      </div>

      {finished ? <Button type="button" size="lg" className="mt-8 h-12 w-full text-base" onClick={continueToResult}>مشاهده نتیجه اولیه<ArrowLeft className="mr-2 h-5 w-5" /></Button> : <p className="mt-6 text-center text-sm text-muted-foreground">این تحلیل روی همین دستگاه و بدون ارسال اطلاعات به سرویس خارجی اجرا می‌شود.</p>}
    </OnboardingShell>
  );
}
