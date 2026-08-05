"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Activity, ArrowLeft, Dumbbell, HeartPulse, Leaf, Scale } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { cn } from "@/lib/utils";
import { OnboardingLoading, OnboardingShell } from "@/components/onboarding/onboarding-shell";
import { useOnboarding } from "@/context/onboarding-context";
import { goalLabels, type GoalId } from "@/lib/onboarding-model";

const goals: Array<{ id: GoalId; icon: React.ElementType; description: string }> = [
  { id: "weight-loss", icon: Scale, description: "کاهش وزن پایدار همراه با حفظ عضله و انرژی روزانه" },
  { id: "muscle-gain", icon: Dumbbell, description: "افزایش حجم و قدرت با تمرین و تغذیهٔ هدفمند" },
  { id: "maintenance", icon: HeartPulse, description: "حفظ وزن، فرم بدنی و عادت‌های سالم فعلی" },
  { id: "fitness", icon: Activity, description: "افزایش استقامت، تحرک و آمادگی عمومی بدن" },
  { id: "lifestyle", icon: Leaf, description: "خواب، تغذیه، تحرک و نظم روزانهٔ بهتر" },
];

export default function OnboardingGoalPage() {
  const router = useRouter();
  const { draft, isHydrated, updateSection, completeStep } = useOnboarding();
  const [primaryGoal, setPrimaryGoal] = React.useState<GoalId | null>(null);
  const [secondaryGoals, setSecondaryGoals] = React.useState<GoalId[]>([]);
  const [timeline, setTimeline] = React.useState<"steady" | "balanced" | "fast">("balanced");

  React.useEffect(() => {
    if (!isHydrated) return;
    setPrimaryGoal(draft.goal.primaryGoal);
    setSecondaryGoals(draft.goal.secondaryGoals);
    setTimeline(draft.goal.targetTimeline);
  }, [draft.goal, isHydrated]);

  if (!isHydrated) return <OnboardingLoading />;

  const toggleSecondary = (goal: GoalId) => {
    if (goal === primaryGoal) return;
    setSecondaryGoals((current) =>
      current.includes(goal) ? current.filter((item) => item !== goal) : [...current, goal].slice(0, 2),
    );
  };

  const submit = () => {
    if (!primaryGoal) return;
    updateSection("goal", {
      primaryGoal,
      secondaryGoals: secondaryGoals.filter((item) => item !== primaryGoal),
      targetTimeline: timeline,
    });
    completeStep(2);
    router.push("/onboarding/basics");
  };

  return (
    <OnboardingShell
      step={2}
      title="مهم‌ترین هدفت چیست؟"
      description="یک هدف اصلی انتخاب کن. حداکثر دو هدف فرعی هم می‌توانی اضافه کنی تا برنامه یک‌بعدی نباشد."
      backHref="/onboarding"
    >
      <div className="grid gap-3 sm:grid-cols-2">
        {goals.map((goal) => {
          const selected = primaryGoal === goal.id;
          const secondary = secondaryGoals.includes(goal.id);
          return (
            <Card
              key={goal.id}
              role="button"
              tabIndex={0}
              onClick={() => {
                setPrimaryGoal(goal.id);
                setSecondaryGoals((current) => current.filter((item) => item !== goal.id));
              }}
              onKeyDown={(event) => {
                if (event.key === "Enter" || event.key === " ") setPrimaryGoal(goal.id);
              }}
              className={cn(
                "cursor-pointer p-5 transition-all hover:-translate-y-0.5 hover:border-primary/60 hover:shadow-md",
                selected && "border-primary bg-primary/5 ring-2 ring-primary/20",
              )}
            >
              <div className="flex items-start gap-4">
                <div className={cn("rounded-2xl bg-muted p-3", selected && "bg-primary text-primary-foreground")}>
                  <goal.icon className="h-6 w-6" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-3">
                    <h2 className="font-bold">{goalLabels[goal.id]}</h2>
                    <span className={cn("text-xs text-muted-foreground", selected && "font-bold text-primary")}>
                      {selected ? "هدف اصلی" : "انتخاب"}
                    </span>
                  </div>
                  <p className="mt-2 text-sm leading-6 text-muted-foreground">{goal.description}</p>
                  {!selected && primaryGoal ? (
                    <Button
                      type="button"
                      size="sm"
                      variant={secondary ? "secondary" : "ghost"}
                      className="mt-3 h-8"
                      onClick={(event) => {
                        event.stopPropagation();
                        toggleSecondary(goal.id);
                      }}
                    >
                      {secondary ? "حذف هدف فرعی" : "افزودن به اهداف فرعی"}
                    </Button>
                  ) : null}
                </div>
              </div>
            </Card>
          );
        })}
      </div>

      <div className="mt-8 space-y-3">
        <Label className="text-base font-bold">سرعت پیشروی مورد انتظار</Label>
        <RadioGroup value={timeline} onValueChange={(value) => setTimeline(value as typeof timeline)} className="grid gap-3 sm:grid-cols-3">
          {[
            ["steady", "آرام و پایدار", "تغییر کم‌فشار و قابل حفظ"],
            ["balanced", "متعادل", "پیشرفت منطقی با انعطاف"],
            ["fast", "سریع‌تر", "نیازمند پایبندی بیشتر"],
          ].map(([value, title, text]) => (
            <Label key={value} className={cn("cursor-pointer rounded-2xl border p-4", timeline === value && "border-primary bg-primary/5 ring-2 ring-primary/20")}>
              <RadioGroupItem value={value} className="sr-only" />
              <span className="block font-bold">{title}</span>
              <span className="mt-1 block text-xs leading-5 text-muted-foreground">{text}</span>
            </Label>
          ))}
        </RadioGroup>
      </div>

      <Button type="button" size="lg" className="mt-8 h-12 w-full text-base" disabled={!primaryGoal} onClick={submit}>
        ادامه
        <ArrowLeft className="mr-2 h-5 w-5" />
      </Button>
    </OnboardingShell>
  );
}
