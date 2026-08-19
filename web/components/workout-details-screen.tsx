import Link from 'next/link';
import { NeoFitIcon } from '@/components/neofit-icons';
import type { WorkoutDay } from '@/data/workout-fixtures';

const faNumber = new Intl.NumberFormat('fa-IR');

export function WorkoutDetailsScreen({ workout }: { workout: WorkoutDay }) {
  const totalSets = workout.exercises.reduce((sum, exercise) => sum + exercise.sets, 0);

  return (
    <section className="page-stack workout-details-page" aria-labelledby="workout-details-heading">
      <Link className="back-button" href="/workout">
        <NeoFitIcon name="chevron" /> تمرین‌ها
      </Link>

      <article className="workout-detail-hero">
        <div className="workout-detail-hero__top">
          <span>{workout.day}</span>
          <span>{workout.duration}</span>
        </div>
        <h2 id="workout-details-heading">{workout.title}</h2>
        <p>{workout.focus}</p>
        <div className="workout-detail-hero__stats">
          <div><strong>{faNumber.format(workout.exercises.length)}</strong><span>حرکت</span></div>
          <div><strong>{faNumber.format(totalSets)}</strong><span>ست</span></div>
          <div><strong>{workout.duration}</strong><span>زمان</span></div>
        </div>
        <Link className="workout-detail-start" href={`/workout-player/${workout.id}`}>
          شروع تمرین
        </Link>
      </article>

      <section className="workout-exercise-section" aria-labelledby="workout-exercises-heading">
        <div className="section-heading">
          <div>
            <p className="section-kicker">جلسه</p>
            <h2 id="workout-exercises-heading">حرکت‌ها</h2>
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
              <span className="exercise-row__rest"><small>استراحت</small><b>{exercise.rest}</b></span>
            </li>
          ))}
        </ol>
      </section>

      <p className="workout-safety-note">
        <NeoFitIcon name="check" size={17} />
        قبل از شروع گرم‌کردن انجام بده و حرکتی که درد ایجاد می‌کند متوقف کن.
      </p>
    </section>
  );
}
