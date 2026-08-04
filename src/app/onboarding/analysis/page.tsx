"use client";

import * as React from "react";
import Link from "next/link";
import { ArrowLeft, Apple, Dumbbell, CheckCircle2 } from "lucide-react";
import { demoNutritionPlan, demoWorkoutPlan } from "@/lib/neofit-demo-data";
import { useUserData } from "@/context/user-profile-context";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function OnboardingAnalysisPage() {
  const { userProfile, savePlans } = useUserData();
  const [saved, setSaved] = React.useState(false);

  const activatePlan = async () => {
    await savePlans({ nutritionPlan: demoNutritionPlan, workoutPlan: demoWorkoutPlan });
    setSaved(true);
  };

  return (
    <main dir="rtl" className="min-h-screen bg-gradient-to-b from-primary/10 via-background to-background p-4 sm:p-8">
      <div className="mx-auto max-w-4xl py-10">
        <header className="mb-10 text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-lg">
            <CheckCircle2 className="h-8 w-8" />
          </div>
          <h1 className="text-4xl font-extrabold">برنامهٔ اولیه آماده است</h1>
          <p className="mt-3 text-lg text-muted-foreground">
            این پیشنهاد نمایشی بر اساس مشخصات فعلی {userProfile?.name || "کاربر"} و داده‌های کنترل‌شدهٔ داخل برنامه ساخته شده است.
          </p>
        </header>

        <div className="grid gap-6 md:grid-cols-2">
          <Card>
            <CardHeader><CardTitle className="flex items-center gap-2"><Apple className="h-5 w-5 text-primary" />برنامهٔ تغذیه</CardTitle></CardHeader>
            <CardContent className="space-y-3 text-sm leading-7 text-muted-foreground">
              <p>سه روز نمونه با غذاهای ایرانی، اندازهٔ سهم و کالری مشخص.</p>
              <p>مجموع هدف روزانه حدود ۲۲۰۰ کیلوکالری است.</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader><CardTitle className="flex items-center gap-2"><Dumbbell className="h-5 w-5 text-primary" />برنامهٔ تمرین</CardTitle></CardHeader>
            <CardContent className="space-y-3 text-sm leading-7 text-muted-foreground">
              <p>سه جلسهٔ فشار، کشش و پایین‌تنه با ست و تکرار مشخص.</p>
              <p>تمام جزئیات در نسخهٔ نمایشی قابل مرور هستند.</p>
            </CardContent>
          </Card>
        </div>

        <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
          <Button size="lg" onClick={activatePlan}>{saved ? "برنامه فعال شد" : "فعال‌کردن برنامه"}</Button>
          <Button size="lg" variant="outline" asChild><Link href="/today">رفتن به داشبورد<ArrowLeft className="mr-2 h-5 w-5" /></Link></Button>
        </div>
      </div>
    </main>
  );
}
