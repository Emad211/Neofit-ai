export type ActivityIntensity = 'low' | 'medium' | 'high';

const activities: Array<{ pattern: RegExp; met: number }> = [
  { pattern: /run|jog|دویدن|دوی/i, met: 8.3 },
  { pattern: /walk|walking|پیاده/i, met: 3.8 },
  { pattern: /cycle|cycling|bike|دوچرخه/i, met: 7.0 },
  { pattern: /swim|شنا/i, met: 7.0 },
  { pattern: /weight|strength|bodybuild|resistance|بدنسازی|وزنه|قدرتی/i, met: 5.5 },
  { pattern: /yoga|stretch|pilates|یوگا|کشش|پیلاتس/i, met: 3.0 },
  { pattern: /football|soccer|basketball|tennis|فوتبال|بسکتبال|تنیس/i, met: 7.5 },
  { pattern: /dance|رقص/i, met: 5.0 },
  { pattern: /hiit|crossfit|کراسفیت/i, met: 9.0 },
];

export function estimateActivityCalories(input: {
  activityType: string;
  durationMinutes: number;
  intensity: ActivityIntensity;
  weightKg: number;
}) {
  const baseMet = activities.find((item) => item.pattern.test(input.activityType))?.met ?? 4.5;
  const intensityFactor = input.intensity === 'low' ? 0.75 : input.intensity === 'high' ? 1.25 : 1;
  const met = Math.max(1.5, baseMet * intensityFactor);
  const calories = met * 3.5 * input.weightKg / 200 * input.durationMinutes;
  return {
    caloriesBurned: Math.max(0, Math.round(calories)),
    met: Math.round(met * 10) / 10,
    confidence: activities.some((item) => item.pattern.test(input.activityType)) ? 'medium' as const : 'low' as const,
  };
}
