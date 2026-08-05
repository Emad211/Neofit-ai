"use client";

export default function GlobalError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <html lang="fa" dir="rtl">
      <body className="bg-background text-foreground">
        <main className="grid min-h-screen place-items-center p-6 text-center">
          <div className="max-w-lg rounded-3xl border bg-card p-8 shadow-sm">
            <p className="text-sm font-black text-destructive">خطای غیرمنتظره</p>
            <h1 className="mt-2 text-3xl font-black">بخشی از برنامه درست بارگذاری نشد</h1>
            <p className="mt-4 leading-8 text-muted-foreground">یک‌بار دوباره تلاش کن. اگر مشکل ادامه داشت، به صفحهٔ امروز برگرد. داده‌های ذخیره‌شدهٔ مرورگر حذف نمی‌شوند.</p>
            <div className="mt-7 flex flex-col gap-3 sm:flex-row sm:justify-center">
              <button type="button" onClick={reset} className="rounded-xl bg-primary px-5 py-3 font-bold text-primary-foreground focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-ring/40">تلاش دوباره</button>
              <a href="/today" className="rounded-xl border px-5 py-3 font-bold focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-ring/40">بازگشت به امروز</a>
            </div>
          </div>
        </main>
      </body>
    </html>
  );
}
