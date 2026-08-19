export const PROGRAM_CYCLE_SCHEMA_VERSION = 1 as const;
export const MIN_PROGRAM_DURATION_DAYS = 14;
export const MAX_PROGRAM_DURATION_DAYS = 84;

export const PROGRAM_CYCLE_STATUSES = [
  'draft',
  'generating',
  'ready',
  'failed',
  'active',
  'paused',
  'completed',
  // Terminal exit for a pre-generation (draft/failed) cycle that was discarded
  // so a fresh one could be pinned to re-completed onboarding. Like 'completed'
  // it is never the "open" cycle; the loaders below exclude it.
  'abandoned',
] as const;

export type ProgramCycleStatus = (typeof PROGRAM_CYCLE_STATUSES)[number];

const STATUS_LABELS: Readonly<Record<ProgramCycleStatus, string>> = {
  draft: 'آمادهٔ ساخت',
  generating: 'در حال ساخت',
  ready: 'آمادهٔ فعال‌سازی',
  failed: 'نیاز به بررسی',
  active: 'فعال',
  paused: 'متوقف',
  completed: 'تمام‌شده',
  abandoned: 'کنارگذاشته‌شده',
};

export function parseProgramCycleStatus(value: unknown): ProgramCycleStatus | null {
  return typeof value === 'string' && PROGRAM_CYCLE_STATUSES.includes(value as ProgramCycleStatus)
    ? value as ProgramCycleStatus
    : null;
}

export function programCycleStatusLabel(status: ProgramCycleStatus): string {
  return STATUS_LABELS[status];
}

function parseLocalDate(value: string): Date {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) throw new RangeError('Program start date is invalid.');
  const [year, month, day] = value.split('-').map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  if (date.getUTCFullYear() !== year || date.getUTCMonth() !== month - 1 || date.getUTCDate() !== day) {
    throw new RangeError('Program start date is invalid.');
  }
  return date;
}

export function programCycleEndDate(startDate: string, durationDays: number): string {
  if (!Number.isInteger(durationDays) || durationDays < MIN_PROGRAM_DURATION_DAYS || durationDays > MAX_PROGRAM_DURATION_DAYS) {
    throw new RangeError('Program duration is outside the supported range.');
  }
  const end = parseLocalDate(startDate);
  end.setUTCDate(end.getUTCDate() + durationDays - 1);
  return end.toISOString().slice(0, 10);
}
