'use client';

import * as React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { getAuth, signOut } from 'firebase/auth';
import { Loader2, MoveLeft, Save, Trash2 } from 'lucide-react';
import { useUserData } from '@/context/user-profile-context';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { useToast } from '@/hooks/use-toast';
import { useI18n } from '@/i18n/provider';
import { LanguageSwitcher } from '@/components/language-switcher';

const ProfileSchema = z.object({ displayName: z.string().trim().min(2).max(80) });
const EmailSchema = z.object({
  newEmail: z.string().trim().email(),
  currentPasswordForEmail: z.string().min(1),
});
const PasswordSchema = z.object({
  currentPasswordForPassword: z.string().min(1),
  newPassword: z.string().min(8).max(128).regex(/[A-Za-z]/).regex(/[0-9]/),
  confirmPassword: z.string(),
}).refine((data) => data.newPassword === data.confirmPassword, { path: ['confirmPassword'] });
const DeleteSchema = z.object({ currentPasswordForDeletion: z.string().min(1) });

export default function AccountSettingsPage() {
  const {
    user,
    reauthenticateUser,
    updateUserAccount,
    updateUserEmail,
    updateUserPassword,
  } = useUserData();
  const router = useRouter();
  const { toast } = useToast();
  const { locale, t } = useI18n();
  const [isSubmitting, setIsSubmitting] = React.useState<string | null>(null);
  const [deleteOpen, setDeleteOpen] = React.useState(false);

  const profileForm = useForm<z.infer<typeof ProfileSchema>>({
    resolver: zodResolver(ProfileSchema),
    defaultValues: { displayName: user?.displayName || '' },
  });
  const emailForm = useForm<z.infer<typeof EmailSchema>>({
    resolver: zodResolver(EmailSchema),
    defaultValues: { newEmail: user?.email || '', currentPasswordForEmail: '' },
  });
  const passwordForm = useForm<z.infer<typeof PasswordSchema>>({
    resolver: zodResolver(PasswordSchema),
    defaultValues: { currentPasswordForPassword: '', newPassword: '', confirmPassword: '' },
  });
  const deleteForm = useForm<z.infer<typeof DeleteSchema>>({
    resolver: zodResolver(DeleteSchema),
    defaultValues: { currentPasswordForDeletion: '' },
  });

  React.useEffect(() => {
    if (!user) return;
    profileForm.reset({ displayName: user.displayName || '' });
    emailForm.reset({ newEmail: user.email || '', currentPasswordForEmail: '' });
  }, [emailForm, profileForm, user]);

  const success = (fa: string, en: string) => toast({ title: locale === 'fa' ? fa : en });
  const failure = (error: unknown) => toast({
    variant: 'destructive',
    title: locale === 'fa' ? 'به‌روزرسانی انجام نشد' : 'Update failed',
    description: error instanceof Error ? error.message : t('common.error'),
  });

  const handleProfileSubmit = async (values: z.infer<typeof ProfileSchema>) => {
    setIsSubmitting('profile');
    try {
      await updateUserAccount(values);
      success('نام نمایشی به‌روز شد', 'Display name updated');
    } catch (error) { failure(error); } finally { setIsSubmitting(null); }
  };

  const handleEmailSubmit = async (values: z.infer<typeof EmailSchema>) => {
    setIsSubmitting('email');
    try {
      await reauthenticateUser(values.currentPasswordForEmail);
      await updateUserEmail(values.newEmail);
      emailForm.reset({ newEmail: values.newEmail, currentPasswordForEmail: '' });
      success('ایمیل حساب به‌روز شد', 'Account email updated');
    } catch (error) { failure(error); } finally { setIsSubmitting(null); }
  };

  const handlePasswordSubmit = async (values: z.infer<typeof PasswordSchema>) => {
    setIsSubmitting('password');
    try {
      await reauthenticateUser(values.currentPasswordForPassword);
      await updateUserPassword(values.newPassword);
      passwordForm.reset();
      success('رمز عبور تغییر کرد', 'Password changed');
    } catch (error) { failure(error); } finally { setIsSubmitting(null); }
  };

  const deleteAccount = async (values: z.infer<typeof DeleteSchema>) => {
    if (!user) return;
    setIsSubmitting('delete');
    try {
      await reauthenticateUser(values.currentPasswordForDeletion);
      const token = await user.getIdToken(true);
      const response = await fetch('/api/account/delete', {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
        cache: 'no-store',
      });
      const payload = await response.json().catch(() => null) as { error?: string } | null;
      if (!response.ok) throw new Error(payload?.error || 'Account deletion failed.');
      await signOut(getAuth());
      router.replace('/auth');
    } catch (error) {
      failure(error);
      setIsSubmitting(null);
    }
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <div className="mb-8 flex items-center justify-between gap-3">
        <Button variant="ghost" asChild>
          <Link href="/profile"><MoveLeft className="me-2 h-4 w-4 rtl:rotate-180" />{t('common.back')}</Link>
        </Button>
        <LanguageSwitcher />
      </div>
      <header className="mb-8 text-center">
        <h1 className="font-headline text-4xl font-bold">{t('profile.account')}</h1>
        <p className="text-muted-foreground">
          {locale === 'fa' ? 'اطلاعات ورود و امنیت حساب را مدیریت کنید.' : 'Manage sign-in details and account security.'}
        </p>
      </header>

      <main className="mx-auto max-w-2xl space-y-8">
        <Card>
          <CardHeader><CardTitle>{t('account.displayName')}</CardTitle><CardDescription>{locale === 'fa' ? 'نامی که در برنامه نمایش داده می‌شود.' : 'The name displayed inside the app.'}</CardDescription></CardHeader>
          <CardContent>
            <Form {...profileForm}>
              <form onSubmit={profileForm.handleSubmit(handleProfileSubmit)} className="space-y-4">
                <FormField control={profileForm.control} name="displayName" render={({ field }) => (
                  <FormItem><FormLabel>{t('account.displayName')}</FormLabel><FormControl><Input autoComplete="name" {...field} /></FormControl><FormMessage /></FormItem>
                )} />
                <Button type="submit" disabled={isSubmitting !== null}>
                  {isSubmitting === 'profile' ? <Loader2 className="me-2 h-4 w-4 animate-spin" /> : <Save className="me-2 h-4 w-4" />}{t('common.save')}
                </Button>
              </form>
            </Form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>{t('account.email')}</CardTitle><CardDescription>{locale === 'fa' ? 'برای تغییر ایمیل، رمز فعلی لازم است.' : 'Your current password is required to change email.'}</CardDescription></CardHeader>
          <CardContent>
            <Form {...emailForm}>
              <form onSubmit={emailForm.handleSubmit(handleEmailSubmit)} className="space-y-4">
                <FormField control={emailForm.control} name="newEmail" render={({ field }) => (
                  <FormItem><FormLabel>{t('account.email')}</FormLabel><FormControl><Input type="email" autoComplete="email" {...field} /></FormControl><FormMessage /></FormItem>
                )} />
                <FormField control={emailForm.control} name="currentPasswordForEmail" render={({ field }) => (
                  <FormItem><FormLabel>{t('account.currentPassword')}</FormLabel><FormControl><Input type="password" autoComplete="current-password" {...field} /></FormControl><FormMessage /></FormItem>
                )} />
                <Button type="submit" disabled={isSubmitting !== null}>
                  {isSubmitting === 'email' ? <Loader2 className="me-2 h-4 w-4 animate-spin" /> : <Save className="me-2 h-4 w-4" />}{t('account.updateEmail')}
                </Button>
              </form>
            </Form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>{t('account.password')}</CardTitle><CardDescription>{locale === 'fa' ? 'رمز جدید حداقل ۸ کاراکتر و شامل حرف و عدد باشد.' : 'Use at least 8 characters with a letter and a number.'}</CardDescription></CardHeader>
          <CardContent>
            <Form {...passwordForm}>
              <form onSubmit={passwordForm.handleSubmit(handlePasswordSubmit)} className="space-y-4">
                <FormField control={passwordForm.control} name="currentPasswordForPassword" render={({ field }) => (
                  <FormItem><FormLabel>{t('account.currentPassword')}</FormLabel><FormControl><Input type="password" autoComplete="current-password" {...field} /></FormControl><FormMessage /></FormItem>
                )} />
                <FormField control={passwordForm.control} name="newPassword" render={({ field }) => (
                  <FormItem><FormLabel>{t('account.newPassword')}</FormLabel><FormControl><Input type="password" autoComplete="new-password" {...field} /></FormControl><FormMessage /></FormItem>
                )} />
                <FormField control={passwordForm.control} name="confirmPassword" render={({ field }) => (
                  <FormItem><FormLabel>{t('account.confirmPassword')}</FormLabel><FormControl><Input type="password" autoComplete="new-password" {...field} /></FormControl><FormMessage /></FormItem>
                )} />
                <Button type="submit" disabled={isSubmitting !== null}>
                  {isSubmitting === 'password' ? <Loader2 className="me-2 h-4 w-4 animate-spin" /> : <Save className="me-2 h-4 w-4" />}{t('account.changePassword')}
                </Button>
              </form>
            </Form>
          </CardContent>
        </Card>

        <Card className="border-destructive/50">
          <CardHeader><CardTitle className="text-destructive">{t('profile.deleteAccount')}</CardTitle><CardDescription>{t('profile.deleteAccountWarning')}</CardDescription></CardHeader>
          <CardContent>
            <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
              <AlertDialogTrigger asChild><Button variant="destructive"><Trash2 className="me-2 h-4 w-4" />{t('profile.deleteAccount')}</Button></AlertDialogTrigger>
              <AlertDialogContent>
                <Form {...deleteForm}>
                  <form onSubmit={deleteForm.handleSubmit(deleteAccount)}>
                    <AlertDialogHeader>
                      <AlertDialogTitle>{t('profile.deleteAccount')}</AlertDialogTitle>
                      <AlertDialogDescription>{t('profile.deleteAccountWarning')}</AlertDialogDescription>
                    </AlertDialogHeader>
                    <div className="py-5">
                      <FormField control={deleteForm.control} name="currentPasswordForDeletion" render={({ field }) => (
                        <FormItem><FormLabel>{t('account.currentPassword')}</FormLabel><FormControl><Input type="password" autoComplete="current-password" {...field} /></FormControl><FormMessage /></FormItem>
                      )} />
                    </div>
                    <AlertDialogFooter>
                      <AlertDialogCancel disabled={isSubmitting === 'delete'}>{t('common.cancel')}</AlertDialogCancel>
                      <AlertDialogAction type="submit" className="bg-destructive text-destructive-foreground" disabled={isSubmitting === 'delete'}>
                        {isSubmitting === 'delete' && <Loader2 className="me-2 h-4 w-4 animate-spin" />}{t('profile.deleteAccount')}
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </form>
                </Form>
              </AlertDialogContent>
            </AlertDialog>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
