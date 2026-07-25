'use client';

import { OnboardingDetailsForm } from '@/components/onboarding/onboarding-details-form';
import { MoveLeft } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { useI18n } from '@/i18n/provider';

export default function OnboardingDetailsPage() {
  const { locale, t } = useI18n();

  return (
    <main className="flex min-h-screen w-full flex-col items-center justify-center bg-background p-4 sm:p-6 md:p-8">
      <div className="w-full max-w-2xl">
        <header className="mb-8 text-center">
          <h1 className="font-headline text-3xl font-bold tracking-tight sm:text-4xl">
            {t('onboarding.basicInfo')}
          </h1>
          <p className="mt-2 text-lg text-muted-foreground">
            {locale === 'fa' ? 'این اطلاعات برای ساخت برنامه‌ای متناسب و ایمن استفاده می‌شود.' : 'This information is used to create a safer, more relevant plan.'}
          </p>
        </header>
        <OnboardingDetailsForm />
        <div className="mt-8 text-center">
          <Button variant="ghost" asChild>
            <Link href="/">
              <MoveLeft className="me-2 h-4 w-4 rtl:rotate-180" aria-hidden="true" /> {t('common.back')}
            </Link>
          </Button>
        </div>
      </div>
    </main>
  );
}
