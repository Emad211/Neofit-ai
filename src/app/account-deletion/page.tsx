'use client';

import * as React from 'react';
import Link from 'next/link';
import { getAuth, signInWithEmailAndPassword, signOut } from 'firebase/auth';
import { AlertTriangle, CheckCircle, Loader2, Trash2 } from 'lucide-react';
import { app } from '@/lib/firebase';
import { useI18n } from '@/i18n/provider';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { LanguageSwitcher } from '@/components/language-switcher';

const auth = getAuth(app);

export default function AccountDeletionPage() {
  const { locale, t } = useI18n();
  const [email, setEmail] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [deleted, setDeleted] = React.useState(false);
  const label = (en: string, fa: string) => locale === 'fa' ? fa : en;

  const deleteAccount = async (event: React.FormEvent) => {
    event.preventDefault();
    setIsSubmitting(true);
    setError(null);
    try {
      const credential = await signInWithEmailAndPassword(auth, email.trim(), password);
      const token = await credential.user.getIdToken(true);
      const response = await fetch('/api/account/delete', {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
        cache: 'no-store',
      });
      const payload = await response.json().catch(() => null) as { error?: string } | null;
      if (!response.ok) throw new Error(payload?.error || label('Account deletion failed.', 'حذف حساب انجام نشد.'));
      await signOut(auth).catch(() => undefined);
      setDeleted(true);
      setEmail('');
      setPassword('');
    } catch (caught) {
      console.error('Web account deletion failed:', caught);
      setError(label(
        'We could not verify and delete this account. Check the credentials or reset the password from the sign-in page.',
        'تأیید و حذف حساب انجام نشد. اطلاعات ورود را بررسی کنید یا از صفحه ورود رمز را بازیابی کنید.',
      ));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="min-h-screen bg-background p-4 sm:p-8">
      <div className="mx-auto max-w-2xl">
        <div className="mb-6 flex items-center justify-between gap-3">
          <Button variant="ghost" asChild><Link href="/auth">{t('common.back')}</Link></Button>
          <LanguageSwitcher />
        </div>

        {deleted ? (
          <Card>
            <CardHeader className="text-center">
              <CheckCircle className="mx-auto mb-3 h-12 w-12 text-emerald-600" />
              <CardTitle>{label('Account deleted', 'حساب حذف شد')}</CardTitle>
              <CardDescription>{label('The account and associated NeoFit application data were deleted.', 'حساب و داده‌های مرتبط با برنامه نئوفیت حذف شدند.')}</CardDescription>
            </CardHeader>
            <CardContent className="text-center"><Button asChild><Link href="/auth">{label('Return to sign in', 'بازگشت به ورود')}</Link></Button></CardContent>
          </Card>
        ) : (
          <Card>
            <CardHeader>
              <div className="mb-2 flex items-center gap-2 text-destructive"><Trash2 className="h-6 w-6" /><span className="font-semibold">NeoFit AI</span></div>
              <CardTitle>{t('profile.deleteAccount')}</CardTitle>
              <CardDescription>{t('profile.deleteAccountWarning')}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-5">
              <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertTitle>{label('Before deleting', 'پیش از حذف')}</AlertTitle>
                <AlertDescription>
                  {label(
                    'Deleting NeoFit does not automatically cancel an active Google Play, Cafe Bazaar, or Myket subscription. Cancel the subscription in the store to stop future billing.',
                    'حذف حساب نئوفیت، اشتراک فعال Google Play، بازار یا مایکت را خودکار لغو نمی‌کند. برای جلوگیری از پرداخت بعدی، اشتراک را در همان فروشگاه لغو کنید.',
                  )}
                </AlertDescription>
              </Alert>

              <form onSubmit={deleteAccount} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="deletion-email">{t('auth.email')}</Label>
                  <Input id="deletion-email" type="email" autoComplete="email" required value={email} onChange={(event) => setEmail(event.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="deletion-password">{t('auth.password')}</Label>
                  <Input id="deletion-password" type="password" autoComplete="current-password" required value={password} onChange={(event) => setPassword(event.target.value)} />
                </div>
                {error && <Alert variant="destructive"><AlertDescription>{error}</AlertDescription></Alert>}
                <Button type="submit" variant="destructive" className="w-full" disabled={isSubmitting || !email.trim() || !password}>
                  {isSubmitting && <Loader2 className="me-2 h-4 w-4 animate-spin" />}
                  {t('profile.deleteAccount')}
                </Button>
              </form>

              <p className="text-center text-sm text-muted-foreground">
                <Link href="/auth" className="underline">{label('Forgot your password?', 'رمز را فراموش کرده‌اید؟')}</Link>
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </main>
  );
}
