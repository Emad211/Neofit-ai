export const COACH_CONTEXT_DOMAINS = ['profile', 'safety', 'nutrition', 'workout', 'progress'] as const;
export type CoachContextDomain = (typeof COACH_CONTEXT_DOMAINS)[number];

const NUTRITION = /(غذا|تغذیه|وعده|کالری|پروتئین|کربوهیدرات|چربی|رژیم|آب|meal|food|nutrition|diet|calorie|macro|protein|carb|fat)/i;
const WORKOUT = /(تمرین|حرکت|ست|تکرار|وزنه|باشگاه|قدرت|عضله|هوازی|رکورد|workout|exercise|training|gym|set|reps?|weight|strength|cardio|record)/i;
const SAFETY = /(درد|آسیب|محدودیت|پزشک|دارو|فشار خون|دیابت|قلب|injury|pain|medical|doctor|medication|cardiac|diabetes|blood pressure)/i;
const BODY_PROGRESS = /(وزن بدن|وزنم|دور کمر|چربی بدن|درصد چربی|اندازه.?گیری|ترکیب بدنی|body weight|waist|body fat|measurement|body composition)/i;
const GENERAL_PROGRESS = /(پیشرفت|روند|progress|trend)/i;

export function routeCoachDomains(message: string): CoachContextDomain[] {
  const domains = new Set<CoachContextDomain>(['profile']);
  if (NUTRITION.test(message)) { domains.add('nutrition'); domains.add('safety'); }
  if (WORKOUT.test(message)) { domains.add('workout'); domains.add('safety'); }
  if (SAFETY.test(message)) domains.add('safety');
  if (BODY_PROGRESS.test(message)) domains.add('progress');
  if (GENERAL_PROGRESS.test(message)) domains.add('progress');
  return COACH_CONTEXT_DOMAINS.filter((domain) => domains.has(domain));
}
