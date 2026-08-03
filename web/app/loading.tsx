export default function Loading() {
  return (
    <main className="system-page" aria-busy="true" aria-label="در حال آماده‌سازی نئوفیت">
      <section className="system-card loading-card">
        <span className="system-mark" aria-hidden="true">N</span>
        <div className="loading-bar" />
        <div className="loading-bar is-short" />
        <span className="sr-only">در حال بارگذاری</span>
      </section>
    </main>
  );
}
