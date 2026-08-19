import 'server-only';

import {
  AI_HARD_MAX_OUTPUT_TOKENS,
  AI_MAX_OUTPUT_TOKENS,
  AI_PROVIDER_TIMEOUT_MS,
  AI_VALIDATION_TIMEOUT_MS,
} from '../config';
import type { AiGenerationInput } from '../types';
import { fetchWithTimeout, outputReachedCeiling, providerHttpError } from './shared';

const AVALAI_API_BASE = 'https://api.avalai.ir/v1';

interface AvalAiResponse {
  readonly id?: string;
  readonly output_text?: string;
  readonly output?: Array<{
    readonly type?: string;
    readonly content?: Array<{ readonly type?: string; readonly text?: string }>;
  }>;
  readonly usage?: unknown;
}

function avalAiText(payload: AvalAiResponse): string {
  if (typeof payload.output_text === 'string' && payload.output_text.trim()) {
    return payload.output_text.trim();
  }
  return (payload.output ?? [])
    .flatMap((item) => item.content ?? [])
    .filter((item) => item.type === 'output_text' && typeof item.text === 'string')
    .map((item) => item.text ?? '')
    .join('')
    .trim();
}

function outputTokenLimit(request: AiGenerationInput): number {
  const requested = request.maxOutputTokens;
  return typeof requested === 'number' && Number.isInteger(requested) && requested > 0
    ? Math.min(requested, AI_HARD_MAX_OUTPUT_TOKENS)
    : AI_MAX_OUTPUT_TOKENS;
}

export async function validateAvalAiCredential(apiKey: string, modelId: string): Promise<void> {
  const response = await fetchWithTimeout(
    `${AVALAI_API_BASE}/models/${encodeURIComponent(modelId)}`,
    { headers: { Authorization: `Bearer ${apiKey}` } },
    AI_VALIDATION_TIMEOUT_MS,
  );
  if (!response.ok) throw providerHttpError(response, 'avalai_validate');
}

export async function generateAvalAi(
  apiKey: string,
  modelId: string,
  request: AiGenerationInput,
): Promise<{ text: string; requestId: string | null; stateId: string | null; usage: unknown; incomplete: boolean }> {
  // Resolve the ceiling ONCE, clamped to the hard cap, and reuse the same
  // number both for what we send and for truncation detection below. Detecting
  // against a different (unclamped) value would silently under-report truncation
  // whenever a caller requests above AI_HARD_MAX_OUTPUT_TOKENS.
  const maxOutputTokens = outputTokenLimit(request);
  const response = await fetchWithTimeout(
    `${AVALAI_API_BASE}/responses`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: modelId,
        input: request.input,
        ...(request.systemInstruction ? { instructions: request.systemInstruction } : {}),
        max_output_tokens: maxOutputTokens,
        store: false,
      }),
    },
    AI_PROVIDER_TIMEOUT_MS,
  );
  if (!response.ok) throw providerHttpError(response, 'avalai_response');
  const payload = (await response.json()) as AvalAiResponse;
  const text = avalAiText(payload);
  if (!text) {
    throw providerHttpError(new Response(null, { status: 502 }), 'avalai_empty_output');
  }
  return {
    text,
    requestId: response.headers.get('x-request-id'),
    stateId: payload.id ?? null,
    usage: payload.usage ?? null,
    incomplete: outputReachedCeiling(payload.usage, maxOutputTokens),
  };
}
