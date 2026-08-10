function parseOrigin(value: string | null): string | null {
  if (!value) return null;
  try {
    return new URL(value).origin;
  } catch {
    return null;
  }
}

function configuredAppOrigin(): string | null {
  return parseOrigin(process.env.NEXT_PUBLIC_APP_URL?.trim() || null);
}

export function isSameOriginBrowserMutation(request: Request): boolean {
  const requestUrl = new URL(request.url);
  const origin = parseOrigin(request.headers.get('origin'));

  if (origin) {
    const allowedOrigins = new Set<string>([requestUrl.origin]);

    // In local development Next can bind to 127.0.0.1 while the browser uses
    // localhost. The Host header represents the browser-visible authority, so
    // accept that exact authority without weakening the cross-origin check.
    const host = request.headers.get('host')?.trim();
    if (host) {
      allowedOrigins.add(`${requestUrl.protocol}//${host}`);
    }

    // NEXT_PUBLIC_APP_URL is an environment-controlled canonical origin. This
    // also keeps the guard correct behind trusted hosting/proxy URL rewriting.
    const configured = configuredAppOrigin();
    if (configured) allowedOrigins.add(configured);

    return allowedOrigins.has(origin);
  }

  // Cookie-authenticated mutation endpoints are browser-only. If Origin is
  // absent, require Fetch Metadata to prove the request came from this origin.
  return request.headers.get('sec-fetch-site') === 'same-origin';
}
