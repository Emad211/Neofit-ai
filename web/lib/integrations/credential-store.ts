import 'server-only';

import type { SupabaseClient } from '@supabase/supabase-js';
import { activeAuthSession } from '@/lib/auth/active-session';
import type { Database } from '@/lib/supabase/database.types';
import { createClient } from '@/lib/supabase/server';
import type { ExternalIntegration, IntegrationCredentialMetadata } from './types';

export interface IntegrationAuthenticatedContext {
  readonly supabase: SupabaseClient<Database>;
  readonly userId: string;
  readonly sessionId: string;
}

export interface StoredIntegrationCredential extends IntegrationCredentialMetadata {
  readonly userId: string;
  readonly ciphertext: string;
  readonly iv: string;
  readonly authTag: string;
  readonly keyVersion: number;
}

function mapCredential(row: Database['public']['Tables']['encrypted_integration_credentials']['Row']): StoredIntegrationCredential {
  return {
    userId: row.user_id,
    integration: row.integration as ExternalIntegration,
    ciphertext: row.ciphertext,
    iv: row.iv,
    authTag: row.auth_tag,
    keyVersion: row.key_version,
    keyHint: row.key_hint,
    status: row.status as 'active' | 'invalid',
    cooldownUntil: row.cooldown_until,
    lastValidatedAt: row.last_validated_at,
    lastFailureCode: row.last_failure_code,
  };
}

export async function authenticatedIntegrationContext(): Promise<IntegrationAuthenticatedContext> {
  const supabase = await createClient();
  const active = await activeAuthSession(supabase);
  if (!active) throw new Error('Integration authentication required.');
  return { supabase, userId: active.userId, sessionId: active.sessionId };
}

async function resolveContext(context?: IntegrationAuthenticatedContext) {
  return context ?? authenticatedIntegrationContext();
}

export async function listIntegrationCredentials(
  context?: IntegrationAuthenticatedContext,
): Promise<{ userId: string; credentials: StoredIntegrationCredential[] }> {
  const { supabase, userId } = await resolveContext(context);
  const { data, error } = await supabase
    .from('encrypted_integration_credentials')
    .select('*')
    .eq('user_id', userId)
    .in('integration', ['youtube']);
  if (error) throw new Error('Unable to load integration credentials.');
  return { userId, credentials: (data ?? []).map(mapCredential) };
}

export async function upsertIntegrationCredential(input: {
  integration: ExternalIntegration;
  ciphertext: string;
  iv: string;
  authTag: string;
  keyVersion: number;
  keyHint: string;
}, context?: IntegrationAuthenticatedContext): Promise<IntegrationCredentialMetadata> {
  const { supabase, userId } = await resolveContext(context);
  const validatedAt = new Date().toISOString();
  const { data, error } = await supabase
    .from('encrypted_integration_credentials')
    .upsert({
      user_id: userId,
      integration: input.integration,
      ciphertext: input.ciphertext,
      iv: input.iv,
      auth_tag: input.authTag,
      key_version: input.keyVersion,
      key_hint: input.keyHint,
      status: 'active',
      cooldown_until: null,
      last_validated_at: validatedAt,
      last_failure_code: null,
    }, { onConflict: 'user_id,integration' })
    .select('integration,key_hint,status,cooldown_until,last_validated_at,last_failure_code')
    .single();
  if (error || !data) throw new Error('Unable to save integration credential.');
  return {
    integration: data.integration as ExternalIntegration,
    keyHint: data.key_hint,
    status: data.status as 'active' | 'invalid',
    cooldownUntil: data.cooldown_until,
    lastValidatedAt: data.last_validated_at,
    lastFailureCode: data.last_failure_code,
  };
}

export async function markIntegrationValidated(
  integration: ExternalIntegration,
  context?: IntegrationAuthenticatedContext,
): Promise<IntegrationCredentialMetadata> {
  const { supabase, userId } = await resolveContext(context);
  const validatedAt = new Date().toISOString();
  const { data, error } = await supabase
    .from('encrypted_integration_credentials')
    .update({ status: 'active', cooldown_until: null, last_validated_at: validatedAt, last_failure_code: null })
    .eq('user_id', userId)
    .eq('integration', integration)
    .select('integration,key_hint,status,cooldown_until,last_validated_at,last_failure_code')
    .single();
  if (error || !data) throw new Error('Unable to update integration validation state.');
  return {
    integration: data.integration as ExternalIntegration,
    keyHint: data.key_hint,
    status: data.status as 'active' | 'invalid',
    cooldownUntil: data.cooldown_until,
    lastValidatedAt: data.last_validated_at,
    lastFailureCode: data.last_failure_code,
  };
}

export async function markIntegrationFailure(input: {
  integration: ExternalIntegration;
  status: 'active' | 'invalid';
  failureCode: string;
  cooldownUntil?: string | null;
}, context?: IntegrationAuthenticatedContext): Promise<void> {
  const { supabase, userId } = await resolveContext(context);
  await supabase
    .from('encrypted_integration_credentials')
    .update({
      status: input.status,
      last_failure_code: input.failureCode.slice(0, 120),
      cooldown_until: input.cooldownUntil ?? null,
    })
    .eq('user_id', userId)
    .eq('integration', input.integration);
}

export async function deleteIntegrationCredential(
  integration: ExternalIntegration,
  context?: IntegrationAuthenticatedContext,
): Promise<void> {
  const { supabase, userId } = await resolveContext(context);
  const { error } = await supabase
    .from('encrypted_integration_credentials')
    .delete()
    .eq('user_id', userId)
    .eq('integration', integration);
  if (error) throw new Error('Unable to delete integration credential.');
}
