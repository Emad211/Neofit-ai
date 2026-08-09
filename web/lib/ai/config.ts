import type { AiProvider } from './types';

export const AI_PROVIDER_PRIORITY: readonly AiProvider[] = ['google', 'avalai'];

export const DEFAULT_AI_MODELS: Readonly<Record<AiProvider, string>> = {
  // Stable GA Google model verified against the current Gemini API model catalog.
  google: 'gemini-3.5-flash-lite',
  // AvalAI documents this provider-maintained Gemini Flash alias. Keeping the
  // fallback on its documented alias avoids coupling AvalAI to an unproven
  // Google release-specific model id.
  avalai: 'gemini-flash-latest',
};

export const AI_INPUT_LIMIT = 12_000;
export const AI_SYSTEM_INSTRUCTION_LIMIT = 4_000;
export const AI_PROVIDER_TIMEOUT_MS = 45_000;
export const AI_VALIDATION_TIMEOUT_MS = 12_000;

export const AI_TRANSIENT_COOLDOWN_MS = 60_000;
export const AI_RATE_LIMIT_COOLDOWN_MS = 5 * 60_000;
