'use client';

import { useEffect } from 'react';

export default function ErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('NeoFit route error', error);
  }, [error]);

  return (
    <main className="system-page">
      <section className="system-card" aria-labelledby="route-error-title">
        <span className="system-mark" aria-hidden="true">!</span>
        <h1 id="route-error-title">این بخش درست بارگذاری نشد</h1>
        <p>داده‌ای تغییر نکرده است. دوباره تلاش کن؛ اگر مشکل باقی ماند، صفحه را تازه‌سازی کن.</p>
        <button className="system-action" type="button" onClick={reset}>تلاش دوباره</button>
      </section>
    </main>
  );
}
