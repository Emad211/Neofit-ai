import { revalidatePath } from 'next/cache';
import { NextResponse, type NextRequest } from 'next/server';
import { hasSupabasePublicEnv } from '@/lib/supabase/env';
import { createClient } from '@/lib/supabase/server';

function sameOriginRequest(request: NextRequest): boolean {
  const origin = request.headers.get('origin');
  if (origin) {
    try {
      return new URL(origin).origin === request.nextUrl.origin;
    } catch {
      return false;
    }
  }

  // Browser form submissions that omit Origin still carry Fetch Metadata.
  // This route is browser-only, so ambiguous no-origin/no-metadata POSTs fail closed.
  return request.headers.get('sec-fetch-site') === 'same-origin';
}

export async function POST(request: NextRequest) {
  if (!sameOriginRequest(request)) {
    return NextResponse.json({ error: 'cross_origin_request' }, { status: 403 });
  }

  let scope: 'local' | 'global' = 'local';
  try {
    const formData = await request.formData();
    if (formData.get('scope') === 'global') scope = 'global';
  } catch {
    // Empty same-origin POST remains a local sign-out for backward compatibility.
  }

  if (hasSupabasePublicEnv()) {
    const supabase = await createClient();
    const { data } = await supabase.auth.getClaims();
    if (data?.claims?.sub) await supabase.auth.signOut({ scope });
  }

  revalidatePath('/', 'layout');
  const message = scope === 'global' ? 'signedout-all' : 'signedout';
  return NextResponse.redirect(new URL(`/auth?message=${message}`, request.url), { status: 303 });
}
