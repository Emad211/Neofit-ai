import Link from "next/link";
import { ArrowRight, Dumbbell, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ONBOARDING_TOTAL_STEPS, onboardingSteps } from "@/lib/onboarding-model";

export function OnboardingShell({
  step,
  title,
  description,
  children,
  backHref,
  onReset,
}: {
  step: number;
  title: string;
  description: string;
  children: React.ReactNode;
  backHref?: string;
  onReset?: () => void;
}) {
  const percent = Math.round((step / ONBOARDING_TOTAL_STEPS) * 100);
  const stepMeta = onboardingSteps.find((item) => item.number === step);

  return (
    <main dir="rtl" className="min-h-screen bg-gradient-to-b from-primary/10 via-background to-background px-4 py-6 sm:px-6 sm:py-10">
      <div className="mx-auto w-full max-w-3xl">
        <header className="mb-6 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="grid h-11 w-11 place-items-center rounded-2xl bg-primary text-primary-foreground shadow-sm">
              <Dumbbell className="h-6 w-6" />
            </div>
            <div>
              <p className="font-extrabold text-foreground">NeoFit</p>
              <p className="text-xs text-muted-foreground">ساخت برنامه شخصی شما</p>
            </div>
          </div>
          {onReset ? (
            <Button type="button" variant="ghost" size="sm" onClick={onReset} className="text-muted-foreground">
              <RotateCcw className="ml-2 h-4 w-4" />
              شروع دوباره
            </Button>
          ) : null}
        </header>

        <Card className="overflow-hidden border-border/70 bg-card/95 shadow-xl shadow-primary/5 backdrop-blur">
          <div className="border-b bg-muted/30 px-5 py-4 sm:px-8">
            <div className="mb-3 flex items-center justify-between text-xs font-medium text-muted-foreground">
              <span>مرحله {step} از {ONBOARDING_TOTAL_STEPS}</span>
              <span>{stepMeta?.label}</span>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-muted">
              <div className="h-full rounded-full bg-primary transition-all duration-500" style={{ width: `${percent}%` }} />
            </div>
          </div>

          <div className="px-5 py-7 sm:px-8 sm:py-9">
            {backHref ? (
              <Button variant="ghost" size="sm" asChild className="mb-5 -mr-3 text-muted-foreground">
                <Link href={backHref}>
                  <ArrowRight className="ml-2 h-4 w-4" />
                  بازگشت
                </Link>
              </Button>
            ) : null}

            <div className="mb-8">
              <h1 className="text-2xl font-black tracking-tight text-foreground sm:text-3xl">{title}</h1>
              <p className="mt-3 max-w-2xl leading-7 text-muted-foreground">{description}</p>
            </div>

            {children}
          </div>
        </Card>

        <p className="mt-5 text-center text-xs leading-6 text-muted-foreground">
          پاسخ‌ها در همین دستگاه ذخیره می‌شوند و هر زمان می‌توانی ادامه بدهی یا آن‌ها را تغییر دهی.
        </p>
      </div>
    </main>
  );
}

export function OnboardingLoading() {
  return (
    <div dir="rtl" className="flex min-h-screen items-center justify-center bg-background p-6">
      <div className="w-full max-w-2xl space-y-4 rounded-3xl border bg-card p-8 shadow-sm">
        <div className="h-2 w-full animate-pulse rounded-full bg-muted" />
        <div className="h-9 w-2/3 animate-pulse rounded-xl bg-muted" />
        <div className="h-5 w-full animate-pulse rounded-lg bg-muted" />
        <div className="h-48 w-full animate-pulse rounded-2xl bg-muted" />
      </div>
    </div>
  );
}
