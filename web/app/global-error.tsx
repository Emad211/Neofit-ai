'use client';

export default function GlobalError({ reset }: { reset: () => void }) {
  return (
    <html lang="fa" dir="rtl">
      <body>
        <main className="system-page">
          <section className="system-card" aria-labelledby="global-error-title">
            <span className="system-mark" aria-hidden="true">!</span>
            <h1 id="global-error-title">نئوفیت موقتاً در دسترس نیست</h1>
            <p>یک خطای عمومی رخ داده است. دوباره تلاش کن؛ اطلاعات شخصی در این مرحله روی سرور نوشته نشده است.</p>
            <button className="system-action" type="button" onClick={reset}>راه‌اندازی دوباره</button>
          </section>
        </main>
      </body>
    </html>
  );
}
