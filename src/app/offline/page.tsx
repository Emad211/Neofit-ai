"use client";

import Link from "next/link";
import { Database, RefreshCw, WifiOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export default function OfflinePage() {
  return (
    <main dir="rtl" className="grid min-h-screen place-items-center bg-gradient-to-b from-amber-500/10 via-background to-background p-4">
      <Card className="w-full max-w-xl">
        <CardContent className="p-7 text-center sm:p-9">
          <div className="mx-auto grid h-16 w-16 place-items-center rounded-3xl bg-amber-500/15 text-amber-700 dark:text-amber-300"><WifiOff className="h-8 w-8" /></div>
          <h1 className="mt-5 text-3xl font-black">اتصال اینترنت در دسترس نیست</h1>
          <p className="mt-3 text-sm leading-7 text-muted-foreground">ثبت آب، قدم، خواب، وزن، اندازه‌ها و داده‌های نمایشی روی همین دستگاه ادامه پیدا می‌کند. قابلیت‌هایی که به همگام‌سازی یا دریافت محتوای جدید نیاز دارند بعد از اتصال فعال می‌شوند.</p>
          <div className="mt-6 flex items-start gap-3 rounded-2xl bg-muted/40 p-4 text-right"><Database className="mt-1 h-5 w-5 shrink-0 text-primary" /><p className="text-sm leading-7 text-muted-foreground">این صفحه از حالا مسیر ثابت Offline است؛ در فاز PWA به Cache و Service Worker واقعی متصل خواهد شد.</p></div>
          <div className="mt-7 flex flex-col gap-3 sm:flex-row sm:justify-center"><Button onClick={() => window.location.reload()}><RefreshCw className="ml-2 h-4 w-4" />بررسی دوباره اتصال</Button><Button asChild variant="outline"><Link href="/today">بازگشت به امروز</Link></Button></div>
        </CardContent>
      </Card>
    </main>
  );
}
