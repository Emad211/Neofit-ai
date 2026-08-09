import Link from 'next/link';
import { NeoFitIcon } from '@/components/neofit-icons';
import type { WorkoutPlanSnapshot } from '@/lib/supabase/workout-plan-data';

const faNumber = new Intl.NumberFormat('fa-IR');

export function WorkoutScreen({ snapshot }: { snapshot: WorkoutPlanSnapshot }) {
  if (snapshot.mode === 'unavailable') {
    return (
      <section className="page-stack" aria-labelledby="workout-heading">
        <div className="section-heading"><div><p className="section-kicker">برنامه تمرینی</p><h2 id="workout-heading">برنامه در دسترس نیست</h2></div></div>
        <article className="local-data-card"><div><span>خطای اتصال</span><h3>برنامه تمرینی خوانده نشد</h3><p>{snapshot.loadError ?? 'دوباره تلاش کن.'}</p></div></article>
      </section>
    );
  }

  if (snapshot.mode === 'account' && snapshot.days.length === 0) {
    return (
      <section className="page-stack" aria-labelledby="workout-heading">
        <div className="section-heading"><div><p className="section-kicker">برنامهٔ حساب</p><h2 id="workout-heading">هنوز برنامهٔ فعالی ثبت نشده</h2></div></div>
        <article className="local-data-card">
          <div>
            <span>دادهٔ واقعی حساب</span>
            <h3>NeoFit برنامهٔ نمونه را به‌جای برنامهٔ شخصی نمایش نمی‌دهد</h3>
            <p>وقتی یک نسخهٔ معتبر از برنامه برای حساب فعال شود، جلسه‌ها و Player از همان نسخه استفاده می‌کنند.</p>
          </div>
        </article>
        <div className="action-row">
          <Link className="primary-button" href="/onboarding">تکمیل اطلاعات پایه</Link>
          <Link className="text-button" href="/profile">بازگشت به پروفایل</Link>
        </div>
      </section>
    );
  }

  const workoutPlan = snapshot.days;
  const exerciseCount = workoutPlan.reduce((sum, workout) => sum + workout.exercises.length, 0);
  const totalSets = workoutPlan.reduce(
    (sum, workout) => sum + workout.exercises.reduce((daySum, exercise) => daySum + exercise.sets, 0),
    0,
  );

  return (
    <section className="page-stack" aria-labelledby="workout-heading">
      <div className="section-heading">
        <div>
          <p className="section-kicker">{snapshot.mode === 'guest' ? 'برنامه نمونه مهمان' : 'برنامهٔ فعال حساب'}</p>
          <h2 id="workout-heading">{snapshot.title ?? 'تمرین‌های برنامه'}</h2>
        </div>
        <span className="status-pill">
          <NeoFitIcon name="workout" size={15} />
          {snapshot.version ? `نسخه ${faNumber.format(snapshot.version)}` : `${faNumber.format(workoutPlan.length)} جلسه`}
        </span>
      </div>

      {snapshot.mode === 'guest' ? (
        <div className="auth-notice auth-notice--warning" role="status">این برنامه فقط Demo مهمان است و برنامهٔ شخصی یا تجویز‌شده محسوب نمی‌شود.</div>
      ) : null}

      {snapshot.mode === 'account' ? (
        <div className="auth-notice" role="status">ترتیب زیر ترتیب نسخهٔ فعال برنامه است. NeoFit تا وقتی schedule/history جداگانه نداشته باشد، جلسه‌ای را به‌عنوان «بعدی» حدس نمی‌زند.</div>
      ) : null}

      <article className="workout-summary-card">
        <div><span>جلسه</span><strong>{faNumber.format(workoutPlan.length)}</strong></div>
        <div><span>حرکت</span><strong>{faNumber.format(exerciseCount)}</strong></div>
        <div><span>ست کل</span><strong>{faNumber.format(totalSets)}</strong></div>
      </article>

      <div className="workout-list">
        {workoutPlan.map((workout) => (
          <Link className="workout-card" href={`/workout/${workout.id}`} key={workout.id}>
            <div className="workout-card__day"><span>{workout.day}</span></div>
            <div className="workout-card__body">
              <h3>{workout.title}</h3>
              <p>{workout.focus}</p>
              <div className="workout-card__meta">
                <span>{workout.duration}</span>
                <span>{faNumber.format(workout.exercises.length)} حرکت</span>
                <span>{faNumber.format(workout.exercises.reduce((sum, exercise) => sum + exercise.sets, 0))} ست</span>
              </div>
            </div>
            <NeoFitIcon name="chevron" />
          </Link>
        ))}
      </div>
    </section>
  );
}
