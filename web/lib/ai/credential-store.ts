import 'server-only';

import { createClient } from '@/lib/supabase/server';
import type { AiCredentialMetadata, AiProvider } from './types';

export interface StoredAiCredential extends AiCredentialMetadata {
  readonly userId: string;
  readonly ciphertext: string;
  readonly iv: string;
  readonly authTag: string;
  readonly keyVersion: number;
}

async function authenticatedContext() {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.getClaims();
  const userId = data?.claims?.sub;
  if (error || !userId) throw new Error('AI authentication required.');
  return { supabase, userId };
}

function mapCredential(row: {
  user_id: string;
  provider: string;
  ciphertext: string;
  iv: string;
  auth_tag: string;
  key_version: number;
  key_hint: string;
  model_id: string;
  status: string;
  cooldown_until: string | null;
  last_validated_at: string;
  last_failure_code: string | null;
}): StoredAiCredential {
  return {
    userId: row.user_id,
    provider: row.provider as AiProvider,
    ciphertext: row.ciphertext,
    iv: row.iv,
    authTag: row.auth_tag,
    keyVersion: row.key_version,
    keyHint: row.key_hint,
    modelId: row.model_id,
    status: row.status as 'active' | 'invalid',
    cooldownUntil: row.cooldown_until,
    lastValidatedAt: row.last_validated_at,
    lastFailureCode: row.last_failure_code,
  };
}

export async function listStoredCredentials(): Promise<{ userId: string; credentials: StoredAiCredential[] }> {
  const { supabase, userId } = await authenticatedContext();
  const { data, error } = await supabase
    .from('encrypted_provider_credentials')
    .select('user_id,provider,ciphertext,iv,auth_tag,key_version,key_hint,model_id,status,cooldown_until,last_validated_at,last_failure_code')
    .eq('user_id', userId)
    .in('provider', ['google', 'avalai']);
  if (error) throw new Error('Unable to load AI provider credentials.');
  return { userId, credentials: (data ?? []).map(mapCredential) };
}

export async function upsertStoredCredential(input: {
  provider: AiProvider;
  ciphertext: string;
  iv: string;
  authTag: string;
  keyVersion: number;
  keyHint: string;
  modelId: string;
}): Promise<AiCredentialMetadata> {
  const { supabase, userId } = await authenticatedContext();
  const validatedAt = new Date().toISOString();
  const { data, error } = await supabase
    .from('encrypted_provider_credentials')
    .upsert({
      user_id: userId,
      provider: input.provider,
      ciphertext: input.ciphertext,
      iv: input.iv,
      auth_tag: input.authTag,
      key_version: input.keyVersion,
      key_hint: input.keyHint,
      model_id: input.modelId,
      status: 'active',
      cooldown_until: null,
      last_validated_at: validatedAt,
      last_failure_code: null,
    }, { onConflict: 'user_id,provider' })
    .select('provider,key_hint,model_id,status,cooldown_until,last_validated_at,last_failure_code')
    .single();
  if (error || !data) throw new Error('Unable to save AI provider credential.');
  return {
    provider: data.provider as AiProvider,
    keyHint: data.key_hint,
    modelId: data.model_id,
    status: data.status as 'active' | 'invalid',
    cooldownUntil: data.cooldown_until,
    lastValidatedAt: data.last_validated_at,
    lastFailureCode: data.last_failure_code,
  };
}

export async function deleteStoredCredential(provider: AiProvider): Promise<void> {
  const { supabase, userId } = await authenticatedContext();
  const { error } = await supabase
    .from('encrypted_provider_credentials')
    .delete()
    .eq('user_id', userId)
    .eq('provider', provider);
  if (error) throw new Error('Unable to delete AI provider credential.');
}

export async function markCredentialValidated(provider: AiProvider): Promise<AiCredentialMetadata> {
  const { supabase, userId } = await authenticatedContext();
  const validatedAt = new Date().toISOString();
  const { data, error } = await supabase
    .from('encrypted_provider_credentials')
    .update({
      status: 'active',
      cooldown_until: null,
      last_validated_at: validatedAt,
      last_failure_code: null,
    })
    .eq('user_id', userId)
    .eq('provider', provider)
    .select('provider,key_hint,model_id,status,cooldown_until,last_validated_at,last_failure_code')
    .single();
  if (error || !data) throw new Error('Unable to update AI provider validation state.');
  return {
    provider: data.provider as AiProvider,
    keyHint: data.key_hint,
    modelId: data.model_id,
    status: data.status as 'active' | 'invalid',
    cooldownUntil: data.cooldown_until,
    lastValidatedAt: data.last_validated_at,
    lastFailureCode: data.last_failure_code,
  };
}

export async function markCredentialFailure(input: {
  provider: AiProvider;
  status: 'active' | 'invalid';
  failureCode: string;
  cooldownUntil: string | null;
}): Promise<void> {
  const { supabase, userId } = await authenticatedContext();
  await supabase
    .from('encrypted_provider_credentials')
    .update({
      status: input.status,
      last_failure_code: input.failureCode,
      cooldown_until: input.cooldownUntil,
    })
    .eq('user_id', userId)
    .eq('provider', input.provider);
}
