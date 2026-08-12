'use client';

import Link from 'next/link';
import { NeoFitIcon } from '@/components/neofit-icons';
import { useNutritionState } from '@/components/nutrition-state';

const faNumber = new Intl.NumberFormat('fa-IR', { maximumFractionDigits: 1 });

type TodayWorkoutDay = {
  readonly id: string;
  readonly day: string;
  readonly title: string;
  readonly focus: string;
  readonly duration: string;
  readonly exercises: readonly unknown[];
};

type TodayWorkoutSnapshot = {
  readonly mode: 'account' | 'guest' | 'unavailable';
  readonly title: string | null;
  readonly days: readonly TodayWorkoutDay[];
  readonly loadError: string | null;
};

function normalizeDay(value: string) {
  return value.replace(/[\u200c\s]/g, '').trim();
}

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

function TodayFocus({ workout, weekday, account }: { workout: TodayWorkoutSnapshot; weekday: string; account: boolean }) {
  if (!account || workout.mode === 'guest') {
    return (
      <article className="today-focus-card today-focus-card--welcome">
        <div className="today-focus-card__copy">
          <span className="today-focus-card__eyebrow">برنامه شخصی</span>
          <h3>تمرین و تغذیه‌ات را یک‌جا داشته باش</h3>
          <p>برای ذخیره دائمی اطلاعات و دریافت برنامه شخصی وارد حساب شو.</p>
        </div>
        <Link className="today-focus-card__action" href="/auth">ورود یا ساخت حساب</Link>
      </article>
    );
  }

  if (workout.mode === 'unavailable') {
    return (
      <article className="today-focus-card today-focus-card--quiet">
        <div className="today-focus-card__copy">
          <span className="today-focus-card__eyebrow">تمرین امروز</span>
          <h3>برنامه تمرین فعلاً در دسترس نیست</h3>
          <p>{workout.loadError ?? 'کمی بعد دوباره صفحه را باز کن.'}</p>
        </div>
        <Link className="today-focus-card__action" href="/workout">بررسی دوباره</Link>
      </article>
    );
  }

  if (workout.days.length === 0) {
    return (
      <article className="today-focus-card">
        <div className="today-focus-card__copy">
          <span className="today-focus-card__eyebrow">گام بعد</span>
          <h3>برنامه شخصی‌ات را بساز</h3>
          <p>بر اساس هدف، زمان، تجهیزات و محدودیت‌هایی که ثبت کرده‌ای.</p>
        </div>
        <Link className="today-focus-card__action" href="/program">ساخت برنامه</Link>
      </article>
    );
  }

  const today = workout.days.find((day) => normalizeDay(day.day) === normalizeDay(weekday));
  if (!today) {
    return (
      <article className="today-focus-card today-focus-card--rest">
        <div className="today-focus-card__copy">
          <span className="today-focus-card__eyebrow">امروز</span>
          <h3>جلسه‌ای برای امروز در برنامه ثبت نشده</h3>
          <p>برنامه کاملت را ببین و زمان جلسه بعدی را خودت انتخاب کن.</p>
        </div>
        <Link className="today-focus-card__action" href="/workout">دیدن برنامه</Link>
      </article>
    );
  }

  return (
    <article className="today-focus-card today-focus-card--workout">
      <div className="today-focus-card__copy">
        <span className="today-focus-card__eyebrow">تمرین امروز · {today.day}</span>
        <h3>{today.title}</h3>
        <p>{today.focus}</p>
        <div className="today-focus-card__meta">
          <span>{today.duration}</span>
          <span>{faNumber.format(today.exercises.length)} حرکت</span>
        </div>
      </div>
      <Link className="today-focus-card__action" href={`/workout/${today.id}`}>باز کردن تمرین</Link>
    </article>
  );
}

export function TodayScreen({ workout }: { workout: TodayWorkoutSnapshot }) {
  const { diary, summary, account } = useNutritionState();
  const now = new Date();
  const dateLabel = new Intl.DateTimeFormat('fa-IR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  }).format(now);
  const weekday = new Intl.DateTimeFormat('fa-IR', { weekday: 'long' }).format(now);
  const target = summary.targets;
  const visibleDiary = diary.slice(0, 3);

  return (
    <section className="page-stack today-page" aria-labelledby="today-heading">
      <div className="today-heading">
        <div><p className="section-kicker">{dateLabel}</p><h2 id="today-heading">امروز</h2></div>
        <Link className="today-coach-link" href="/coach"><NeoFitIcon name="sparkle" size={17} /> از مربی بپرس</Link>
      </div>

      <TodayFocus workout={workout} weekday={weekday} account={Boolean(account)} />

      <div className="today-quick-actions" aria-label="اقدام‌های سریع">
        <Link href="/nutrition"><span><NeoFitIcon name="plus" /></span><strong>ثبت غذا</strong><small>افزودن وعده</small></Link>
        <Link href="/workout"><span><NeoFitIcon name="workout" /></span><strong>تمرین</strong><small>برنامه من</small></Link>
        <Link href="/coach"><span><NeoFitIcon name="sparkle" /></span><strong>مربی</strong><small>پرسیدن سؤال</small></Link>
      </div>

      <article className="today-nutrition-card">
        <header>
          <div><span>تغذیه امروز</span><h3>{summary.targetsConfigured && target ? `${faNumber.format(summary.macros.calories)} از ${faNumber.format(target.calories)} کیلوکالری` : `${faNumber.format(summary.macros.calories)} کیلوکالری ثبت شده`}</h3></div>
          <Link href="/nutrition">جزئیات</Link>
        </header>
        <div className="today-nutrition-card__body">
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
          <div className="macro-panel">
            <MacroBar label="پروتئین" value={summary.macros.proteinG} target={target?.proteinG ?? null} />
            <MacroBar label="کربوهیدرات" value={summary.macros.carbsG} target={target?.carbsG ?? null} />
            <MacroBar label="چربی" value={summary.macros.fatG} target={target?.fatG ?? null} />
          </div>
        </div>
        {!summary.targetsConfigured ? <p className="today-nutrition-card__note">هدف روزانه تنظیم نشده؛ فعلاً فقط مصرف ثبت‌شده نمایش داده می‌شود.</p> : null}
      </article>

      <section className="timeline-section" aria-labelledby="diary-heading">
        <div className="section-heading">
          <div><p className="section-kicker">ثبت‌های امروز</p><h2 id="diary-heading">وعده‌ها</h2></div>
          {diary.length > 0 ? <span className="count-badge">{faNumber.format(summary.entryCount)}</span> : null}
        </div>
        <div className="meal-list">
          {visibleDiary.length ? visibleDiary.map((entry) => (
            <article className="meal-row" key={entry.core.id}>
              <span className="meal-row__dot" aria-hidden="true" />
              <div className="meal-row__copy"><span>{entry.mealLabelFa}</span><h3>{entry.core.label}</h3><p>{entry.portionText}</p></div>
              <strong>{faNumber.format(entry.macros.calories)}<small> kcal</small></strong>
            </article>
          )) : <div className="empty-state empty-state--compact"><span className="empty-state__icon"><NeoFitIcon name="food" size={25} /></span><div><h3>هنوز غذایی برای امروز ثبت نشده</h3><p>اولین وعده‌ات را اضافه کن.</p></div><Link className="secondary-button" href="/nutrition">ثبت غذا</Link></div>}
        </div>
        {diary.length > visibleDiary.length ? <Link className="today-more-link" href="/nutrition">دیدن همه ثبت‌های امروز</Link> : null}
      </section>
    </section>
  );
}
