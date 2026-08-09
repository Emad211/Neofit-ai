export const AI_PROVIDERS = ['google', 'avalai'] as const;

export type AiProvider = (typeof AI_PROVIDERS)[number];

export interface AiCredentialMetadata {
  readonly provider: AiProvider;
  readonly keyHint: string;
  readonly modelId: string;
  readonly status: 'active' | 'invalid';
  readonly cooldownUntil: string | null;
  readonly lastValidatedAt: string;
  readonly lastFailureCode: string | null;
}

export interface AiYouTubeVideoInput {
  readonly type: 'youtube_video';
  readonly url: string;
}

export type AiMediaInput = AiYouTubeVideoInput;

export interface AiGenerationInput {
  readonly input: string;
  readonly systemInstruction?: string;
  readonly media?: readonly AiMediaInput[];
}

export interface AiGenerationResult {
  readonly provider: AiProvider;
  readonly modelId: string;
  readonly text: string;
  readonly providerRequestId: string | null;
  readonly providerStateId: string | null;
  readonly latencyMs: number;
  readonly usage: unknown;
  readonly fallbackFrom: AiProvider | null;
}

export function isAiProvider(value: string): value is AiProvider {
  return (AI_PROVIDERS as readonly string[]).includes(value);
}
