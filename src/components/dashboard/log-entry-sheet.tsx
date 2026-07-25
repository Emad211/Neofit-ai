'use client';

import * as React from 'react';
import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Apple, Dumbbell, Loader2, Sparkles, Weight } from 'lucide-react';
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { calculateActivityCalories } from '@/ai/flows/calculate-activity-calories';
import type { CalculateActivityCaloriesOutput } from '@/ai/schemas';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { CombinedLog, useUserData } from '@/context/user-profile-context';
import { useI18n } from '@/i18n/provider';

export type LogType = 'meal' | 'activity' | 'weight' | null;

const ValuesSchema = z.object({
  mealType: z.enum(['breakfast', 'lunch', 'dinner', 'snack']).default('snack'),
  description: z.string().trim().max(500).default(''),
  calories: z.string().default(''),
  protein: z.string().default(''),
  carbohydrates: z.string().default(''),
  fat: z.string().default(''),
  activityType: z.string().trim().max(200).default(''),
  durationMinutes: z.string().default(''),
  intensity: z.enum(['low', 'medium', 'high']).default('medium'),
  caloriesBurned: z.string().default(''),
  weight: z.string().default(''),
});
type Values = z.infer<typeof ValuesSchema>;

function nonNegative(value: string, field: string, required = false) {
  if (!value.trim() && !required) return 0;
  const number = Number(value);
  if (!Number.isFinite(number) || number < 0) throw new Error(`${field} is invalid.`);
  return number;
}

