import { ProviderRequestError, classifyHttpFailure, parseRetryAfterMs } from '../provider-error';

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
