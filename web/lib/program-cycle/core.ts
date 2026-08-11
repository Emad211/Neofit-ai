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
] as const;

export type ProgramCycleStatus = (typeof PROGRAM_CYCLE_STATUSES)[number];

const STATUS_LABELS: Readonly<Record<ProgramCycleStatus, string>> = {
  draft: 'پیش‌نویس چرخه',
  generating: 'در حال آماده‌سازی',
  ready: 'آمادهٔ بررسی',
  failed: 'نیازمند تلاش دوباره',
  active: 'فعال',
  paused: 'متوقف‌شده',
  completed: 'تکمیل‌شده',
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
