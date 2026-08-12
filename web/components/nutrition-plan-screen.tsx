import Link from 'next/link';
import { NeoFitIcon } from '@/components/neofit-icons';
import { NutritionPlanLogForm } from '@/components/nutrition-plan-log-form';
import { mealTypeLabelFa } from '@/lib/nutrition-adapter';
import type { ResolvedNutritionPlanDay } from '@/lib/nutrition-plan-core';
import type { NutritionPlanSnapshot } from '@/lib/supabase/nutrition-plan-data';

const faNumber = new Intl.NumberFormat('fa-IR', { maximumFractionDigits: 2 });

function normalizedDay(value: string) {
  return value.replace(/[\u200c\s]/g, '').trim();
}

function accountMessage(message: string | null, error: string | null): { tone: 'success' | 'error'; text: string } | null {
  if (message === 'meal-logged') return { tone: 'success', text: 'وعده برای امروز ثبت شد.' };
  if (!error) return null;
  const text = error === 'invalid_date'
    ? 'ثبت وعده انجام نشد. صفحه را تازه کن و دوباره تلاش کن.'
    : error === 'plan_missing'
      ? 'برنامه تغییر کرده است. صفحه را تازه کن.'
      : error === 'plan_invalid'
        ? 'این وعده فعلاً قابل ثبت نیست. صفحه را تازه کن.'
        : error === 'meal_missing'
          ? 'این وعده دیگر در برنامه فعلی نیست.'
          : 'ثبت وعده انجام نشد. دوباره تلاش کن.';
  return { tone: 'error', text };
}

function DayMeals({
  day,
  snapshot,
}: {
  day: ResolvedNutritionPlanDay;
  snapshot: NutritionPlanSnapshot;
}) {
  return (
    <ol className="nutrition-plan-meals">
      {day.meals.map((meal) => (
        <li className="nutrition-plan-meal" key={meal.id}>
          <div className="nutrition-plan-meal__copy">
            <span>{mealTypeLabelFa(meal.mealType)}</span>
            <strong>{meal.label}</strong>
            <ul>
              {meal.items.map((item) => (
                <li key={`${meal.id}:${item.foodId}:${item.sourceVersion}`}>
                  <span>{item.nameFa}</span>
                  <small>{faNumber.format(item.portionCount)} × {item.portionLabelFa}</small>
                </li>
              ))}
            </ul>
          </div>
          {snapshot.planId && snapshot.version ? (
            <NutritionPlanLogForm planId={snapshot.planId} planVersion={snapshot.version} mealId={meal.id} />
          ) : null}
        </li>
      ))}
    </ol>
  );
}

function AccountPlan({ snapshot }: { snapshot: NutritionPlanSnapshot }) {
  if (snapshot.days.length === 0) {
    return (
      <article className="screen-empty-card">
        <span className="screen-empty-card__icon"><NeoFitIcon name="food" size={28} /></span>
        <div>
          <h3>هنوز برنامه غذایی فعالی نداری</h3>
          <p>برنامه تمرین و تغذیه‌ات را بساز و بعد از مرور، فعالش کن.</p>
        </div>
        <Link className="primary-button" href="/program">رفتن به برنامه من</Link>
        <Link className="text-button" href="/onboarding/review">ویرایش اطلاعات</Link>
      </article>
    );
  }

  const today = snapshot.localWeekday
    ? snapshot.days.find((day) => normalizedDay(day.day) === normalizedDay(snapshot.localWeekday!)) ?? null
    : null;
  const otherDays = today ? snapshot.days.filter((day) => day.id !== today.id) : snapshot.days;

  return (
    <div className="nutrition-plan-flow">
      {today ? (
        <section className="nutrition-plan-today" aria-labelledby="nutrition-plan-today-heading">
          <header>
            <div><span>امروز · {today.day}</span><h3 id="nutrition-plan-today-heading">{today.title}</h3></div>
            <b>{faNumber.format(today.meals.length)} وعده</b>
          </header>
          <DayMeals day={today} snapshot={snapshot} />
        </section>
      ) : null}

      <section className="nutrition-plan-week" aria-labelledby="nutrition-plan-week-heading">
        <div className="section-heading section-heading--compact">
          <div><p className="section-kicker">هفته</p><h2 id="nutrition-plan-week-heading">روزهای دیگر</h2></div>
        </div>
        <div className="nutrition-plan-day-list">
          {otherDays.map((day) => (
            <details className="nutrition-plan-day" key={day.id}>
              <summary>
                <span><strong>{day.day}</strong><small>{day.title}</small></span>
                <span>{faNumber.format(day.meals.length)} وعده <NeoFitIcon name="chevron" size={17} /></span>
              </summary>
              <DayMeals day={day} snapshot={snapshot} />
            </details>
          ))}
        </div>
      </section>
    </div>
  );
}

export function NutritionPlanScreen({
  snapshot,
  message = null,
  error = null,
}: {
  snapshot: NutritionPlanSnapshot;
  message?: string | null;
  error?: string | null;
}) {
  const feedback = accountMessage(message, error);

  if (snapshot.mode === 'guest') {
    return (
      <section className="page-stack nutrition-plan-page" aria-labelledby="plan-heading">
        <Link className="back-button" href="/nutrition"><NeoFitIcon name="chevron" /> تغذیه</Link>
        <div className="section-heading"><div><p className="section-kicker">برنامه غذایی</p><h2 id="plan-heading">برنامه شخصی تو</h2></div></div>
        <article className="screen-empty-card">
          <span className="screen-empty-card__icon"><NeoFitIcon name="food" size={28} /></span>
          <div><h3>برای ساخت برنامه شخصی وارد حساب شو</h3><p>بعد از تکمیل اطلاعاتت، برنامه غذایی متناسب با انتخاب‌ها و شرایطت آماده می‌شود.</p></div>
          <Link className="primary-button" href="/auth">ورود یا ساخت حساب</Link>
        </article>
      </section>
    );
  }

  return (
    <section className="page-stack nutrition-plan-page" aria-labelledby="plan-heading">
      <Link className="back-button" href="/nutrition"><NeoFitIcon name="chevron" /> تغذیه</Link>
      <div className="section-heading nutrition-plan-page__heading">
        <div><p className="section-kicker">برنامه غذایی</p><h2 id="plan-heading">{snapshot.title ?? 'برنامه غذایی من'}</h2><p className="page-intro">برنامه امروز را ببین؛ روزهای دیگر فقط وقتی لازم باشد باز می‌شوند.</p></div>
        <Link className="text-button" href="/program">برنامه من</Link>
      </div>

      {snapshot.mode === 'unavailable' ? (
        <div className="auth-notice auth-notice--error" role="alert">{snapshot.loadError ?? 'برنامه غذایی در دسترس نیست.'}</div>
      ) : null}

      {snapshot.mode === 'account' && feedback ? (
        <div className={`auth-notice ${feedback.tone === 'error' ? 'auth-notice--error' : 'auth-notice--success'}`} role={feedback.tone === 'error' ? 'alert' : 'status'}>
          {feedback.text}
        </div>
      ) : null}

      {snapshot.mode === 'account' ? <AccountPlan snapshot={snapshot} /> : null}
    </section>
  );
}
