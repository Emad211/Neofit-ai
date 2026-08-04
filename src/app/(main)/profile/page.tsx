// src/app/(main)/profile/page.tsx
"use client";

import * as React from "react";
import Link from "next/link";
import { useUserData } from "@/context/user-profile-context";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ChevronLeft, Edit, FileText, UserCog, LogOut, ShieldCheck } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { ModeToggle } from "@/components/mode-toggle";
import { useToast } from "@/hooks/use-toast";

const SettingsItem = ({ icon, title, description, href }: { icon: React.ReactNode; title: string; description: string; href: string }) => (
  <Link href={href} className="block">
    <div className="flex items-center gap-4 rounded-lg p-4 transition-colors hover:bg-secondary">
      <div className="text-primary">{icon}</div>
      <div className="flex-grow text-right">
        <p className="font-semibold">{title}</p>
        <p className="text-sm text-muted-foreground">{description}</p>
      </div>
      <ChevronLeft className="h-5 w-5 text-muted-foreground" />
    </div>
  </Link>
);

export default function ProfilePage() {
  const { user, userProfile, isLoading } = useUserData();
  const { toast } = useToast();

  const handleLogout = () => {
    toast({
      title: "حساب نمایشی نئوفیت",
      description: "خروج واقعی پس از اتصال Supabase Auth فعال می‌شود.",
    });
  };

  if (isLoading) {
    return (
      <div className="p-4 sm:p-6 lg:p-8">
        <header className="mb-10 flex flex-col items-center text-center">
          <Skeleton className="h-24 w-24 rounded-full" />
          <Skeleton className="mt-4 h-7 w-32" />
          <Skeleton className="mt-2 h-4 w-48" />
        </header>
        <div className="mx-auto max-w-2xl space-y-6">
          <Skeleton className="h-48 w-full" />
          <Skeleton className="h-32 w-full" />
        </div>
      </div>
    );
  }

  const userName = userProfile?.name || user?.displayName || "عماد";
  const userEmail = user?.email || "demo@neofit.local";

  return (
    <div dir="rtl" className="min-h-screen bg-gradient-to-b from-primary/5 via-background to-background p-4 sm:p-6 lg:p-8">
      <header className="mb-10 flex flex-col items-center pt-8 text-center lg:pt-2">
        <Avatar className="h-24 w-24 border-4 border-primary shadow-lg">
          <AvatarImage src={user?.photoURL || ""} alt={userName} />
          <AvatarFallback className="text-2xl font-bold">{userName.charAt(0)}</AvatarFallback>
        </Avatar>
        <h1 className="mt-4 text-3xl font-extrabold font-headline text-foreground">{userName}</h1>
        <p className="text-muted-foreground">{userEmail}</p>
        <div className="mt-3 inline-flex items-center gap-2 rounded-full border bg-card px-3 py-1 text-xs text-primary shadow-sm">
          <ShieldCheck className="h-4 w-4" />
          حساب نمایشی برای ارزیابی رابط کاربری
        </div>
      </header>

      <main className="mx-auto max-w-2xl space-y-8 pb-24">
        <Card>
          <CardHeader><CardTitle>اطلاعات و برنامه</CardTitle></CardHeader>
          <CardContent className="divide-y divide-border p-0">
            <SettingsItem icon={<FileText className="h-6 w-6" />} title="مشاهده اطلاعات من" description="اطلاعاتی که مبنای برنامه‌های نئوفیت هستند" href="/profile/view" />
            <SettingsItem icon={<Edit className="h-6 w-6" />} title="ویرایش مشخصات و برنامه" description="هدف، اندازه‌ها، سبک زندگی و تنظیمات تمرین" href="/profile/edit" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>تنظیمات حساب</CardTitle></CardHeader>
          <CardContent className="divide-y divide-border p-0">
            <SettingsItem icon={<UserCog className="h-6 w-6" />} title="مدیریت حساب" description="نام نمایشی، ایمیل و تنظیمات ورود" href="/profile/account" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>تنظیمات برنامه</CardTitle></CardHeader>
          <CardContent>
            <div className="flex items-center justify-between p-2">
              <p className="font-semibold">حالت نمایش</p>
              <ModeToggle />
            </div>
          </CardContent>
        </Card>

        <div className="text-center">
          <Button variant="ghost" className="text-destructive hover:text-destructive" onClick={handleLogout}>
            <LogOut className="ml-2 h-4 w-4" />
            خروج از حساب
          </Button>
        </div>
      </main>
    </div>
  );
}
