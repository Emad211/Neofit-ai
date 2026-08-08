'use client';

import { useNutritionState } from '@/components/nutrition-state';
import { workoutPlan } from '@/data/workout-fixtures';

const faNumber = new Intl.NumberFormat('fa-IR', { maximumFractionDigits: 1 });
const weightPoints = [95, 94.4, 93.8, 93.3, 92.8, 92.2] as const;
const weekLabels = ['هفته ۱', 'هفته ۲', 'هفته ۳', 'هفته ۴', 'هفته ۵', 'اکنون'] as const;

export function ProgressScreen() {
  const { summary } = useNutritionState();
  const currentWeight = weightPoints.at(-1) ?? 0;
  const change = currentWeight - weightPoints[0];
  const minWeight = Math.min(...weightPoints);
  const maxWeight = Math.max(...weightPoints);
  const range = Math.max(1, maxWeight - minWeight);

  return (
    <section className="page-stack" aria-labelledby="progress-heading">
      <div className="section-heading">
        <div>
          <p className="section-kicker">نمای ساده</p>
          <h2 id="progress-heading">پیشرفت</h2>
        </div>
        <span className="progress-period">۶ هفته</span>
      </div>

      <div className="progress-metrics">
        <article>
          <span>وزن فعلی</span>
          <strong>{faNumber.format(currentWeight)}<small> کیلوگرم</small></strong>
          <p>{faNumber.format(Math.abs(change))} کیلوگرم کاهش</p>
        </article>
        <article>
          <span>تمرین هفتگی</span>
          <strong>{faNumber.format(workoutPlan.length)}<small> جلسه</small></strong>
          <p>برنامهٔ کامل این هفته</p>
        </article>
        <article>
          <span>ثبت غذای امروز</span>
          <strong>{faNumber.format(summary.entryCount)}<small> وعده</small></strong>
          <p>{faNumber.format(summary.macros.calories)} کیلوکالری</p>
        </article>
      </div>

      <article className="progress-chart-card">
        <div className="progress-chart-card__header">
          <div><span>روند وزن</span><h3>کاهش آرام و پیوسته</h3></div>
          <b>{faNumber.format(change)} kg</b>
        </div>
        <div className="weight-bars" aria-label="روند وزن در شش هفته">
          {weightPoints.map((weight, index) => {
            const normalized = (weight - minWeight) / range;
            const height = 38 + normalized * 62;
            return (
              <div className="weight-bar" key={weekLabels[index]}>
                <span className="weight-bar__value">{faNumber.format(weight)}</span>
                <i style={{ blockSize: `${height}%` }} />
                <small>{weekLabels[index]}</small>
              </div>
            );
          })}
        </div>
      </article>

      <article className="consistency-card">
        <div className="consistency-card__copy">
          <span>ثبات این هفته</span>
          <h3>۳ روز تمرین برنامه‌ریزی شده</h3>
          <p>تمرکز فعلی روی انجام منظم جلسات و ثبت روزانهٔ غذاست.</p>
        </div>
        <div className="consistency-days" aria-label="روزهای تمرین هفته">
          {['ش', 'ی', 'د', 'س', 'چ', 'پ', 'ج'].map((day, index) => (
            <span className={[0, 2, 4].includes(index) ? 'is-active' : ''} key={`${day}-${index}`}>{day}</span>
          ))}
        </div>
      </article>

      <p className="progress-demo-note">روند وزن فعلاً دادهٔ نمایشی است؛ ثبت غذای امروز مستقیماً از وضعیت جاری برنامه خوانده می‌شود.</p>
    </section>
  );
}
