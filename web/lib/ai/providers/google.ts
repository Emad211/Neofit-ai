import 'server-only';

import { AI_PROVIDER_TIMEOUT_MS, AI_VALIDATION_TIMEOUT_MS } from '../config';
import type { AiGenerationInput } from '../types';
import { fetchWithTimeout, providerHttpError } from './shared';

const GOOGLE_API_BASE = 'https://generativelanguage.googleapis.com/v1';

interface GoogleInteraction {
  readonly id?: string;
  readonly steps?: Array<{
    readonly type?: string;
    readonly content?: Array<{ readonly type?: string; readonly text?: string }>;
  }>;
  readonly usage?: unknown;
}

function googleText(payload: GoogleInteraction): string {
  return (payload.steps ?? [])
    .filter((step) => step.type === 'model_output')
    .flatMap((step) => step.content ?? [])
    .filter((item) => item.type === 'text' && typeof item.text === 'string')
    .map((item) => item.text ?? '')
    .join('')
    .trim();
}

export async function validateGoogleCredential(apiKey: string, modelId: string): Promise<void> {
  const response = await fetchWithTimeout(
    `${GOOGLE_API_BASE}/models/${encodeURIComponent(modelId)}`,
    { headers: { 'x-goog-api-key': apiKey } },
    AI_VALIDATION_TIMEOUT_MS,
  );
  if (!response.ok) throw providerHttpError(response, 'google_validate');
}

export async function generateGoogle(
  apiKey: string,
  modelId: string,
  request: AiGenerationInput,
): Promise<{ text: string; requestId: string | null; stateId: string | null; usage: unknown }> {
  const response = await fetchWithTimeout(
    `${GOOGLE_API_BASE}/interactions`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-goog-api-key': apiKey,
      },
      body: JSON.stringify({
        model: modelId,
        input: request.input,
        ...(request.systemInstruction ? { system_instruction: request.systemInstruction } : {}),
        store: false,
      }),
    },
    AI_PROVIDER_TIMEOUT_MS,
  );
  if (!response.ok) throw providerHttpError(response, 'google_interaction');
  const payload = (await response.json()) as GoogleInteraction;
  const text = googleText(payload);
  if (!text) {
    throw providerHttpError(new Response(null, { status: 502 }), 'google_empty_output');
  }
  return {
    text,
    requestId: response.headers.get('x-request-id'),
    stateId: payload.id ?? null,
    usage: payload.usage ?? null,
  };
}
