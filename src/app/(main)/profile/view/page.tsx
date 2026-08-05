"use client";

import Link from "next/link";
import { ArrowRight, HeartPulse, Salad, UserRound, Dumbbell } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useUserData } from "@/context/user-profile-context";

const labels = {
  goal: { lose_weight: "کاهش وزن و چربی", gain_muscle: "افزایش عضله", improve_fitness: "بهبود آمادگی جسمانی" },
  gender: { male: "مرد", female: "زن", other: "سایر" },
  bodyType: { ectomorph: "اکتومورف", mesomorph: "مزومورف", endomorph: "اندومورف" },
  level: { beginner: "مبتدی", intermediate: "متوسط", advanced: "پیشرفته" },
  location: { home: "خانه", gym: "باشگاه" },
  lifestyle: { sedentary: "کم‌تحرک", lightly_active: "فعالیت سبک", moderately_active: "فعالیت متوسط", very_active: "بسیار فعال" },
  stress: { low: "کم", medium: "متوسط", high: "زیاد" },
  cost: { low: "اقتصادی", medium: "متوسط", high: "آزاد" },
  cooking: { beginner: "مبتدی", intermediate: "متوسط", advanced: "ماهر" },
};

function InfoItem({ label, value }: { label: string; value: React.ReactNode }) {
  return <div className="rounded-2xl bg-muted/35 p-4"><p className="text-xs text-muted-foreground">{label}</p><p className="mt-2 font-black leading-7">{value || "ثبت نشده"}</p></div>;
}

function InfoSection({ title, icon, children }: { title: string; icon: React.ReactNode; children: React.ReactNode }) {
  return <Card><CardHeader><CardTitle className="flex items-center gap-2">{icon}{title}</CardTitle></CardHeader><CardContent className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">{children}</CardContent></Card>;
}

export default function ViewProfilePage() {
  const { userProfile, isLoading } = useUserData();

  if (isLoading) {
    return <main className="p-4 sm:p-6 lg:p-8"><div className="mx-auto max-w-5xl"><Skeleton className="h-10 w-52" /><Skeleton className="mt-3 h-4 w-72" /><div className="mt-8 space-y-5">{Array.from({ length: 4 }).map((_, index) => <Skeleton key={index} className="h-48" />)}</div></div></main>;
  }

  if (!userProfile) {
    return <main dir="rtl" className="grid min-h-[70vh] place-items-center p-6 text-center"><div><UserRound className="mx-auto h-12 w-12 text-muted-foreground" /><h1 className="mt-4 text-2xl font-black">اطلاعات پروفایل موجود نیست</h1><p className="mt-2 text-muted-foreground">برای ساخت اطلاعات اولیه، مراحل شروع را تکمیل کن.</p><Button asChild className="mt-5"><Link href="/onboarding">شروع تکمیل اطلاعات</Link></Button></div></main>;
  }

  return (
    <main dir="rtl" className="min-h-screen bg-gradient-to-b from-primary/5 via-background to-background p-4 sm:p-6 lg:p-8">
      <div className="mx-auto max-w-5xl py-3">
        <Button variant="ghost" asChild className="mb-5"><Link href="/profile"><ArrowRight className="ml-2 h-4 w-4" />بازگشت به پروفایل</Link></Button>
        <header className="mb-7"><h1 className="text-3xl font-black sm:text-4xl">اطلاعات من</h1><p className="mt-2 text-muted-foreground">این داده‌ها مبنای نمایش برنامهٔ تمرین و تغذیهٔ نسخهٔ فعلی هستند.</p></header>

        <div className="space-y-5">
          <InfoSection title="اطلاعات پایه" icon={<UserRound className="h-5 w-5 text-primary" />}>
            <InfoItem label="هدف اصلی" value={labels.goal[userProfile.goal]} />
            <InfoItem label="جنسیت" value={labels.gender[userProfile.gender]} />
            <InfoItem label="سن" value={`${userProfile.age.toLocaleString("fa-IR")} سال`} />
            <InfoItem label="قد" value={`${userProfile.height.toLocaleString("fa-IR")} سانتی‌متر`} />
            <InfoItem label="وزن" value={`${userProfile.weight.toLocaleString("fa-IR")} کیلوگرم`} />
            <InfoItem label="تیپ بدنی" value={labels.bodyType[userProfile.bodyType]} />
          </InfoSection>

          <InfoSection title="تمرین و فعالیت" icon={<Dumbbell className="h-5 w-5 text-primary" />}>
            <InfoItem label="سطح تمرین" value={labels.level[userProfile.fitnessLevel]} />
            <InfoItem label="روزهای تمرین" value={`${Number(userProfile.trainingDays).toLocaleString("fa-IR")} روز در هفته`} />
            <InfoItem label="مدت جلسه" value={`${userProfile.trainingDuration} دقیقه`} />
            <InfoItem label="محل تمرین" value={labels.location[userProfile.workoutLocation]} />
            <InfoItem label="فعالیت روزانه" value={labels.lifestyle[userProfile.lifestyle]} />
            <InfoItem label="هدف عملکردی" value={userProfile.performanceGoals || "ثبت نشده"} />
            <InfoItem label="تجهیزات موجود" value={userProfile.availableEquipment || "ثبت نشده"} />
          </InfoSection>

          <InfoSection title="تغذیه و سبک زندگی" icon={<Salad className="h-5 w-5 text-primary" />}>
            <InfoItem label="بودجه غذا" value={labels.cost[userProfile.costLevel]} />
            <InfoItem label="مهارت آشپزی" value={labels.cooking[userProfile.cookingSkill]} />
            <InfoItem label="خواب معمول" value={`${userProfile.sleepHours} ساعت`} />
            <InfoItem label="سطح استرس" value={labels.stress[userProfile.stressLevel]} />
            <InfoItem label="عادت‌ها، حساسیت یا محدودیت غذایی" value={userProfile.eatingHabits || "ثبت نشده"} />
            <InfoItem label="ترجیح غذایی" value={userProfile.dietaryPreference || "ثبت نشده"} />
            <InfoItem label="منطقه زمانی" value={<span dir="ltr">{userProfile.timezone}</span>} />
          </InfoSection>

          <InfoSection title="سوابق و محدودیت‌های پزشکی" icon={<HeartPulse className="h-5 w-5 text-primary" />}>
            <div className="sm:col-span-2 lg:col-span-3"><InfoItem label="یادداشت ثبت‌شده" value={userProfile.medicalHistory || "هیچ موردی در پروفایل فعلی ثبت نشده است."} /></div>
          </InfoSection>
        </div>

        <div className="mt-6 flex justify-end"><Button asChild><Link href="/profile/edit">ویرایش این اطلاعات</Link></Button></div>
      </div>
    </main>
  );
}
