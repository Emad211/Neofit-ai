'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
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
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { MoveRight } from 'lucide-react';
import { useOnboarding } from '@/context/onboarding-context';
import { useI18n } from '@/i18n/provider';

const FormSchema = z.object({
  gender: z.enum(['male', 'female', 'other']),
  age: z.coerce.number().int().min(16).max(100),
  height: z.number().int().min(100).max(250),
  weight: z.number().min(30).max(300),
  bodyType: z.enum(['ectomorph', 'mesomorph', 'endomorph']),
  fitnessLevel: z.enum(['beginner', 'intermediate', 'advanced']),
});

type Values = z.infer<typeof FormSchema>;

export function OnboardingDetailsForm() {
  const router = useRouter();
  const { draft, updateDraft } = useOnboarding();
  const { locale, t } = useI18n();
  const form = useForm<Values>({
    resolver: zodResolver(FormSchema),
    defaultValues: {
      gender: draft.gender,
      age: draft.age || 25,
      height: draft.height || 175,
      weight: draft.weight || 70,
      bodyType: draft.bodyType,
      fitnessLevel: draft.fitnessLevel,
    },
  });

  const bodyTypes = [
    {
      value: 'ectomorph' as const,
      label: locale === 'fa' ? 'اکتومورف' : 'Ectomorph',
      description: locale === 'fa' ? 'بدن معمولاً باریک‌تر؛ فقط یک توصیف ظاهری و نه معیار متابولیسم.' : 'Usually a leaner frame; a visual description, not a metabolic diagnosis.',
      image: '/uploads/ECTOMORFO.png',
    },
    {
      value: 'mesomorph' as const,
      label: locale === 'fa' ? 'مزومورف' : 'Mesomorph',
      description: locale === 'fa' ? 'بدن معمولاً عضلانی‌تر؛ این انتخاب فقط برای ترجیح بصری است.' : 'Usually a more muscular frame; used only as a visual preference.',
      image: '/uploads/MESOMORFO.png',
    },
    {
      value: 'endomorph' as const,
      label: locale === 'fa' ? 'اندومورف' : 'Endomorph',
      description: locale === 'fa' ? 'بدن معمولاً درشت‌تر؛ این برچسب پیش‌بینی علمی متابولیسم نیست.' : 'Usually a broader frame; this label does not scientifically predict metabolism.',
      image: '/uploads/ENDOMORFO.png',
    },
  ];

  function onSubmit(data: Values) {
    updateDraft(data);
    router.push('/onboarding/lifestyle');
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        <div className="grid gap-6 md:grid-cols-2">
          <FormField control={form.control} name="gender" render={({ field }) => (
            <FormItem>
              <FormLabel>{t('onboarding.gender')}</FormLabel>
              <FormControl>
                <RadioGroup onValueChange={field.onChange} value={field.value} className="flex flex-wrap gap-4">
                  {(['male', 'female', 'other'] as const).map((value) => (
                    <FormItem key={value} className="flex items-center gap-2 space-y-0">
                      <FormControl><RadioGroupItem value={value} /></FormControl>
                      <FormLabel className="font-normal">{t(`onboarding.${value}`)}</FormLabel>
                    </FormItem>
                  ))}
                </RadioGroup>
              </FormControl>
              <FormMessage />
            </FormItem>
          )} />
          <FormField control={form.control} name="age" render={({ field }) => (
            <FormItem>
              <FormLabel>{t('onboarding.age')}</FormLabel>
              <FormControl><Input type="number" inputMode="numeric" {...field} /></FormControl>
              <FormMessage />
            </FormItem>
          )} />
        </div>

        <FormField control={form.control} name="height" render={({ field }) => (
          <FormItem>
            <FormLabel>{t('onboarding.height')}: {field.value} cm</FormLabel>
            <FormControl>
              <Slider min={100} max={250} step={1} value={[field.value]} onValueChange={([value]) => field.onChange(value)} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )} />

        <FormField control={form.control} name="weight" render={({ field }) => (
          <FormItem>
            <FormLabel>{t('onboarding.weight')}: {field.value} kg</FormLabel>
            <FormControl>
              <Slider min={30} max={300} step={1} value={[field.value]} onValueChange={([value]) => field.onChange(value)} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )} />

        <FormField control={form.control} name="bodyType" render={({ field }) => (
          <FormItem>
            <FormLabel>{t('onboarding.bodyType')}</FormLabel>
            <FormDescription>
              {locale === 'fa' ? 'تیپ‌های بدنی دسته‌بندی پزشکی نیستند و فقط برای شخصی‌سازی ظاهری استفاده می‌شوند.' : 'Body types are not medical categories and are used only for visual personalization.'}
            </FormDescription>
            <FormControl>
              <RadioGroup onValueChange={field.onChange} value={field.value} className="grid gap-4 md:grid-cols-3">
                {bodyTypes.map((type) => (
                  <FormItem key={type.value}>
                    <FormControl><RadioGroupItem value={type.value} className="sr-only" /></FormControl>
                    <FormLabel className="font-normal">
                      <Card className={cn('cursor-pointer overflow-hidden', field.value === type.value && 'border-primary ring-2 ring-primary')}>
                        <CardContent className="p-4 text-center">
                          <div className="relative mb-3 h-56 w-full">
                            <Image src={type.image} alt={type.label} fill sizes="(max-width: 768px) 100vw, 33vw" className="object-contain" />
                          </div>
                          <p className="font-semibold">{type.label}</p>
                          <p className="mt-1 text-xs text-muted-foreground">{type.description}</p>
                        </CardContent>
                      </Card>
                    </FormLabel>
                  </FormItem>
                ))}
              </RadioGroup>
            </FormControl>
            <FormMessage />
          </FormItem>
        )} />

        <FormField control={form.control} name="fitnessLevel" render={({ field }) => (
          <FormItem>
            <FormLabel>{t('onboarding.fitnessLevel')}</FormLabel>
            <Select onValueChange={field.onChange} value={field.value}>
              <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
              <SelectContent>
                <SelectItem value="beginner">{t('onboarding.beginner')}</SelectItem>
                <SelectItem value="intermediate">{t('onboarding.intermediate')}</SelectItem>
                <SelectItem value="advanced">{t('onboarding.advanced')}</SelectItem>
              </SelectContent>
            </Select>
            <FormMessage />
          </FormItem>
        )} />

        <Button type="submit" size="lg" className="w-full bg-accent text-accent-foreground hover:bg-accent/90">
          {t('common.next')} <MoveRight className="ms-2 h-5 w-5 rtl:rotate-180" aria-hidden="true" />
        </Button>
      </form>
    </Form>
  );
}
