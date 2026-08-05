"use client";

import Link from "next/link";
import { AlertTriangle, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export default function WorkoutError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <main dir="rtl" className="grid min-h-[70vh] place-items-center p-4">
      <Card className="w-full max-w-lg border-destructive/30">
        <CardContent className="p-9 text-center">
          <AlertTriangle className="mx-auto h-12 w-12 text-destructive" />
          <h1 className="mt-4 text-2xl font-black">برنامه تمرینی بارگذاری نشد</h1>
          <p className="mt-2 text-sm leading-7 text-muted-foreground">ثبت‌های محلی حذف نشده‌اند. صفحه را دوباره بارگذاری کن یا به داشبورد برگرد.</p>
          <div className="mt-6 flex flex-col justify-center gap-3 sm:flex-row">
            <Button onClick={reset}><RefreshCw className="ml-2 h-4 w-4" />تلاش دوباره</Button>
            <Button asChild variant="outline"><Link href="/today">بازگشت به امروز</Link></Button>
          </div>
        </CardContent>
      </Card>
    </main>
  );
}
