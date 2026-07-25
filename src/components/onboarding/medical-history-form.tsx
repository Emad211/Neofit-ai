'use client';

import * as React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Checkbox } from '@/components/ui/checkbox';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Textarea } from '@/components/ui/textarea';
import { useOnboarding } from '@/context/onboarding-context';
import { useI18n } from '@/i18n/provider';

const FormSchema = z.object({
  conditions: z.array(z.string()),
  details: z.string().max(2_000).optional(),
});

type Values = z.infer<typeof FormSchema>;

const conditionGroups = [
  {
    id: 'cardiovascular',
    en: 'Cardiovascular conditions',
    fa: 'بیماری‌های قلبی‌عروقی',
    items: [
      ['high blood pressure', 'High blood pressure', 'فشار خون بالا'],
      ['heart condition', 'Known heart condition', 'بیماری قلبی شناخته‌شده'],
      ['high cholesterol', 'High cholesterol', 'کلسترول بالا'],
    ],
  },
  {
    id: 'musculoskeletal',
    en: 'Musculoskeletal conditions',
    fa: 'مشکلات اسکلتی‌عضلانی',
    items: [
      ['arthritis', 'Arthritis', 'آرتریت'],
      ['chronic back pain', 'Chronic back pain', 'کمردرد مزمن'],
      ['osteoporosis', 'Osteoporosis', 'پوکی استخوان'],
    ],
  },
  {
    id: 'metabolic',
    en: 'Metabolic conditions',
    fa: 'بیماری‌های متابولیک',
    items: [
      ['type 1 diabetes', 'Type 1 diabetes', 'دیابت نوع ۱'],
      ['type 2 diabetes', 'Type 2 diabetes', 'دیابت نوع ۲'],
      ['thyroid condition', 'Thyroid condition', 'بیماری تیروئید'],
      ['kidney condition', 'Kidney condition', 'بیماری کلیه'],
    ],
  },
  {
    id: 'respiratory',
    en: 'Respiratory conditions',
    fa: 'بیماری‌های تنفسی',
    items: [
      ['asthma', 'Asthma', 'آسم'],
      ['copd', 'COPD', 'بیماری انسدادی مزمن ریه'],
    ],
  },
  {
    id: 'other-risk',
    en: 'Other important considerations',
    fa: 'موارد مهم دیگر',
    items: [
      ['pregnancy', 'Pregnancy', 'بارداری'],
      ['eating disorder history', 'Eating disorder history', 'سابقه اختلال خوردن'],
      ['recent surgery', 'Recent surgery', 'جراحی اخیر'],
      ['fainting or unexplained dizziness', 'Fainting or unexplained dizziness', 'غش یا سرگیجه بدون علت مشخص'],
    ],
  },
] as const;

export function MedicalHistoryForm() {
  const { draft, updateDraft } = useOnboarding();
  const { locale, t } = useI18n();
  const form = useForm<Values>({
    resolver: zodResolver(FormSchema),
    defaultValues: {
      conditions: [],
      details: draft.medicalHistory && draft.medicalHistory !== 'None' ? draft.medicalHistory : '',
    },
  });

  React.useEffect(() => {
    const subscription = form.watch((value) => {
      const selected = (value.conditions || []).filter(Boolean);
      const details = value.details?.trim();
      const medicalHistory = [...selected, ...(details ? [details] : [])].join('; ') || 'None';
      updateDraft({ medicalHistory });
    });
    return () => subscription.unsubscribe();
  }, [form, updateDraft]);

  return (
    <Form {...form}>
      <div className="w-full max-w-2xl space-y-4">
        <Accordion type="multiple" className="w-full">
          {conditionGroups.map((group) => (
            <AccordionItem value={group.id} key={group.id}>
              <AccordionTrigger className="font-semibold">{locale === 'fa' ? group.fa : group.en}</AccordionTrigger>
              <AccordionContent>
                <FormField control={form.control} name="conditions" render={({ field }) => (
                  <FormItem className="space-y-3 p-2">
                    {group.items.map(([value, en, fa]) => (
                      <FormItem key={value} className="flex flex-row items-start gap-3 space-y-0">
                        <FormControl>
                          <Checkbox
                            checked={field.value.includes(value)}
                            onCheckedChange={(checked) => field.onChange(
                              checked ? [...field.value, value] : field.value.filter((item) => item !== value),
                            )}
                          />
                        </FormControl>
                        <FormLabel className="font-normal">{locale === 'fa' ? fa : en}</FormLabel>
                      </FormItem>
                    ))}
                    <FormMessage />
                  </FormItem>
                )} />
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>

        <FormField control={form.control} name="details" render={({ field }) => (
          <FormItem>
            <FormLabel className="font-semibold">{t('onboarding.otherConditions')}</FormLabel>
            <FormControl>
              <Textarea
                placeholder={locale === 'fa' ? 'داروها، محدودیت پزشک، جراحی، درد یا نکته مهم دیگر را بنویسید.' : 'List medication-related exercise limits, recent surgery, pain, or other important details.'}
                {...field}
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )} />
      </div>
    </Form>
  );
}
