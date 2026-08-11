import 'server-only';

import type { IntegrationAuthenticatedContext } from './credential-store';
import { toolQueryFingerprint } from './tool-audit-core';

export interface AgentToolAuditReservation {
  readonly id: string;
}

interface ReserveAgentToolRow {
  readonly allowed: boolean;
  readonly audit_id: string | null;
  readonly burst_used: number;
  readonly daily_used: number;
  readonly retry_after_seconds: number;
}

export class AgentToolBudgetExceededError extends Error {
  readonly retryAfterSeconds: number;
  readonly burstUsed: number;
  readonly dailyUsed: number;

  constructor(input: { retryAfterSeconds: number; burstUsed: number; dailyUsed: number }) {
    super('Agent tool budget exceeded.');
    this.name = 'AgentToolBudgetExceededError';
    this.retryAfterSeconds = input.retryAfterSeconds;
    this.burstUsed = input.burstUsed;
    this.dailyUsed = input.dailyUsed;
  }
}

export class AgentToolBudgetUnavailableError extends Error {
  constructor() {
    super('Agent tool budget is unavailable.');
    this.name = 'AgentToolBudgetUnavailableError';
  }
}

function count(value: unknown): number {
  return typeof value === 'number' && Number.isFinite(value) && value >= 0 ? Math.round(value) : 0;
}

export async function beginYouTubeToolAudit(
  context: IntegrationAuthenticatedContext,
  query: string,
): Promise<AgentToolAuditReservation> {
  const { data, error } = await context.supabase.rpc('reserve_agent_tool_call', {
    p_tool_name: 'youtube_search',
    p_query_fingerprint: toolQueryFingerprint(query),
  });
  if (error || !Array.isArray(data) || data.length !== 1) throw new AgentToolBudgetUnavailableError();

  const row = data[0] as Partial<ReserveAgentToolRow>;
  const burstUsed = count(row.burst_used);
  const dailyUsed = count(row.daily_used);
  if (row.allowed !== true) {
    throw new AgentToolBudgetExceededError({
      retryAfterSeconds: Math.max(1, count(row.retry_after_seconds)),
      burstUsed,
      dailyUsed,
    });
  }
  if (typeof row.audit_id !== 'string' || !row.audit_id) throw new AgentToolBudgetUnavailableError();
  return { id: row.audit_id };
}

export async function completeYouTubeToolAudit(input: {
  context: IntegrationAuthenticatedContext;
  reservation: AgentToolAuditReservation;
  status: 'success' | 'failure';
  resultCount?: number;
  latencyMs: number;
  failureCode?: string | null;
}): Promise<void> {
  const { error } = await input.context.supabase
    .from('agent_tool_audit')
    .update({
      status: input.status,
      result_count: input.resultCount ?? null,
      latency_ms: Math.max(0, Math.min(300000, Math.round(input.latencyMs))),
      failure_code: input.failureCode?.slice(0, 120) ?? null,
      completed_at: new Date().toISOString(),
    })
    .eq('id', input.reservation.id)
    .eq('user_id', input.context.userId)
    .eq('status', 'pending');
  if (error) console.warn('NeoFit agent tool audit completion failed.');
}
