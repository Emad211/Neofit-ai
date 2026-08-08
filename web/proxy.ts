import { NextResponse, type NextRequest } from 'next/server';
import { updateSupabaseSession } from './lib/supabase/proxy';

function canonicalPreviewRedirect(request: NextRequest): NextResponse | null {
  const environment = process.env.NEXT_PUBLIC_VERCEL_ENV ?? process.env.VERCEL_ENV;
  if (environment !== 'preview') return null;
  if (request.method !== 'GET' && request.method !== 'HEAD') return null;

  const configured = process.env.NEXT_PUBLIC_APP_URL?.trim();
  if (!configured) return null;

  let canonical: URL;
  try {
    canonical = new URL(configured);
  } catch {
    return null;
  }

  if (canonical.host === request.nextUrl.host) return null;

  // Preview auth must use one hostname. PKCE verifiers and Supabase SSR session
  // cookies are host-scoped, so a unique Vercel deployment URL must not become
  // a second interactive origin next to the stable Preview Lab alias.
  const destination = new URL(request.nextUrl.pathname + request.nextUrl.search, canonical.origin);
  return NextResponse.redirect(destination, 307);
}

export async function proxy(request: NextRequest) {
  const canonical = canonicalPreviewRedirect(request);
  if (canonical) return canonical;
  return updateSupabaseSession(request);
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|sw.js|manifest.webmanifest|icons/|.*\\.(?:svg|png|jpg|jpeg|gif|webp|woff2?)$).*)',
  ],
};
