import Link from 'next/link';
import { NeoFitIcon } from '@/components/neofit-icons';
import type { WorkoutPlanSnapshot } from '@/lib/supabase/workout-plan-data';

const faNumber = new Intl.NumberFormat('fa-IR');

function WorkoutEmpty({
  title,
  text,
  actionHref,
  actionLabel,
  secondaryHref,
  secondaryLabel,
}: {
  title: string;
  text: string;
  actionHref?: string;
  actionLabel?: string;
  secondaryHref?: string;
  secondaryLabel?: string;
}) {
  return (
    <article className="screen-empty-card">
      <span className="screen-empty-card__icon"><NeoFitIcon name="workout" size={28} /></span>
      <div><h3>{title}</h3><p>{text}</p></div>
      {actionHref && actionLabel ? <Link className="primary-button" href={actionHref}>{actionLabel}</Link> : null}
      {secondaryHref && secondaryLabel ? <Link className="text-button" href={secondaryHref}>{secondaryLabel}</Link> : null}
    </article>
  );
}

export function WorkoutScreen({ snapshot }: { snapshot: WorkoutPlanSnapshot }) {
  if (snapshot.mode === 'unavailable') {
    return (
      <section className="page-stack workout-page" aria-labelledby="workout-heading">
        <div className="section-heading"><div><p className="section-kicker">تمرین</p><h2 id="workout-heading">برنامه تمرین</h2></div></div>
        <WorkoutEmpty title="برنامه تمرینی بارگذاری نشد" text={snapshot.loadError ?? 'صفحه را تازه کن و دوباره تلاش کن.'} />
      </section>
    );
  }

  if (snapshot.mode === 'guest') {
    return (
      <section className="page-stack workout-page" aria-labelledby="workout-heading">
        <div className="section-heading"><div><p className="section-kicker">تمرین</p><h2 id="workout-heading">برنامه شخصی تمرین</h2></div></div>
        <WorkoutEmpty
          title="برای ساخت برنامه شخصی وارد حساب شو"
          text="بعد از تکمیل اطلاعاتت، NeoFit برنامه تمرین مناسب شرایطت را آماده می‌کند."
          actionHref="/auth"
          actionLabel="ورود یا ساخت حساب"
        />
      </section>
    );
  }

  if (snapshot.days.length === 0) {
    return (
      <section className="page-stack workout-page" aria-labelledby="workout-heading">
        <div className="section-heading"><div><p className="section-kicker">تمرین</p><h2 id="workout-heading">برنامه تمرین</h2></div></div>
        <WorkoutEmpty
          title="هنوز برنامه تمرینی نداری"
          text="اطلاعاتت را مرور کن و برنامه تمرین و تغذیه‌ات را بساز."
          actionHref="/program"
          actionLabel="رفتن به برنامه من"
          secondaryHref="/onboarding/review"
          secondaryLabel="ویرایش اطلاعات"
        />
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
    <section className="page-stack workout-page" aria-labelledby="workout-heading">
      <div className="section-heading workout-page__heading">
        <div><p className="section-kicker">برنامه تمرین</p><h2 id="workout-heading">{snapshot.title ?? 'تمرین‌های من'}</h2></div>
        <Link className="text-button" href="/program">برنامه من</Link>
      </div>

      <article className="workout-overview">
        <div className="workout-overview__copy">
          <span>برنامه فعال</span>
          <h3>{faNumber.format(workoutPlan.length)} جلسه برای دوره فعلی</h3>
          <p>جلسه‌ای را که می‌خواهی انجام بدهی باز کن؛ جزئیات حرکت‌ها داخل هر جلسه است.</p>
        </div>
        <div className="workout-overview__stats" aria-label="خلاصه برنامه تمرین">
          <div><strong>{faNumber.format(workoutPlan.length)}</strong><span>جلسه</span></div>
          <div><strong>{faNumber.format(exerciseCount)}</strong><span>حرکت</span></div>
          <div><strong>{faNumber.format(totalSets)}</strong><span>ست</span></div>
        </div>
      </article>

      <section className="workout-sessions" aria-labelledby="workout-sessions-heading">
        <div className="section-heading section-heading--compact">
          <div><p className="section-kicker">جلسه‌ها</p><h2 id="workout-sessions-heading">برنامه هفتگی</h2></div>
        </div>
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
              <span className="workout-card__open"><span>باز کردن</span><NeoFitIcon name="chevron" size={18} /></span>
            </Link>
          ))}
        </div>
      </section>
    </section>
  );
}
