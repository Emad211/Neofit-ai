import 'server-only';

import { AI_PROVIDER_PRIORITY } from './config';
import { decryptProviderApiKey } from './credential-vault';
import { listStoredCredentials, markCredentialFailure } from './credential-store';
import { generateFromProvider } from './provider-adapter';
import { ProviderRequestError, cooldownUntilFor, shouldFallback } from './provider-error';
import type { AiGenerationInput, AiGenerationResult, AiProvider } from './types';

function cooldownActive(value: string | null): boolean {
  return value ? Date.parse(value) > Date.now() : false;
}

export async function generateWithProviderFallback(
  request: AiGenerationInput,
): Promise<AiGenerationResult> {
  const { userId, credentials } = await listStoredCredentials();
  const byProvider = new Map(credentials.map((credential) => [credential.provider, credential]));
  let fallbackFrom: AiProvider | null = null;
  let lastError: unknown = null;

  for (const provider of AI_PROVIDER_PRIORITY) {
    const credential = byProvider.get(provider);
    if (!credential || credential.status !== 'active' || cooldownActive(credential.cooldownUntil)) {
      continue;
    }

    const apiKey = decryptProviderApiKey({
      ciphertext: credential.ciphertext,
      iv: credential.iv,
      authTag: credential.authTag,
      keyVersion: credential.keyVersion,
    }, userId, provider);

    const startedAt = performance.now();
    try {
      const result = await generateFromProvider(provider, apiKey, credential.modelId, request);
      return {
        provider,
        modelId: credential.modelId,
        text: result.text,
        providerRequestId: result.requestId,
        providerStateId: result.stateId,
        latencyMs: Math.round(performance.now() - startedAt),
        usage: result.usage,
        fallbackFrom,
      };
    } catch (error) {
      lastError = error;
      if (!(error instanceof ProviderRequestError) || !shouldFallback(error)) throw error;

      await markCredentialFailure({
        provider,
        status: error.kind === 'auth' || error.kind === 'unsupported_model' ? 'invalid' : 'active',
        failureCode: error.code,
        cooldownUntil: cooldownUntilFor(error),
      });
      fallbackFrom ??= provider;
    }
  }

  if (lastError instanceof ProviderRequestError) throw lastError;
  throw new Error('No active AI provider credential is available.');
}
