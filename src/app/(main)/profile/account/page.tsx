// src/app/(main)/profile/account/page.tsx
"use client";

import * as React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'next/navigation';
import * as z from 'zod';
import { useUserData } from '@/context/user-profile-context';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import Link from 'next/link';
import { MoveLeft, Save, Loader2 } from 'lucide-react';


const ProfileSchema = z.object({
  displayName: z.string().min(2, { message: 'Display name must be at least 2 characters.' }),
});

const EmailSchema = z.object({
  newEmail: z.string().email(),
  currentPasswordForEmail: z.string().min(1, { message: "Password is required." }),
});

const PasswordSchema = z.object({
  currentPasswordForPassword: z.string().min(1, { message: "Current password is required." }),
  newPassword: z.string().min(6, { message: "New password must be at least 6 characters." }),
  confirmPassword: z.string(),
}).refine(data => data.newPassword === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});


export default function AccountSettingsPage() {
    const { user, updateUserAccount, reauthenticateUser, updateUserEmail, updateUserPassword } = useUserData();
    const router = useRouter();
    const { toast } = useToast();
    const [isSubmitting, setIsSubmitting] = React.useState<string | null>(null);

    const profileForm = useForm<z.infer<typeof ProfileSchema>>({
        resolver: zodResolver(ProfileSchema),
        defaultValues: {
            displayName: user?.displayName || '',
        }
    });

    const emailForm = useForm<z.infer<typeof EmailSchema>>({
        resolver: zodResolver(EmailSchema),
        defaultValues: {
            newEmail: user?.email || '',
            currentPasswordForEmail: ''
        }
    });

    const passwordForm = useForm<z.infer<typeof PasswordSchema>>({
        resolver: zodResolver(PasswordSchema),
        defaultValues: {
            currentPasswordForPassword: '',
            newPassword: '',
            confirmPassword: ''
        }
    });
    
    React.useEffect(() => {
        if (user) {
            profileForm.reset({
                displayName: user.displayName || '',
            });
            emailForm.reset({
                newEmail: user.email || '',
                currentPasswordForEmail: ''
            });
        }
    }, [user, profileForm, emailForm]);


    const handleProfileSubmit = async (values: z.infer<typeof ProfileSchema>) => {
        setIsSubmitting('profile');
        try {
            await updateUserAccount(values);
            toast({ title: 'Profile Updated', description: 'Your display name has been updated.' });
        } catch (error: any) {
            toast({ variant: 'destructive', title: 'Update Failed', description: error.message });
        } finally {
            setIsSubmitting(null);
        }
    };

    const handleEmailSubmit = async (values: z.infer<typeof EmailSchema>) => {
        setIsSubmitting('email');
        try {
            await reauthenticateUser(values.currentPasswordForEmail);
            await updateUserEmail(values.newEmail);
            toast({ title: 'Email Updated', description: 'Your email address has been successfully updated.' });
            emailForm.reset({ ...values, currentPasswordForEmail: '' });
        } catch (error: any)
        {
            toast({ variant: 'destructive', title: 'Update Failed', description: error.code === 'auth/invalid-credential' ? 'Incorrect password.' : error.message });
        } finally {
            setIsSubmitting(null);
        }
    };
    
    const handlePasswordSubmit = async (values: z.infer<typeof PasswordSchema>) => {
        setIsSubmitting('password');
        try {
            await reauthenticateUser(values.currentPasswordForPassword);
            await updateUserPassword(values.newPassword);
            toast({ title: 'Password Updated', description: 'Your password has been successfully changed.' });
            passwordForm.reset();
        } catch (error: any) {
            toast({ variant: 'destructive', title: 'Update Failed', description: error.code === 'auth/invalid-credential' ? 'Incorrect password.' : error.message });
        } finally {
            setIsSubmitting(null);
        }
    };


    return (
        <div className="p-4 sm:p-6 lg:p-8">
            <div className="mb-8">
                <Button variant="ghost" asChild>
                    <Link href="/profile">
                    <MoveLeft className="mr-2 h-4 w-4" /> Back to Profile
                    </Link>
                </Button>
            </div>
            <header className="mb-8 text-center">
                <h1 className="text-4xl font-bold font-headline text-foreground">
                    Account Settings
                </h1>
                <p className="text-muted-foreground">
                    Manage your account details.
                </p>
            </header>

            <main className="space-y-8 max-w-2xl mx-auto">
                <Card>
                    <CardHeader>
                        <CardTitle>Display Name</CardTitle>
                        <CardDescription>Update your public display name.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Form {...profileForm}>
                            <form onSubmit={profileForm.handleSubmit(handleProfileSubmit)} className="space-y-4">
                                <FormField
                                    control={profileForm.control}
                                    name="displayName"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Display Name</FormLabel>
                                            <FormControl><Input {...field} /></FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <Button type="submit" disabled={isSubmitting === 'profile'}>
                                    {isSubmitting === 'profile' && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                    <Save className="mr-2 h-4 w-4" /> Save Name
                                </Button>
                            </form>
                        </Form>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>Email Address</CardTitle>
                        <CardDescription>Change the email address associated with your account.</CardDescription>
                    </CardHeader>
                    <CardContent>
                         <Form {...emailForm}>
                            <form onSubmit={emailForm.handleSubmit(handleEmailSubmit)} className="space-y-4">
                                <FormField
                                    control={emailForm.control}
                                    name="newEmail"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>New Email</FormLabel>
                                            <FormControl><Input type="email" {...field} /></FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                 <FormField
                                    control={emailForm.control}
                                    name="currentPasswordForEmail"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Current Password</FormLabel>
                                            <FormControl><Input type="password" {...field} /></FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <Button type="submit" disabled={isSubmitting === 'email'}>
                                    {isSubmitting === 'email' && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                    <Save className="mr-2 h-4 w-4" /> Update Email
                                </Button>
                            </form>
                        </Form>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>Password</CardTitle>
                        <CardDescription>Change your account password.</CardDescription>
                    </CardHeader>
                    <CardContent>
                          <Form {...passwordForm}>
                            <form onSubmit={passwordForm.handleSubmit(handlePasswordSubmit)} className="space-y-4">
                                <FormField
                                    control={passwordForm.control}
                                    name="currentPasswordForPassword"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Current Password</FormLabel>
                                            <FormControl><Input type="password" {...field} /></FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={passwordForm.control}
                                    name="newPassword"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>New Password</FormLabel>
                                            <FormControl><Input type="password" {...field} /></FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                 <FormField
                                    control={passwordForm.control}
                                    name="confirmPassword"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Confirm New Password</FormLabel>
                                            <FormControl><Input type="password" {...field} /></FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <Button type="submit" disabled={isSubmitting === 'password'}>
                                    {isSubmitting === 'password' && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                    <Save className="mr-2 h-4 w-4" /> Change Password
                                </Button>
                            </form>
                        </Form>
                    </CardContent>
                </Card>
            </main>
        </div>
    )
}
