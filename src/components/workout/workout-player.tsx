'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import {
  Check,
  ChevronLeft,
  HelpCircle,
  History,
  Loader2,
  ShieldAlert,
  SkipForward,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
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
} from '@/components/ui/alert-dialog';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { WorkoutTimer } from '@/components/workout/workout-timer';
import { AlternativeExerciseDialog } from '@/components/workout/alternative-exercise-dialog';
import { WorkoutCompletion } from '@/components/workout/workout-completion';
import { useUserData } from '@/context/user-profile-context';
import { getExerciseDetails } from '@/ai/flows/get-exercise-details';
import type { GetExerciseDetailsOutput } from '@/ai/schemas';
import { useI18n } from '@/i18n/provider';

export type Log = { set: number; reps: string; weight: string };
export type Exercise = {
  id: string;
  name: string;
  videoUrl?: string;
  dataAiHint?: string;
  sets: number;
  reps: string;
  rest: number;
  logs: Log[];
};
export type WorkoutSession = { id: string; title: string; exercises: Exercise[] };

type SavedDraft = {
  session: WorkoutSession;
  currentExerciseIndex: number;
  currentSetIndex: number;
  startedAt: number;
};

type PendingPosition = { exerciseIndex: number; setIndex: number; nextLabel: string };

function firstPositiveInteger(value: string, fallback = 3) {
  const parsed = value.match(/\d+/)?.[0];
  const number = parsed ? Number(parsed) : fallback;
  return Number.isFinite(number) ? Math.min(12, Math.max(1, number)) : fallback;
}

function validDraft(value: unknown, workoutId: string): value is SavedDraft {
  if (!value || typeof value !== 'object') return false;
  const draft = value as SavedDraft;
  return draft.session?.id === workoutId
    && Array.isArray(draft.session.exercises)
    && Number.isInteger(draft.currentExerciseIndex)
    && Number.isInteger(draft.currentSetIndex)
    && Number.isFinite(draft.startedAt);
}

