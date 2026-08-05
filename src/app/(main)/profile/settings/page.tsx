"use client";

import * as React from "react";
import Link from "next/link";
import {
  ArrowRight,
  BellRing,
  ClipboardCheck,
  Database,
  Download,
  HelpCircle,
  MonitorCog,
  ShieldCheck,
  Trash2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { ModeToggle } from "@/components/mode-toggle";
import { useToast } from "@/hooks/use-toast";

type LocalDataSummary = {
  keys: string[];
  approximateBytes: number;
};

function neoFitKeys() {
  return Array.from({ length: window.localStorage.length }, (_, index) => window.localStorage.key(index))
    .filter((key): key is string => Boolean(key?.startsWith("neofit")))
    .sort();
}

function readLocalSummary(): LocalDataSummary {
  const keys = neoFitKeys();
  const approximateBytes = keys.reduce((sum, key) => sum + key.length + (window.localStorage.getItem(key)?.length || 0), 0) * 2;
  return { keys, approximateBytes };
}

function readableSize(bytes: number) {
  if (bytes < 1024) return `${bytes.toLocaleString("fa-IR")} بایت`;
  return `${(bytes / 1024).toLocaleString("fa-IR", { maximumFractionDigits: 1 })} کیلوبایت`;
}

export default function ProfileSettingsPage() {
  const { toast } = useToast();
  const [summary, setSummary] = React.useState<LocalDataSummary>({ keys: [], approximateBytes: 0 });

  React.useEffect(() => {
    setSummary(readLocalSummary());
  }, []);

  const exportData = () => {
    const keys = neoFitKeys();
    const data = Object.fromEntries(keys.map((key) => {
      const raw = window.localStorage.getItem(key);
      try {
        return [key, raw ? JSON.parse(raw) : null];
      } catch {
        return [key, raw];
      }
    }));
    const payload = {
      format: "neofit-local-export-v1",
      exportedAt: new Date().toISOString(),
      data,
    };
    const url = URL.createObjectURL(new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" }));
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `neofit-local-export-${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    URL.revokeObjectURL(url);
    toast({ title: "خروجی داده آماده شد", description: `${keys.length.toLocaleString("fa-IR")} بخش محلی در فایل JSON قرار گرفت.` });
  };

  const copyDiagnostics = async () => {
    const current = readLocalSummary();
    const diagnostic = JSON.stringify({
      product: "NeoFit frontend demo",
      generatedAt: new Date().toISOString(),
      localDataSections: current.keys.length,
      approximateBytes: current.approximateBytes,
      language: document.documentElement.lang,
      direction: document.documentElement.dir,
      path: window.location.pathname,
      userAgent: navigator.userAgent,
    }, null, 2);

    try {
      await navigator.clipboard.writeText(diagnostic);
      toast({ title: "گزارش فنی کپی شد", description: "می‌توانی این متن را برای بررسی خطا ارسال کنی." });
    } catch {
      const textarea = document.createElement("textarea");
      textarea.value = diagnostic;
      textarea.style.position = "fixed";
      textarea.style.opacity = "0";
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand("copy");
      textarea.remove();
      toast({ title: "گزارش فنی کپی شد" });
    }
  };

  const deleteLocalData = () => {
    neoFitKeys().forEach((key) => window.localStorage.removeItem(key));
    window.location.assign("/onboarding");
  };

  return (
    <main dir="rtl" className="min-h-screen bg-gradient-to-b from-primary/5 via-background to-background p-4 sm:p-6 lg:p-8">
      <div className="mx-auto max-w-4xl py-3">
        <Button variant="ghost" asChild className="mb-5"><Link href="/profile"><ArrowRight className="ml-2 h-4 w-4" />بازگشت به پروفایل</Link></Button>
        <header className="mb-7"><h1 className="text-3xl font-black sm:text-4xl">تنظیمات، داده و راهنما</h1><p className="mt-2 text-muted-foreground">همهٔ کنترل‌های این صفحه فقط روی داده‌های همین مرورگر اثر می‌گذارند.</p></header>

        <div className="space-y-5">
          <Card>
            <CardHeader><CardTitle className="flex items-center gap-2"><MonitorCog className="h-5 w-5 text-primary" />نمایش و اعلان‌ها</CardTitle></CardHeader>
            <CardContent className="divide-y">
              <div className="flex items-center justify-between gap-4 pb-4"><div><p className="font-black">حالت نمایش</p><p className="mt-1 text-sm text-muted-foreground">روشن، تاریک یا مطابق دستگاه</p></div><ModeToggle /></div>
              <div className="flex flex-col items-start justify-between gap-3 pt-4 sm:flex-row sm:items-center"><div><p className="flex items-center gap-2 font-black"><BellRing className="h-4 w-4 text-primary" />تنظیمات دسته‌ای اعلان‌ها</p><p className="mt-1 text-sm text-muted-foreground">تمرین، وعده، آب و گزارش‌های دوره‌ای</p></div><Button variant="outline" asChild><Link href="/notifications#notification-settings">مدیریت اعلان‌ها</Link></Button></div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle className="flex items-center gap-2"><Database className="h-5 w-5 text-primary" />داده‌های محلی</CardTitle><p className="text-sm leading-6 text-muted-foreground">اطلاعات فعلی روی دستگاه و در Local Storage مرورگر قرار دارند؛ هنوز به حساب ابری همگام نمی‌شوند.</p></CardHeader>
            <CardContent>
              <div className="mb-4 grid grid-cols-2 gap-3">
                <div className="rounded-2xl bg-muted/40 p-4"><p className="text-xs text-muted-foreground">بخش‌های ذخیره‌شده</p><p className="mt-2 text-xl font-black">{summary.keys.length.toLocaleString("fa-IR")}</p></div>
                <div className="rounded-2xl bg-muted/40 p-4"><p className="text-xs text-muted-foreground">حجم تقریبی</p><p className="mt-2 text-xl font-black">{readableSize(summary.approximateBytes)}</p></div>
              </div>
              <div className="flex flex-col gap-3 sm:flex-row">
                <Button type="button" onClick={exportData}><Download className="ml-2 h-4 w-4" />خروجی JSON</Button>
                <AlertDialog>
                  <AlertDialogTrigger asChild><Button type="button" variant="destructive"><Trash2 className="ml-2 h-4 w-4" />حذف داده‌های محلی</Button></AlertDialogTrigger>
                  <AlertDialogContent dir="rtl">
                    <AlertDialogHeader className="text-right"><AlertDialogTitle>همه داده‌های محلی حذف شوند؟</AlertDialogTitle><AlertDialogDescription className="text-right leading-7">پروفایل، برنامه‌ها، ثبت‌های تمرین و تغذیه، تنظیمات و تاریخچهٔ همین مرورگر پاک می‌شوند. این عمل قابل بازگشت نیست؛ پیش از حذف می‌توانی خروجی JSON بگیری.</AlertDialogDescription></AlertDialogHeader>
                    <AlertDialogFooter className="gap-2"><AlertDialogCancel>انصراف</AlertDialogCancel><AlertDialogAction className="bg-destructive text-destructive-foreground hover:bg-destructive/90" onClick={deleteLocalData}>تأیید حذف کامل</AlertDialogAction></AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle className="flex items-center gap-2"><ShieldCheck className="h-5 w-5 text-primary" />مرز حریم خصوصی نسخهٔ فعلی</CardTitle></CardHeader>
            <CardContent className="space-y-3 text-sm leading-7 text-muted-foreground">
              <p>داده‌های این نسخه در مرورگر نگهداری می‌شوند و صفحهٔ Profile چیزی را به سرور ارسال نمی‌کند.</p>
              <p>عکس‌های Progress فقط پیش‌نمایش موقت Object URL هستند و با Refresh حذف می‌شوند.</p>
              <p>ورود واقعی، بازیابی حساب، همگام‌سازی چنددستگاهی و حذف حساب سروری پس از اتصال Supabase Auth و سیاست حریم خصوصی نهایی فعال می‌شوند.</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle className="flex items-center gap-2"><HelpCircle className="h-5 w-5 text-primary" />راهنما و گزارش مشکل</CardTitle></CardHeader>
            <CardContent>
              <div className="space-y-3">
                <details className="rounded-2xl border p-4"><summary className="cursor-pointer font-black">چرا اطلاعات روی دستگاه دیگری دیده نمی‌شوند؟</summary><p className="mt-3 text-sm leading-7 text-muted-foreground">چون این شاخه هنوز از حافظهٔ محلی استفاده می‌کند. همگام‌سازی بعد از اتصال حساب واقعی انجام می‌شود.</p></details>
                <details className="rounded-2xl border p-4"><summary className="cursor-pointer font-black">آیا اعداد تغذیه‌ای ناشناخته تخمین زده می‌شوند؟</summary><p className="mt-3 text-sm leading-7 text-muted-foreground">خیر. فقط داده‌های کاتالوگ معتبر محلی ثبت می‌شوند و ماکروهای ناشناخته اختراع نمی‌شوند.</p></details>
                <details className="rounded-2xl border p-4"><summary className="cursor-pointer font-black">آیا این برنامه جایگزین پزشک است؟</summary><p className="mt-3 text-sm leading-7 text-muted-foreground">خیر. اطلاعات پزشکی و هشدارهای ایمنی برای محدودکردن تجربه‌اند و جای ارزیابی حرفه‌ای را نمی‌گیرند.</p></details>
              </div>
              <div className="mt-4 flex flex-col items-start justify-between gap-3 rounded-2xl bg-muted/40 p-4 sm:flex-row sm:items-center"><div><p className="font-black">گزارش فنی بدون دادهٔ حساس</p><p className="mt-1 text-sm leading-6 text-muted-foreground">نسخه، مسیر، مرورگر و حجم تقریبی داده‌ها را کپی می‌کند؛ محتوای پروفایل در آن نیست.</p></div><Button type="button" variant="outline" onClick={copyDiagnostics}><ClipboardCheck className="ml-2 h-4 w-4" />کپی گزارش فنی</Button></div>
            </CardContent>
          </Card>

          <p className="text-center text-xs text-muted-foreground">NeoFit Frontend Demo · نسخهٔ محلی قبل از اتصال Backend</p>
        </div>
      </div>
    </main>
  );
}
