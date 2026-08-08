import 'server-only';

import { generateAvalAi, validateAvalAiCredential } from './providers/avalai';
import { generateGoogle, validateGoogleCredential } from './providers/google';
import type { AiGenerationInput, AiProvider } from './types';

export function validateProviderCredential(
  provider: AiProvider,
  apiKey: string,
  modelId: string,
): Promise<void> {
  return provider === 'google'
    ? validateGoogleCredential(apiKey, modelId)
    : validateAvalAiCredential(apiKey, modelId);
}

export function generateFromProvider(
  provider: AiProvider,
  apiKey: string,
  modelId: string,
  request: AiGenerationInput,
) {
  return provider === 'google'
    ? generateGoogle(apiKey, modelId, request)
    : generateAvalAi(apiKey, modelId, request);
}
