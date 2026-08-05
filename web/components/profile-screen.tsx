'use client';

import Link from 'next/link';
import { useState } from 'react';
import { NeoFitIcon } from '@/components/neofit-icons';
import { useNutritionState } from '@/components/nutrition-state';
import { workoutPlan } from '@/data/workout-fixtures';

const faNumber = new Intl.NumberFormat('fa-IR', { maximumFractionDigits: 1 });

export function ProfileScreen() {
  const { summary, resetDiary } = useNutritionState();
  const [message, setMessage] = useState('');

  function clearDemoDiary() {
    const accepted = window.confirm('ثبت‌های آزمایشی تغذیه به حالت اولیه برگردند؟');
    if (!accepted) return;
    resetDiary();
    setMessage('ثبت‌های آزمایشی به حالت اولیه برگشتند.');
  }

  return (
    <section className="page-stack" aria-labelledby="profile-heading">
      <div className="section-heading">
        <div>
          <p className="section-kicker">حساب و برنامه</p>
          <h2 id="profile-heading">پروفایل من</h2>
        </div>
        <span className="status-pill status-pill--soft"><NeoFitIcon name="profile" size={15} />محلی</span>
      </div>

      <article className="profile-identity-card">
        <span className="profile-identity-card__avatar">ع</span>
        <div>
          <h3>عماد</h3>
          <p>پیش‌نمایش محلی نئوفیت</p>
        </div>
        <span className="profile-identity-card__state">بدون حساب آنلاین</span>
      </article>

      <div className="profile-metrics">
        <article><span>وزن فعلی</span><strong>{faNumber.format(92.2)}<small> kg</small></strong></article>
        <article><span>هدف وزن</span><strong>{faNumber.format(85)}<small> kg</small></strong></article>
        <article><span>جلسه در هفته</span><strong>{faNumber.format(workoutPlan.length)}</strong></article>
      </div>

      <article className="profile-plan-card">
        <div>
          <span>هدف فعلی</span>
          <h3>کاهش وزن با حفظ عضله</h3>
          <p>سه جلسه تمرین مقاومتی و ثبت منظم تغذیه.</p>
        </div>
        <NeoFitIcon name="sparkle" size={28} />
      </article>

      <nav className="profile-links" aria-label="بخش‌های پروفایل">
        <Link href="/progress"><span><NeoFitIcon name="chart" />روند پیشرفت</span><NeoFitIcon name="chevron" /></Link>
        <Link href="/workout"><span><NeoFitIcon name="workout" />برنامهٔ تمرین</span><NeoFitIcon name="chevron" /></Link>
        <Link href="/nutrition"><span><NeoFitIcon name="food" />تغذیه و ثبت غذا</span><NeoFitIcon name="chevron" /></Link>
      </nav>

      <article className="local-data-card">
        <div>
          <span>داده‌های همین مرورگر</span>
          <h3>{faNumber.format(summary.entryCount)} وعدهٔ تغذیه</h3>
          <p>در این مرحله داده‌ها فقط روی همین دستگاه نگه‌داری می‌شوند.</p>
        </div>
        <button type="button" onClick={clearDemoDiary}>بازنشانی دادهٔ آزمایشی</button>
        {message ? <p className="local-data-card__message" role="status">{message}</p> : null}
      </article>

      <div className="profile-boundary-note">
        <NeoFitIcon name="offline" size={18} />
        <p>ورود واقعی و همگام‌سازی حساب هنوز به این فرانت متصل نشده‌اند؛ این صفحه ادعای حساب آنلاین ندارد.</p>
      </div>
    </section>
  );
}
