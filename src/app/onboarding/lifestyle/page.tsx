'use client';

import { OnboardingLifestyleForm } from '@/components/onboarding/onboarding-lifestyle-form';
import { MoveLeft } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { useI18n } from '@/i18n/provider';

export default function OnboardingLifestylePage() {
  const { locale, t } = useI18n();

  return (
    <main className="flex min-h-screen w-full flex-col items-center justify-center bg-background p-4 sm:p-6 md:p-8">
      <div className="w-full max-w-3xl">
        <header className="mb-8 text-center">
          <h1 className="font-headline text-3xl font-bold tracking-tight sm:text-4xl">
            {locale === 'fa' ? 'سبک زندگی و ترجیحات شما' : 'Lifestyle and preferences'}
          </h1>
          <p className="mt-2 text-lg text-muted-foreground">
            {locale === 'fa' ? 'جزئیات واقعی‌تر، برنامه قابل‌اجراتری می‌سازد.' : 'More realistic details produce a more practical plan.'}
          </p>
        </header>
        <OnboardingLifestyleForm />
        <div className="mt-8 text-center">
          <Button variant="ghost" asChild>
            <Link href="/onboarding/details">
              <MoveLeft className="me-2 h-4 w-4 rtl:rotate-180" aria-hidden="true" /> {t('common.back')}
            </Link>
          </Button>
        </div>
      </div>
    </main>
  );
}
