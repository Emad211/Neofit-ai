"use client";

import { useRouter } from "next/navigation";
import { Dumbbell, ShieldCheck, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function AuthPage() {
  const router = useRouter();

  return (
    <main dir="rtl" className="flex min-h-screen items-center justify-center bg-gradient-to-b from-primary/10 via-background to-background p-4">
      <Card className="w-full max-w-md border-primary/20 shadow-xl">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-lg">
            <Dumbbell className="h-8 w-8" />
          </div>
          <CardTitle className="text-3xl font-extrabold">ورود به نئوفیت</CardTitle>
          <CardDescription className="text-base leading-7">
            این نسخه برای ارزیابی رابط کاربری با یک حساب محلی اجرا می‌شود. ورود واقعی در مرحلهٔ اتصال سامانهٔ حساب کاربری فعال خواهد شد.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-start gap-3 rounded-xl border bg-secondary/40 p-4 text-sm leading-6">
            <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
            هیچ سرویس ابری قدیمی یا کلید خارجی برای بازشدن این صفحه استفاده نمی‌شود.
          </div>
          <Button className="w-full" size="lg" onClick={() => router.push("/today")}>
            ورود به نسخهٔ نمایشی
            <ArrowLeft className="mr-2 h-5 w-5" />
          </Button>
        </CardContent>
      </Card>
    </main>
  );
}
