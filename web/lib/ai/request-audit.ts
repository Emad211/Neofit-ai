import 'server-only';

import type { Database } from '@/lib/supabase/database.types';
import type { AiAuthenticatedContext } from './credential-store';
import type { AiProvider } from './types';

export type AiRequestKind = 'coach' | 'respond';
type CompleteAiRequestArgs = Database['public']['Functions']['complete_ai_request']['Args'];

export interface AiAuditReservation {
  readonly requestId: string;
  readonly burstUsed: number;
  readonly hourlyUsed: number;
}

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

export async function reserveAiRequest(
  context: AiAuthenticatedContext,
  requestKind: AiRequestKind,
): Promise<AiAuditReservation> {
  const limits = aiRequestBudgetLimits();
  const { data, error } = await context.supabase.rpc('reserve_ai_request', {
    p_request_kind: requestKind,
    p_burst_limit: limits.burstPerMinute,
    p_hourly_limit: limits.requestsPerHour,
  });
  if (error || !data || data.length !== 1) throw new AiBudgetUnavailableError();

  const row = data[0];
  const burstUsed = asNonNegativeInteger(row.burst_used) ?? 0;
  const hourlyUsed = asNonNegativeInteger(row.hourly_used) ?? 0;
  const retryAfterSeconds = Math.max(1, asNonNegativeInteger(row.retry_after_seconds) ?? 1);
  if (row.allowed !== true) {
    throw new AiBudgetExceededError({ retryAfterSeconds, burstUsed, hourlyUsed });
  }
  if (typeof row.request_id !== 'string' || !row.request_id) throw new AiBudgetUnavailableError();

  return { requestId: row.request_id, burstUsed, hourlyUsed };
}

export async function completeAiRequest(input: {
  context: AiAuthenticatedContext;
  reservation: AiAuditReservation;
  status: 'success' | 'failure';
  provider: AiProvider | null;
  modelId: string | null;
  fallbackFrom: AiProvider | null;
  attemptCount: number;
  routerLatencyMs: number;
  inputChars: number;
  systemChars: number;
  outputChars: number | null;
  usage?: unknown;
  failureCode?: string | null;
}): Promise<void> {
  const usage = normalizeAiUsage(input.usage);
  const args: CompleteAiRequestArgs = {
    p_request_id: input.reservation.requestId,
    p_status: input.status,
    p_attempt_count: input.attemptCount,
    p_router_latency_ms: input.routerLatencyMs,
    p_input_chars: input.inputChars,
    p_system_chars: input.systemChars,
    ...(input.provider ? { p_provider: input.provider } : {}),
    ...(input.modelId ? { p_model_id: input.modelId } : {}),
    ...(input.fallbackFrom ? { p_fallback_from: input.fallbackFrom } : {}),
    ...(input.outputChars !== null ? { p_output_chars: input.outputChars } : {}),
    ...(usage.inputTokens !== null ? { p_input_tokens: usage.inputTokens } : {}),
    ...(usage.outputTokens !== null ? { p_output_tokens: usage.outputTokens } : {}),
    ...(usage.totalTokens !== null ? { p_total_tokens: usage.totalTokens } : {}),
    ...(input.failureCode ? { p_failure_code: input.failureCode } : {}),
  };
  const { error } = await input.context.supabase.rpc('complete_ai_request', args);
  if (error) {
    // Audit completion must never leak prompt/key material and must not replace a
    // successful provider response with an observability-only failure.
    console.warn('NeoFit AI request audit completion failed.');
  }
}
