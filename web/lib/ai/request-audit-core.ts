export type AiRequestKind = 'coach' | 'respond';

export interface AiUsageCounts {
  readonly inputTokens: number | null;
  readonly outputTokens: number | null;
  readonly totalTokens: number | null;
}

export class AiBudgetExceededError extends Error {
  readonly retryAfterSeconds: number;
  readonly burstUsed: number;
  readonly hourlyUsed: number;

  constructor(input: { retryAfterSeconds: number; burstUsed: number; hourlyUsed: number }) {
    super('AI request budget exceeded.');
    this.name = 'AiBudgetExceededError';
    this.retryAfterSeconds = input.retryAfterSeconds;
    this.burstUsed = input.burstUsed;
    this.hourlyUsed = input.hourlyUsed;
  }
}

export class AiBudgetUnavailableError extends Error {
  constructor() {
    super('AI request budget is unavailable.');
    this.name = 'AiBudgetUnavailableError';
  }
}

function boundedEnvInteger(name: string, fallback: number, minimum: number, maximum: number): number {
  const raw = process.env[name];
  if (!raw) return fallback;
  const parsed = Number.parseInt(raw, 10);
  if (!Number.isFinite(parsed)) return fallback;
  return Math.min(Math.max(parsed, minimum), maximum);
}

export function aiRequestBudgetLimits(): { burstPerMinute: number; requestsPerHour: number } {
  const burstPerMinute = boundedEnvInteger('AI_REQUEST_BURST_PER_MINUTE', 12, 1, 1000);
  const requestsPerHour = Math.max(
    burstPerMinute,
    boundedEnvInteger('AI_REQUESTS_PER_HOUR', 120, 1, 5000),
  );
  return { burstPerMinute, requestsPerHour };
}

function asNonNegativeInteger(value: unknown): number | null {
  return typeof value === 'number' && Number.isFinite(value) && value >= 0
    ? Math.round(value)
    : null;
}

function usageValue(record: Record<string, unknown>, keys: readonly string[]): number | null {
  for (const key of keys) {
    const value = asNonNegativeInteger(record[key]);
    if (value !== null) return value;
  }
  return null;
}

export function normalizeAiUsage(usage: unknown): AiUsageCounts {
  if (!usage || typeof usage !== 'object' || Array.isArray(usage)) {
    return { inputTokens: null, outputTokens: null, totalTokens: null };
  }
  const record = usage as Record<string, unknown>;
  return {
    inputTokens: usageValue(record, [
      'total_input_tokens',
      'input_tokens',
      'prompt_tokens',
      'prompt_token_count',
    ]),
    outputTokens: usageValue(record, [
      'total_output_tokens',
      'output_tokens',
      'completion_tokens',
      'candidates_token_count',
    ]),
    totalTokens: usageValue(record, [
      'total_tokens',
      'total_token_count',
    ]),
  };
}

export function nonNegativeInteger(value: unknown): number | null {
  return asNonNegativeInteger(value);
}
