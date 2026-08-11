import type { CoachContextDomain } from '@/lib/coach/context-router';

function record(value: unknown): Record<string, unknown> | null {
  return value !== null && typeof value === 'object' && !Array.isArray(value)
    ? value as Record<string, unknown>
    : null;
}

export function deterministicWorkoutSafetyResponse(
  context: Record<string, unknown>,
  domains: readonly CoachContextDomain[],
): string | null {
  if (!domains.includes('workout')) return null;

  const safety = record(context.safety);
  const injuries = record(safety?.injuries);
  const painScale = injuries?.painScale;
  const severeExercisePain = injuries?.painDuringExercise === true
    && typeof painScale === 'number'
    && Number.isFinite(painScale)
    && painScale >= 7;

  const registry = record(context.exerciseRegistry);
  const candidates = Array.isArray(registry?.candidates) ? registry.candidates : [];
  const blockedNames = candidates.flatMap((candidate) => {
    const item = record(candidate);
    const decision = record(item?.decision);
    if (decision?.status !== 'blocked') return [];
    const name = typeof item?.nameFa === 'string' ? item.nameFa.trim().slice(0, 80) : '';
    return name ? [name] : [];
  }).slice(0, 3);

  if (!severeExercisePain && blockedNames.length === 0) return null;
  const exerciseClause = blockedNames.length > 0 ? ` به‌ویژه ${blockedNames.join('،')} را` : '';
  return `با توجه به درد یا محدودیت ثبت‌شده، فعلاً${exerciseClause} انجام نده و تمرین را متوقف کن. پیش از ادامه، برای ارزیابی ایمن با پزشک یا فیزیوتراپیست واجد صلاحیت مشورت کن؛ من تشخیص پزشکی نمی‌دهم.`;
}
