export function isSameOriginBrowserMutation(request: Request): boolean {
  const requestUrl = new URL(request.url);
  const origin = request.headers.get('origin');

  if (origin) {
    try {
      return new URL(origin).origin === requestUrl.origin;
    } catch {
      return false;
    }
  }

  // Cookie-authenticated mutation endpoints are browser-only. If Origin is
  // absent, require Fetch Metadata to prove the request came from this origin.
  return request.headers.get('sec-fetch-site') === 'same-origin';
}
