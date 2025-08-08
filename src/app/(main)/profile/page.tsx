// src/app/(main)/profile/page.tsx
"use client";

import * as React from 'react';
import Link from 'next/link';
import { useUserProfile } from '@/context/user-profile-context';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ChevronRight, Edit, LogOut, FileText, UserCog, Mail, Lock } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { ModeToggle } from '@/components/mode-toggle';
import { Separator } from '@/components/ui/separator';

const SettingsItem = ({ icon, title, description, href }: { icon: React.ReactNode, title: string, description: string, href: string }) => (
    <Link href={href} className="block">
        <div className="flex items-center p-4 rounded-lg hover:bg-secondary transition-colors">
            <div className="mr-4 text-primary">{icon}</div>
            <div className="flex-grow">
                <p className="font-semibold">{title}</p>
                <p className="text-sm text-muted-foreground">{description}</p>
            </div>
            <ChevronRight className="h-5 w-5 text-muted-foreground" />
        </div>
    </Link>
)


export default function ProfilePage() {
    const { userProfile, isLoading } = useUserProfile();

    if (isLoading) {
        return (
             <div className="p-4 sm:p-6 lg:p-8">
                <header className="flex flex-col items-center text-center mb-10">
                    <Skeleton className="h-24 w-24 rounded-full" />
                    <Skeleton className="h-7 w-32 mt-4" />
                    <Skeleton className="h-4 w-48 mt-2" />
                </header>
                <div className="space-y-6 max-w-2xl mx-auto">
                    <Skeleton className="h-48 w-full" />
                    <Skeleton className="h-32 w-full" />
                </div>
            </div>
        )
    }

    // Default name if not available in profile
    const userName = "Sara"; 
    const userEmail = "sara@example.com";

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <header className="flex flex-col items-center text-center mb-10">
        <Avatar className="h-24 w-24 border-4 border-primary">
          <AvatarImage src="https://placehold.co/100x100.png" alt={userName} data-ai-hint="profile picture" />
          <AvatarFallback>{userName.charAt(0)}</AvatarFallback>
        </Avatar>
        <h1 className="mt-4 text-3xl font-bold font-headline text-foreground">
          {userName}
        </h1>
        <p className="text-muted-foreground">{userEmail}</p>
      </header>

      <main className="space-y-8 max-w-2xl mx-auto">
        <Card>
            <CardHeader>
                <CardTitle>Plan Details</CardTitle>
            </CardHeader>
            <CardContent className="p-0 divide-y divide-border">
                 <SettingsItem 
                    icon={<FileText className="h-6 w-6"/>}
                    title="View My Information"
                    description="See the data used to generate your plans"
                    href="/profile/view"
                />
                 <SettingsItem 
                    icon={<Edit className="h-6 w-6"/>}
                    title="Edit My Details & Plan"
                    description="Update your goals, stats, and lifestyle"
                    href="/profile/edit"
                />
            </CardContent>
        </Card>
        
        <Card>
            <CardHeader>
                <CardTitle>Account Settings</CardTitle>
            </CardHeader>
            <CardContent className="p-0 divide-y divide-border">
                 <SettingsItem 
                    icon={<UserCog className="h-6 w-6"/>}
                    title="Edit Profile"
                    description="Change your name and profile picture"
                    href="#" // Placeholder link
                />
                 <SettingsItem 
                    icon={<Mail className="h-6 w-6"/>}
                    title="Change Email"
                    description="Update the email address for your account"
                    href="#" // Placeholder link
                />
                 <SettingsItem 
                    icon={<Lock className="h-6 w-6"/>}
                    title="Change Password"
                    description="Update your account password"
                    href="#" // Placeholder link
                />
            </CardContent>
        </Card>

        <Card>
            <CardHeader>
                <CardTitle>App Settings</CardTitle>
            </CardHeader>
            <CardContent>
                <div className="flex items-center justify-between p-2">
                    <p className="font-semibold">Theme</p>
                    <ModeToggle />
                </div>
            </CardContent>
        </Card>

        <div className="text-center">
            <Button variant="ghost" className="text-destructive hover:text-destructive">
                <LogOut className="mr-2 h-4 w-4" />
                Log Out
            </Button>
        </div>
      </main>
    </div>
  );
}