export function LogEntrySheet({
  open,
  onOpenChange,
  logType,
  editableLog,
  onClose,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  logType: LogType;
  editableLog?: CombinedLog | null;
  onClose?: () => void;
}) {
  const { toast } = useToast();
  const { userProfile, logMeal, logActivity, logWeight, updateLog } = useUserData();
  const { locale, t } = useI18n();
  const [isCalculating, setIsCalculating] = React.useState(false);
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [calculation, setCalculation] = React.useState<CalculateActivityCaloriesOutput | null>(null);
  const isEditMode = Boolean(editableLog);
  const form = useForm<Values>({ resolver: zodResolver(ValuesSchema), defaultValues: ValuesSchema.parse({}) });
  const activityType = form.watch('activityType');
  const durationMinutes = form.watch('durationMinutes');
  const intensity = form.watch('intensity');

  React.useEffect(() => {
    if (open && editableLog) {
      form.reset({
        ...ValuesSchema.parse({}),
        ...Object.fromEntries(Object.entries(editableLog).map(([key, value]) => [key, value == null ? '' : String(value)])),
        mealType: editableLog.logType === 'meal' ? editableLog.mealType : 'snack',
        intensity: editableLog.logType === 'activity' ? editableLog.intensity : 'medium',
      });
    } else if (open) {
      form.reset(ValuesSchema.parse({}));
    }
    setCalculation(null);
  }, [editableLog, form, open]);

  React.useEffect(() => {
    if (!open) onClose?.();
  }, [onClose, open]);

  const label = (en: string, fa: string) => locale === 'fa' ? fa : en;
  const config = logType === 'meal'
    ? { title: label('Log meal', 'ثبت وعده'), description: label('Record food and known nutrition values.', 'غذا و مقادیر تغذیه‌ای شناخته‌شده را ثبت کنید.'), icon: Apple }
    : logType === 'activity'
      ? { title: label('Log activity', 'ثبت فعالیت'), description: label('Record a workout or other physical activity.', 'تمرین یا فعالیت بدنی دیگر را ثبت کنید.'), icon: Dumbbell }
      : { title: label('Log weight', 'ثبت وزن'), description: label('Update your current body weight.', 'وزن فعلی خود را ثبت کنید.'), icon: Weight };

  const calculate = async () => {
    if (!userProfile || !activityType.trim()) {
      toast({ variant: 'destructive', title: label('Missing information', 'اطلاعات ناقص است') });
      return;
    }
    try {
      const duration = nonNegative(durationMinutes, 'duration', true);
      if (duration < 1 || duration > 1_440) throw new Error('Duration is outside the supported range.');
      setIsCalculating(true);
      const result = await calculateActivityCalories({
        activityType,
        durationMinutes: Math.round(duration),
        intensity,
        userProfile: {
          weightKg: userProfile.weight,
          age: userProfile.age,
          gender: userProfile.gender,
          heightCm: Math.round(userProfile.height),
        },
        locale,
      });
      form.setValue('caloriesBurned', String(result.caloriesBurned), { shouldValidate: true });
      setCalculation(result);
    } catch (error) {
      toast({ variant: 'destructive', title: label('Calculation failed', 'محاسبه انجام نشد'), description: error instanceof Error ? error.message : undefined });
    } finally {
      setIsCalculating(false);
    }
  };

  const submit = async (values: Values) => {
    if (!logType) return;
    setIsSubmitting(true);
    try {
      if (logType === 'meal') {
        const payload = {
          mealType: values.mealType,
          description: values.description.trim(),
          calories: Math.round(nonNegative(values.calories, 'calories', true)),
          protein: nonNegative(values.protein, 'protein'),
          carbohydrates: nonNegative(values.carbohydrates, 'carbohydrates'),
          fat: nonNegative(values.fat, 'fat'),
        };
        if (!payload.description) throw new Error(label('Meal description is required.', 'توضیح وعده لازم است.'));
        if (isEditMode && editableLog?.id) await updateLog(editableLog.id, 'meal', payload);
        else await logMeal(payload);
      } else if (logType === 'activity') {
        const payload = {
          activityType: values.activityType.trim(),
          durationMinutes: Math.round(nonNegative(values.durationMinutes, 'duration', true)),
          intensity: values.intensity,
          caloriesBurned: Math.round(nonNegative(values.caloriesBurned, 'calories')),
        };
        if (!payload.activityType || payload.durationMinutes < 1) throw new Error(label('Activity and duration are required.', 'نام فعالیت و مدت آن لازم است.'));
        if (isEditMode && editableLog?.id) await updateLog(editableLog.id, 'activity', payload);
        else await logActivity(payload);
      } else {
        const payload = { weight: nonNegative(values.weight, 'weight', true) };
        if (payload.weight < 20 || payload.weight > 500) throw new Error(label('Weight is outside the supported range.', 'وزن خارج از محدوده قابل قبول است.'));
        if (isEditMode && editableLog?.id) await updateLog(editableLog.id, 'weight', payload);
        else await logWeight(payload);
      }
      toast({ title: isEditMode ? label('Log updated', 'ثبت به‌روز شد') : label('Log saved', 'ثبت ذخیره شد') });
      onOpenChange(false);
    } catch (error) {
      console.error('Log save failed:', error);
      toast({ variant: 'destructive', title: label('Save failed', 'ذخیره انجام نشد'), description: error instanceof Error ? error.message : undefined });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!logType) return null;
  const Icon = config.icon;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="overflow-y-auto">
        <form onSubmit={form.handleSubmit(submit)}>
          <SheetHeader>
            <SheetTitle className="flex items-center gap-2"><Icon className="h-6 w-6 text-primary" />{isEditMode ? label('Edit log', 'ویرایش ثبت') : config.title}</SheetTitle>
            <SheetDescription>{config.description}</SheetDescription>
          </SheetHeader>
          <div className="grid gap-6 py-6">
            {logType === 'meal' && (
              <>
                <Field label={label('Meal', 'وعده')}><Controller name="mealType" control={form.control} render={({ field }) => <Select onValueChange={field.onChange} value={field.value}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="breakfast">{label('Breakfast','صبحانه')}</SelectItem><SelectItem value="lunch">{label('Lunch','ناهار')}</SelectItem><SelectItem value="dinner">{label('Dinner','شام')}</SelectItem><SelectItem value="snack">{label('Snack','میان‌وعده')}</SelectItem></SelectContent></Select>} /></Field>
                <Field label={label('Description', 'توضیح')}><Input {...form.register('description')} placeholder={label('For example: chicken and rice', 'مثلاً مرغ و برنج')} /></Field>
                <Field label={t('today.calories')}><Input type="number" min="0" inputMode="numeric" {...form.register('calories')} /></Field>
                <div className="grid grid-cols-3 gap-3">
                  <div><Label>{t('today.protein')} (g)</Label><Input className="mt-2" type="number" min="0" step="0.1" {...form.register('protein')} /></div>
                  <div><Label>{label('Carbs','کربوهیدرات')} (g)</Label><Input className="mt-2" type="number" min="0" step="0.1" {...form.register('carbohydrates')} /></div>
                  <div><Label>{label('Fat','چربی')} (g)</Label><Input className="mt-2" type="number" min="0" step="0.1" {...form.register('fat')} /></div>
                </div>
              </>
            )}
            {logType === 'activity' && (
              <>
                <Field label={label('Activity', 'فعالیت')}><Input {...form.register('activityType')} placeholder={label('For example: brisk walking', 'مثلاً پیاده‌روی تند')} /></Field>
                <Field label={label('Duration (minutes)', 'مدت (دقیقه)')}><Input type="number" min="1" max="1440" inputMode="numeric" {...form.register('durationMinutes')} /></Field>
                <div><Label>{label('Intensity', 'شدت')}</Label><Controller name="intensity" control={form.control} render={({ field }) => <RadioGroup onValueChange={field.onChange} value={field.value} className="mt-2 grid grid-cols-3 gap-2">{(['low','medium','high'] as const).map((level) => <Label key={level} className={cn('cursor-pointer rounded-md border p-3 text-center text-sm font-normal', field.value === level && 'border-primary ring-2 ring-primary')}><RadioGroupItem value={level} className="sr-only" />{level === 'low' ? label('Low','کم') : level === 'medium' ? label('Medium','متوسط') : label('High','زیاد')}</Label>)}</RadioGroup>} /></div>
                <Field label={label('Estimated calories', 'کالری تخمینی')}><Input type="number" min="0" inputMode="numeric" {...form.register('caloriesBurned')} /></Field>
                <Button type="button" variant="outline" size="sm" onClick={() => void calculate()} disabled={isCalculating}>{isCalculating ? <Loader2 className="me-2 h-4 w-4 animate-spin" /> : <Sparkles className="me-2 h-4 w-4" />}{label('Estimate with MET', 'تخمین با MET')}</Button>
                {calculation && <Alert><AlertDescription>{label(`Method: MET · confidence: ${calculation.confidence}. This is an estimate.`, `روش: MET · اطمینان: ${calculation.confidence === 'medium' ? 'متوسط' : 'کم'}. این عدد تخمینی است.`)}</AlertDescription></Alert>}
              </>
            )}
            {logType === 'weight' && <Field label={`${t('onboarding.weight')} (kg)`}><Input type="number" min="20" max="500" step="0.1" inputMode="decimal" {...form.register('weight')} /></Field>}
          </div>
          <SheetFooter>
            <SheetClose asChild><Button type="button" variant="secondary" disabled={isSubmitting}>{t('common.cancel')}</Button></SheetClose>
            <Button type="submit" disabled={isSubmitting}>{isSubmitting && <Loader2 className="me-2 h-4 w-4 animate-spin" />}{isEditMode ? label('Save changes', 'ذخیره تغییرات') : t('common.save')}</Button>
          </SheetFooter>
        </form>
      </SheetContent>
    </Sheet>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <div className="grid gap-2"><Label>{label}</Label>{children}</div>;
}
