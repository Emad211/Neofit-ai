"use client";

import * as React from "react";
import Link from "next/link";
import {
  Apple,
  Bot,
  Dumbbell,
  Send,
  ShieldAlert,
  Sparkles,
  Trash2,
  TrendingUp,
  UserRound,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { useUserData, type MealLog, type WeightLog, type WorkoutLog } from "@/context/user-profile-context";
import { useDailyMetrics } from "@/hooks/use-daily-metrics";
import { useWorkoutRecords } from "@/hooks/use-workout-records";
import type { InitialPlanPreview } from "@/lib/onboarding-model";
import { cn } from "@/lib/utils";

type CoachMessage = {
  id: string;
  role: "user" | "coach";
  text: string;
  createdAt: string;
  action?: { label: string; href: string };
  tone?: "normal" | "safety";
};

const STORAGE_KEY = "neofit:coach-history:v1";

const welcomeMessage: CoachMessage = {
  id: "coach-welcome",
  role: "coach",
  text: "سلام! من راهنمای محلی نئوفیت هستم. می‌توانم ثبت‌های همین مرورگر را خلاصه کنم، جلسهٔ بعدی را نشان بدهم و دربارهٔ روند تغذیه یا پیشرفت توضیح بدهم.",
  createdAt: new Date(0).toISOString(),
};

const suggestions = [
  { label: "خلاصه امروز", icon: Sparkles },
  { label: "تمرین بعدی", icon: Dumbbell },
  { label: "وضعیت تغذیه", icon: Apple },
  { label: "مرور پیشرفت", icon: TrendingUp },
];

function formatTime(value: string) {
  return new Intl.DateTimeFormat("fa-IR", { hour: "2-digit", minute: "2-digit" }).format(new Date(value));
}

export default function ChatPage() {
  const { userProfile, workoutPlan, nutritionPlan, combinedLogs } = useUserData();
  const { metrics } = useDailyMetrics();
  const { records } = useWorkoutRecords();
  const [messages, setMessages] = React.useState<CoachMessage[]>([welcomeMessage]);
  const [input, setInput] = React.useState("");
  const [isHydrated, setIsHydrated] = React.useState(false);
  const [calorieTarget, setCalorieTarget] = React.useState<number | null>(null);
  const endRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const stored = JSON.parse(raw) as CoachMessage[];
        setMessages(stored.length ? stored : [welcomeMessage]);
      }
      const planRaw = window.localStorage.getItem("neofit:initial-plan:v1");
      if (planRaw) setCalorieTarget(Number((JSON.parse(planRaw) as InitialPlanPreview).calorieTarget) || null);
    } catch {
      setMessages([welcomeMessage]);
      setCalorieTarget(null);
    } finally {
      setIsHydrated(true);
    }
  }, []);

  React.useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }, [messages]);

  const mealLogs = combinedLogs.filter((log): log is MealLog => log.logType === "meal");
  const workoutLogs = combinedLogs.filter((log): log is WorkoutLog => log.logType === "workout");
  const weightLogs = combinedLogs.filter((log): log is WeightLog => log.logType === "weight");
  const today = new Date().toDateString();
  const todayMeals = mealLogs.filter((meal) => new Date(meal.loggedAt).toDateString() === today);
  const todayCalories = todayMeals.reduce((sum, meal) => sum + meal.calories, 0);
  const latestWeight = [...weightLogs].sort((a, b) => new Date(a.loggedAt).getTime() - new Date(b.loggedAt).getTime()).at(-1)?.weight ?? userProfile?.weight ?? null;
  const nextWorkout = workoutPlan?.[0] || null;
  const todayNutrition = nutritionPlan?.[0] || null;

  const persistMessages = (next: CoachMessage[]) => {
    const limited = next.slice(-50);
    setMessages(limited);
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(limited));
  };

  const buildCoachMessage = (prompt: string): CoachMessage => {
    const normalized = prompt.trim().toLowerCase();
    const createdAt = new Date().toISOString();
    const make = (text: string, action?: CoachMessage["action"], tone: CoachMessage["tone"] = "normal"): CoachMessage => ({
      id: `coach-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      role: "coach",
      text,
      createdAt,
      action,
      tone,
    });

    const safetyTerms = ["درد", "آسیب", "سرگیجه", "تنگی نفس", "قفسه سینه", "غش", "پزشک", "بیماری"];
    if (safetyTerms.some((term) => normalized.includes(term))) {
      return make(
        "من نمی‌توانم علت درد یا بیماری را تشخیص بدهم یا برنامهٔ درمانی بدهم. تمرینی که درد را بیشتر می‌کند متوقف کن. اگر درد شدید یا ناگهانی، درد قفسهٔ سینه، تنگی نفس، غش یا ضعف غیرعادی داری، ارزیابی فوری پزشکی لازم است. برای محدودیت‌های پایدار نیز اطلاعات پزشکی پروفایل را به‌روز و با متخصص هماهنگ کن.",
        { label: "ویرایش محدودیت‌های پزشکی", href: "/profile/edit" },
        "safety",
      );
    }

    if (normalized.includes("امروز") || normalized.includes("خلاصه")) {
      const workoutText = workoutLogs.some((workout) => new Date(workout.loggedAt).toDateString() === today) ? "تمرین امروز ثبت شده است" : nextWorkout ? `جلسهٔ پیشنهادی بعدی «${nextWorkout.title}» است` : "جلسه‌ای در برنامه پیدا نشد";
      return make(
        `خلاصهٔ امروز:\n• ${workoutText}.\n• ${todayMeals.length.toLocaleString("fa-IR")} وعده و ${todayCalories.toLocaleString("fa-IR")} کالری ثبت شده است.\n• آب: ${metrics.waterMl.toLocaleString("fa-IR")} میلی‌لیتر، قدم: ${metrics.steps.toLocaleString("fa-IR")}, خواب: ${metrics.sleepHours.toLocaleString("fa-IR")} ساعت.`,
        { label: "رفتن به امروز", href: "/today" },
      );
    }

    if (normalized.includes("تمرین") || normalized.includes("جلسه")) {
      if (!nextWorkout) return make("برنامهٔ تمرینی فعالی پیدا نشد. ابتدا اطلاعات و برنامه را بررسی کن.", { label: "مشاهده تمرین‌ها", href: "/workout" });
      return make(
        `جلسهٔ بعدی «${nextWorkout.title}» با تمرکز بر ${nextWorkout.focus} است. زمان برنامه‌ریزی‌شده ${nextWorkout.duration} و تعداد حرکات ${nextWorkout.exercises.length.toLocaleString("fa-IR")} است. پیش از شروع، محدودیت‌های پزشکی و درد فعلی را در نظر بگیر.`,
        { label: "جزئیات جلسه", href: `/workout/${nextWorkout.id}` },
      );
    }

    if (normalized.includes("غذا") || normalized.includes("تغذیه") || normalized.includes("کالری") || normalized.includes("وعده")) {
      const targetText = calorieTarget ? `از هدف ${calorieTarget.toLocaleString("fa-IR")} کالری` : "و هدف کالری ثبت نشده";
      const planText = todayNutrition ? `برنامهٔ امروز ${todayNutrition.meals.length.toLocaleString("fa-IR")} وعده دارد` : "برنامهٔ غذایی امروز پیدا نشد";
      return make(
        `${planText}. تاکنون ${todayMeals.length.toLocaleString("fa-IR")} وعده و ${todayCalories.toLocaleString("fa-IR")} کالری ${targetText} ثبت شده است. ماکروهای غذای ناشناخته در این نسخه تخمین زده نمی‌شوند.`,
        { label: "مشاهده تغذیه", href: "/nutrition" },
      );
    }

    if (normalized.includes("پیشرفت") || normalized.includes("وزن") || normalized.includes("رکورد")) {
      return make(
        `تا اینجا ${workoutLogs.length.toLocaleString("fa-IR")} جلسهٔ تمرین، ${records.length.toLocaleString("fa-IR")} رکورد شخصی و ${weightLogs.length.toLocaleString("fa-IR")} ثبت وزن داری${latestWeight == null ? "." : `؛ آخرین وزن ${latestWeight.toLocaleString("fa-IR")} کیلوگرم است.`}`,
        { label: "بازکردن پیشرفت", href: "/progress" },
      );
    }

    return make(
      "در این نسخه پاسخ من به داده‌های محلی و چند راهنمای ثابت محدود است. دربارهٔ «خلاصه امروز»، «تمرین بعدی»، «وضعیت تغذیه» یا «مرور پیشرفت» بپرس. اتصال مدل آنلاین بعداً و با مرزهای ایمنی جداگانه انجام می‌شود.",
    );
  };

  const send = (text: string) => {
    const prompt = text.trim();
    if (!prompt || !isHydrated) return;
    const userMessage: CoachMessage = { id: `user-${Date.now()}`, role: "user", text: prompt, createdAt: new Date().toISOString() };
    persistMessages([...messages, userMessage, buildCoachMessage(prompt)]);
    setInput("");
  };

  const submit = (event: React.FormEvent) => {
    event.preventDefault();
    send(input);
  };

  const clearHistory = () => {
    persistMessages([welcomeMessage]);
  };

  return (
    <main dir="rtl" className="min-h-screen bg-gradient-to-b from-primary/5 via-background to-background p-4 sm:p-6 lg:p-8">
      <div className="mx-auto flex min-h-[calc(100vh-8rem)] max-w-4xl flex-col py-3">
        <header className="mb-5 flex flex-wrap items-start justify-between gap-4">
          <div><div className="mb-2 inline-flex items-center gap-2 rounded-full border bg-card px-3 py-1 text-xs font-bold text-primary"><Bot className="h-3.5 w-3.5" />راهنمای محلی و آفلاین</div><h1 className="text-3xl font-black sm:text-4xl">مربی نئوفیت</h1><p className="mt-2 text-muted-foreground">خلاصه و راهنمایی بر اساس داده‌های همین مرورگر؛ بدون اتصال مدل آنلاین.</p></div>
          <AlertDialog>
            <AlertDialogTrigger asChild><Button variant="outline" disabled={messages.length <= 1}><Trash2 className="ml-2 h-4 w-4" />پاک‌کردن گفتگو</Button></AlertDialogTrigger>
            <AlertDialogContent dir="rtl"><AlertDialogHeader className="text-right"><AlertDialogTitle>تاریخچهٔ گفتگو پاک شود؟</AlertDialogTitle><AlertDialogDescription className="text-right leading-7">پیام‌های محلی این مرورگر حذف می‌شوند و پیام خوش‌آمدگویی باقی می‌ماند.</AlertDialogDescription></AlertDialogHeader><AlertDialogFooter className="gap-2"><AlertDialogCancel>انصراف</AlertDialogCancel><AlertDialogAction onClick={clearHistory}>تأیید پاک‌کردن</AlertDialogAction></AlertDialogFooter></AlertDialogContent>
          </AlertDialog>
        </header>

        <Card className="mb-4 border-amber-500/20 bg-amber-500/5">
          <CardContent className="flex items-start gap-3 p-4 text-sm leading-7 text-muted-foreground"><ShieldAlert className="mt-1 h-5 w-5 shrink-0 text-amber-600" /><p><strong className="text-foreground">مرز ایمنی:</strong> این راهنما تشخیص پزشکی، دوز دارو یا برنامهٔ درمانی ارائه نمی‌کند. پاسخ‌ها Rule-based هستند و از اینترنت یا مدل زبانی دریافت نمی‌شوند.</p></CardContent>
        </Card>

        <div className="mb-4 flex gap-2 overflow-x-auto pb-1" aria-label="پیشنهادهای مربی">
          {suggestions.map((suggestion) => <Button key={suggestion.label} type="button" variant="outline" className="shrink-0" onClick={() => send(suggestion.label)} disabled={!isHydrated}><suggestion.icon className="ml-2 h-4 w-4" />{suggestion.label}</Button>)}
        </div>

        <Card className="flex min-h-0 flex-1 flex-col overflow-hidden">
          <CardHeader className="border-b py-4"><CardTitle className="text-base">گفتگوی محلی</CardTitle></CardHeader>
          <CardContent className="flex min-h-0 flex-1 flex-col p-0">
            <div className="min-h-[420px] flex-1 space-y-4 overflow-y-auto p-4 sm:p-6" aria-live="polite">
              {!isHydrated ? <div className="space-y-3">{[1, 2, 3].map((item) => <div key={item} className="h-20 animate-pulse rounded-2xl bg-muted" />)}</div> : messages.map((message) => (
                <div key={message.id} className={cn("flex gap-3", message.role === "user" ? "flex-row-reverse" : "flex-row")}>
                  <div className={cn("grid h-9 w-9 shrink-0 place-items-center rounded-full", message.role === "user" ? "bg-secondary text-secondary-foreground" : message.tone === "safety" ? "bg-amber-500 text-white" : "bg-primary text-primary-foreground")}>{message.role === "user" ? <UserRound className="h-4 w-4" /> : <Bot className="h-4 w-4" />}</div>
                  <div className={cn("max-w-[86%] rounded-2xl px-4 py-3", message.role === "user" ? "bg-primary text-primary-foreground" : message.tone === "safety" ? "border border-amber-500/30 bg-amber-500/10" : "bg-muted/60")}>
                    <p className="whitespace-pre-line text-sm leading-7">{message.text}</p>
                    {message.action ? <Button asChild variant={message.role === "user" ? "secondary" : "outline"} size="sm" className="mt-3"><Link href={message.action.href}>{message.action.label}</Link></Button> : null}
                    <p className={cn("mt-2 text-[10px]", message.role === "user" ? "text-primary-foreground/70" : "text-muted-foreground")}>{formatTime(message.createdAt)}</p>
                  </div>
                </div>
              ))}
              <div ref={endRef} />
            </div>

            <form onSubmit={submit} className="flex gap-2 border-t bg-background p-3 sm:p-4">
              <Input aria-label="پیام به مربی نئوفیت" value={input} onChange={(event) => setInput(event.target.value)} placeholder="مثلاً وضعیت تغذیه امروز چطور است؟" maxLength={500} disabled={!isHydrated} />
              <Button type="submit" size="icon" aria-label="ارسال پیام" disabled={!isHydrated || !input.trim()}><Send className="h-4 w-4" /></Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
