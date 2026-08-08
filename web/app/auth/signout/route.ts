import { revalidatePath } from 'next/cache';
import { NextResponse, type NextRequest } from 'next/server';
import { authRedirectUrl } from '@/lib/auth/origin';
import { isSameOriginBrowserMutation } from '@/lib/auth/request-origin';
import { hasSupabasePublicEnv } from '@/lib/supabase/env';
import { createClient } from '@/lib/supabase/server';

export async function POST(request: NextRequest) {
  if (!isSameOriginBrowserMutation(request)) {
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
  return NextResponse.redirect(authRedirectUrl(`/auth?message=${message}`), { status: 303 });
}
