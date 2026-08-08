export interface WorkoutExercise {
  readonly id: string;
  readonly name: string;
  readonly sets: number;
  readonly reps: string;
  readonly rest: string;
}

export interface WorkoutDay {
  readonly id: string;
  readonly day: string;
  readonly title: string;
  readonly focus: string;
  readonly duration: string;
  readonly calories: number;
  readonly exercises: readonly WorkoutExercise[];
}

export const workoutPlan: readonly WorkoutDay[] = [
  {
    id: 'push-a',
    day: 'شنبه',
    title: 'فشار بالاتنه',
    focus: 'سینه، سرشانه و پشت بازو',
    duration: '۶۰ دقیقه',
    calories: 390,
    exercises: [
      { id: 'bench-press', name: 'پرس سینه هالتر', sets: 4, reps: '۸–۱۰', rest: '۹۰ ثانیه' },
      { id: 'incline-db-press', name: 'پرس بالا سینه دمبل', sets: 3, reps: '۱۰–۱۲', rest: '۷۵ ثانیه' },
      { id: 'shoulder-press', name: 'پرس سرشانه دمبل', sets: 3, reps: '۸–۱۰', rest: '۷۵ ثانیه' },
      { id: 'triceps-pushdown', name: 'پشت بازو سیم‌کش', sets: 3, reps: '۱۲–۱۵', rest: '۶۰ ثانیه' },
    ],
  },
  {
    id: 'pull-a',
    day: 'دوشنبه',
    title: 'کشش بالاتنه',
    focus: 'پشت و جلو بازو',
    duration: '۶۰ دقیقه',
    calories: 370,
    exercises: [
      { id: 'lat-pulldown', name: 'لت سیم‌کش', sets: 4, reps: '۸–۱۲', rest: '۹۰ ثانیه' },
      { id: 'row', name: 'قایقی سیم‌کش', sets: 3, reps: '۱۰–۱۲', rest: '۷۵ ثانیه' },
      { id: 'rear-delt', name: 'نشر خم', sets: 3, reps: '۱۲–۱۵', rest: '۶۰ ثانیه' },
      { id: 'curl', name: 'جلو بازو دمبل', sets: 3, reps: '۱۰–۱۲', rest: '۶۰ ثانیه' },
    ],
  },
  {
    id: 'legs-a',
    day: 'چهارشنبه',
    title: 'پایین‌تنه',
    focus: 'چهارسر، همسترینگ و باسن',
    duration: '۷۰ دقیقه',
    calories: 460,
    exercises: [
      { id: 'squat', name: 'اسکوات', sets: 4, reps: '۶–۸', rest: '۱۲۰ ثانیه' },
      { id: 'rdl', name: 'ددلیفت رومانیایی', sets: 3, reps: '۸–۱۰', rest: '۹۰ ثانیه' },
      { id: 'leg-press', name: 'پرس پا', sets: 3, reps: '۱۰–۱۲', rest: '۹۰ ثانیه' },
      { id: 'calf-raise', name: 'ساق پا ایستاده', sets: 4, reps: '۱۲–۱۵', rest: '۶۰ ثانیه' },
    ],
  },
];

export function findWorkout(id: string): WorkoutDay | undefined {
  return workoutPlan.find((workout) => workout.id === id);
}
