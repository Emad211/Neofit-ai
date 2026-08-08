import Link from 'next/link';
import { NeoFitIcon } from '@/components/neofit-icons';
import type { WorkoutDay } from '@/data/workout-fixtures';

const faNumber = new Intl.NumberFormat('fa-IR');

export function WorkoutDetailsScreen({ workout }: { workout: WorkoutDay }) {
  const totalSets = workout.exercises.reduce((sum, exercise) => sum + exercise.sets, 0);

  return (
    <section className="page-stack" aria-labelledby="workout-details-heading">
      <Link className="back-button" href="/workout">
        <NeoFitIcon name="chevron" /> بازگشت به تمرین‌ها
      </Link>

      <article className="workout-detail-hero">
        <div className="workout-detail-hero__top">
          <span className="status-pill"><NeoFitIcon name="workout" size={15} />{workout.day}</span>
          <span>{workout.duration}</span>
        </div>
        <h2 id="workout-details-heading">{workout.title}</h2>
        <p>{workout.focus}</p>
        <div className="workout-detail-hero__stats">
          <div><strong>{faNumber.format(workout.exercises.length)}</strong><span>حرکت</span></div>
          <div><strong>{faNumber.format(totalSets)}</strong><span>ست</span></div>
          <div><strong>{faNumber.format(workout.calories)}</strong><span>kcal</span></div>
        </div>
      </article>

      <div className="section-heading">
        <div>
          <p className="section-kicker">ترتیب جلسه</p>
          <h2>حرکت‌ها</h2>
        </div>
      </div>

      <ol className="exercise-list">
        {workout.exercises.map((exercise, index) => (
          <li className="exercise-row" key={exercise.id}>
            <span className="exercise-row__index">{faNumber.format(index + 1)}</span>
            <div>
              <h3>{exercise.name}</h3>
              <p>{faNumber.format(exercise.sets)} ست × {exercise.reps} تکرار</p>
            </div>
            <span className="exercise-row__rest">استراحت<br /><b>{exercise.rest}</b></span>
          </li>
        ))}
      </ol>

      <div className="workout-safety-note">
        <NeoFitIcon name="check" size={18} />
        <p>قبل از شروع گرم‌کردن انجام بده و حرکتی که درد ایجاد می‌کند متوقف کن.</p>
      </div>

      <Link className="primary-button" href={`/workout-player/${workout.id}`}>
        شروع یا ادامهٔ Player
      </Link>
    </section>
  );
}
