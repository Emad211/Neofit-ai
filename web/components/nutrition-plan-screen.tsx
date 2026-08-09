import Link from 'next/link';
import { NeoFitIcon } from '@/components/neofit-icons';
import { mealTypeLabelFa } from '@/lib/nutrition-adapter';
import type { NutritionPlanSnapshot } from '@/lib/supabase/nutrition-plan-data';

const faNumber = new Intl.NumberFormat('fa-IR', { maximumFractionDigits: 2 });

function AccountPlan({ snapshot }: { snapshot: NutritionPlanSnapshot }) {
  if (snapshot.days.length === 0) {
    return (
      <article className="local-data-card">
        <div>
          <span>دادهٔ واقعی حساب</span>
          <h3>هنوز برنامهٔ غذایی فعالی ثبت نشده</h3>
          <p>NeoFit برنامهٔ نمونه را به‌جای برنامهٔ شخصی نمایش نمی‌دهد. وقتی نسخهٔ معتبر و resolve‌شده‌ای از برنامه فعال شود، همین صفحه آن را نشان می‌دهد.</p>
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
                <span><NeoFitIcon name="check" size={14} />کاتالوگ نسخه‌دار</span>
              </li>
            ))}
          </ol>
        </article>
      ))}
    </div>
  );
}

export function NutritionPlanScreen({ snapshot }: { snapshot: NutritionPlanSnapshot }) {
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
          <p className="page-intro">برنامهٔ حساب فقط هویت غذای نسخه‌دار و اندازه سهم را نگه می‌دارد. هر عدد تغذیه‌ای هنگام استفاده از برنامه باید از Nutrition Core محاسبه شود، نه از plan JSON یا مدل زبانی.</p>
          <AccountPlan snapshot={snapshot} />
        </>
      ) : null}
    </section>
  );
}
