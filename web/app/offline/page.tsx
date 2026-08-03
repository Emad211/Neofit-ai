export default function OfflinePage() {
  return (
    <main className="system-page">
      <section className="system-card" aria-labelledby="offline-title">
        <span className="system-mark" aria-hidden="true">↯</span>
        <h1 id="offline-title">اتصال اینترنت در دسترس نیست</h1>
        <p>پوستهٔ نئوفیت آماده است. بعد از برگشت اتصال، صفحه را دوباره باز کن تا داده‌های تازه دریافت شوند.</p>
        <a className="system-action" href="/">تلاش دوباره</a>
        <span className="system-secondary">در Stage 7 جست‌وجوی کاتالوگ و صف ثبت آفلاین اضافه می‌شود.</span>
      </section>
    </main>
  );
}
