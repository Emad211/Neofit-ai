import { ProviderRequestError, classifyHttpFailure, parseRetryAfterMs } from '../provider-error';
import { normalizeAiUsage } from '../request-audit-core';

export async function fetchWithTimeout(
  url: string,
  init: RequestInit,
  timeoutMs: number,
): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, {
      ...init,
      signal: controller.signal,
      cache: 'no-store',
    });
  } catch {
    throw new ProviderRequestError({
      kind: 'transient',
      code: 'network_or_timeout',
    });
  } finally {
    clearTimeout(timer);
  }
}

export function providerHttpError(response: Response, codePrefix: string): ProviderRequestError {
  return new ProviderRequestError({
    kind: classifyHttpFailure(response.status),
    code: `${codePrefix}_${response.status}`,
    status: response.status,
    retryAfterMs: parseRetryAfterMs(response.headers.get('retry-after')),
  });
}

// Truncation is inferred by ARITHMETIC, not by parsing a provider-specific
// finish-reason field (unverified shapes are forbidden; see web/AGENTS.md). A
// completion that consumed the entire output-token ceiling we sent was almost
// certainly cut off; one that finished under the ceiling was not. We only
// trust a confident positive reading — if the provider reported no output-token
// count we make no truncation claim and leave the strict parser as the
// backstop. normalizeAiUsage is the same verified counter reader the audit
// layer uses, so no new provider field or request is introduced.
export function outputReachedCeiling(usage: unknown, sentMaxOutputTokens: number): boolean {
  const { outputTokens } = normalizeAiUsage(usage);
  return outputTokens !== null && outputTokens >= sentMaxOutputTokens;
}
