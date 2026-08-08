export const DEFAULT_NEOFIT_TIME_ZONE = 'Asia/Tehran';

export function normalizeTimeZone(
  value: string | null | undefined,
  fallback = DEFAULT_NEOFIT_TIME_ZONE,
): string {
  const candidate = value?.trim();
  if (!candidate) return fallback;

  try {
    new Intl.DateTimeFormat('en-US', { timeZone: candidate }).format(0);
    return candidate;
  } catch {
    return fallback;
  }
}

export function formatLocalDate(
  date: Date,
  timeZone = DEFAULT_NEOFIT_TIME_ZONE,
): string {
  const formatter = new Intl.DateTimeFormat('en-CA', {
    timeZone: normalizeTimeZone(timeZone),
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
  const parts = formatter.formatToParts(date);
  const values = new Map(parts.map((part) => [part.type, part.value]));
  const year = values.get('year');
  const month = values.get('month');
  const day = values.get('day');
  if (!year || !month || !day) {
    throw new Error('Unable to format the NeoFit local date.');
  }
  return `${year}-${month}-${day}`;
}
