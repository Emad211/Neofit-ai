'use client';

import Link from 'next/link';
import { NeoFitIcon } from '@/components/neofit-icons';
import { useNutritionState } from '@/components/nutrition-state';

const faNumber = new Intl.NumberFormat('fa-IR', { maximumFractionDigits: 1 });

function MacroBar({ label, value, target }: { label: string; value: number; target: number }) {
  const ratio = target > 0 ? Math.min(1, value / target) : 0;
  return (
    <div className="macro-row">
      <div className="macro-row__copy">
        <span>{label}</span>
        <b><span dir="ltr">{faNumber.format(value)} / {faNumber.format(target)}</span> گرم</b>
      </div>
      <div className="macro-row__track" aria-label={`${label}: ${value} از ${target}`}>
        <span style={{ inlineSize: `${ratio * 100}%` }} />
      </div>
    </div>
  );
}

export function TodayScreen() {
  const { diary, summary } = useNutritionState();
  const dateLabel = new Intl.DateTimeFormat('fa-IR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  }).format(new Date());

  return (
    <section className="page-stack" aria-labelledby="today-heading">
      <div className="section-heading section-heading--compact">
        <div>
          <p className="section-kicker">{dateLabel}</p>
          <h2 id="today-heading">خلاصهٔ امروز</h2>
        </div>
        <Link className="text-button" href="/progress">جزئیات</Link>
      </div>

      <article className="hero-card">
        <div
          className="calorie-ring"
          style={{ '--progress': `${summary.calorieProgressPercent * 3.6}deg` } as React.CSSProperties}
          aria-label={`${summary.calorieProgressPercent} درصد هدف کالری`}
        >
          <div className="calorie-ring__inner">
            <strong>{faNumber.format(summary.remainingCalories)}</strong>
            <span>باقی‌مانده</span>
          </div>
        </div>
        <div className="hero-card__copy">
          <span className="status-pill"><NeoFitIcon name="sparkle" size={15} />در مسیر هدف</span>
          <h3>{faNumber.format(summary.macros.calories)} از {faNumber.format(summary.targets.calories)} کیلوکالری</h3>
          <p>ثبت‌های امروز از همان داده‌هایی جمع می‌شوند که در بخش تغذیه می‌بینی.</p>
        </div>
      </article>

      <div className="macro-panel">
        <MacroBar label="پروتئین" value={summary.macros.proteinG} target={summary.targets.proteinG} />
        <MacroBar label="کربوهیدرات" value={summary.macros.carbsG} target={summary.targets.carbsG} />
        <MacroBar label="چربی" value={summary.macros.fatG} target={summary.targets.fatG} />
      </div>

      <Link className="primary-action" href="/nutrition">
        <span className="primary-action__icon"><NeoFitIcon name="plus" /></span>
        <span><b>ثبت غذا</b><small>جست‌وجو در کاتالوگ تغذیه</small></span>
        <NeoFitIcon name="chevron" />
      </Link>

      <section className="timeline-section" aria-labelledby="diary-heading">
        <div className="section-heading">
          <div>
            <p className="section-kicker">تایم‌لاین</p>
            <h2 id="diary-heading">وعده‌های ثبت‌شده</h2>
          </div>
          <span className="count-badge">{faNumber.format(summary.entryCount)}</span>
        </div>
        <div className="meal-list">
          {diary.map((entry) => (
            <article className="meal-row" key={entry.core.id}>
              <span className="meal-row__dot" aria-hidden="true" />
              <div className="meal-row__copy">
                <span>{entry.mealLabelFa}</span>
                <h3>{entry.core.label}</h3>
                <p>{entry.portionText}</p>
              </div>
              <strong>{faNumber.format(entry.macros.calories)}<small> kcal</small></strong>
            </article>
          ))}
        </div>
      </section>

      <Link className="plan-preview" href="/nutrition/plan">
        <div>
          <span className="section-kicker">برنامهٔ غذایی</span>
          <h2>نگاه سریع به روزهای بعد</h2>
          <p>وعده‌های برنامه‌ریزی‌شده و قابل ثبت را یک‌جا ببین.</p>
        </div>
        <span className="round-arrow"><NeoFitIcon name="chevron" /></span>
      </Link>
    </section>
  );
}
