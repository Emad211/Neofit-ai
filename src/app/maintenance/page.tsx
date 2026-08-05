import Link from "next/link";
import { Construction, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function MaintenancePage() {
  return (
    <main dir="rtl" className="grid min-h-screen place-items-center bg-gradient-to-b from-amber-500/10 via-background to-background p-6 text-center">
      <div className="max-w-lg">
        <div className="mx-auto grid h-20 w-20 place-items-center rounded-3xl bg-amber-500/10 text-amber-600"><Construction className="h-10 w-10" /></div>
        <h1 className="mt-6 text-3xl font-black sm:text-4xl">در حال به‌روزرسانی نئوفیت</h1>
        <p className="mt-4 leading-8 text-muted-foreground">ممکن است بعضی قابلیت‌های آنلاین موقتاً در دسترس نباشند. اطلاعات محلی و ثبت‌های قبلی روی همین دستگاه محفوظ می‌مانند.</p>
        <Button asChild className="mt-7"><Link href="/today"><RefreshCw className="ml-2 h-4 w-4" />بررسی دوباره</Link></Button>
      </div>
    </main>
  );
}
