import Link from "next/link";
import { ArrowRight, MapPinOff } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function NotFoundPage() {
  return (
    <main dir="rtl" className="grid min-h-screen place-items-center bg-gradient-to-b from-primary/10 via-background to-background p-6 text-center">
      <div className="max-w-lg">
        <div className="mx-auto grid h-20 w-20 place-items-center rounded-3xl bg-primary/10 text-primary">
          <MapPinOff className="h-10 w-10" />
        </div>
        <p className="mt-6 text-sm font-black text-primary">خطای ۴۰۴</p>
        <h1 className="mt-2 text-3xl font-black sm:text-4xl">این صفحه پیدا نشد</h1>
        <p className="mt-4 leading-8 text-muted-foreground">ممکن است آدرس تغییر کرده باشد یا لینک قدیمی باشد. داده‌های محلی تو دست‌نخورده باقی مانده‌اند.</p>
        <Button asChild className="mt-7"><Link href="/today"><ArrowRight className="ml-2 h-4 w-4" />بازگشت به امروز</Link></Button>
      </div>
    </main>
  );
}
