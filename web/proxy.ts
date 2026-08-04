import type { NextRequest } from 'next/server';
import { updateSupabaseSession } from './lib/supabase/proxy';

export async function proxy(request: NextRequest) {
  return updateSupabaseSession(request);
}

export const config = {
  // Stage 4B protects only the future account/auth surface. Public fixture
  // routes and PWA assets remain outside this matcher: _next/static, sw.js,
  // manifest.webmanifest and icons are never session-refresh entrypoints.
  matcher: ['/auth/:path*', '/account/:path*'],
};
