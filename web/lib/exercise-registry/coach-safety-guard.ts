import type { CoachContextDomain } from '@/lib/coach/context-router';

function record(value: unknown): Record<string, unknown> | null {
  return value !== null && typeof value === 'object' && !Array.isArray(value)
    ? value as Record<string, unknown>
    : null;
}

function latestRecordedWorkoutPain(context: Record<string, unknown>): number | null {
  const workout = record(context.workout);
  const recent = Array.isArray(workout?.recent) ? workout.recent : [];
  const latest = record(recent[0]);
  const pain = latest?.pain_scale;
  return typeof pain === 'number' && Number.isFinite(pain) ? pain : null;
}

export function deterministicWorkoutSafetyResponse(
  context: Record<string, unknown>,
  domains: readonly CoachContextDomain[],
): string | null {
  if (!domains.includes('workout')) return null;

  const safety = record(context.safety);
  const injuries = record(safety?.injuries);
  const onboardingPainScale = injuries?.painScale;
  const onboardingPain = injuries?.painDuringExercise === true
    && typeof onboardingPainScale === 'number'
    && Number.isFinite(onboardingPainScale)
    ? onboardingPainScale
    : null;
  const recentPain = latestRecordedWorkoutPain(context);
  const abnormalPain = Math.max(onboardingPain ?? 0, recentPain ?? 0);

  const registry = record(context.exerciseRegistry);
  const candidates = Array.isArray(registry?.candidates) ? registry.candidates : [];
  const blockedNames = candidates.flatMap((candidate) => {
    const item = record(candidate);
    const decision = record(item?.decision);
    if (decision?.status !== 'blocked') return [];
    const name = typeof item?.nameFa === 'string' ? item.nameFa.trim().slice(0, 80) : '';
    return name ? [name] : [];
  }).slice(0, 3);

  if (abnormalPain >= 4) {
    const source = recentPain !== null && recentPain >= 4
      ? 'در آخرین تمرین ثبت‌شده درد یا ناراحتی غیرعادی متوسط یا بیشتر گزارش شده است.'
      : 'درد حین تمرین در محدوده‌ای ثبت شده که ادامه خودکار برنامه را قابل‌دفاع نمی‌کند.';
    return `${source} فعلاً تمرین را متوقف کن و قبل از برنامه‌ریزی مجدد، وضعیت درد و محدودیت‌ها را به‌روز کن. اگر درد ادامه دارد، شدید است یا نگران‌کننده است، با پزشک یا فیزیوتراپیست واجد صلاحیت ارزیابی انجام بده؛ من تشخیص پزشکی نمی‌دهم.`;
  }

  if (blockedNames.length === 0) return null;
  return `با اطلاعات ایمنی ثبت‌شده، ${blockedNames.join('، ')} برایت مناسب نیست. از این حرکت‌ها استفاده نکن؛ اگر لازم است محدودیت‌ها یا درد فعلی را در پروفایل به‌روز کن تا جایگزین‌های امن بررسی شوند.`;
}
