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
        if (!isLoading && !user) {
            router.push('/auth');
        }
        // If user is logged in but has no profile, redirect to onboarding
        if (!isLoading && user && !userProfile) {
            router.push('/');
        }
    }, [user, isLoading, userProfile, router]);

    if (isLoading || !user || !userProfile) {
        return (
            <div className="flex h-screen w-full items-center justify-center">
                <Skeleton className="h-12 w-12 rounded-full animate-pulse" />
            </div>
        );
    }
    
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
