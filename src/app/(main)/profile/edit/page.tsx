'use client';

import * as React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Globe, Loader2, MoveLeft, RefreshCw, Save, Trash2 } from 'lucide-react';
import { useUserData, UserProfileSchema } from '@/context/user-profile-context';
import { useOnboarding } from '@/context/onboarding-context';
import { useI18n } from '@/i18n/provider';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Skeleton } from '@/components/ui/skeleton';
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
import { useToast } from '@/hooks/use-toast';

const FormSchema = z.object({
  goal: z.enum(['lose_weight', 'gain_muscle', 'improve_fitness']),
  weight: z.coerce.number().min(30).max(300),
  fitnessLevel: z.enum(['beginner', 'intermediate', 'advanced']),
  trainingDays: z.string().regex(/^[2-6]$/),
  trainingDuration: z.string().min(1),
  trainingTime: z.string().min(1),
  lifestyle: z.enum(['sedentary', 'lightly_active', 'moderately_active', 'very_active']),
  sleepHours: z.string().min(1),
  stressLevel: z.enum(['low', 'medium', 'high']),
  eatingHabits: z.string().max(2_000).optional(),
  dietaryPreference: z.string().max(100).optional(),
  cookingSkill: z.enum(['beginner', 'intermediate', 'advanced']),
  performanceGoals: z.string().max(500).optional(),
  workoutLocation: z.enum(['home', 'gym']),
  availableEquipment: z.string().max(1_000).optional(),
  costLevel: z.enum(['low', 'medium', 'high']),
  medicalHistory: z.string().max(2_000).optional(),
  timezone: z.string().min(1).max(100),
});
type Values = z.infer<typeof FormSchema>;

