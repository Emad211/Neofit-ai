export default function NotFound() {
  return (
    <main className="system-page">
      <section className="system-card" aria-labelledby="not-found-title">
        <span className="system-mark" aria-hidden="true">۴۰۴</span>
        <h1 id="not-found-title">این صفحه پیدا نشد</h1>
        <p>نشانی واردشده جزو مسیرهای فعلی نئوفیت نیست.</p>
        <a className="system-action" href="/">بازگشت به امروز</a>
      </section>
    </main>
  );
}
