"use client";

import { AppShell } from "@/components/app-shell";
import { UserDataProvider, useUserData } from "@/context/user-profile-context";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { Skeleton } from "@/components/ui/skeleton";


function AuthGuard({ children }: { children: React.ReactNode }) {
    const { user, isLoading, userProfile } = useUserData();
    const router = useRouter();

    useEffect(() => {
        // If loading is done and there's no user, redirect to auth.
        // This is the primary protection for the main app layout.
        if (!isLoading && !user) {
            router.push('/auth');
        }
        // If the user is logged in but *still* has no profile after loading,
        // it means they haven't completed onboarding. Send them back.
        if (!isLoading && user && !userProfile) {
            router.push('/');
        }
    }, [user, isLoading, userProfile, router]);

    // Show a loading skeleton while auth state is being determined
    // OR if the user is logged in but the profile is still loading.
    if (isLoading || !userProfile) {
        return (
            <div className="flex h-screen w-full items-center justify-center">
                <Skeleton className="h-12 w-12 rounded-full animate-pulse" />
            </div>
        );
    }
    
    // If we have a user and their profile, render the app shell.
    return <>{children}</>;
}


export default function MainAppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <UserDataProvider>
        <AuthGuard>
            <AppShell>{children}</AppShell>
        </AuthGuard>
    </UserDataProvider>
  );
}
