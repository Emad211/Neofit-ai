'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { Award, CheckCircle, Clock, Loader2, RefreshCw, Repeat, Weight } from 'lucide-react';
import Confetti from 'react-confetti';
import { useWindowSize } from '@uidotdev/usehooks';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import type { WorkoutSession } from '@/components/workout/workout-player';
import { useUserData } from '@/context/user-profile-context';
import { useI18n } from '@/i18n/provider';

function StatCard({ icon, title, value }: { icon: React.ReactNode; title: string; value: string | number }) {
  return <div className="flex flex-col items-center justify-center rounded-lg bg-secondary p-4 text-center"><div className="mb-2 text-primary">{icon}</div><p className="text-sm font-medium text-muted-foreground">{title}</p><p className="text-2xl font-bold">{value}</p></div>;
}

export function WorkoutCompletion({
  session,
  totalDuration,
  draftStorageKey,
}: {
  session: WorkoutSession;
  totalDuration: number;
  draftStorageKey?: string;
}) {
  const router = useRouter();
  const { width, height } = useWindowSize();
  const { saveWorkoutLog } = useUserData();
  const { locale } = useI18n();
  const [saveState, setSaveState] = React.useState<'saving' | 'saved' | 'failed'>('saving');
  const savingRef = React.useRef(false);
  const label = React.useCallback((en: string, fa: string) => locale === 'fa' ? fa : en, [locale]);

  const completedExercises = React.useMemo(() => session.exercises.map((exercise) => ({
    ...exercise,
    logs: exercise.logs.filter((log) => Number(log.reps) > 0).map((log) => ({
      ...log,
      weight: log.weight.trim() || '0',
    })),
  })).filter((exercise) => exercise.logs.length > 0), [session.exercises]);

  const totalVolume = React.useMemo(() => completedExercises.reduce((total, exercise) => total + exercise.logs.reduce((exerciseTotal, log) => {
    const reps = Number(log.reps);
    const weight = Number(log.weight);
    return Number.isFinite(reps) && Number.isFinite(weight) ? exerciseTotal + reps * weight : exerciseTotal;
  }, 0), 0), [completedExercises]);

  const save = React.useCallback(async () => {
    if (savingRef.current) return;
    savingRef.current = true;
    setSaveState('saving');
    try {
      await saveWorkoutLog({
        workoutId: session.id,
        workoutName: session.title,
        durationMinutes: totalDuration,
        totalVolume,
        exercises: completedExercises.map((exercise) => ({ id: exercise.id, name: exercise.name, logs: exercise.logs })),
      });
      if (draftStorageKey) window.sessionStorage.removeItem(draftStorageKey);
      setSaveState('saved');
    } catch (error) {
      console.error('Workout log save failed:', error);
      setSaveState('failed');
    } finally {
      savingRef.current = false;
    }
  }, [completedExercises, draftStorageKey, saveWorkoutLog, session.id, session.title, totalDuration, totalVolume]);

  React.useEffect(() => {
    void save();
  }, [save]);

  return (
    <>
      {saveState === 'saved' && width && height && <Confetti width={width} height={height} recycle={false} numberOfPieces={300} gravity={0.1} />}
      <main className="flex min-h-screen w-full flex-col items-center justify-center bg-background p-4 text-center">
        <div className="w-full max-w-2xl">
          <Award className="mx-auto h-20 w-20 animate-pulse text-accent" aria-hidden="true" />
          <h1 className="mt-6 font-headline text-4xl font-bold tracking-tight sm:text-5xl">{label('Workout complete', 'تمرین تمام شد')}</h1>
          <p className="mt-4 text-lg text-muted-foreground">{label(`Here is the summary for ${session.title}.`, `خلاصه جلسه ${session.title} را ببینید.`)}</p>

          {saveState === 'saving' && <Alert className="mt-6"><Loader2 className="h-4 w-4 animate-spin" /><AlertDescription>{label('Saving your workout…', 'در حال ذخیره تمرین…')}</AlertDescription></Alert>}
          {saveState === 'saved' && <Alert className="mt-6"><CheckCircle className="h-4 w-4" /><AlertDescription>{label('Your workout was saved successfully.', 'تمرین با موفقیت ذخیره شد.')}</AlertDescription></Alert>}
          {saveState === 'failed' && <Alert variant="destructive" className="mt-6"><AlertDescription className="flex flex-col items-center justify-between gap-3 sm:flex-row"><span>{label('The workout is still stored on this device, but cloud saving failed.', 'تمرین هنوز روی این دستگاه نگه داشته شده، اما ذخیره ابری انجام نشد.')}</span><Button size="sm" variant="outline" onClick={() => void save()}><RefreshCw className="me-2 h-4 w-4" />{label('Retry save', 'تلاش دوباره')}</Button></AlertDescription></Alert>}

          <div className="my-8 grid grid-cols-2 gap-4 md:grid-cols-3">
            <StatCard icon={<Clock className="h-8 w-8" />} title={label('Duration', 'مدت')} value={`${totalDuration} ${label('min', 'دقیقه')}`} />
            <StatCard icon={<Weight className="h-8 w-8" />} title={label('Total volume', 'حجم کل')} value={`${Math.round(totalVolume)} kg`} />
            <StatCard icon={<Repeat className="h-8 w-8" />} title={label('Exercises', 'حرکت‌ها')} value={completedExercises.length} />
          </div>

          <Card>
            <CardHeader><CardTitle>{label('Completed exercises', 'حرکت‌های انجام‌شده')}</CardTitle></CardHeader>
            <CardContent>
              {completedExercises.length ? <ul className="divide-y divide-border">{completedExercises.map((exercise) => <li key={exercise.id} className="flex items-center justify-between gap-3 py-2 text-sm"><span className="font-medium">{exercise.name}</span><span className="text-muted-foreground">{exercise.logs.length} {label('sets', 'ست')}</span></li>)}</ul> : <p className="text-muted-foreground">{label('No completed sets were recorded.', 'هیچ ست کاملی ثبت نشده است.')}</p>}
            </CardContent>
          </Card>

          <div className="mt-10"><Button onClick={() => router.push('/today')} size="lg" className="w-full max-w-sm" disabled={saveState === 'saving'}>{label('Back to dashboard', 'بازگشت به داشبورد')}</Button></div>
        </div>
      </main>
    </>
  );
}
