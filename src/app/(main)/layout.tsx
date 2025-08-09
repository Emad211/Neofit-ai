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
        // This is the primary protection for the main app layout.
        // If loading is done and there's no user, they MUST be sent to auth.
        if (!isLoading && !user) {
            router.push('/auth');
            return;
        }

        // NEW LOGIC: This is a secondary check. If a user is logged in
        // but somehow lands in the main app without having a profile
        // (e.g., incomplete onboarding, URL manipulation), we must send
        // them back to the start to complete the process.
        if (!isLoading && user && !userProfile) {
            router.push('/');
            return;
        }
        
    }, [user, isLoading, userProfile, router]);


    // Show a loading skeleton while auth state is being determined
    // OR if the user is logged in but the profile is still loading.
    if (isLoading || !user || !userProfile) {
        return (
            <div className="flex h-screen w-full items-center justify-center">
                <Skeleton className="h-12 w-12 rounded-full animate-pulse" />
            </div>
        );
    }
    
    // If we have a user and their profile, render the app shell.
    return <AppShell>{children}</AppShell>;
}


export default function MainAppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AuthGuard>
        {children}
    </AuthGuard>
  );
}
