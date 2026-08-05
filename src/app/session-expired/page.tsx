import Link from "next/link";
import { Clock3, LogIn } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function SessionExpiredPage() {
  return (
    <main dir="rtl" className="grid min-h-screen place-items-center bg-gradient-to-b from-primary/10 via-background to-background p-6 text-center">
      <div className="max-w-lg">
        <div className="mx-auto grid h-20 w-20 place-items-center rounded-3xl bg-primary/10 text-primary"><Clock3 className="h-10 w-10" /></div>
        <h1 className="mt-6 text-3xl font-black sm:text-4xl">نشست کاربری پایان یافته است</h1>
        <p className="mt-4 leading-8 text-muted-foreground">برای ادامهٔ همگام‌سازی آنلاین باید دوباره وارد حساب شوی. داده‌های محلی این مرورگر تا زمان ورود مجدد حذف نمی‌شوند.</p>
        <Button asChild className="mt-7"><Link href="/auth"><LogIn className="ml-2 h-4 w-4" />رفتن به ورود</Link></Button>
      </div>
    </main>
  );
}
