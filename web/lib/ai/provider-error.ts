import {
  AI_RATE_LIMIT_COOLDOWN_MS,
  AI_TRANSIENT_COOLDOWN_MS,
} from './config';

export type ProviderFailureKind =
  | 'auth'
  | 'rate_limit'
  | 'transient'
  | 'invalid_request'
  | 'unsupported_model';

export class ProviderRequestError extends Error {
  readonly kind: ProviderFailureKind;
  readonly status: number | null;
  readonly code: string;
  readonly retryAfterMs: number | null;

  constructor(options: {
    kind: ProviderFailureKind;
    code: string;
    status?: number | null;
    retryAfterMs?: number | null;
  }) {
    super(`AI provider request failed: ${options.code}`);
    this.name = 'ProviderRequestError';
    this.kind = options.kind;
    this.code = options.code;
    this.status = options.status ?? null;
    this.retryAfterMs = options.retryAfterMs ?? null;
  }
}

export function classifyHttpFailure(status: number): ProviderFailureKind {
  if (status === 401 || status === 403) return 'auth';
  if (status === 404) return 'unsupported_model';
  if (status === 408 || status === 429) return status === 429 ? 'rate_limit' : 'transient';
  if (status >= 500) return 'transient';
  return 'invalid_request';
}

export function shouldFallback(error: unknown): boolean {
  return error instanceof ProviderRequestError &&
    (error.kind === 'auth' ||
      error.kind === 'rate_limit' ||
      error.kind === 'transient' ||
      error.kind === 'unsupported_model');
}

export function cooldownUntilFor(error: ProviderRequestError, now = Date.now()): string | null {
  if (error.kind === 'auth' || error.kind === 'unsupported_model') return null;
  if (error.kind === 'rate_limit') {
    return new Date(now + (error.retryAfterMs ?? AI_RATE_LIMIT_COOLDOWN_MS)).toISOString();
  }
  if (error.kind === 'transient') {
    return new Date(now + (error.retryAfterMs ?? AI_TRANSIENT_COOLDOWN_MS)).toISOString();
  }
  return null;
}

export function parseRetryAfterMs(value: string | null): number | null {
  if (!value) return null;
  const seconds = Number(value);
  if (Number.isFinite(seconds) && seconds >= 0) return Math.min(seconds * 1000, AI_RATE_LIMIT_COOLDOWN_MS);
  const date = Date.parse(value);
  if (Number.isNaN(date)) return null;
  return Math.max(0, Math.min(date - Date.now(), AI_RATE_LIMIT_COOLDOWN_MS));
}
