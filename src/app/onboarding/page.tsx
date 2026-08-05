"use client";

import Link from "next/link";
import { ArrowLeft, CheckCircle2, Clock3, ShieldCheck, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { OnboardingLoading, OnboardingShell } from "@/components/onboarding/onboarding-shell";
import { useOnboarding } from "@/context/onboarding-context";

const promises = [
  { icon: Sparkles, title: "برنامه واقعاً شخصی", text: "تمرین و تغذیه بر اساس هدف، بدن، محدودیت‌ها و زمان واقعی تو تنظیم می‌شود." },
  { icon: ShieldCheck, title: "با اولویت ایمنی", text: "سابقه پزشکی و آسیب‌ها پیش از پیشنهاد تمرین در نظر گرفته می‌شوند." },
  { icon: Clock3, title: "حدود ۷ دقیقه", text: "پاسخ‌ها خودکار ذخیره می‌شوند و می‌توانی بعداً ادامه بدهی." },
];

export default function OnboardingWelcomePage() {
  const { draft, isHydrated, completeStep, resetDraft } = useOnboarding();

  if (!isHydrated) return <OnboardingLoading />;

  const hasProgress = draft.completedSteps.length > 0 || Boolean(draft.goal.primaryGoal || draft.basics.name);

  return (
    <OnboardingShell
      step={1}
      title="برنامه‌ای که با زندگی تو هماهنگ باشد"
      description="چند سؤال کوتاه می‌پرسیم تا NeoFit بتواند هدف، توان بدنی، وضعیت سلامت، تغذیه و برنامه تمرینی مناسب تو را کنار هم قرار دهد."
      onReset={hasProgress ? resetDraft : undefined}
    >
      <div className="grid gap-4 sm:grid-cols-3">
        {promises.map((item) => (
          <div key={item.title} className="rounded-2xl border bg-background/60 p-5">
            <item.icon className="mb-4 h-7 w-7 text-primary" />
            <h2 className="font-bold text-foreground">{item.title}</h2>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">{item.text}</p>
          </div>
        ))}
      </div>

      <div className="mt-6 rounded-2xl bg-primary/5 p-5">
        <div className="flex items-start gap-3">
          <CheckCircle2 className="mt-1 h-5 w-5 shrink-0 text-primary" />
          <p className="text-sm leading-7 text-muted-foreground">
            NeoFit جایگزین ارزیابی پزشکی نیست. اگر محدودیت، درد یا بیماری زمینه‌ای داری، آن را دقیق وارد کن تا برنامهٔ نمایشی از محدودهٔ ایمن خارج نشود.
          </p>
        </div>
      </div>

      <Button asChild size="lg" className="mt-8 h-12 w-full text-base" onClick={() => completeStep(1)}>
        <Link href="/onboarding/goal">
          {hasProgress ? "ادامهٔ تکمیل اطلاعات" : "شروع شخصی‌سازی"}
          <ArrowLeft className="mr-2 h-5 w-5" />
        </Link>
      </Button>
    </OnboardingShell>
  );
}
