export const COACH_CONTEXT_DOMAINS = ['profile', 'safety', 'nutrition', 'workout', 'progress'] as const;
export type CoachContextDomain = (typeof COACH_CONTEXT_DOMAINS)[number];

const NUTRITION = /(غذا|تغذیه|وعده|کالری|پروتئین|کربوهیدرات|چربی|رژیم|آب|meal|food|nutrition|diet|calorie|macro|protein|carb|fat)/i;
const WORKOUT = /(تمرین|حرکت|ست|تکرار|وزنه|باشگاه|قدرت|عضله|هوازی|رکورد|ریکاوری|workout|exercise|training|gym|set|reps?|weight|strength|cardio|record|recovery)/i;
const SAFETY = /(درد|آسیب|محدودیت|پزشک|دارو|حساسیت|آلرژی|فشار خون|دیابت|قلب|injury|pain|medical|doctor|medication|allerg|cardiac|diabetes|blood pressure)/i;
const BODY_PROGRESS = /(وزن بدن|وزنم|دور کمر|چربی بدن|درصد چربی|اندازه.?گیری|ترکیب بدنی|body weight|waist|body fat|measurement|body composition)/i;
const GENERAL_PROGRESS = /(پیشرفت|روند|ریکاوری|آمادگی|progress|trend|recovery|readiness)/i;
const DAILY_GUIDANCE = /(امروز|امروزم|روز من|چیکار کنم|چه کار کنم|چه کاری کنم|وضعیتم|برنامه امروز|today|my day|what should i do)/i;
const PROGRAM = /(برنامه(?:‌|\s)?من|برنامه(?:‌|\s)?ام|برنامه کلی|پلن|دوره|my plan|program|training plan|meal plan)/i;

export function routeCoachDomains(message: string): CoachContextDomain[] {
  const domains = new Set<CoachContextDomain>(['profile']);

  if (DAILY_GUIDANCE.test(message)) {
    domains.add('safety');
    domains.add('nutrition');
    domains.add('workout');
    domains.add('progress');
  }
  if (PROGRAM.test(message)) {
    domains.add('safety');
    domains.add('nutrition');
    domains.add('workout');
  }
  if (NUTRITION.test(message)) { domains.add('nutrition'); domains.add('safety'); }
  if (WORKOUT.test(message)) { domains.add('workout'); domains.add('safety'); }
  if (SAFETY.test(message)) domains.add('safety');
  if (BODY_PROGRESS.test(message)) domains.add('progress');
  if (GENERAL_PROGRESS.test(message)) domains.add('progress');

  return COACH_CONTEXT_DOMAINS.filter((domain) => domains.has(domain));
}
