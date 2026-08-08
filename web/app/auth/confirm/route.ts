import type { EmailOtpType } from '@supabase/supabase-js';
import { NextResponse, type NextRequest } from 'next/server';
import { bootstrapAccount } from '@/lib/supabase/account';
import { hasSupabasePublicEnv } from '@/lib/supabase/env';
import { createClient } from '@/lib/supabase/server';

function safeNext(value: string | null): string {
  return value && value.startsWith('/') && !value.startsWith('//') ? value : '/onboarding';
}

function authRedirect(request: NextRequest, value: string): NextResponse {
  return NextResponse.redirect(new URL(`/auth?${value}`, request.url));
}

export async function GET(request: NextRequest) {
  if (!hasSupabasePublicEnv()) return authRedirect(request, 'error=config');

  if (request.nextUrl.searchParams.get('error')) {
    return authRedirect(request, 'error=callback');
  }

  const tokenHash = request.nextUrl.searchParams.get('token_hash');
  const type = request.nextUrl.searchParams.get('type') as EmailOtpType | null;
  const code = request.nextUrl.searchParams.get('code');
  const next = safeNext(request.nextUrl.searchParams.get('next'));
  const supabase = await createClient();

  let user = null;
  if (tokenHash && type) {
    const result = await supabase.auth.verifyOtp({ token_hash: tokenHash, type });
    if (result.error || !result.data.user) return authRedirect(request, 'error=callback');
    user = result.data.user;
  } else if (code) {
    // Compatibility path for PKCE redirects that already use the canonical host.
    const result = await supabase.auth.exchangeCodeForSession(code);
    if (result.error || !result.data.user) return authRedirect(request, 'message=confirmed-login');
    user = result.data.user;
  } else {
    // The default Supabase confirmation URL may have already verified the email
    // but cannot establish an SSR cookie session across a different hostname.
    return authRedirect(request, 'message=confirmed-login');
  }

  try {
    await bootstrapAccount(supabase, {
      userId: user.id,
      email: user.email ?? '',
      displayName: typeof user.user_metadata?.display_name === 'string'
        ? user.user_metadata.display_name
        : null,
    });
  } catch {
    console.error('NeoFit confirmation bootstrap remained incomplete after retry.');
  }

  return NextResponse.redirect(new URL(next, request.url));
}
