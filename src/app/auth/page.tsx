'use client';

import * as React from 'react';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  createUserWithEmailAndPassword,
  getAuth,
  sendEmailVerification,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  updateProfile,
} from 'firebase/auth';
import { useRouter } from 'next/navigation';
import { app } from '@/lib/firebase';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dumbbell, Loader2 } from 'lucide-react';
import { useUserData } from '@/context/user-profile-context';
import { useI18n } from '@/i18n/provider';
import { LanguageSwitcher } from '@/components/language-switcher';

const auth = getAuth(app);

const loginSchema = z.object({
  email: z.string().trim().email(),
  password: z.string().min(1),
});

const signupSchema = z.object({
  displayName: z.string().trim().min(2).max(80),
  email: z.string().trim().email(),
  password: z.string().min(8).max(128)
    .regex(/[A-Za-z]/, 'Password must include a letter.')
    .regex(/[0-9]/, 'Password must include a number.'),
  acceptedTerms: z.boolean().refine(Boolean, 'You must accept the terms and privacy policy.'),
});

export default function AuthPage() {
  const { user, isLoading, userProfile } = useUserData();
  const router = useRouter();
  const { t } = useI18n();

  React.useEffect(() => {
    if (!isLoading && user && userProfile) router.replace('/today');
    else if (!isLoading && user && !userProfile) router.replace('/');
  }, [user, isLoading, userProfile, router]);

  return (
    <main className="relative flex min-h-screen w-full flex-col items-center justify-center bg-background p-4">
      <div className="absolute end-4 top-4"><LanguageSwitcher /></div>
      <div className="w-full max-w-md">
        <header className="mb-8 text-center">
          <Dumbbell className="mx-auto h-12 w-12 text-primary" aria-hidden="true" />
          <h1 className="mt-4 font-headline text-3xl font-bold">{t('auth.welcome')}</h1>
          <p className="text-muted-foreground">{t('auth.subtitle')}</p>
        </header>

        <Tabs defaultValue="login" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="login">{t('auth.login')}</TabsTrigger>
            <TabsTrigger value="signup">{t('auth.signup')}</TabsTrigger>
          </TabsList>
          <TabsContent value="login"><LoginForm /></TabsContent>
          <TabsContent value="signup"><SignupForm /></TabsContent>
        </Tabs>
      </div>
    </main>
  );
}

