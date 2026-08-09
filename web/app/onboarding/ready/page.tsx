import Link from 'next/link';

export default function OnboardingReadyPage() {
  return (
    <main className="onboarding-ready-page" id="main-content">
      <section className="onboarding-ready-card" aria-labelledby="onboarding-ready-heading">
        <p className="section-kicker">Onboarding v2</p>
        <h1 id="onboarding-ready-heading">قرارداد دوره ذخیره شد</h1>
        <p>کلید Google در vault امن حساب نگه‌داری می‌شود و پاسخ‌های شخصی + تاریخ شروع + مدت دوره برای لایه Program Cycle آماده‌اند.</p>
        <div className="onboarding-boundary-note">
          <strong>این صفحه عمداً برنامه جعلی نشان نمی‌دهد</strong>
          <p>Stage22 باید Program Cycle را بسازد و Stage24 Planner تمرین و تغذیه را با validation واقعی materialize کند. تا آن زمان NeoFit ادعا نمی‌کند دوره AI تولید شده است.</p>
        </div>
        <div className="onboarding-ready-card__actions">
          <Link href="/onboarding/review">مرور دوباره اطلاعات</Link>
          <Link href="/profile/ai">مدیریت کلیدهای AI</Link>
          <Link href="/coach">Coach فعلی read-only</Link>
        </div>
      </section>
    </main>
  );
}
