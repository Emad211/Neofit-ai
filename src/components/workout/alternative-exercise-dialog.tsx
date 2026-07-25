'use client';

import * as React from 'react';
import { Dumbbell, Loader2, Replace, Shield, Sparkles } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { getAlternativeExercise } from '@/ai/flows/get-alternative-exercise';
import type { GetAlternativeExerciseOutput } from '@/ai/schemas';
import { useUserData } from '@/context/user-profile-context';
import { useI18n } from '@/i18n/provider';
import { cn } from '@/lib/utils';

type Reason = 'no_equipment' | 'causes_pain';

export function AlternativeExerciseDialog({
  currentExerciseName,
  onSelectExercise,
  availableEquipment,
  medicalLimitations,
}: {
  currentExerciseName: string;
  onSelectExercise: (exerciseName: string) => void;
  availableEquipment: string;
  medicalLimitations: string;
}) {
  const [isOpen, setIsOpen] = React.useState(false);
  const [isLoading, setIsLoading] = React.useState(false);
  const [alternative, setAlternative] = React.useState<GetAlternativeExerciseOutput | null>(null);
  const [error, setError] = React.useState<string | null>(null);
  const [reason, setReason] = React.useState<Reason | null>(null);
  const { user } = useUserData();
  const { locale } = useI18n();

  const reset = () => {
    setAlternative(null);
    setError(null);
    setReason(null);
    setIsLoading(false);
  };

  const openChange = (open: boolean) => {
    setIsOpen(open);
    if (!open) reset();
  };

  const fetchAlternative = async () => {
    if (!user || !reason) return;
    setIsLoading(true);
    setError(null);
    setAlternative(null);
    try {
      setAlternative(await getAlternativeExercise({
        exerciseName: currentExerciseName,
        availableEquipment,
        medicalLimitations,
        reasonForChange: reason,
        locale,
      }));
    } catch (caught) {
      console.error('Exercise alternative failed:', caught);
      setError(locale === 'fa' ? 'پیشنهاد جایگزین ایمن ساخته نشد.' : 'A safe alternative could not be generated.');
    } finally {
      setIsLoading(false);
    }
  };

  const replaceExercise = () => {
    if (!alternative || alternative.stopWorkout) return;
    onSelectExercise(alternative.alternativeExercise);
    openChange(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={openChange}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="icon" aria-label={locale === 'fa' ? 'جایگزین‌کردن حرکت' : 'Replace exercise'}><Replace className="h-6 w-6" /></Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{locale === 'fa' ? 'به حرکت دیگری نیاز دارید؟' : 'Need a different exercise?'}</DialogTitle>
          <DialogDescription>{locale === 'fa' ? `دلیل جایگزینی ${currentExerciseName} را مشخص کنید.` : `Tell us why you need to replace ${currentExerciseName}.`}</DialogDescription>
        </DialogHeader>

        {!alternative && (
          <div className="space-y-6 py-4">
            <div>
              <Label className="font-semibold">{locale === 'fa' ? 'مشکل چیست؟' : 'What is the issue?'}</Label>
              <RadioGroup value={reason || ''} onValueChange={(value) => setReason(value as Reason)} className="mt-2 grid grid-cols-2 gap-4">
                <Label className={cn('flex cursor-pointer flex-col items-center justify-center rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent', reason === 'no_equipment' && 'border-primary')}>
                  <RadioGroupItem value="no_equipment" className="sr-only" />
                  <Dumbbell className="mb-2 h-8 w-8" />
                  <span className="text-center font-normal">{locale === 'fa' ? 'تجهیزات لازم را ندارم' : 'I do not have the equipment'}</span>
                </Label>
                <Label className={cn('flex cursor-pointer flex-col items-center justify-center rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent', reason === 'causes_pain' && 'border-primary')}>
                  <RadioGroupItem value="causes_pain" className="sr-only" />
                  <Shield className="mb-2 h-8 w-8" />
                  <span className="text-center font-normal">{locale === 'fa' ? 'این حرکت درد ایجاد می‌کند' : 'This movement causes pain'}</span>
                </Label>
              </RadioGroup>
            </div>
            {reason === 'causes_pain' && (
              <Alert variant="destructive"><AlertTitle>{locale === 'fa' ? 'تمرین را متوقف کنید' : 'Stop the exercise'}</AlertTitle><AlertDescription>{locale === 'fa' ? 'درد را با ادامه حرکت یا یک تغییر جزئی امتحان نکنید.' : 'Do not test the pain by continuing or making a minor variation.'}</AlertDescription></Alert>
            )}
            <Button onClick={() => void fetchAlternative()} disabled={!reason || isLoading} className="w-full">
              {isLoading ? <Loader2 className="me-2 h-4 w-4 animate-spin" /> : <Sparkles className="me-2 h-4 w-4" />}
              {locale === 'fa' ? 'بررسی جایگزین' : 'Review an alternative'}
            </Button>
          </div>
        )}

        <div className="flex min-h-32 items-center justify-center py-4">
          {isLoading && <div className="flex flex-col items-center text-muted-foreground"><Loader2 className="h-8 w-8 animate-spin text-primary" /><p className="mt-2 text-sm">{locale === 'fa' ? 'در حال بررسی ایمنی…' : 'Reviewing safety…'}</p></div>}
          {error && <p className="text-center text-destructive">{error}</p>}
          {alternative && (
            <div className="w-full space-y-3">
              <Card><CardContent className="p-4 text-center"><h3 className="text-xl font-bold text-primary">{alternative.alternativeExercise}</h3><p className="mt-2 text-sm text-muted-foreground">{alternative.reason}</p></CardContent></Card>
              {alternative.stopWorkout && <Alert variant="destructive"><AlertTitle>{locale === 'fa' ? 'برای جلسه فعلی جایگزین نشود' : 'Do not substitute during this session'}</AlertTitle><AlertDescription>{alternative.seekMedicalAdvice ? (locale === 'fa' ? 'پیش از ادامه این الگوی حرکتی، ارزیابی متخصص لازم است.' : 'Seek qualified assessment before returning to this movement pattern.') : (locale === 'fa' ? 'جلسه را متوقف کنید و فقط پس از برطرف‌شدن درد درباره جایگزین تصمیم بگیرید.' : 'Stop the session and consider alternatives only after the pain has resolved.')}</AlertDescription></Alert>}
            </div>
          )}
        </div>
        <DialogFooter>
          <Button variant="secondary" onClick={reset} disabled={isLoading}>{locale === 'fa' ? 'شروع دوباره' : 'Start over'}</Button>
          {alternative?.stopWorkout ? (
            <Button variant="destructive" onClick={() => openChange(false)}>{locale === 'fa' ? 'توقف و بستن' : 'Stop and close'}</Button>
          ) : (
            <Button onClick={replaceExercise} disabled={!alternative}>{locale === 'fa' ? 'جایگزین‌کردن حرکت' : 'Replace exercise'}</Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
