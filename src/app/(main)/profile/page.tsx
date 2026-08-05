"use client";

import Link from "next/link";
import {
  BellRing,
  ChevronLeft,
  Dumbbell,
  Edit3,
  FileText,
  MapPin,
  Scale,
  ShieldCheck,
  Target,
  UserCog,
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { ModeToggle } from "@/components/mode-toggle";
import { useUserData } from "@/context/user-profile-context";

const goalLabels = {
  lose_weight: "کاهش وزن و چربی",
  gain_muscle: "افزایش عضله",
  improve_fitness: "بهبود آمادگی جسمانی",
};

const locationLabels = {
  gym: "باشگاه",
  home: "خانه",
};

function SettingsItem({ icon, title, description, href }: { icon: React.ReactNode; title: string; description: string; href: string }) {
  return (
    <Link href={href} className="flex items-center gap-4 rounded-2xl p-4 transition-colors hover:bg-secondary/60">
      <span className="rounded-2xl bg-primary/10 p-3 text-primary">{icon}</span>
      <span className="min-w-0 flex-1 text-right">
        <span className="block font-black">{title}</span>
        <span className="mt-1 block text-sm leading-6 text-muted-foreground">{description}</span>
      </span>
      <ChevronLeft className="h-5 w-5 shrink-0 text-muted-foreground" />
    </Link>
  );
}

function SummaryItem({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="rounded-2xl border bg-card p-4">
      <div className="flex items-start justify-between gap-3">
        <div><p className="text-xs text-muted-foreground">{label}</p><p className="mt-2 font-black">{value}</p></div>
        <span className="rounded-xl bg-primary/10 p-2 text-primary">{icon}</span>
      </div>
    </div>
  );
}

export default function ProfilePage() {
  const { user, userProfile, isLoading } = useUserData();

  if (isLoading) {
    return (
      <main className="p-4 sm:p-6 lg:p-8">
        <div className="mx-auto max-w-4xl">
          <header className="mb-8 flex flex-col items-center"><Skeleton className="h-24 w-24 rounded-full" /><Skeleton className="mt-4 h-8 w-40" /><Skeleton className="mt-2 h-4 w-52" /></header>
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">{Array.from({ length: 4 }).map((_, index) => <Skeleton key={index} className="h-28" />)}</div>
          <Skeleton className="mt-6 h-64" />
        </div>
      </main>
    );
  }

  const userName = userProfile?.name || user?.displayName || "کاربر نئوفیت";
  const userEmail = user?.email || "demo@neofit.local";

  return (
    <main dir="rtl" className="min-h-screen bg-gradient-to-b from-primary/5 via-background to-background p-4 sm:p-6 lg:p-8">
      <div className="mx-auto max-w-4xl py-3">
        <header className="mb-7 flex flex-col items-center text-center">
          <Avatar className="h-24 w-24 border-4 border-primary shadow-lg">
            <AvatarImage src={user?.photoURL || ""} alt={userName} />
            <AvatarFallback className="text-2xl font-black">{userName.charAt(0)}</AvatarFallback>
          </Avatar>
          <h1 className="mt-4 text-3xl font-black">{userName}</h1>
          <p className="mt-1 text-sm text-muted-foreground" dir="ltr">{userEmail}</p>
          <div className="mt-3 inline-flex items-center gap-2 rounded-full border bg-card px-3 py-1.5 text-xs font-bold text-primary shadow-sm"><ShieldCheck className="h-4 w-4" />حساب محلی نسخهٔ نمایشی</div>
        </header>

        {userProfile ? (
          <section className="grid grid-cols-2 gap-3 lg:grid-cols-4" aria-label="خلاصه پروفایل">
            <SummaryItem icon={<Target className="h-5 w-5" />} label="هدف اصلی" value={goalLabels[userProfile.goal]} />
            <SummaryItem icon={<Scale className="h-5 w-5" />} label="وزن فعلی" value={`${userProfile.weight.toLocaleString("fa-IR")} کیلوگرم`} />
            <SummaryItem icon={<Dumbbell className="h-5 w-5" />} label="برنامه تمرین" value={`${Number(userProfile.trainingDays).toLocaleString("fa-IR")} روز در هفته`} />
            <SummaryItem icon={<MapPin className="h-5 w-5" />} label="محل تمرین" value={locationLabels[userProfile.workoutLocation]} />
          </section>
        ) : null}

        <div className="mt-7 grid gap-5 lg:grid-cols-2">
          <Card>
            <CardHeader><CardTitle>اطلاعات و برنامه</CardTitle></CardHeader>
            <CardContent className="divide-y p-0">
              <SettingsItem icon={<FileText className="h-5 w-5" />} title="مشاهده اطلاعات من" description="اطلاعات پایه، سبک زندگی، تغذیه و سابقه پزشکی" href="/profile/view" />
              <SettingsItem icon={<Edit3 className="h-5 w-5" />} title="ویرایش مشخصات" description="هدف، وزن، شرایط تمرین و عادت‌های روزانه را به‌روز کن" href="/profile/edit" />
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle>حساب و تنظیمات</CardTitle></CardHeader>
            <CardContent className="divide-y p-0">
              <SettingsItem icon={<UserCog className="h-5 w-5" />} title="مدیریت حساب محلی" description="نام نمایشی و محدودیت‌های حساب نسخهٔ فعلی" href="/profile/account" />
              <SettingsItem icon={<BellRing className="h-5 w-5" />} title="تنظیمات اعلان‌ها" description="تمرین، وعده، آب و گزارش‌های دوره‌ای" href="/notifications#notification-settings" />
              <div className="flex items-center justify-between gap-4 p-4"><div><p className="font-black">حالت نمایش</p><p className="mt-1 text-sm text-muted-foreground">روشن، تاریک یا مطابق دستگاه</p></div><ModeToggle /></div>
            </CardContent>
          </Card>
        </div>

        <div className="mt-6 rounded-2xl border bg-muted/30 p-4 text-sm leading-7 text-muted-foreground">
          ورود واقعی، همگام‌سازی چنددستگاهی، تغییر ایمیل و رمز عبور بعد از اتصال زیرساخت حساب فعال می‌شوند. این صفحه فعلاً فقط داده‌های محلی همین مرورگر را مدیریت می‌کند.
        </div>
      </div>
    </main>
  );
}
