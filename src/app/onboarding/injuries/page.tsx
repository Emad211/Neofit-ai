'use client';

import { BodyMap } from '@/components/onboarding/body-map/body-map';
import { MoveLeft } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { MedicalHistoryForm } from '@/components/onboarding/medical-history-form';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useI18n } from '@/i18n/provider';

export default function OnboardingInjuriesPage() {
  const { locale, t } = useI18n();

  return (
    <main className="flex min-h-screen w-full flex-col items-center justify-center bg-background p-4 sm:p-6 md:p-8">
      <div className="w-full max-w-4xl">
        <header className="mb-8 text-center">
          <h1 className="font-headline text-3xl font-bold tracking-tight sm:text-4xl">
            {t('onboarding.healthTitle')}
          </h1>
          <p className="mt-2 text-lg text-muted-foreground">{t('onboarding.healthDescription')}</p>
        </header>

        <Alert className="mb-6">
          <AlertDescription>
            {locale === 'fa'
              ? 'این برنامه جایگزین پزشک نیست. درد قفسه سینه، غش، تنگی نفس غیرعادی، ضعف ناگهانی یا درد شدید نیازمند بررسی حرفه‌ای است.'
              : 'This app is not a substitute for medical care. Chest pain, fainting, unusual shortness of breath, sudden weakness, or severe pain requires professional assessment.'}
          </AlertDescription>
        </Alert>

        <MedicalHistoryForm />

        <section className="mt-12 text-center">
          <h2 className="font-headline text-2xl font-bold tracking-tight sm:text-3xl">{t('onboarding.painAreas')}</h2>
          <p className="mt-2 text-lg text-muted-foreground">
            {locale === 'fa' ? 'نواحی دارای درد یا آسیب فعلی و قبلی را انتخاب کنید.' : 'Select areas with current or previous pain or injury.'}
          </p>
        </section>

        <BodyMap />

        <div className="mt-8 text-center">
          <Button variant="ghost" asChild>
            <Link href="/onboarding/lifestyle">
              <MoveLeft className="me-2 h-4 w-4 rtl:rotate-180" aria-hidden="true" /> {t('common.back')}
            </Link>
          </Button>
        </div>
      </div>
    </main>
  );
}
