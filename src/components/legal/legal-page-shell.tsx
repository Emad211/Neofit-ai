'use client';

import Link from 'next/link';
import { Dumbbell } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { LanguageSwitcher } from '@/components/language-switcher';
import { useI18n } from '@/i18n/provider';

export function LegalPageShell({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
}) {
  const { t } = useI18n();

  return (
    <main className="min-h-screen bg-background p-4 sm:p-8">
      <div className="mx-auto max-w-4xl">
        <header className="mb-8">
          <div className="mb-8 flex items-center justify-between gap-3">
            <Button variant="ghost" asChild><Link href="/auth">{t('common.back')}</Link></Button>
            <LanguageSwitcher />
          </div>
          <div className="flex items-center gap-3 text-primary">
            <Dumbbell className="h-8 w-8" aria-hidden="true" />
            <span className="font-headline text-xl font-bold">{t('common.appName')}</span>
          </div>
          <h1 className="mt-5 font-headline text-3xl font-bold tracking-tight sm:text-5xl">{title}</h1>
          {description && <p className="mt-3 text-lg text-muted-foreground">{description}</p>}
        </header>

        <article className="space-y-8 rounded-xl border bg-card p-5 leading-7 shadow-sm sm:p-8">
          {children}
        </article>

        <footer className="mt-8 flex flex-wrap justify-center gap-x-5 gap-y-2 text-sm text-muted-foreground">
          <Link className="underline" href="/privacy">{t('legal.privacy')}</Link>
          <Link className="underline" href="/terms">{t('legal.terms')}</Link>
          <Link className="underline" href="/medical-disclaimer">{t('legal.medicalDisclaimer')}</Link>
          <Link className="underline" href="/support">{t('legal.support')}</Link>
          <Link className="underline" href="/account-deletion">{t('profile.deleteAccount')}</Link>
        </footer>
      </div>
    </main>
  );
}

export function LegalSection({ title, children }: { title: string; children: React.ReactNode }) {
  return <section className="space-y-3"><h2 className="font-headline text-2xl font-bold">{title}</h2><div className="space-y-3 text-muted-foreground">{children}</div></section>;
}
