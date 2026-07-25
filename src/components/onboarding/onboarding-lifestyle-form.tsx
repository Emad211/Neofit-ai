'use client';

import * as React from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dumbbell, Globe, MoveRight, Utensils, BedDouble } from 'lucide-react';
import { useOnboarding } from '@/context/onboarding-context';
import { useI18n } from '@/i18n/provider';

const FormSchema = z.object({
  trainingDays: z.string().regex(/^[2-6]$/),
  trainingDuration: z.enum(['<30', '30-45', '45-60', '60-90']),
  trainingTime: z.enum(['morning', 'afternoon', 'evening', 'any']),
  lifestyle: z.enum(['sedentary', 'lightly_active', 'moderately_active', 'very_active']),
  sleepHours: z.enum(['<5', '5-6', '7-8', '>8']),
  stressLevel: z.enum(['low', 'medium', 'high']),
  eatingHabits: z.string().trim().max(1_500).optional(),
  dietaryPreference: z.enum(['none', 'vegetarian', 'vegan', 'halal', 'other']),
  cookingSkill: z.enum(['beginner', 'intermediate', 'advanced']),
  performanceGoals: z.string().trim().max(500).optional(),
  workoutLocation: z.enum(['home', 'gym']),
  availableEquipment: z.string().trim().max(1_000).optional(),
  costLevel: z.enum(['low', 'medium', 'high']),
  timezone: z.string().min(1).max(100),
});

type Values = z.infer<typeof FormSchema>;