function LoginForm() {
  const router = useRouter();
  const { toast } = useToast();
  const { locale, t } = useI18n();
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [isResetting, setIsResetting] = React.useState(false);
  const form = useForm<z.infer<typeof loginSchema>>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '' },
  });

  const onSubmit = async (values: z.infer<typeof loginSchema>) => {
    setIsSubmitting(true);
    try {
      await signInWithEmailAndPassword(auth, values.email, values.password);
      toast({ title: t('auth.loginSuccess') });
      router.replace('/');
    } catch (error) {
      console.error('Login failed:', error);
      toast({ variant: 'destructive', title: t('auth.login'), description: t('auth.invalidCredentials') });
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetPassword = async () => {
    const email = form.getValues('email').trim();
    if (!z.string().email().safeParse(email).success) {
      form.setError('email', { message: locale === 'fa' ? 'ابتدا ایمیل معتبر وارد کنید.' : 'Enter a valid email first.' });
      return;
    }
    setIsResetting(true);
    try {
      await sendPasswordResetEmail(auth, email);
      toast({
        title: locale === 'fa' ? 'درخواست ارسال شد' : 'Request sent',
        description: locale === 'fa' ? 'اگر حسابی با این ایمیل وجود داشته باشد، لینک بازیابی ارسال می‌شود.' : 'If an account exists for this email, a reset link will be sent.',
      });
    } catch (error) {
      console.error('Password reset failed:', error);
      toast({
        title: locale === 'fa' ? 'درخواست ثبت شد' : 'Request received',
        description: locale === 'fa' ? 'اگر حسابی با این ایمیل وجود داشته باشد، لینک بازیابی ارسال می‌شود.' : 'If an account exists for this email, a reset link will be sent.',
      });
    } finally {
      setIsResetting(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t('auth.login')}</CardTitle>
        <CardDescription>{t('auth.loginDescription')}</CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField control={form.control} name="email" render={({ field }) => (
              <FormItem>
                <FormLabel>{t('auth.email')}</FormLabel>
                <FormControl><Input type="email" autoComplete="email" inputMode="email" {...field} /></FormControl>
                <FormMessage />
              </FormItem>
            )} />
            <FormField control={form.control} name="password" render={({ field }) => (
              <FormItem>
                <FormLabel>{t('auth.password')}</FormLabel>
                <FormControl><Input type="password" autoComplete="current-password" {...field} /></FormControl>
                <FormMessage />
              </FormItem>
            )} />
            <Button type="submit" className="w-full" disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="me-2 h-4 w-4 animate-spin" aria-hidden="true" />}
              {t('auth.login')}
            </Button>
            <Button type="button" variant="ghost" className="w-full" disabled={isResetting} onClick={() => void resetPassword()}>
              {isResetting && <Loader2 className="me-2 h-4 w-4 animate-spin" aria-hidden="true" />}
              {locale === 'fa' ? 'رمز عبور را فراموش کرده‌اید؟' : 'Forgot your password?'}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}

function SignupForm() {
  const router = useRouter();
  const { toast } = useToast();
  const { locale, t } = useI18n();
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const form = useForm<z.infer<typeof signupSchema>>({
    resolver: zodResolver(signupSchema),
    defaultValues: { displayName: '', email: '', password: '', acceptedTerms: false },
  });

  const onSubmit = async (values: z.infer<typeof signupSchema>) => {
    setIsSubmitting(true);
    try {
      const credential = await createUserWithEmailAndPassword(auth, values.email, values.password);
      await updateProfile(credential.user, { displayName: values.displayName });
      await sendEmailVerification(credential.user).catch((error) => console.error('Verification email failed:', error));
      toast({
        title: t('auth.signupSuccess'),
        description: locale === 'fa' ? 'برای امنیت حساب، ایمیل تأیید نیز برای شما ارسال شد.' : 'A verification email was also sent for account security.',
      });
      router.replace('/');
    } catch (error: any) {
      console.error('Signup failed:', error);
      const alreadyUsed = error?.code === 'auth/email-already-in-use';
      toast({
        variant: 'destructive',
        title: t('auth.signup'),
        description: alreadyUsed
          ? (locale === 'fa' ? 'امکان ساخت حساب وجود ندارد؛ ورود یا بازیابی رمز را امتحان کنید.' : 'The account could not be created. Try signing in or resetting the password.')
          : t('common.error'),
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t('auth.signup')}</CardTitle>
        <CardDescription>{t('auth.signupDescription')}</CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField control={form.control} name="displayName" render={({ field }) => (
              <FormItem>
                <FormLabel>{t('auth.displayName')}</FormLabel>
                <FormControl><Input autoComplete="name" {...field} /></FormControl>
                <FormMessage />
              </FormItem>
            )} />
            <FormField control={form.control} name="email" render={({ field }) => (
              <FormItem>
                <FormLabel>{t('auth.email')}</FormLabel>
                <FormControl><Input type="email" autoComplete="email" inputMode="email" {...field} /></FormControl>
                <FormMessage />
              </FormItem>
            )} />
            <FormField control={form.control} name="password" render={({ field }) => (
              <FormItem>
                <FormLabel>{t('auth.password')}</FormLabel>
                <FormControl><Input type="password" autoComplete="new-password" {...field} /></FormControl>
                <FormMessage />
              </FormItem>
            )} />
            <FormField control={form.control} name="acceptedTerms" render={({ field }) => (
              <FormItem className="flex flex-row items-start gap-3 space-y-0 rounded-md border p-3">
                <FormControl><Checkbox checked={field.value} onCheckedChange={field.onChange} /></FormControl>
                <div className="space-y-1">
                  <FormLabel className="font-normal">
                    {locale === 'fa' ? 'شرایط استفاده و سیاست حریم خصوصی را می‌پذیرم.' : 'I accept the terms of use and privacy policy.'}
                  </FormLabel>
                  <p className="text-xs text-muted-foreground">
                    <Link className="underline" href="/terms">{t('legal.terms')}</Link>{' · '}
                    <Link className="underline" href="/privacy">{t('legal.privacy')}</Link>
                  </p>
                  <FormMessage />
                </div>
              </FormItem>
            )} />
            <Button type="submit" className="w-full" disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="me-2 h-4 w-4 animate-spin" aria-hidden="true" />}
              {t('auth.createAccount')}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
