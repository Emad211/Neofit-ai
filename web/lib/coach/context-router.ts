export const COACH_CONTEXT_DOMAINS = ['profile', 'safety', 'nutrition', 'workout', 'progress'] as const;
export type CoachContextDomain = (typeof COACH_CONTEXT_DOMAINS)[number];

const NUTRITION = /(غذا|تغذیه|وعده|کالری|پروتئین|کربوهیدرات|چربی|رژیم|آب|meal|food|nutrition|diet|calorie|macro|protein|carb|fat)/i;
const WORKOUT = /(تمرین|حرکت|ست|تکرار|وزنه|باشگاه|قدرت|عضله|هوازی|رکورد|ریکاوری|workout|exercise|training|gym|set|reps?|weight|strength|cardio|record|recovery)/i;
const SAFETY = /(درد|آسیب|محدودیت|پزشک|دارو|حساسیت|آلرژی|فشار خون|دیابت|قلب|injury|pain|medical|doctor|medication|allerg|cardiac|diabetes|blood pressure)/i;
const BODY_PROGRESS = /(وزن بدن|وزنم|دور کمر|چربی بدن|درصد چربی|اندازه.?گیری|ترکیب بدنی|body weight|waist|body fat|measurement|body composition)/i;
const GENERAL_PROGRESS = /(پیشرفت|روند|ریکاوری|آمادگی|progress|trend|recovery|readiness)/i;
const DAILY_TIME = /(امروز|امروزم|روز من|وضعیتم|برنامه امروز|today|my day)/i;
const VAGUE_GUIDANCE = /(چیکار کنم|چه کار کنم|چه کاری کنم|what should i do)/i;
const PROGRAM = /(برنامه(?:‌|\s)?من|برنامه(?:‌|\s)?ام|برنامه کلی|پلن|دوره|my plan|program|training plan|meal plan)/i;

export function routeCoachDomains(message: string): CoachContextDomain[] {
  const domains = new Set<CoachContextDomain>(['profile']);
  const nutrition = NUTRITION.test(message);
  const workout = WORKOUT.test(message);
  const safety = SAFETY.test(message);
  const bodyProgress = BODY_PROGRESS.test(message);
  const generalProgress = GENERAL_PROGRESS.test(message);
  const program = PROGRAM.test(message);
  const hasSpecificIntent = nutrition || workout || safety || bodyProgress || generalProgress || program;

  // Load the full daily picture only for truly broad guidance. A focused query
  // such as “برای درد زانو چه کار کنم؟” must not pull Nutrition/Progress just
  // because it contains a generic “چه کار کنم” phrase.
  if (!hasSpecificIntent && (DAILY_TIME.test(message) || VAGUE_GUIDANCE.test(message))) {
    domains.add('safety');
    domains.add('nutrition');
    domains.add('workout');
    domains.add('progress');
  }
  if (program) {
    domains.add('safety');
    domains.add('nutrition');
    domains.add('workout');
  }
  if (nutrition) { domains.add('nutrition'); domains.add('safety'); }
  if (workout) { domains.add('workout'); domains.add('safety'); }
  if (safety) domains.add('safety');
  if (bodyProgress || generalProgress) domains.add('progress');

  return COACH_CONTEXT_DOMAINS.filter((domain) => domains.has(domain));
}
