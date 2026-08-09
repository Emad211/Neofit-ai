import 'server-only';

import type { Database } from '@/lib/supabase/database.types';
import type { AiAuthenticatedContext } from './credential-store';
import {
  AiBudgetExceededError,
  AiBudgetUnavailableError,
  aiRequestBudgetLimits,
  nonNegativeInteger,
  normalizeAiUsage,
  type AiRequestKind,
} from './request-audit-core';
import type { AiProvider } from './types';

export { AiBudgetExceededError, AiBudgetUnavailableError } from './request-audit-core';
export type { AiRequestKind, AiUsageCounts } from './request-audit-core';

type CompleteAiRequestArgs = Database['public']['Functions']['complete_ai_request']['Args'];

export interface AiAuditReservation {
  readonly requestId: string;
  readonly burstUsed: number;
  readonly hourlyUsed: number;
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
  const burstUsed = nonNegativeInteger(row.burst_used) ?? 0;
  const hourlyUsed = nonNegativeInteger(row.hourly_used) ?? 0;
  const retryAfterSeconds = Math.max(1, nonNegativeInteger(row.retry_after_seconds) ?? 1);
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
