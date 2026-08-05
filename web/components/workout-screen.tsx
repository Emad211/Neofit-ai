import Link from 'next/link';
import { NeoFitIcon } from '@/components/neofit-icons';
import { workoutPlan } from '@/data/workout-fixtures';

const faNumber = new Intl.NumberFormat('fa-IR');

export function WorkoutScreen() {
  const exerciseCount = workoutPlan.reduce((sum, workout) => sum + workout.exercises.length, 0);
  const totalMinutes = workoutPlan.reduce((sum, workout) => sum + Number.parseInt(workout.duration, 10), 0);

  return (
    <section className="page-stack" aria-labelledby="workout-heading">
      <div className="section-heading">
        <div>
          <p className="section-kicker">برنامهٔ هفتگی</p>
          <h2 id="workout-heading">تمرین‌های این هفته</h2>
        </div>
        <span className="status-pill"><NeoFitIcon name="workout" size={15} />{faNumber.format(workoutPlan.length)} جلسه</span>
      </div>

      <article className="workout-summary-card">
        <div><span>جلسه</span><strong>{faNumber.format(workoutPlan.length)}</strong></div>
        <div><span>حرکت</span><strong>{faNumber.format(exerciseCount)}</strong></div>
        <div><span>زمان کل</span><strong>{faNumber.format(totalMinutes)}<small> دقیقه</small></strong></div>
      </article>

      <div className="workout-list">
        {workoutPlan.map((workout, index) => (
          <Link className={index === 0 ? 'workout-card is-next' : 'workout-card'} href={`/workout/${workout.id}`} key={workout.id}>
            <div className="workout-card__day">
              <span>{workout.day}</span>
              {index === 0 ? <b>بعدی</b> : null}
            </div>
            <div className="workout-card__body">
              <h3>{workout.title}</h3>
              <p>{workout.focus}</p>
              <div className="workout-card__meta">
                <span>{workout.duration}</span>
                <span>{faNumber.format(workout.exercises.length)} حرکت</span>
                <span>{faNumber.format(workout.calories)} kcal</span>
              </div>
            </div>
            <NeoFitIcon name="chevron" />
          </Link>
        ))}
      </div>
    </section>
  );
}