export function WorkoutPlayer({ workoutId }: { workoutId: string }) {
  const { workoutPlan, userProfile } = useUserData();
  const { locale, t } = useI18n();
  const router = useRouter();
  const storageKey = `neofit-workout-draft:${workoutId}`;
  const label = React.useCallback((en: string, fa: string) => locale === 'fa' ? fa : en, [locale]);

  const [session, setSession] = React.useState<WorkoutSession | null>(null);
  const [currentExerciseIndex, setCurrentExerciseIndex] = React.useState(0);
  const [currentSetIndex, setCurrentSetIndex] = React.useState(0);
  const [pendingPosition, setPendingPosition] = React.useState<PendingPosition | null>(null);
  const [startedAt, setStartedAt] = React.useState<number | null>(null);
  const [completionDuration, setCompletionDuration] = React.useState<number | null>(null);
  const [formGuide, setFormGuide] = React.useState<GetExerciseDetailsOutput | null>(null);
  const [isFormGuideLoading, setIsFormGuideLoading] = React.useState(false);
  const [formGuideError, setFormGuideError] = React.useState<string | null>(null);
  const [isFormGuideDialogOpen, setIsFormGuideDialogOpen] = React.useState(false);
  const initializedRef = React.useRef(false);

  React.useEffect(() => {
    if (!workoutPlan || initializedRef.current) return;
    const activeWorkout = workoutPlan.find((workout) => workout.id === workoutId);
    if (!activeWorkout) return;

    try {
      const rawDraft = window.sessionStorage.getItem(storageKey);
      const parsedDraft = rawDraft ? JSON.parse(rawDraft) : null;
      if (validDraft(parsedDraft, workoutId)) {
        setSession(parsedDraft.session);
        setCurrentExerciseIndex(Math.min(parsedDraft.currentExerciseIndex, parsedDraft.session.exercises.length - 1));
        setCurrentSetIndex(parsedDraft.currentSetIndex);
        setStartedAt(parsedDraft.startedAt);
        initializedRef.current = true;
        return;
      }
    } catch (error) {
      console.error('Workout draft restore failed:', error);
      window.sessionStorage.removeItem(storageKey);
    }

    const exercises: Exercise[] = activeWorkout.exercises.map((exercise, exerciseIndex) => {
      const setCount = firstPositiveInteger(exercise.sets);
      return {
        ...exercise,
        id: `${workoutId}-${exerciseIndex}`,
        sets: setCount,
        rest: 90,
        logs: Array.from({ length: setCount }, (_, setIndex) => ({
          set: setIndex + 1,
          reps: '',
          weight: '',
        })),
      };
    });
    setSession({ id: activeWorkout.id, title: activeWorkout.title, exercises });
    setStartedAt(Date.now());
    initializedRef.current = true;
  }, [storageKey, workoutId, workoutPlan]);

  React.useEffect(() => {
    if (!session || !startedAt || completionDuration !== null) return;
    const draft: SavedDraft = { session, currentExerciseIndex, currentSetIndex, startedAt };
    window.sessionStorage.setItem(storageKey, JSON.stringify(draft));
  }, [completionDuration, currentExerciseIndex, currentSetIndex, session, startedAt, storageKey]);

  const currentExercise = session?.exercises[currentExerciseIndex];
  const currentLog = currentExercise?.logs[currentSetIndex];
  const repsValue = Number(currentLog?.reps);
  const isSetLogComplete = Boolean(currentLog && Number.isInteger(repsValue) && repsValue > 0 && repsValue <= 1_000);
  const completedSets = currentExercise?.logs.filter((log) => Number(log.reps) > 0) || [];

  const fetchFormGuide = async () => {
    if (!currentExercise) return;
    setIsFormGuideLoading(true);
    setFormGuideError(null);
    setFormGuide(null);
    try {
      setFormGuide(await getExerciseDetails({ exerciseName: currentExercise.name, locale }));
    } catch (error) {
      console.error('Form guide failed:', error);
      setFormGuideError(label('The form guide is unavailable right now.', 'راهنمای اجرای حرکت در حال حاضر در دسترس نیست.'));
    } finally {
      setIsFormGuideLoading(false);
    }
  };

  const updateLog = (field: 'reps' | 'weight', value: string) => {
    const sanitized = value.replace(/[^0-9.]/g, '').slice(0, 8);
    setSession((current) => {
      if (!current) return current;
      return {
        ...current,
        exercises: current.exercises.map((exercise, exerciseIndex) => exerciseIndex !== currentExerciseIndex ? exercise : {
          ...exercise,
          logs: exercise.logs.map((log, setIndex) => setIndex !== currentSetIndex ? log : {
            ...log,
            [field]: sanitized,
          }),
        }),
      };
    });
  };

  const replaceExercise = (newExerciseName: string) => {
    setSession((current) => {
      if (!current) return current;
      return {
        ...current,
        exercises: current.exercises.map((exercise, index) => index !== currentExerciseIndex ? exercise : {
          ...exercise,
          name: newExerciseName,
          logs: exercise.logs.map((log) => ({ ...log, reps: '', weight: '' })),
        }),
      };
    });
    setCurrentSetIndex(0);
    setFormGuide(null);
  };

  const completeSet = () => {
    if (!session || !currentExercise || !currentLog || !isSetLogComplete) return;
    if (!currentLog.weight.trim()) updateLog('weight', '0');

    const lastSet = currentSetIndex === currentExercise.logs.length - 1;
    const lastExercise = currentExerciseIndex === session.exercises.length - 1;
    if (lastSet && lastExercise) {
      const duration = Math.max(1, Math.round((Date.now() - (startedAt || Date.now())) / 60_000));
      setCompletionDuration(duration);
      window.sessionStorage.removeItem(storageKey);
      return;
    }

    const nextExerciseIndex = lastSet ? currentExerciseIndex + 1 : currentExerciseIndex;
    const nextSetIndex = lastSet ? 0 : currentSetIndex + 1;
    const nextExercise = session.exercises[nextExerciseIndex];
    setPendingPosition({
      exerciseIndex: nextExerciseIndex,
      setIndex: nextSetIndex,
      nextLabel: lastSet
        ? label(`Next: ${nextExercise.name}`, `بعدی: ${nextExercise.name}`)
        : label(`Next: set ${nextSetIndex + 1}`, `بعدی: ست ${nextSetIndex + 1}`),
    });
  };

  const finishRest = () => {
    if (!pendingPosition) return;
    setCurrentExerciseIndex(pendingPosition.exerciseIndex);
    setCurrentSetIndex(pendingPosition.setIndex);
    setPendingPosition(null);
    setFormGuide(null);
  };

  const skipExercise = () => {
    if (!session || currentExerciseIndex >= session.exercises.length - 1) return;
    setCurrentExerciseIndex((index) => index + 1);
    setCurrentSetIndex(0);
    setPendingPosition(null);
    setFormGuide(null);
  };

  if (!session || !userProfile || !currentExercise || !currentLog || !startedAt) {
    return <div className="flex h-screen flex-col bg-gray-950 p-4 text-white" aria-busy="true"><Skeleton className="h-full w-full bg-gray-900" /></div>;
  }

  if (completionDuration !== null) {
    return <WorkoutCompletion session={session} totalDuration={completionDuration} draftStorageKey={storageKey} />;
  }

  if (pendingPosition) {
    return <WorkoutTimer duration={currentExercise.rest} onComplete={finishRest} exerciseName={pendingPosition.nextLabel} />;
  }

  return (
    <div className="flex min-h-screen flex-col bg-gray-950 text-white">
      <header className="flex items-center justify-between gap-3 border-b border-gray-800 p-4">
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button variant="ghost" size="icon" aria-label={label('Exit workout', 'خروج از تمرین')}>
              <ChevronLeft className="h-8 w-8 rtl:rotate-180" aria-hidden="true" />
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>{label('Leave workout?', 'از تمرین خارج می‌شوید؟')}</AlertDialogTitle>
              <AlertDialogDescription>
                {label('Your current entries are saved on this device and can be resumed during this session.', 'اطلاعات فعلی روی همین دستگاه ذخیره شده و در این نشست قابل ادامه است.')}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>{t('common.cancel')}</AlertDialogCancel>
              <AlertDialogAction onClick={() => router.push('/workout')}>{label('Leave', 'خروج')}</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        <div className="min-w-0 text-center">
          <h1 className="truncate text-xl font-bold">{currentExercise.name}</h1>
          <p className="text-sm text-gray-400">{label(`Exercise ${currentExerciseIndex + 1} of ${session.exercises.length}`, `حرکت ${currentExerciseIndex + 1} از ${session.exercises.length}`)}</p>
        </div>

        <div className="flex items-center justify-end gap-1">
          <AlternativeExerciseDialog
            currentExerciseName={currentExercise.name}
            onSelectExercise={replaceExercise}
            availableEquipment={userProfile.availableEquipment || 'Bodyweight only'}
            medicalLimitations={userProfile.medicalHistory || 'None'}
          />
          <Dialog open={isFormGuideDialogOpen} onOpenChange={setIsFormGuideDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="ghost" size="icon" onClick={() => void fetchFormGuide()} aria-label={label('Exercise form guide', 'راهنمای اجرای حرکت')}>
                <HelpCircle className="h-6 w-6" aria-hidden="true" />
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-3xl">
              <DialogHeader><DialogTitle>{label('Form guide', 'راهنمای اجرا')}: {currentExercise.name}</DialogTitle></DialogHeader>
              {isFormGuideLoading && <div className="flex h-48 items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>}
              {formGuideError && <p className="text-destructive">{formGuideError}</p>}
              {formGuide && (
                <ScrollArea className="max-h-[65vh] pe-4">
                  <div className="space-y-5">
                    <p className="whitespace-pre-wrap leading-7 text-muted-foreground">{formGuide.description}</p>
                    {formGuide.commonMistakes.length > 0 && <section><h3 className="mb-2 font-semibold">{label('Common mistakes', 'اشتباه‌های رایج')}</h3><ul className="list-disc space-y-1 ps-5 text-sm text-muted-foreground">{formGuide.commonMistakes.map((item) => <li key={item}>{item}</li>)}</ul></section>}
                    {formGuide.safetyWarnings.length > 0 && <Alert variant="destructive"><ShieldAlert className="h-4 w-4" /><AlertTitle>{label('Safety', 'ایمنی')}</AlertTitle><AlertDescription><ul className="list-disc space-y-1 ps-5">{formGuide.safetyWarnings.map((item) => <li key={item}>{item}</li>)}</ul></AlertDescription></Alert>}
                  </div>
                </ScrollArea>
              )}
            </DialogContent>
          </Dialog>
        </div>
      </header>

      <main className="flex w-full flex-1 flex-col space-y-4 overflow-y-auto p-4">
        <div className="flex justify-center gap-2" aria-label={label('Set progress', 'پیشرفت ست‌ها')}>
          {currentExercise.logs.map((_, index) => <div key={index} className={`h-2 flex-1 rounded-full ${index < currentSetIndex ? 'bg-primary' : index === currentSetIndex ? 'bg-primary/50' : 'bg-gray-700'}`} />)}
        </div>

        <div className="text-center"><h2 className="text-5xl font-bold text-primary">{label(`Set ${currentSetIndex + 1}`, `ست ${currentSetIndex + 1}`)}</h2><p className="mt-2 text-sm text-gray-400">{label(`Target: ${currentExercise.reps}`, `هدف: ${currentExercise.reps}`)}</p></div>

        <Card className="border-gray-800 bg-gray-900/50">
          <CardContent className="grid grid-cols-2 gap-4 p-4">
            <div className="text-center">
              <label htmlFor="weight" className="text-sm font-medium text-gray-400">{label('Weight (kg)', 'وزن (کیلوگرم)')}</label>
              <Input id="weight" type="number" min="0" max="1000" step="0.25" inputMode="decimal" placeholder="0" value={currentLog.weight} onChange={(event) => updateLog('weight', event.target.value)} className="mt-1 h-20 w-full bg-gray-800 text-center text-4xl font-bold text-white" />
              <p className="mt-1 text-xs text-gray-500">{label('Use 0 for bodyweight.', 'برای وزن بدن عدد ۰ را وارد کنید.')}</p>
            </div>
            <div className="text-center">
              <label htmlFor="reps" className="text-sm font-medium text-gray-400">{label('Reps', 'تکرار')}</label>
              <Input id="reps" type="number" min="1" max="1000" step="1" inputMode="numeric" placeholder={currentExercise.reps} value={currentLog.reps} onChange={(event) => updateLog('reps', event.target.value)} className="mt-1 h-20 w-full bg-gray-800 text-center text-4xl font-bold text-white" />
            </div>
          </CardContent>
        </Card>

        {completedSets.length > 0 && (
          <section className="flex min-h-0 flex-grow flex-col">
            <div className="mb-2 flex items-center gap-2 text-gray-400"><History className="h-5 w-5" /><h3 className="font-semibold">{label('Set history', 'سابقه ست‌ها')}</h3></div>
            <div className="flex-grow overflow-y-auto rounded-lg bg-gray-900/50 p-2">
              <Table>
                <TableHeader><TableRow className="border-gray-800"><TableHead>{label('Set', 'ست')}</TableHead><TableHead>{label('Weight', 'وزن')}</TableHead><TableHead className="text-end">{label('Reps', 'تکرار')}</TableHead></TableRow></TableHeader>
                <TableBody>{completedSets.map((log) => <TableRow key={log.set} className="border-gray-800"><TableCell>{log.set}</TableCell><TableCell>{log.weight || '0'} kg</TableCell><TableCell className="text-end">{log.reps}</TableCell></TableRow>)}</TableBody>
              </Table>
            </div>
          </section>
        )}

        <div className="mt-auto flex items-center justify-between pt-4">
          <div className="w-10" />
          <Button className="h-20 w-20 rounded-full shadow-lg" onClick={completeSet} disabled={!isSetLogComplete} aria-label={label('Complete set', 'ثبت پایان ست')}><Check className="h-10 w-10" /></Button>
          <Button variant="ghost" size="icon" onClick={skipExercise} disabled={currentExerciseIndex >= session.exercises.length - 1} aria-label={label('Skip exercise', 'ردکردن حرکت')}><SkipForward className="h-6 w-6 rtl:rotate-180" /></Button>
        </div>
      </main>
    </div>
  );
}
