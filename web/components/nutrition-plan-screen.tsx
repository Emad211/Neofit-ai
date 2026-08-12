import Link from 'next/link';
import { NeoFitIcon } from '@/components/neofit-icons';
import { NutritionPlanLogForm } from '@/components/nutrition-plan-log-form';
import { mealTypeLabelFa } from '@/lib/nutrition-adapter';
import type { NutritionPlanSnapshot } from '@/lib/supabase/nutrition-plan-data';

const faNumber = new Intl.NumberFormat('fa-IR', { maximumFractionDigits: 2 });

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

function AccountPlan({ snapshot }: { snapshot: NutritionPlanSnapshot }) {
  if (snapshot.days.length === 0) {
    return (
      <article className="local-data-card">
        <div>
          <h3>هنوز برنامه غذایی فعالی نداری</h3>
          <p>از بخش «برنامه من» برنامه تمرین و تغذیه‌ات را بساز و فعال کن.</p>
          <div className="action-row">
            <Link className="primary-button" href="/program">رفتن به برنامه من</Link>
            <Link className="text-button" href="/onboarding/review">ویرایش اطلاعات</Link>
          </div>
        </div>
      </article>
    );
  }

  return (
    <div className="week-list">
      {snapshot.days.map((day, index) => (
        <article className={index === 0 ? 'day-card is-current' : 'day-card'} key={day.id}>
          <div className="day-card__header">
            <div><span>روز {faNumber.format(index + 1)}</span><h3>{day.day}</h3></div>
            <b>{day.title}</b>
          </div>
          <ol>
            {day.meals.map((meal) => (
              <li key={meal.id}>
                <div>
                  <strong>{meal.label}</strong>
                  <small>{mealTypeLabelFa(meal.mealType)}</small>
                  <ul>
                    {meal.items.map((item) => (
                      <li key={`${meal.id}:${item.foodId}:${item.sourceVersion}`}>
                        {item.nameFa} · {faNumber.format(item.portionCount)} × {item.portionLabelFa}
                      </li>
                    ))}
                  </ul>
                </div>
                {snapshot.planId && snapshot.version ? (
                  <div className="plan-meal-actions">
                    <NutritionPlanLogForm planId={snapshot.planId} planVersion={snapshot.version} mealId={meal.id} />
                  </div>
                ) : null}
              </li>
            ))}
          </ol>
        </article>
      ))}
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
      <section className="page-stack" aria-labelledby="plan-heading">
        <Link className="back-button" href="/nutrition"><NeoFitIcon name="chevron" /> بازگشت به تغذیه</Link>
        <div className="section-heading"><div><p className="section-kicker">برنامه غذایی</p><h2 id="plan-heading">برنامه شخصی تو</h2></div></div>
        <article className="local-data-card"><div><h3>برای ساخت برنامه شخصی وارد حساب شو</h3><p>بعد از تکمیل اطلاعاتت، NeoFit برنامه غذایی متناسب با انتخاب‌ها و شرایطت را آماده می‌کند.</p></div></article>
        <div className="action-row"><Link className="primary-button" href="/auth">ورود یا ساخت حساب</Link></div>
      </section>
    );
  }

  return (
    <section className="page-stack" aria-labelledby="plan-heading">
      <Link className="back-button" href="/nutrition"><NeoFitIcon name="chevron" /> بازگشت به تغذیه</Link>
      <div className="section-heading">
        <div><p className="section-kicker">برنامه غذایی</p><h2 id="plan-heading">{snapshot.title ?? 'برنامه غذایی من'}</h2></div>
      </div>

      {snapshot.mode === 'unavailable' ? (
        <div className="auth-notice auth-notice--error" role="alert">{snapshot.loadError ?? 'برنامه غذایی در دسترس نیست.'}</div>
      ) : null}

      {snapshot.mode === 'account' && feedback ? (
        <div className={`auth-notice ${feedback.tone === 'error' ? 'auth-notice--error' : 'auth-notice--success'}`} role={feedback.tone === 'error' ? 'alert' : 'status'}>
          {feedback.text}
        </div>
      ) : null}

      {snapshot.mode === 'account' ? (
        <>
          <p className="page-intro">برنامه هفتگی‌ات را ببین و در صورت نیاز وعده‌های همان روز را مستقیم ثبت کن.</p>
          <AccountPlan snapshot={snapshot} />
        </>
      ) : null}
    </section>
  );
}
