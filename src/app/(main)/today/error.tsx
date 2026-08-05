"use client";

import { AlertTriangle, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export default function TodayError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <main dir="rtl" className="grid min-h-[70vh] place-items-center p-4 sm:p-8">
      <Card className="w-full max-w-lg border-destructive/30">
        <CardContent className="p-7 text-center">
          <div className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-destructive/10 text-destructive"><AlertTriangle className="h-7 w-7" /></div>
          <h1 className="mt-5 text-2xl font-black">داشبورد امروز کامل بارگذاری نشد</h1>
          <p className="mt-3 text-sm leading-7 text-muted-foreground">اطلاعات ثبت‌شده روی دستگاه پاک نشده‌اند. دوباره تلاش کن؛ اگر خطا ادامه داشت، صفحه را بازخوانی یا وضعیت اتصال را بررسی کن.</p>
          <Button className="mt-6" onClick={reset}><RotateCcw className="ml-2 h-4 w-4" />تلاش دوباره</Button>
        </CardContent>
      </Card>
    </main>
  );
}
