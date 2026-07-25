'use client';

import { Languages } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useI18n } from '@/i18n/provider';

export function LanguageGate({ children }: { children: React.ReactNode }) {
  const { hasChosenLocale, isReady, setLocale } = useI18n();

  if (!isReady) {
    return <div className="min-h-screen bg-background" aria-busy="true" />;
  }

  if (!hasChosenLocale) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-background p-4">
        <Card className="w-full max-w-lg">
          <CardHeader className="text-center">
            <Languages className="mx-auto mb-3 h-10 w-10 text-primary" aria-hidden="true" />
            <CardTitle className="text-2xl">Choose your language · زبان را انتخاب کنید</CardTitle>
            <CardDescription>
              You can change it later in settings. · بعداً هم از تنظیمات قابل تغییر است.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-3 sm:grid-cols-2">
            <Button size="lg" variant="outline" onClick={() => setLocale('en')} lang="en" dir="ltr">
              English
            </Button>
            <Button size="lg" onClick={() => setLocale('fa')} lang="fa" dir="rtl">
              فارسی
            </Button>
          </CardContent>
        </Card>
      </main>
    );
  }

  return <>{children}</>;
}