export function OnboardingLifestyleForm() {
  const router = useRouter();
  const { draft, updateDraft } = useOnboarding();
  const { locale, t } = useI18n();
  const defaultTimezone = React.useMemo(() => Intl.DateTimeFormat().resolvedOptions().timeZone, []);
  const timezones = React.useMemo(() => Intl.supportedValuesOf('timeZone'), []);

  const form = useForm<Values>({
    resolver: zodResolver(FormSchema),
    defaultValues: {
      trainingDays: draft.trainingDays || '3',
      trainingDuration: (draft.trainingDuration as Values['trainingDuration']) || '45-60',
      trainingTime: (draft.trainingTime as Values['trainingTime']) || 'any',
      lifestyle: draft.lifestyle || 'sedentary',
      sleepHours: (draft.sleepHours as Values['sleepHours']) || '7-8',
      stressLevel: draft.stressLevel || 'medium',
      eatingHabits: draft.eatingHabits || '',
      dietaryPreference: (draft.dietaryPreference as Values['dietaryPreference']) || 'none',
      cookingSkill: draft.cookingSkill || 'intermediate',
      performanceGoals: draft.performanceGoals || '',
      workoutLocation: draft.workoutLocation || 'gym',
      availableEquipment: draft.availableEquipment || '',
      costLevel: draft.costLevel || 'medium',
      timezone: draft.timezone || defaultTimezone,
    },
  });

  const location = form.watch('workoutLocation');

  function onSubmit(data: Values) {
    updateDraft({
      ...data,
      availableEquipment: data.workoutLocation === 'gym'
        ? 'Full gym equipment'
        : (data.availableEquipment || 'Bodyweight only'),
    });
    router.push('/onboarding/injuries');
  }

  const label = (en: string, fa: string) => locale === 'fa' ? fa : en;

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        <Card>
          <CardHeader><CardTitle className="flex items-center gap-2"><Dumbbell className="h-5 w-5 text-primary" />{t('onboarding.trainingPreferences')}</CardTitle></CardHeader>
          <CardContent className="grid gap-6 md:grid-cols-2">
            <FormField control={form.control} name="trainingDays" render={({ field }) => (
              <FormItem>
                <FormLabel>{t('onboarding.trainingDays')}</FormLabel>
                <Select value={field.value} onValueChange={field.onChange}>
                  <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                  <SelectContent>{['2', '3', '4', '5', '6'].map((day) => <SelectItem key={day} value={day}>{day}</SelectItem>)}</SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )} />
            <FormField control={form.control} name="trainingDuration" render={({ field }) => (
              <FormItem>
                <FormLabel>{t('onboarding.trainingDuration')}</FormLabel>
                <Select value={field.value} onValueChange={field.onChange}>
                  <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                  <SelectContent>
                    <SelectItem value="<30">{label('Under 30 minutes', 'کمتر از ۳۰ دقیقه')}</SelectItem>
                    <SelectItem value="30-45">{label('30–45 minutes', '۳۰ تا ۴۵ دقیقه')}</SelectItem>
                    <SelectItem value="45-60">{label('45–60 minutes', '۴۵ تا ۶۰ دقیقه')}</SelectItem>
                    <SelectItem value="60-90">{label('60–90 minutes', '۶۰ تا ۹۰ دقیقه')}</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )} />
            <FormField control={form.control} name="trainingTime" render={({ field }) => (
              <FormItem>
                <FormLabel>{t('onboarding.trainingTime')}</FormLabel>
                <Select value={field.value} onValueChange={field.onChange}>
                  <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                  <SelectContent>
                    <SelectItem value="morning">{label('Morning', 'صبح')}</SelectItem>
                    <SelectItem value="afternoon">{label('Afternoon', 'بعدازظهر')}</SelectItem>
                    <SelectItem value="evening">{label('Evening', 'شب')}</SelectItem>
                    <SelectItem value="any">{label('Any time', 'فرقی ندارد')}</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )} />
            <FormField control={form.control} name="workoutLocation" render={({ field }) => (
              <FormItem>
                <FormLabel>{t('onboarding.location')}</FormLabel>
                <FormControl>
                  <RadioGroup value={field.value} onValueChange={field.onChange} className="flex gap-5">
                    <FormItem className="flex items-center gap-2 space-y-0"><FormControl><RadioGroupItem value="home" /></FormControl><FormLabel className="font-normal">{t('onboarding.home')}</FormLabel></FormItem>
                    <FormItem className="flex items-center gap-2 space-y-0"><FormControl><RadioGroupItem value="gym" /></FormControl><FormLabel className="font-normal">{t('onboarding.gym')}</FormLabel></FormItem>
                  </RadioGroup>
                </FormControl>
                <FormMessage />
              </FormItem>
            )} />
            {location === 'home' && (
              <FormField control={form.control} name="availableEquipment" render={({ field }) => (
                <FormItem className="md:col-span-2">
                  <FormLabel>{t('onboarding.equipment')}</FormLabel>
                  <FormControl><Input {...field} placeholder={label('Dumbbells, resistance bands, bodyweight…', 'دمبل، کش تمرینی، وزن بدن و…')} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
            )}
            <FormField control={form.control} name="performanceGoals" render={({ field }) => (
              <FormItem className="md:col-span-2">
                <FormLabel>{t('onboarding.performanceGoals')}</FormLabel>
                <FormControl><Input {...field} placeholder={label('For example: run 5 km or improve squat form', 'مثلاً دویدن ۵ کیلومتر یا بهترشدن فرم اسکوات')} /></FormControl>
                <FormMessage />
              </FormItem>
            )} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="flex items-center gap-2"><BedDouble className="h-5 w-5 text-primary" />{label('Lifestyle and recovery', 'سبک زندگی و ریکاوری')}</CardTitle></CardHeader>
          <CardContent className="grid gap-6 md:grid-cols-2">
            <FormField control={form.control} name="lifestyle" render={({ field }) => (
              <FormItem>
                <FormLabel>{t('onboarding.lifestyle')}</FormLabel>
                <Select value={field.value} onValueChange={field.onChange}>
                  <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                  <SelectContent>
                    <SelectItem value="sedentary">{label('Mostly seated', 'بیشتر نشسته')}</SelectItem>
                    <SelectItem value="lightly_active">{label('Lightly active', 'کم‌تحرک')}</SelectItem>
                    <SelectItem value="moderately_active">{label('Moderately active', 'فعالیت متوسط')}</SelectItem>
                    <SelectItem value="very_active">{label('Very active', 'بسیار فعال')}</SelectItem>
                  </SelectContent>
                </Select>
              </FormItem>
            )} />
            <FormField control={form.control} name="sleepHours" render={({ field }) => (
              <FormItem>
                <FormLabel>{t('onboarding.sleep')}</FormLabel>
                <Select value={field.value} onValueChange={field.onChange}>
                  <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                  <SelectContent>
                    <SelectItem value="<5">{label('Under 5 hours', 'کمتر از ۵ ساعت')}</SelectItem>
                    <SelectItem value="5-6">{label('5–6 hours', '۵ تا ۶ ساعت')}</SelectItem>
                    <SelectItem value="7-8">{label('7–8 hours', '۷ تا ۸ ساعت')}</SelectItem>
                    <SelectItem value=">8">{label('More than 8 hours', 'بیشتر از ۸ ساعت')}</SelectItem>
                  </SelectContent>
                </Select>
              </FormItem>
            )} />
            <FormField control={form.control} name="stressLevel" render={({ field }) => (
              <FormItem>
                <FormLabel>{t('onboarding.stress')}</FormLabel>
                <Select value={field.value} onValueChange={field.onChange}>
                  <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                  <SelectContent>
                    <SelectItem value="low">{label('Low', 'کم')}</SelectItem>
                    <SelectItem value="medium">{label('Medium', 'متوسط')}</SelectItem>
                    <SelectItem value="high">{label('High', 'زیاد')}</SelectItem>
                  </SelectContent>
                </Select>
              </FormItem>
            )} />
            <FormField control={form.control} name="timezone" render={({ field }) => (
              <FormItem>
                <FormLabel className="flex items-center gap-2"><Globe className="h-4 w-4" />{t('common.language') === 'زبان' ? 'منطقه زمانی' : 'Time zone'}</FormLabel>
                <Select value={field.value} onValueChange={field.onChange}>
                  <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                  <SelectContent>{timezones.map((timezone) => <SelectItem key={timezone} value={timezone}>{timezone}</SelectItem>)}</SelectContent>
                </Select>
              </FormItem>
            )} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="flex items-center gap-2"><Utensils className="h-5 w-5 text-primary" />{t('onboarding.diet')}</CardTitle></CardHeader>
          <CardContent className="grid gap-6 md:grid-cols-2">
            <FormField control={form.control} name="dietaryPreference" render={({ field }) => (
              <FormItem>
                <FormLabel>{label('Dietary preference', 'نوع رژیم غذایی')}</FormLabel>
                <Select value={field.value} onValueChange={field.onChange}>
                  <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                  <SelectContent>
                    <SelectItem value="none">{t('common.none')}</SelectItem>
                    <SelectItem value="vegetarian">{label('Vegetarian', 'گیاه‌خواری')}</SelectItem>
                    <SelectItem value="vegan">{label('Vegan', 'وگان')}</SelectItem>
                    <SelectItem value="halal">{label('Halal', 'حلال')}</SelectItem>
                    <SelectItem value="other">{t('onboarding.other')}</SelectItem>
                  </SelectContent>
                </Select>
              </FormItem>
            )} />
            <FormField control={form.control} name="cookingSkill" render={({ field }) => (
              <FormItem>
                <FormLabel>{t('onboarding.cookingSkill')}</FormLabel>
                <Select value={field.value} onValueChange={field.onChange}>
                  <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                  <SelectContent>
                    <SelectItem value="beginner">{t('onboarding.beginner')}</SelectItem>
                    <SelectItem value="intermediate">{t('onboarding.intermediate')}</SelectItem>
                    <SelectItem value="advanced">{t('onboarding.advanced')}</SelectItem>
                  </SelectContent>
                </Select>
              </FormItem>
            )} />
            <FormField control={form.control} name="costLevel" render={({ field }) => (
              <FormItem>
                <FormLabel>{t('onboarding.foodBudget')}</FormLabel>
                <Select value={field.value} onValueChange={field.onChange}>
                  <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                  <SelectContent>
                    <SelectItem value="low">{label('Low', 'اقتصادی')}</SelectItem>
                    <SelectItem value="medium">{label('Medium', 'متوسط')}</SelectItem>
                    <SelectItem value="high">{label('High', 'آزاد')}</SelectItem>
                  </SelectContent>
                </Select>
              </FormItem>
            )} />
            <FormField control={form.control} name="eatingHabits" render={({ field }) => (
              <FormItem className="md:col-span-2">
                <FormLabel>{t('onboarding.allergies')}</FormLabel>
                <FormControl><Textarea {...field} placeholder={label('List allergies first, then dislikes or unavailable foods.', 'ابتدا حساسیت‌ها، سپس غذاهای نامطلوب یا در دسترس نبودن مواد را بنویسید.')} /></FormControl>
                <FormDescription>{label('For a severe allergy, verify every ingredient label yourself.', 'در حساسیت شدید، برچسب همه مواد غذایی را شخصاً بررسی کنید.')}</FormDescription>
                <FormMessage />
              </FormItem>
            )} />
          </CardContent>
        </Card>

        <Button type="submit" size="lg" className="w-full bg-accent text-accent-foreground hover:bg-accent/90">
          {t('common.next')} <MoveRight className="ms-2 h-5 w-5 rtl:rotate-180" aria-hidden="true" />
        </Button>
      </form>
    </Form>
  );
}
