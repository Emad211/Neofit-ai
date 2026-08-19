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
  readonly responseSchema?: Readonly<Record<string, unknown>>;
  // Per-request output ceiling. A property of the generation itself, NOT of the
  // audit bucket: planners and the respond route share the 'respond' kind, so
  // keying the ceiling on requestKind would wrongly cap both together. Omitted
  // ⇒ the provider default (AI_MAX_OUTPUT_TOKENS).
  readonly maxOutputTokens?: number;
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
  // True when the provider's own reported output-token count reached the
  // ceiling we sent — i.e. the text is very likely cut off mid-output. Derived
  // by arithmetic from usage counters, never from a guessed finish-reason
  // field. Conversational callers may tolerate a clipped reply; the structured
  // planners treat it as a distinct, non-retryable failure so the user is not
  // told to retry into the same deterministic ceiling.
  readonly incomplete: boolean;
}

export function isAiProvider(value: string): value is AiProvider {
  return (AI_PROVIDERS as readonly string[]).includes(value);
}
