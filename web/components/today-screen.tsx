'use client';

import Link from 'next/link';
import { NeoFitIcon } from '@/components/neofit-icons';
import { useNutritionState } from '@/components/nutrition-state';

const faNumber = new Intl.NumberFormat('fa-IR', { maximumFractionDigits: 1 });

function MacroBar({ label, value, target }: { label: string; value: number; target: number | null }) {
  const ratio = target !== null && target > 0 ? Math.min(1, value / target) : 0;
  return (
    <div className="macro-row">
      <div className="macro-row__copy">
        <span>{label}</span>
        {target === null
          ? <b><span dir="ltr">{faNumber.format(value)}</span> گرم</b>
          : <b><span dir="ltr">{faNumber.format(value)} / {faNumber.format(target)}</span> گرم</b>}
      </div>
      <div className="macro-row__track" aria-label={target === null ? `${label}: ${value} گرم` : `${label}: ${value} از ${target}`}>
        <span style={{ inlineSize: `${ratio * 100}%` }} />
      </div>
    </div>
  );
}

export function TodayScreen() {
  const { diary, summary, account } = useNutritionState();
  const dateLabel = new Intl.DateTimeFormat('fa-IR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  }).format(new Date());
  const target = summary.targets;

  return (
    <section className="page-stack" aria-labelledby="today-heading">
      <div className="section-heading section-heading--compact">
        <div><p className="section-kicker">{dateLabel}</p><h2 id="today-heading">خلاصهٔ امروز</h2></div>
        <Link className="text-button" href="/progress">جزئیات</Link>
      </div>

      <article className={summary.targetsConfigured ? 'hero-card' : 'hero-card hero-card--unconfigured'}>
        <div
          className="calorie-ring"
          style={{ '--progress': `${(summary.calorieProgressPercent ?? 0) * 3.6}deg` } as React.CSSProperties}
          aria-label={summary.targetsConfigured ? `${summary.calorieProgressPercent} درصد هدف کالری` : 'هدف روزانه هنوز تنظیم نشده است'}
        >
          <div className="calorie-ring__inner">
            <strong>{summary.remainingCalories === null ? '—' : faNumber.format(summary.remainingCalories)}</strong>
            <span>{summary.remainingCalories === null ? 'هدف' : 'باقی‌مانده'}</span>
          </div>
        </div>
        <div className="hero-card__copy">
          <span className="status-pill"><NeoFitIcon name={summary.targetsConfigured ? 'check' : 'profile'} size={15} />{summary.targetsConfigured ? 'هدف روزانه' : 'هدف روزانه تنظیم نشده'}</span>
          <h3>{summary.targetsConfigured && target ? `${faNumber.format(summary.macros.calories)} از ${faNumber.format(target.calories)} کیلوکالری` : `${faNumber.format(summary.macros.calories)} کیلوکالری ثبت شده`}</h3>
          <p>{summary.targetsConfigured
            ? 'مصرف امروزت با هدف روزانه مقایسه می‌شود.'
            : account
              ? 'فعلاً مصرف ثبت‌شده‌ات را می‌بینی. وقتی هدف روزانه برای حسابت تنظیم شود، مقایسه هم اینجا نمایش داده می‌شود.'
              : 'برای ذخیره دائمی اطلاعات و دریافت برنامه شخصی وارد حساب شو.'}</p>
        </div>
      </article>

      <div className="macro-panel">
        <MacroBar label="پروتئین" value={summary.macros.proteinG} target={target?.proteinG ?? null} />
        <MacroBar label="کربوهیدرات" value={summary.macros.carbsG} target={target?.carbsG ?? null} />
        <MacroBar label="چربی" value={summary.macros.fatG} target={target?.fatG ?? null} />
      </div>

      <Link className="primary-action" href="/nutrition">
        <span className="primary-action__icon"><NeoFitIcon name="plus" /></span>
        <span><b>ثبت غذا</b><small>غذا یا وعده‌ات را اضافه کن</small></span>
        <NeoFitIcon name="chevron" />
      </Link>

      <section className="timeline-section" aria-labelledby="diary-heading">
        <div className="section-heading">
          <div><p className="section-kicker">امروز</p><h2 id="diary-heading">وعده‌های ثبت‌شده</h2></div>
          <span className="count-badge">{faNumber.format(summary.entryCount)}</span>
        </div>
        <div className="meal-list">
          {diary.length ? diary.map((entry) => (
            <article className="meal-row" key={entry.core.id}>
              <span className="meal-row__dot" aria-hidden="true" />
              <div className="meal-row__copy"><span>{entry.mealLabelFa}</span><h3>{entry.core.label}</h3><p>{entry.portionText}</p></div>
              <strong>{faNumber.format(entry.macros.calories)}<small> kcal</small></strong>
            </article>
          )) : <div className="empty-state"><span className="empty-state__icon"><NeoFitIcon name="food" size={28} /></span><h3>هنوز غذایی برای امروز ثبت نشده</h3><p>اولین وعده‌ات را از بخش تغذیه اضافه کن.</p></div>}
        </div>
      </section>

      <Link className="plan-preview" href="/nutrition/plan">
        <div>
          <span className="section-kicker">برنامهٔ غذایی</span>
          <h2>برنامه‌ات را ببین</h2>
          <p>{account
            ? 'وعده‌های پیشنهادی برنامه غذایی فعال را ببین و در صورت نیاز برای امروز ثبت کن.'
            : 'برای دریافت برنامه غذایی شخصی وارد حساب شو.'}</p>
        </div>
        <span className="round-arrow"><NeoFitIcon name="chevron" /></span>
      </Link>
    </section>
  );
}
