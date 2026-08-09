import 'server-only';

import { AI_PROVIDER_PRIORITY } from './config';
import { decryptProviderApiKey } from './credential-vault';
import {
  authenticatedAiContext,
  listStoredCredentials,
  markCredentialFailure,
  type AiAuthenticatedContext,
} from './credential-store';
import { generateFromProvider } from './provider-adapter';
import { ProviderRequestError, cooldownUntilFor, shouldFallback } from './provider-error';
import {
  completeAiRequest,
  reserveAiRequest,
  type AiRequestKind,
} from './request-audit';
import type { AiGenerationInput, AiGenerationResult, AiProvider } from './types';

function cooldownActive(value: string | null): boolean {
  return value ? Date.parse(value) > Date.now() : false;
}

export async function generateWithProviderFallback(
  request: AiGenerationInput,
  context?: AiAuthenticatedContext,
  requestKind: AiRequestKind = 'respond',
): Promise<AiGenerationResult> {
  const authContext = context ?? await authenticatedAiContext();
  const { userId, credentials } = await listStoredCredentials(authContext);
  const byProvider = new Map(credentials.map((credential) => [credential.provider, credential]));
  const eligibleProviders = AI_PROVIDER_PRIORITY.filter((provider) => {
    const credential = byProvider.get(provider);
    return Boolean(
      credential
      && credential.status === 'active'
      && !cooldownActive(credential.cooldownUntil),
    );
  });

  // Do not consume budget when there is no provider request to make.
  if (eligibleProviders.length === 0) {
    throw new Error('No active AI provider credential is available.');
  }

  const routerStartedAt = performance.now();
  const reservation = await reserveAiRequest(authContext, requestKind);
  let fallbackFrom: AiProvider | null = null;
  let lastError: unknown = null;
  let attemptCount = 0;
  let lastProvider: AiProvider | null = null;
  let lastModelId: string | null = null;
  let auditCompleted = false;

  try {
    for (const provider of eligibleProviders) {
      const credential = byProvider.get(provider);
      if (!credential) continue;

      attemptCount += 1;
      lastProvider = provider;
      lastModelId = credential.modelId;

      const apiKey = decryptProviderApiKey({
        ciphertext: credential.ciphertext,
        iv: credential.iv,
        authTag: credential.authTag,
        keyVersion: credential.keyVersion,
      }, userId, provider);

      const providerStartedAt = performance.now();
      try {
        const result = await generateFromProvider(provider, apiKey, credential.modelId, request);
        const providerLatencyMs = Math.round(performance.now() - providerStartedAt);
        await completeAiRequest({
          context: authContext,
          reservation,
          status: 'success',
          provider,
          modelId: credential.modelId,
          fallbackFrom,
          attemptCount,
          routerLatencyMs: Math.round(performance.now() - routerStartedAt),
          inputChars: request.input.length,
          systemChars: request.systemInstruction?.length ?? 0,
          outputChars: result.text.length,
          usage: result.usage,
        });
        auditCompleted = true;
        return {
          provider,
          modelId: credential.modelId,
          text: result.text,
          providerRequestId: result.requestId,
          providerStateId: result.stateId,
          latencyMs: providerLatencyMs,
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
        }, authContext);
        fallbackFrom ??= provider;
      }
    }

    if (lastError instanceof ProviderRequestError) throw lastError;
    throw new Error('No active AI provider credential is available.');
  } catch (error) {
    if (!auditCompleted) {
      await completeAiRequest({
        context: authContext,
        reservation,
        status: 'failure',
        provider: lastProvider,
        modelId: lastModelId,
        fallbackFrom,
        attemptCount,
        routerLatencyMs: Math.round(performance.now() - routerStartedAt),
        inputChars: request.input.length,
        systemChars: request.systemInstruction?.length ?? 0,
        outputChars: null,
        failureCode: error instanceof ProviderRequestError ? error.code : 'internal_error',
      });
    }
    throw error;
  }
}