export default function EditProfilePage() {
  const { userProfile, saveUserProfile, resetUserData, isLoading } = useUserData();
  const { replaceDraft } = useOnboarding();
  const { locale, t } = useI18n();
  const router = useRouter();
  const { toast } = useToast();
  const [pending, setPending] = React.useState<'save' | 'regenerate' | 'reset' | null>(null);
  const timezones = React.useMemo(() => Intl.supportedValuesOf('timeZone'), []);
  const form = useForm<Values>({ resolver: zodResolver(FormSchema) });

  React.useEffect(() => {
    if (!userProfile) return;
    form.reset({
      goal: userProfile.goal,
      weight: userProfile.weight,
      fitnessLevel: userProfile.fitnessLevel,
      trainingDays: userProfile.trainingDays,
      trainingDuration: userProfile.trainingDuration,
      trainingTime: userProfile.trainingTime,
      lifestyle: userProfile.lifestyle,
      sleepHours: userProfile.sleepHours,
      stressLevel: userProfile.stressLevel,
      eatingHabits: userProfile.eatingHabits || '',
      dietaryPreference: userProfile.dietaryPreference || 'none',
      cookingSkill: userProfile.cookingSkill,
      performanceGoals: userProfile.performanceGoals || '',
      workoutLocation: userProfile.workoutLocation,
      availableEquipment: userProfile.availableEquipment || '',
      costLevel: userProfile.costLevel,
      medicalHistory: userProfile.medicalHistory || '',
      timezone: userProfile.timezone,
    });
  }, [form, userProfile]);

  const buildProfile = (values: Values) => {
    if (!userProfile) throw new Error('Profile is not loaded.');
    return UserProfileSchema.parse({ ...userProfile, ...values });
  };

  const save = async (values: Values) => {
    setPending('save');
    try {
      await saveUserProfile(buildProfile(values));
      toast({ title: locale === 'fa' ? 'پروفایل ذخیره شد' : 'Profile saved' });
      router.replace('/profile');
    } catch (error) {
      toast({ variant: 'destructive', title: t('common.error'), description: error instanceof Error ? error.message : undefined });
    } finally {
      setPending(null);
    }
  };

  const regenerate = async (values: Values) => {
    setPending('regenerate');
    try {
      const fullProfile = buildProfile(values);
      await saveUserProfile(fullProfile);
      const { name: _name, ...draft } = fullProfile;
      replaceDraft(draft);
      router.push('/onboarding/analysis');
    } catch (error) {
      toast({ variant: 'destructive', title: t('common.error'), description: error instanceof Error ? error.message : undefined });
      setPending(null);
    }
  };

  const reset = async () => {
    setPending('reset');
    try {
      await resetUserData();
      toast({ title: locale === 'fa' ? 'داده‌های پروفایل پاک شدند' : 'Profile data deleted' });
      router.replace('/');
    } catch (error) {
      toast({ variant: 'destructive', title: t('common.error'), description: error instanceof Error ? error.message : undefined });
      setPending(null);
    }
  };

  const label = (en: string, fa: string) => locale === 'fa' ? fa : en;
  const location = form.watch('workoutLocation');

  if (isLoading || !userProfile) {
    return <div className="space-y-6 p-4 sm:p-6 lg:p-8"><Skeleton className="h-10 w-48" /><Skeleton className="h-64 w-full" /><Skeleton className="h-64 w-full" /></div>;
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <div className="mb-8"><Button variant="ghost" asChild><Link href="/profile"><MoveLeft className="me-2 h-4 w-4 rtl:rotate-180" />{t('common.back')}</Link></Button></div>
      <header className="mb-8 text-center">
        <h1 className="font-headline text-4xl font-bold">{t('profile.edit')}</h1>
        <p className="text-muted-foreground">{t('profile.editDescription')}</p>
      </header>

      <Form {...form}>
        <form className="mx-auto max-w-4xl space-y-8" onSubmit={form.handleSubmit(regenerate)}>
          <Card>
            <CardHeader><CardTitle>{label('Goal and measurements', 'هدف و اندازه‌ها')}</CardTitle></CardHeader>
            <CardContent className="grid gap-6 md:grid-cols-2">
              <FormField control={form.control} name="goal" render={({ field }) => (
                <FormItem><FormLabel>{t('onboarding.primaryGoal')}</FormLabel><Select value={field.value} onValueChange={field.onChange}><FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl><SelectContent><SelectItem value="lose_weight">{t('onboarding.loseWeight')}</SelectItem><SelectItem value="gain_muscle">{t('onboarding.gainMuscle')}</SelectItem><SelectItem value="improve_fitness">{t('onboarding.improveFitness')}</SelectItem></SelectContent></Select><FormMessage /></FormItem>
              )} />
              <FormField control={form.control} name="weight" render={({ field }) => (
                <FormItem><FormLabel>{t('onboarding.weight')} (kg)</FormLabel><FormControl><Input type="number" inputMode="decimal" {...field} /></FormControl><FormDescription>{label('Keep this current as your weight changes.', 'با تغییر وزن، این مقدار را به‌روز نگه دارید.')}</FormDescription><FormMessage /></FormItem>
              )} />
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle>{t('onboarding.trainingPreferences')}</CardTitle></CardHeader>
            <CardContent className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              <FormField control={form.control} name="fitnessLevel" render={({ field }) => (
                <FormItem><FormLabel>{t('onboarding.fitnessLevel')}</FormLabel><Select value={field.value} onValueChange={field.onChange}><FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl><SelectContent><SelectItem value="beginner">{t('onboarding.beginner')}</SelectItem><SelectItem value="intermediate">{t('onboarding.intermediate')}</SelectItem><SelectItem value="advanced">{t('onboarding.advanced')}</SelectItem></SelectContent></Select></FormItem>
              )} />
              <FormField control={form.control} name="trainingDays" render={({ field }) => (
                <FormItem><FormLabel>{t('onboarding.trainingDays')}</FormLabel><Select value={field.value} onValueChange={field.onChange}><FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl><SelectContent>{['2','3','4','5','6'].map((day) => <SelectItem key={day} value={day}>{day}</SelectItem>)}</SelectContent></Select></FormItem>
              )} />
              <FormField control={form.control} name="trainingDuration" render={({ field }) => (
                <FormItem><FormLabel>{t('onboarding.trainingDuration')}</FormLabel><Select value={field.value} onValueChange={field.onChange}><FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl><SelectContent><SelectItem value="<30">&lt; 30</SelectItem><SelectItem value="30-45">30–45</SelectItem><SelectItem value="45-60">45–60</SelectItem><SelectItem value="60-90">60–90</SelectItem></SelectContent></Select></FormItem>
              )} />
              <FormField control={form.control} name="trainingTime" render={({ field }) => (
                <FormItem><FormLabel>{t('onboarding.trainingTime')}</FormLabel><Select value={field.value} onValueChange={field.onChange}><FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl><SelectContent><SelectItem value="morning">{label('Morning','صبح')}</SelectItem><SelectItem value="afternoon">{label('Afternoon','بعدازظهر')}</SelectItem><SelectItem value="evening">{label('Evening','شب')}</SelectItem><SelectItem value="any">{label('Any time','فرقی ندارد')}</SelectItem></SelectContent></Select></FormItem>
              )} />
              <FormField control={form.control} name="workoutLocation" render={({ field }) => (
                <FormItem><FormLabel>{t('onboarding.location')}</FormLabel><FormControl><RadioGroup value={field.value} onValueChange={field.onChange} className="flex gap-4"><FormItem className="flex items-center gap-2 space-y-0"><FormControl><RadioGroupItem value="home" /></FormControl><FormLabel className="font-normal">{t('onboarding.home')}</FormLabel></FormItem><FormItem className="flex items-center gap-2 space-y-0"><FormControl><RadioGroupItem value="gym" /></FormControl><FormLabel className="font-normal">{t('onboarding.gym')}</FormLabel></FormItem></RadioGroup></FormControl></FormItem>
              )} />
              {location === 'home' && <FormField control={form.control} name="availableEquipment" render={({ field }) => (
                <FormItem className="lg:col-span-2"><FormLabel>{t('onboarding.equipment')}</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
              )} />}
              <FormField control={form.control} name="performanceGoals" render={({ field }) => (
                <FormItem className="md:col-span-2 lg:col-span-3"><FormLabel>{t('onboarding.performanceGoals')}</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
              )} />
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle>{label('Nutrition and recovery', 'تغذیه و ریکاوری')}</CardTitle></CardHeader>
            <CardContent className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              <FormField control={form.control} name="lifestyle" render={({ field }) => (
                <FormItem><FormLabel>{t('onboarding.lifestyle')}</FormLabel><Select value={field.value} onValueChange={field.onChange}><FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl><SelectContent><SelectItem value="sedentary">{label('Mostly seated','بیشتر نشسته')}</SelectItem><SelectItem value="lightly_active">{label('Lightly active','کم‌تحرک')}</SelectItem><SelectItem value="moderately_active">{label('Moderately active','فعالیت متوسط')}</SelectItem><SelectItem value="very_active">{label('Very active','بسیار فعال')}</SelectItem></SelectContent></Select></FormItem>
              )} />
              <FormField control={form.control} name="sleepHours" render={({ field }) => (
                <FormItem><FormLabel>{t('onboarding.sleep')}</FormLabel><Select value={field.value} onValueChange={field.onChange}><FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl><SelectContent><SelectItem value="<5">&lt; 5</SelectItem><SelectItem value="5-6">5–6</SelectItem><SelectItem value="7-8">7–8</SelectItem><SelectItem value=">8">&gt; 8</SelectItem></SelectContent></Select></FormItem>
              )} />
              <FormField control={form.control} name="stressLevel" render={({ field }) => (
                <FormItem><FormLabel>{t('onboarding.stress')}</FormLabel><Select value={field.value} onValueChange={field.onChange}><FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl><SelectContent><SelectItem value="low">{label('Low','کم')}</SelectItem><SelectItem value="medium">{label('Medium','متوسط')}</SelectItem><SelectItem value="high">{label('High','زیاد')}</SelectItem></SelectContent></Select></FormItem>
              )} />
              <FormField control={form.control} name="dietaryPreference" render={({ field }) => (
                <FormItem><FormLabel>{label('Dietary preference','نوع رژیم غذایی')}</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
              )} />
              <FormField control={form.control} name="cookingSkill" render={({ field }) => (
                <FormItem><FormLabel>{t('onboarding.cookingSkill')}</FormLabel><Select value={field.value} onValueChange={field.onChange}><FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl><SelectContent><SelectItem value="beginner">{t('onboarding.beginner')}</SelectItem><SelectItem value="intermediate">{t('onboarding.intermediate')}</SelectItem><SelectItem value="advanced">{t('onboarding.advanced')}</SelectItem></SelectContent></Select></FormItem>
              )} />
              <FormField control={form.control} name="costLevel" render={({ field }) => (
                <FormItem><FormLabel>{t('onboarding.foodBudget')}</FormLabel><Select value={field.value} onValueChange={field.onChange}><FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl><SelectContent><SelectItem value="low">{label('Low','اقتصادی')}</SelectItem><SelectItem value="medium">{label('Medium','متوسط')}</SelectItem><SelectItem value="high">{label('High','آزاد')}</SelectItem></SelectContent></Select></FormItem>
              )} />
              <FormField control={form.control} name="eatingHabits" render={({ field }) => (
                <FormItem className="md:col-span-2 lg:col-span-3"><FormLabel>{t('onboarding.allergies')}</FormLabel><FormControl><Textarea {...field} /></FormControl><FormMessage /></FormItem>
              )} />
              <FormField control={form.control} name="timezone" render={({ field }) => (
                <FormItem className="md:col-span-2 lg:col-span-3"><FormLabel className="flex items-center gap-2"><Globe className="h-4 w-4" />{label('Time zone','منطقه زمانی')}</FormLabel><Select value={field.value} onValueChange={field.onChange}><FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl><SelectContent>{timezones.map((timezone) => <SelectItem key={timezone} value={timezone}>{timezone}</SelectItem>)}</SelectContent></Select></FormItem>
              )} />
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle>{t('profile.medicalHistory')}</CardTitle></CardHeader>
            <CardContent><FormField control={form.control} name="medicalHistory" render={({ field }) => (
              <FormItem><FormLabel>{label('Conditions, injuries, pain, and clinician restrictions','بیماری‌ها، آسیب‌ها، درد و محدودیت‌های اعلام‌شده توسط پزشک')}</FormLabel><FormControl><Textarea {...field} /></FormControl><FormDescription>{t('legal.medicalDisclaimer')}</FormDescription><FormMessage /></FormItem>
            )} /></CardContent>
          </Card>

          <div className="flex flex-col-reverse justify-between gap-4 sm:flex-row sm:items-center">
            <AlertDialog>
              <AlertDialogTrigger asChild><Button type="button" variant="destructive"><Trash2 className="me-2 h-4 w-4" />{t('profile.reset')}</Button></AlertDialogTrigger>
              <AlertDialogContent><AlertDialogHeader><AlertDialogTitle>{t('profile.reset')}</AlertDialogTitle><AlertDialogDescription>{t('profile.resetWarning')}</AlertDialogDescription></AlertDialogHeader><AlertDialogFooter><AlertDialogCancel>{t('common.cancel')}</AlertDialogCancel><AlertDialogAction onClick={() => void reset()} disabled={pending !== null}>{pending === 'reset' && <Loader2 className="me-2 h-4 w-4 animate-spin" />}{t('common.continue')}</AlertDialogAction></AlertDialogFooter></AlertDialogContent>
            </AlertDialog>
            <div className="flex flex-col-reverse gap-2 sm:flex-row">
              <Button type="button" variant="secondary" disabled={pending !== null} onClick={form.handleSubmit(save)}>{pending === 'save' ? <Loader2 className="me-2 h-4 w-4 animate-spin" /> : <Save className="me-2 h-4 w-4" />}{t('common.save')}</Button>
              <Button type="submit" size="lg" disabled={pending !== null} className="bg-accent text-accent-foreground hover:bg-accent/90">{pending === 'regenerate' ? <Loader2 className="me-2 h-5 w-5 animate-spin" /> : <RefreshCw className="me-2 h-5 w-5" />}{label('Save and regenerate plans','ذخیره و ساخت دوباره برنامه‌ها')}</Button>
            </div>
          </div>
        </form>
      </Form>
    </div>
  );
}
