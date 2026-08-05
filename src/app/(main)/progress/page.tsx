"use client";

import * as React from "react";
import { Award, CalendarCheck, Dumbbell, Ruler, Scale, Target } from "lucide-react";
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
import { useUserData, type WeightLog, type WorkoutLog } from "@/context/user-profile-context";
import { useWorkoutRecords } from "@/hooks/use-workout-records";
import type { BodyMeasurementLog } from "@/components/dashboard/measurement-sheet";

const MEASUREMENT_KEY = "neofit:measurement-logs:v1";

function labelDate(value: string) {
  return new Intl.DateTimeFormat("fa-IR", { month: "short", day: "numeric" }).format(new Date(value));
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

  React.useEffect(() => {
    const load = () => {
      try { setMeasurements(JSON.parse(window.localStorage.getItem(MEASUREMENT_KEY) || "[]")); } catch { setMeasurements([]); }
      try {
        const draft = JSON.parse(window.localStorage.getItem("neofit:onboarding-draft:v1") || "{}");
        setTargetWeight(Number(draft?.body?.targetWeightKg) || null);
      } catch { setTargetWeight(null); }
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

  return (
    <main dir="rtl" className="min-h-screen bg-gradient-to-b from-primary/5 via-background to-background p-4 sm:p-6 lg:p-8">
      <div className="mx-auto max-w-6xl py-3">
        <header className="mb-6">
          <div className="mb-2 inline-flex items-center gap-2 rounded-full border bg-card px-3 py-1 text-xs font-bold text-primary"><Target className="h-3.5 w-3.5" />روند واقعی ثبت‌ها</div>
          <h1 className="text-3xl font-black sm:text-4xl">پیشرفت من</h1>
          <p className="mt-2 text-muted-foreground">وزن، اندازه‌های بدن، تمرین‌ها و رکوردها از ثبت‌های همین دستگاه محاسبه می‌شوند.</p>
        </header>

        <section className="grid grid-cols-2 gap-3 lg:grid-cols-5" aria-label="خلاصه پیشرفت">
          <MetricCard title="وزن فعلی" value={latestWeight ? `${latestWeight.toLocaleString("fa-IR")} کیلوگرم` : "—"} description={weightLogs.length > 1 ? `${Math.abs(weightChange).toLocaleString("fa-IR")} کیلوگرم ${weightChange <= 0 ? "کاهش" : "افزایش"}` : "برای روند، وزن‌های بیشتری ثبت کن"} icon={Scale} />
          <MetricCard title="فاصله تا هدف" value={targetDelta == null ? "—" : `${Math.abs(targetDelta).toLocaleString("fa-IR")} کیلوگرم`} description={targetDelta == null ? "وزن هدف در Onboarding ثبت نشده" : targetDelta > 0 ? "بالاتر از وزن هدف" : targetDelta < 0 ? "پایین‌تر از وزن هدف" : "به وزن هدف رسیده‌ای"} icon={Target} />
          <MetricCard title="دور کمر" value={latestWaist == null ? "—" : `${latestWaist.toLocaleString("fa-IR")} سانتی‌متر`} description={`${waistData.length.toLocaleString("fa-IR")} اندازه‌گیری معتبر`} icon={Ruler} />
          <MetricCard title="تمرین این هفته" value={`${workoutsThisWeek.length.toLocaleString("fa-IR")} جلسه`} description={`${Math.round(weeklyVolume).toLocaleString("fa-IR")} کیلوگرم حجم ثبت‌شده`} icon={CalendarCheck} />
          <MetricCard title="رکوردهای شخصی" value={records.length.toLocaleString("fa-IR")} description="بیشترین وزنه و حجم حرکت" icon={Award} />
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

          <Card className="lg:col-span-2">
            <CardHeader><CardTitle className="flex items-center gap-2"><Dumbbell className="h-5 w-5 text-primary" />حجم جلسات تمرینی</CardTitle></CardHeader>
            <CardContent>
              {volumeData.length ? (
                <div className="h-72" aria-label="نمودار حجم جلسات تمرینی">
                  <ResponsiveContainer width="100%" height="100%"><BarChart data={volumeData}><CartesianGrid strokeDasharray="3 3" vertical={false} /><XAxis dataKey="date" tick={{ fontSize: 11 }} /><YAxis tick={{ fontSize: 11 }} width={55} /><Tooltip /><Bar dataKey="volume" name="حجم تمرین" fill="hsl(var(--primary))" radius={[8, 8, 0, 0]} /></BarChart></ResponsiveContainer>
                </div>
              ) : <EmptyChart text="پس از ذخیره اولین تمرین، حجم جلسه اینجا نمایش داده می‌شود." />}
            </CardContent>
          </Card>
        </section>
      </div>
    </main>
  );
}
