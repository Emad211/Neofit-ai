import 'server-only';

import { AI_MAX_OUTPUT_TOKENS, AI_PROVIDER_TIMEOUT_MS, AI_VALIDATION_TIMEOUT_MS } from '../config';
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

function youtubeUri(value: string): string {
  let url: URL;
  try { url = new URL(value); }
  catch { throw new Error('Invalid YouTube media URL.'); }
  const host = url.hostname.toLowerCase().replace(/^www\./, '');
  if (host !== 'youtube.com' && host !== 'm.youtube.com' && host !== 'youtu.be') {
    throw new Error('Only YouTube media URLs are supported.');
  }
  return url.toString();
}

function interactionInput(request: AiGenerationInput): string | Array<{ type: 'text'; text: string } | { type: 'video'; uri: string }> {
  const media = request.media ?? [];
  if (media.length === 0) return request.input;
  if (media.length > 1) throw new Error('Only one YouTube video is supported per NeoFit Coach request.');
  return [
    { type: 'text', text: request.input },
    { type: 'video', uri: youtubeUri(media[0]!.url) },
  ];
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
        input: interactionInput(request),
        ...(request.systemInstruction ? { system_instruction: request.systemInstruction } : {}),
        generation_config: { max_output_tokens: AI_MAX_OUTPUT_TOKENS },
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
