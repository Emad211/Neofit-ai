"use client";

import * as React from "react";
import { Apple, Award, CalendarCheck, CheckCircle2, Dumbbell, Flame, LockKeyhole, Ruler, Scale, Target, Trophy } from "lucide-react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useUserData, type MealLog, type WeightLog, type WorkoutLog } from "@/context/user-profile-context";
import { useWorkoutRecords } from "@/hooks/use-workout-records";
import type { BodyMeasurementLog } from "@/components/dashboard/measurement-sheet";
import type { InitialPlanPreview } from "@/lib/onboarding-model";

const MEASUREMENT_KEY = "neofit:measurement-logs:v1";

function labelDate(value: string) {
  return new Intl.DateTimeFormat("fa-IR", { month: "short", day: "numeric" }).format(new Date(value));
}

function dayKey(value: string) {
  const date = new Date(value);
  return `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
}

function EmptyChart({ text }: { text: string }) {
  return <div className="grid h-60 place-items-center rounded-2xl border border-dashed bg-muted/20 px-6 text-center text-sm leading-7 text-muted-foreground">{text}</div>;
}

function MetricCard({ title, value, description, icon: Icon }: { title: string; value: string; description: string; icon: React.ComponentType<{ className?: string }> }) {
  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-3">
          <div><p className="text-xs text-muted-foreground">{title}</p><p className="mt-2 text-xl font-black">{value}</p><p className="mt-1 text-xs leading-5 text-muted-foreground">{description}</p></div>
          <div className="rounded-2xl bg-primary/10 p-2.5 text-primary"><Icon className="h-5 w-5" /></div>
        </div>
      </CardContent>
    </Card>
  );
}

export default function ProgressPage() {
  const { combinedLogs, userProfile } = useUserData();
  const { records } = useWorkoutRecords();
  const [measurements, setMeasurements] = React.useState<BodyMeasurementLog[]>([]);
  const [targetWeight, setTargetWeight] = React.useState<number | null>(null);
  const [calorieTarget, setCalorieTarget] = React.useState<number | null>(null);

  React.useEffect(() => {
    const load = () => {
      try { setMeasurements(JSON.parse(window.localStorage.getItem(MEASUREMENT_KEY) || "[]")); } catch { setMeasurements([]); }
      try {
        const draft = JSON.parse(window.localStorage.getItem("neofit:onboarding-draft:v1") || "{}");
        setTargetWeight(Number(draft?.body?.targetWeightKg) || null);
      } catch { setTargetWeight(null); }
      try {
        const plan = JSON.parse(window.localStorage.getItem("neofit:initial-plan:v1") || "null") as InitialPlanPreview | null;
        setCalorieTarget(Number(plan?.calorieTarget) || null);
      } catch { setCalorieTarget(null); }
    };
    load();
    window.addEventListener("neofit:measurement-logs-changed", load);
    return () => window.removeEventListener("neofit:measurement-logs-changed", load);
  }, []);

  const weightLogs = combinedLogs
    .filter((log): log is WeightLog => log.logType === "weight")
    .sort((a, b) => new Date(a.loggedAt).getTime() - new Date(b.loggedAt).getTime());
  const workoutLogs = combinedLogs
    .filter((log): log is WorkoutLog => log.logType === "workout")
    .sort((a, b) => new Date(a.loggedAt).getTime() - new Date(b.loggedAt).getTime());
  const mealLogs = combinedLogs
    .filter((log): log is MealLog => log.logType === "meal")
    .sort((a, b) => new Date(a.loggedAt).getTime() - new Date(b.loggedAt).getTime());
  const sortedMeasurements = [...measurements].sort((a, b) => new Date(a.loggedAt).getTime() - new Date(b.loggedAt).getTime());

  const latestWeight = weightLogs.at(-1)?.weight ?? userProfile?.weight ?? 0;
  const firstWeight = weightLogs[0]?.weight ?? userProfile?.weight ?? latestWeight;
  const weightChange = latestWeight - firstWeight;
  const targetDelta = targetWeight ? latestWeight - targetWeight : null;
  const latestWaist = [...sortedMeasurements].reverse().find((item) => item.waistCm != null)?.waistCm ?? null;
  const weekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
  const workoutsThisWeek = workoutLogs.filter((log) => new Date(log.loggedAt).getTime() >= weekAgo);
  const weeklyVolume = workoutsThisWeek.reduce((sum, log) => sum + log.totalVolume, 0);

  const weightData = weightLogs.map((log) => ({ date: labelDate(log.loggedAt), weight: log.weight }));
  const waistData = sortedMeasurements.filter((item) => item.waistCm != null).map((item) => ({ date: labelDate(item.loggedAt), waist: item.waistCm }));
  const volumeData = workoutLogs.slice(-8).map((log) => ({ date: labelDate(log.loggedAt), volume: Math.round(log.totalVolume) }));

  const nutritionDays = React.useMemo(() => {
    const grouped = new Map<string, { date: Date; calories: number }>();
    mealLogs.forEach((meal) => {
      const key = dayKey(meal.loggedAt);
      const current = grouped.get(key) || { date: new Date(meal.loggedAt), calories: 0 };
      current.calories += meal.calories;
      grouped.set(key, current);
    });
    return Array.from(grouped.values())
      .sort((a, b) => a.date.getTime() - b.date.getTime())
      .slice(-7)
      .map((item) => ({ date: labelDate(item.date.toISOString()), calories: item.calories, target: calorieTarget || undefined }));
  }, [mealLogs, calorieTarget]);
  const averageDailyCalories = nutritionDays.length ? Math.round(nutritionDays.reduce((sum, day) => sum + day.calories, 0) / nutritionDays.length) : 0;

  const milestones = [
    { title: "اولین تمرین", description: "یک جلسه کامل ثبت کن", earned: workoutLogs.length >= 1, icon: Dumbbell },
    { title: "پنج جلسه تمرین", description: "پنج جلسه در تاریخچه داشته باش", earned: workoutLogs.length >= 5, icon: CalendarCheck },
    { title: "اولین رکورد شخصی", description: "در یک حرکت رکورد تازه ثبت کن", earned: records.length >= 1, icon: Trophy },
    { title: "دو کیلو تغییر وزن", description: "روند حداقل دو کیلوگرمی ثبت کن", earned: weightLogs.length >= 2 && Math.abs(weightChange) >= 2, icon: Scale },
    { title: "ثبت منظم تغذیه", description: "حداقل هفت وعده غذایی ثبت کن", earned: mealLogs.length >= 7, icon: Apple },
    { title: "پیگیری اندازه‌ها", description: "دو نوبت اندازه‌گیری بدن ثبت کن", earned: sortedMeasurements.length >= 2, icon: Ruler },
  ];
  const earnedMilestones = milestones.filter((item) => item.earned).length;

  return (
    <main dir="rtl" className="min-h-screen bg-gradient-to-b from-primary/5 via-background to-background p-4 sm:p-6 lg:p-8">
      <div className="mx-auto max-w-6xl py-3">
        <header className="mb-6">
          <div className="mb-2 inline-flex items-center gap-2 rounded-full border bg-card px-3 py-1 text-xs font-bold text-primary"><Target className="h-3.5 w-3.5" />روند واقعی ثبت‌ها</div>
          <h1 className="text-3xl font-black sm:text-4xl">پیشرفت من</h1>
          <p className="mt-2 text-muted-foreground">وزن، اندازه‌های بدن، تمرین‌ها و تغذیه فقط از ثبت‌های همین دستگاه محاسبه می‌شوند.</p>
        </header>

        <section className="grid grid-cols-2 gap-3 lg:grid-cols-5" aria-label="خلاصه پیشرفت">
          <MetricCard title="وزن فعلی" value={latestWeight ? `${latestWeight.toLocaleString("fa-IR")} کیلوگرم` : "—"} description={weightLogs.length > 1 ? `${Math.abs(weightChange).toLocaleString("fa-IR")} کیلوگرم ${weightChange <= 0 ? "کاهش" : "افزایش"}` : "برای روند، وزن‌های بیشتری ثبت کن"} icon={Scale} />
          <MetricCard title="فاصله تا هدف" value={targetDelta == null ? "—" : `${Math.abs(targetDelta).toLocaleString("fa-IR")} کیلوگرم`} description={targetDelta == null ? "وزن هدف در Onboarding ثبت نشده" : targetDelta > 0 ? "بالاتر از وزن هدف" : targetDelta < 0 ? "پایین‌تر از وزن هدف" : "به وزن هدف رسیده‌ای"} icon={Target} />
          <MetricCard title="دور کمر" value={latestWaist == null ? "—" : `${latestWaist.toLocaleString("fa-IR")} سانتی‌متر`} description={`${waistData.length.toLocaleString("fa-IR")} اندازه‌گیری معتبر`} icon={Ruler} />
          <MetricCard title="تمرین این هفته" value={`${workoutsThisWeek.length.toLocaleString("fa-IR")} جلسه`} description={`${Math.round(weeklyVolume).toLocaleString("fa-IR")} کیلوگرم حجم ثبت‌شده`} icon={CalendarCheck} />
          <MetricCard title="دستاوردها" value={`${earnedMilestones.toLocaleString("fa-IR")} از ${milestones.length.toLocaleString("fa-IR")}`} description={`${records.length.toLocaleString("fa-IR")} رکورد شخصی`} icon={Award} />
        </section>

        <section className="mt-7 grid gap-5 lg:grid-cols-2">
          <Card>
            <CardHeader><CardTitle className="flex items-center gap-2"><Scale className="h-5 w-5 text-primary" />روند وزن</CardTitle></CardHeader>
            <CardContent>
              {weightData.length >= 2 ? (
                <div className="h-64" aria-label="نمودار روند وزن">
                  <ResponsiveContainer width="100%" height="100%"><LineChart data={weightData}><CartesianGrid strokeDasharray="3 3" vertical={false} /><XAxis dataKey="date" tick={{ fontSize: 11 }} /><YAxis domain={["dataMin - 2", "dataMax + 2"]} tick={{ fontSize: 11 }} width={40} /><Tooltip /><Line type="monotone" dataKey="weight" name="وزن" stroke="hsl(var(--primary))" strokeWidth={3} dot={{ r: 4 }} /></LineChart></ResponsiveContainer>
                </div>
              ) : <EmptyChart text="برای رسم روند وزن، حداقل دو وزن در روزهای مختلف ثبت کن." />}
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle className="flex items-center gap-2"><Ruler className="h-5 w-5 text-primary" />روند دور کمر</CardTitle></CardHeader>
            <CardContent>
              {waistData.length >= 2 ? (
                <div className="h-64" aria-label="نمودار روند دور کمر">
                  <ResponsiveContainer width="100%" height="100%"><LineChart data={waistData}><CartesianGrid strokeDasharray="3 3" vertical={false} /><XAxis dataKey="date" tick={{ fontSize: 11 }} /><YAxis domain={["dataMin - 3", "dataMax + 3"]} tick={{ fontSize: 11 }} width={40} /><Tooltip /><Line type="monotone" dataKey="waist" name="دور کمر" stroke="hsl(var(--primary))" strokeWidth={3} dot={{ r: 4 }} /></LineChart></ResponsiveContainer>
                </div>
              ) : <EmptyChart text="برای رسم روند دور کمر، حداقل دو اندازه‌گیری ثبت کن." />}
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle className="flex items-center gap-2"><Dumbbell className="h-5 w-5 text-primary" />حجم جلسات تمرینی</CardTitle></CardHeader>
            <CardContent>
              {volumeData.length ? (
                <div className="h-72" aria-label="نمودار حجم جلسات تمرینی">
                  <ResponsiveContainer width="100%" height="100%"><BarChart data={volumeData}><CartesianGrid strokeDasharray="3 3" vertical={false} /><XAxis dataKey="date" tick={{ fontSize: 11 }} /><YAxis tick={{ fontSize: 11 }} width={55} /><Tooltip /><Bar dataKey="volume" name="حجم تمرین" fill="hsl(var(--primary))" radius={[8, 8, 0, 0]} /></BarChart></ResponsiveContainer>
                </div>
              ) : <EmptyChart text="پس از ذخیره اولین تمرین، حجم جلسه اینجا نمایش داده می‌شود." />}
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle className="flex items-center gap-2"><Flame className="h-5 w-5 text-primary" />کالری ثبت‌شده روزانه</CardTitle></CardHeader>
            <CardContent>
              {nutritionDays.length ? (
                <><div className="mb-3 rounded-xl bg-muted/40 p-3 text-sm text-muted-foreground">میانگین روزهای ثبت‌شده: <strong className="text-foreground">{averageDailyCalories.toLocaleString("fa-IR")} کالری</strong></div><div className="h-64" aria-label="نمودار کالری روزانه"><ResponsiveContainer width="100%" height="100%"><BarChart data={nutritionDays}><CartesianGrid strokeDasharray="3 3" vertical={false} /><XAxis dataKey="date" tick={{ fontSize: 11 }} /><YAxis tick={{ fontSize: 11 }} width={50} /><Tooltip /><Bar dataKey="calories" name="کالری ثبت‌شده" fill="hsl(var(--primary))" radius={[8, 8, 0, 0]} />{calorieTarget ? <Bar dataKey="target" name="هدف" fill="hsl(var(--muted-foreground))" opacity={0.25} radius={[8, 8, 0, 0]} /> : null}</BarChart></ResponsiveContainer></div></>
              ) : <EmptyChart text="پس از ثبت وعده‌ها، کالری روزانه و مقایسه با هدف اینجا نمایش داده می‌شود." />}
            </CardContent>
          </Card>
        </section>

        <section className="mt-7">
          <div className="mb-4 flex items-center justify-between gap-4"><div><h2 className="text-2xl font-black">دستاوردها</h2><p className="mt-1 text-sm text-muted-foreground">این نشان‌ها مستقیم از رکوردهای فعلی ساخته می‌شوند.</p></div><div className="rounded-full bg-primary/10 px-4 py-2 text-sm font-black text-primary">{earnedMilestones.toLocaleString("fa-IR")} تکمیل‌شده</div></div>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {milestones.map((milestone) => <Card key={milestone.title} className={milestone.earned ? "border-emerald-500/30 bg-emerald-500/5" : "opacity-70"}><CardContent className="flex items-start gap-4 p-4"><div className={milestone.earned ? "rounded-2xl bg-emerald-500 p-3 text-white" : "rounded-2xl bg-muted p-3 text-muted-foreground"}>{milestone.earned ? <CheckCircle2 className="h-5 w-5" /> : <LockKeyhole className="h-5 w-5" />}</div><div><p className="font-black">{milestone.title}</p><p className="mt-1 text-xs leading-6 text-muted-foreground">{milestone.description}</p></div></CardContent></Card>)}
          </div>
        </section>
      </div>
    </main>
  );
}
