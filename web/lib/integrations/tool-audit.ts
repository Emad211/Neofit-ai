import 'server-only';

import type { IntegrationAuthenticatedContext } from './credential-store';
import { toolQueryFingerprint } from './tool-audit-core';

export interface AgentToolAuditReservation {
  readonly id: string;
}

export async function beginYouTubeToolAudit(
  context: IntegrationAuthenticatedContext,
  query: string,
): Promise<AgentToolAuditReservation | null> {
  const { data, error } = await context.supabase
    .from('agent_tool_audit')
    .insert({
      user_id: context.userId,
      tool_name: 'youtube_search',
      query_fingerprint: toolQueryFingerprint(query),
    })
    .select('id')
    .single();
  if (error || !data) {
    console.warn('NeoFit agent tool audit reservation failed.');
    return null;
  }
  return { id: data.id };
}

export async function completeYouTubeToolAudit(input: {
  context: IntegrationAuthenticatedContext;
  reservation: AgentToolAuditReservation | null;
  status: 'success' | 'failure';
  resultCount?: number;
  latencyMs: number;
  failureCode?: string | null;
}): Promise<void> {
  if (!input.reservation) return;
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
