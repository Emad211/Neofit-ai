'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Card, CardContent } from '@/components/ui/card';
import { Dumbbell, HeartPulse, MoveRight, Scale } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useOnboarding } from '@/context/onboarding-context';
import { useI18n } from '@/i18n/provider';

const FormSchema = z.object({
  goal: z.enum(['lose_weight', 'gain_muscle', 'improve_fitness']),
});

export function OnboardingGoalForm() {
  const router = useRouter();
  const { draft, updateDraft } = useOnboarding();
  const { locale, t } = useI18n();
  const form = useForm<z.infer<typeof FormSchema>>({
    resolver: zodResolver(FormSchema),
    defaultValues: {
      goal: draft.goal,
    },
  });

  const goals = [
    {
      value: 'lose_weight' as const,
      label: t('onboarding.loseWeight'),
      icon: Scale,
      description: locale === 'fa' ? 'کاهش وزن پایدار با برنامه‌ای قابل اجرا.' : 'Sustainable weight loss with a practical plan.',
    },
    {
      value: 'gain_muscle' as const,
      label: t('onboarding.gainMuscle'),
      icon: Dumbbell,
      description: locale === 'fa' ? 'افزایش قدرت و عضله با پیشرفت کنترل‌شده.' : 'Build strength and muscle with controlled progression.',
    },
    {
      value: 'improve_fitness' as const,
      label: t('onboarding.improveFitness'),
      icon: HeartPulse,
      description: locale === 'fa' ? 'افزایش انرژی، استقامت و آمادگی عمومی.' : 'Improve energy, endurance, and general fitness.',
    },
  ];

  function onSubmit(data: z.infer<typeof FormSchema>) {
    updateDraft(data);
    router.push('/onboarding/details');
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="w-full space-y-6">
        <FormField
          control={form.control}
          name="goal"
          render={({ field }) => (
            <FormItem className="space-y-3">
              <FormLabel className="text-lg">{t('onboarding.primaryGoal')}</FormLabel>
              <FormControl>
                <RadioGroup
                  onValueChange={field.onChange}
                  value={field.value}
                  className="grid grid-cols-1 gap-4 md:grid-cols-3"
                >
                  {goals.map((goal) => (
                    <FormItem key={goal.value} className="h-full">
                      <FormControl>
                        <RadioGroupItem value={goal.value} className="sr-only" />
                      </FormControl>
                      <FormLabel className="h-full font-normal">
                        <Card className={cn(
                          'h-full cursor-pointer transition-all duration-300 hover:-translate-y-1 hover:border-primary hover:shadow-xl',
                          field.value === goal.value && 'border-primary ring-2 ring-primary',
                        )}>
                          <CardContent className="flex h-full flex-col items-center justify-center p-6 text-center">
                            <div className="mb-4 rounded-full bg-primary/10 p-4 text-primary">
                              <goal.icon className="h-10 w-10" aria-hidden="true" />
                            </div>
                            <p className="font-headline text-xl font-semibold">{goal.label}</p>
                            <p className="mt-1 text-sm text-muted-foreground">{goal.description}</p>
                          </CardContent>
                        </Card>
                      </FormLabel>
                    </FormItem>
                  ))}
                </RadioGroup>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type="submit" size="lg" className="w-full bg-accent text-accent-foreground hover:bg-accent/90">
          {t('common.next')} <MoveRight className="ms-2 h-5 w-5 rtl:rotate-180" aria-hidden="true" />
        </Button>
      </form>
    </Form>
  );
}
