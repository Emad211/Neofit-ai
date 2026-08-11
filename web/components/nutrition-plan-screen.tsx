import Link from 'next/link';
import { NeoFitIcon } from '@/components/neofit-icons';
import { NutritionPlanLogForm } from '@/components/nutrition-plan-log-form';
import { mealTypeLabelFa } from '@/lib/nutrition-adapter';
import type { NutritionPlanSnapshot } from '@/lib/supabase/nutrition-plan-data';

const faNumber = new Intl.NumberFormat('fa-IR', { maximumFractionDigits: 2 });

function accountMessage(message: string | null, error: string | null): { tone: 'success' | 'error'; text: string } | null {
  if (message === 'meal-logged') {
    return { tone: 'success', text: 'وعده برای امروز ثبت شد. تکرار همان ثبت، دادهٔ تکراری ایجاد نمی‌کند.' };
  }
  if (!error) return null;
  const text = error === 'invalid_date'
    ? 'تاریخ محلی ثبت معتبر نبود. صفحه را تازه کن و دوباره تلاش کن.'
    : error === 'plan_missing'
      ? 'نسخهٔ فعال برنامه دیگر با این درخواست منطبق نیست. صفحه را تازه کن.'
      : error === 'plan_invalid'
        ? 'این برنامه با کاتالوگ نسخه‌دار فعلی قابل ثبت نیست.'
        : error === 'meal_missing'
          ? 'این وعده در نسخهٔ فعال برنامه پیدا نشد.'
          : 'ثبت وعده انجام نشد. دادهٔ ناقص وارد دفترچه نشده است.';
  return { tone: 'error', text };
}

function AccountPlan({ snapshot }: { snapshot: NutritionPlanSnapshot }) {
  if (snapshot.days.length === 0) {
    return (
      <article className="local-data-card">
        <div>
          <span>دادهٔ واقعی حساب</span>
          <h3>هنوز برنامهٔ غذایی فعالی ثبت نشده</h3>
          <p>NeoFit برنامهٔ نمونه را به‌جای برنامهٔ شخصی نمایش نمی‌دهد. وقتی نسخهٔ معتبر و resolve‌شده‌ای از برنامه فعال شود، همین صفحه آن را نشان می‌دهد.</p>
          <div className="action-row">
            <Link className="primary-button" href="/program">ساخت یا فعال‌سازی برنامه</Link>
            <Link className="text-button" href="/onboarding/review">مرور اطلاعات پایه</Link>
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
                <div className="plan-meal-actions">
                  <span><NeoFitIcon name="check" size={14} />کاتالوگ نسخه‌دار</span>
                  {snapshot.planId && snapshot.version ? (
                    <NutritionPlanLogForm
                      planId={snapshot.planId}
                      planVersion={snapshot.version}
                      mealId={meal.id}
                    />
                  ) : null}
                </div>
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
  return (
    <section className="page-stack" aria-labelledby="plan-heading">
      <Link className="back-button" href="/nutrition">
        <NeoFitIcon name="chevron" /> بازگشت به تغذیه
      </Link>
      <div className="section-heading">
        <div>
          <p className="section-kicker">{snapshot.mode === 'guest' ? 'برنامه نمونه مهمان' : 'برنامهٔ فعال حساب'}</p>
          <h2 id="plan-heading">{snapshot.title ?? 'برنامه غذایی'}</h2>
        </div>
        {snapshot.version ? (
          <span className="status-pill status-pill--soft"><NeoFitIcon name="check" size={15} />نسخه {faNumber.format(snapshot.version)}</span>
        ) : null}
      </div>

      {snapshot.mode === 'unavailable' ? (
        <div className="auth-notice auth-notice--error" role="alert">{snapshot.loadError ?? 'برنامه غذایی در دسترس نیست.'}</div>
      ) : null}

      {snapshot.mode === 'account' && feedback ? (
        <div className={`auth-notice ${feedback.tone === 'error' ? 'auth-notice--error' : 'auth-notice--success'}`} role={feedback.tone === 'error' ? 'alert' : 'status'}>
          {feedback.text}
        </div>
      ) : null}

      {snapshot.mode === 'guest' ? (
        <>
          <div className="auth-notice auth-notice--warning" role="status">این فقط Demo مهمان است و برنامهٔ شخصی یا توصیه تغذیه‌ای حساب محسوب نمی‌شود.</div>
          <div className="week-list">
            {snapshot.guestDays.map((day, index) => (
              <article className={index === 0 ? 'day-card is-current' : 'day-card'} key={day.day}>
                <div className="day-card__header">
                  <div><span>روز {faNumber.format(index + 1)}</span><h3>{day.day}</h3></div>
                  <b>{day.title}</b>
                </div>
                <ol>{day.meals.map((meal) => <li key={meal}>{meal}<span>Demo</span></li>)}</ol>
              </article>
            ))}
          </div>
        </>
      ) : snapshot.mode === 'account' ? (
        <>
          <p className="page-intro">برنامهٔ حساب فقط هویت غذای نسخه‌دار و اندازه سهم را نگه می‌دارد. هر عدد تغذیه‌ای هنگام استفاده از برنامه از Nutrition Core محاسبه می‌شود، نه از plan JSON یا مدل زبانی.</p>
          <AccountPlan snapshot={snapshot} />
        </>
      ) : null}
    </section>
  );
}
