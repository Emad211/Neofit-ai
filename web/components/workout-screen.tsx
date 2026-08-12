import Link from 'next/link';
import { NeoFitIcon } from '@/components/neofit-icons';
import type { WorkoutPlanSnapshot } from '@/lib/supabase/workout-plan-data';

const faNumber = new Intl.NumberFormat('fa-IR');

export function WorkoutScreen({ snapshot }: { snapshot: WorkoutPlanSnapshot }) {
  if (snapshot.mode === 'unavailable') {
    return (
      <section className="page-stack" aria-labelledby="workout-heading">
        <div className="section-heading"><div><p className="section-kicker">تمرین</p><h2 id="workout-heading">برنامه در دسترس نیست</h2></div></div>
        <article className="local-data-card"><div><h3>برنامه تمرینی بارگذاری نشد</h3><p>{snapshot.loadError ?? 'صفحه را تازه کن و دوباره تلاش کن.'}</p></div></article>
      </section>
    );
  }

  if (snapshot.mode === 'guest') {
    return (
      <section className="page-stack" aria-labelledby="workout-heading">
        <div className="section-heading"><div><p className="section-kicker">تمرین</p><h2 id="workout-heading">برنامه شخصی تمرین</h2></div></div>
        <article className="local-data-card">
          <div><h3>برای ساخت برنامه شخصی وارد حساب شو</h3><p>بعد از تکمیل اطلاعاتت، NeoFit برنامه تمرین مناسب شرایطت را آماده می‌کند.</p></div>
        </article>
        <div className="action-row"><Link className="primary-button" href="/auth">ورود یا ساخت حساب</Link></div>
      </section>
    );
  }

  if (snapshot.days.length === 0) {
    return (
      <section className="page-stack" aria-labelledby="workout-heading">
        <div className="section-heading"><div><p className="section-kicker">تمرین</p><h2 id="workout-heading">هنوز برنامه تمرینی نداری</h2></div></div>
        <article className="local-data-card">
          <div><h3>برنامه‌ات را بساز</h3><p>اطلاعاتت را مرور کن و از بخش «برنامه من» برنامه تمرین و تغذیه را آماده کن.</p></div>
        </article>
        <div className="action-row">
          <Link className="primary-button" href="/program">رفتن به برنامه من</Link>
          <Link className="text-button" href="/onboarding/review">ویرایش اطلاعات</Link>
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
        <div><p className="section-kicker">برنامه تمرین</p><h2 id="workout-heading">{snapshot.title ?? 'تمرین‌های من'}</h2></div>
        <span className="status-pill"><NeoFitIcon name="workout" size={15} />{faNumber.format(workoutPlan.length)} جلسه</span>
      </div>

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
