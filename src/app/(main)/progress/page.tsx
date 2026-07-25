'use client';

import * as React from 'react';
import Link from 'next/link';
import { Activity, Dumbbell, Loader2, Scale, Sparkles, TrendingUp } from 'lucide-react';
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
} from 'recharts';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Skeleton } from '@/components/ui/skeleton';
import { useUserData } from '@/context/user-profile-context';
import type { ActivityLog, WeightLog, WorkoutLog } from '@/context/user-profile-context';
import { useSubscription } from '@/context/subscription-context';
import { useI18n } from '@/i18n/provider';
import { generateOnDemandReport } from '@/ai/flows/generate-on-demand-report';
import { AiClientError } from '@/lib/ai-client';

function metricCard(icon: React.ReactNode, title: string, value: string, description: string) {
  return <Card><CardContent className="flex items-center gap-4 p-5"><div className="rounded-full bg-primary/10 p-3 text-primary">{icon}</div><div><p className="text-sm text-muted-foreground">{title}</p><p className="text-2xl font-bold">{value}</p><p className="text-xs text-muted-foreground">{description}</p></div></CardContent></Card>;
}

export default function ProgressPage() {
  const { combinedLogs, workoutPlan, nutritionPlan, userProfile, isLoading } = useUserData();
  const subscription = useSubscription();
  const { locale, t } = useI18n();
  const [report, setReport] = React.useState<string | null>(null);
  const [reportError, setReportError] = React.useState<string | null>(null);
  const [isGenerating, setIsGenerating] = React.useState(false);
  const label = React.useCallback((en: string, fa: string) => locale === 'fa' ? fa : en, [locale]);
  const dateFormatter = React.useMemo(() => new Intl.DateTimeFormat(locale === 'fa' ? 'fa-IR' : 'en-US', { month: 'short', day: 'numeric' }), [locale]);

  const weights = React.useMemo(() => combinedLogs
    .filter((log): log is WeightLog => log.logType === 'weight')
    .map((log) => ({ dateValue: Date.parse(log.loggedAt), date: dateFormatter.format(new Date(log.loggedAt)), weight: Number(log.weight) }))
    .filter((item) => Number.isFinite(item.dateValue) && Number.isFinite(item.weight))
    .sort((a, b) => a.dateValue - b.dateValue), [combinedLogs, dateFormatter]);

  const workouts = React.useMemo(() => combinedLogs
    .filter((log): log is WorkoutLog => log.logType === 'workout')
    .map((log) => ({
      dateValue: Date.parse(log.loggedAt),
      date: dateFormatter.format(new Date(log.loggedAt)),
      volume: Number(log.totalVolume) || 0,
      duration: Number(log.durationMinutes) || 0,
    }))
    .filter((item) => Number.isFinite(item.dateValue))
    .sort((a, b) => a.dateValue - b.dateValue), [combinedLogs, dateFormatter]);

  const activities = React.useMemo(() => combinedLogs
    .filter((log): log is ActivityLog => log.logType === 'activity'), [combinedLogs]);

  const latestWeight = weights.at(-1)?.weight;
  const previousWeight = weights.at(-2)?.weight;
  const weightDelta = latestWeight !== undefined && previousWeight !== undefined ? latestWeight - previousWeight : null;
  const totalWorkoutMinutes = workouts.reduce((sum, workout) => sum + workout.duration, 0) + activities.reduce((sum, activity) => sum + (Number(activity.durationMinutes) || 0), 0);
  const totalVolume = workouts.reduce((sum, workout) => sum + workout.volume, 0);
  const recentCutoff = Date.now() - 7 * 24 * 60 * 60 * 1_000;
  const recentWorkouts = workouts.filter((workout) => workout.dateValue >= recentCutoff).length;

  const generateReport = async () => {
    if (!subscription.has('advancedReports')) return;
    setIsGenerating(true);
    setReportError(null);
    try {
      const recentLogs = combinedLogs
        .filter((log) => Date.parse(log.loggedAt) >= recentCutoff)
        .slice(0, 250);
      const result = await generateOnDemandReport({
        locale,
        userData: {
          userProfile: userProfile ? {
            name: userProfile.name,
            goal: userProfile.goal,
            timezone: userProfile.timezone,
          } : null,
          baseWorkoutPlan: workoutPlan || [],
          baseNutritionPlan: nutritionPlan || [],
          logs: recentLogs,
        },
      });
      setReport(result.analysisReport);
    } catch (error) {
      console.error('Progress report failed:', error);
      setReportError(error instanceof AiClientError && error.status === 429
        ? label('Today’s AI request limit has been reached.', 'سهمیه درخواست‌های هوش مصنوعی امروز تمام شده است.')
        : label('The progress report could not be generated.', 'گزارش پیشرفت ساخته نشد.'));
    } finally {
      setIsGenerating(false);
    }
  };

  if (isLoading) {
    return <div className="space-y-6 p-4 sm:p-6 lg:p-8" aria-busy="true"><Skeleton className="h-12 w-64" /><div className="grid gap-4 md:grid-cols-3"><Skeleton className="h-28" /><Skeleton className="h-28" /><Skeleton className="h-28" /></div><Skeleton className="h-80" /></div>;
  }

  const hasData = weights.length > 0 || workouts.length > 0 || activities.length > 0;

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <header className="mb-8">
        <h1 className="font-headline text-4xl font-bold">{t('progress.title')}</h1>
        <p className="text-muted-foreground">{t('progress.subtitle')}</p>
      </header>

      <main className="space-y-8">
        {!hasData && <Alert><AlertDescription>{t('progress.empty')}</AlertDescription></Alert>}

        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {metricCard(<Scale className="h-6 w-6" />, label('Latest weight', 'آخرین وزن'), latestWeight !== undefined ? `${latestWeight.toFixed(1)} kg` : '—', weightDelta === null ? label('Add two entries to see a change.', 'برای مشاهده تغییر، دو وزن ثبت کنید.') : `${weightDelta > 0 ? '+' : ''}${weightDelta.toFixed(1)} kg`)}
          {metricCard(<Dumbbell className="h-6 w-6" />, label('Workouts this week', 'تمرین‌های این هفته'), String(recentWorkouts), label('Completed and saved sessions', 'جلسه‌های کامل و ذخیره‌شده'))}
          {metricCard(<Activity className="h-6 w-6" />, label('Total activity', 'کل فعالیت'), `${Math.round(totalWorkoutMinutes)} ${label('min', 'دقیقه')}`, label('Across saved history', 'در کل سوابق ذخیره‌شده'))}
          {metricCard(<TrendingUp className="h-6 w-6" />, label('Training volume', 'حجم تمرین'), `${Math.round(totalVolume)} kg`, label('Repetitions × external load', 'تکرار × وزنه خارجی'))}
        </section>

        <section className="grid gap-6 xl:grid-cols-2">
          <Card>
            <CardHeader><CardTitle>{label('Weight trend', 'روند وزن')}</CardTitle><CardDescription>{label('Only saved weight entries are shown.', 'فقط وزن‌های ثبت‌شده نمایش داده می‌شوند.')}</CardDescription></CardHeader>
            <CardContent className="h-72">
              {weights.length > 1 ? <ResponsiveContainer width="100%" height="100%"><LineChart data={weights}><CartesianGrid strokeDasharray="3 3" /><XAxis dataKey="date" /><YAxis domain={['dataMin - 2', 'dataMax + 2']} /><Tooltip /><Line type="monotone" dataKey="weight" stroke="hsl(var(--primary))" strokeWidth={2} dot /></LineChart></ResponsiveContainer> : <div className="flex h-full items-center justify-center text-center text-muted-foreground">{label('At least two weight entries are needed for a trend.', 'برای نمایش روند حداقل دو وزن لازم است.')}</div>}
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle>{label('Workout volume', 'حجم تمرین')}</CardTitle><CardDescription>{label('Volume excludes bodyweight load unless you enter it.', 'حجم تمرین وزن بدن را فقط در صورت ورود آن محاسبه می‌کند.')}</CardDescription></CardHeader>
            <CardContent className="h-72">
              {workouts.length ? <ResponsiveContainer width="100%" height="100%"><BarChart data={workouts}><CartesianGrid strokeDasharray="3 3" /><XAxis dataKey="date" /><YAxis /><Tooltip /><Bar dataKey="volume" fill="hsl(var(--primary))" radius={[6, 6, 0, 0]} /></BarChart></ResponsiveContainer> : <div className="flex h-full items-center justify-center text-center text-muted-foreground">{label('Complete a workout to see volume data.', 'برای مشاهده حجم تمرین، یک جلسه را کامل کنید.')}</div>}
            </CardContent>
          </Card>
        </section>

        <Card>
          <CardHeader>
            <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
              <div><CardTitle className="flex items-center gap-2"><Sparkles className="h-5 w-5 text-primary" />{label('AI progress report', 'گزارش هوشمند پیشرفت')}</CardTitle><CardDescription>{label('A cautious summary based on your last seven days of saved data.', 'جمع‌بندی محتاطانه بر اساس داده‌های ذخیره‌شده هفت روز اخیر.')}</CardDescription></div>
              {subscription.has('advancedReports') ? <Button onClick={() => void generateReport()} disabled={isGenerating}>{isGenerating && <Loader2 className="me-2 h-4 w-4 animate-spin" />}{label('Generate report', 'ساخت گزارش')}</Button> : <Button asChild><Link href="/pricing">{t('common.upgrade')}</Link></Button>}
            </div>
          </CardHeader>
          <CardContent>
            {reportError && <Alert variant="destructive"><AlertDescription>{reportError}</AlertDescription></Alert>}
            {report ? <div className="whitespace-pre-wrap leading-7 text-muted-foreground">{report}</div> : <p className="text-sm text-muted-foreground">{subscription.has('advancedReports') ? label('Generate a report when you have enough recent logs.', 'پس از ثبت داده‌های کافی، گزارش را بسازید.') : label('Advanced reports are included in Plus and Pro.', 'گزارش پیشرفته در پلن پلاس و پرو فعال است.')}</p>}
          </CardContent>
        </Card>

        <p className="text-center text-xs text-muted-foreground">{t('legal.medicalDisclaimer')}</p>
      </main>
    </div>
  );
}
