import Link from 'next/link';
import { NeoFitIcon } from '@/components/neofit-icons';
import { weeklyPlan } from '@/data/fixtures';

const faNumber = new Intl.NumberFormat('fa-IR');

export function NutritionPlanScreen() {
  return (
    <section className="page-stack" aria-labelledby="plan-heading">
      <Link className="back-button" href="/nutrition">
        <NeoFitIcon name="chevron" /> بازگشت به تغذیه
      </Link>
      <div className="section-heading">
        <div>
          <p className="section-kicker">برنامهٔ قابل ثبت</p>
          <h2 id="plan-heading">برنامهٔ سه روز آینده</h2>
        </div>
        <span className="status-pill status-pill--soft"><NeoFitIcon name="check" size={15} />آماده</span>
      </div>
      <p className="page-intro">مواد این برنامه به رکوردهای کاتالوگ متصل‌اند و عدد تغذیه‌ای از مدل زبانی گرفته نمی‌شود.</p>
      <div className="week-list">
        {weeklyPlan.map((day, index) => (
          <article className={index === 0 ? 'day-card is-current' : 'day-card'} key={day.day}>
            <div className="day-card__header">
              <div><span>روز {faNumber.format(index + 1)}</span><h3>{day.day}</h3></div>
              <b>{day.title}</b>
            </div>
            <ol>
              {day.meals.map((meal) => (
                <li key={meal}>{meal}<span><NeoFitIcon name="check" size={14} />کاتالوگ</span></li>
              ))}
            </ol>
          </article>
        ))}
      </div>
    </section>
  );
}
