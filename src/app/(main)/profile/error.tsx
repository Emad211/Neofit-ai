"use client";

import Link from "next/link";
import { AlertTriangle, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function ProfileError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <main dir="rtl" className="grid min-h-[70vh] place-items-center p-6 text-center">
      <div className="max-w-md rounded-3xl border bg-card p-8 shadow-sm">
        <AlertTriangle className="mx-auto h-12 w-12 text-destructive" />
        <h1 className="mt-4 text-2xl font-black">پروفایل نمایش داده نشد</h1>
        <p className="mt-3 text-sm leading-7 text-muted-foreground">یک خطای موقت رخ داده است. دوباره تلاش کن؛ داده‌های ذخیره‌شدهٔ مرورگر حذف نمی‌شوند.</p>
        <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-center">
          <Button type="button" onClick={reset}><RefreshCw className="ml-2 h-4 w-4" />تلاش دوباره</Button>
          <Button variant="outline" asChild><Link href="/today">بازگشت به امروز</Link></Button>
        </div>
      </div>
    </main>
  );
}
