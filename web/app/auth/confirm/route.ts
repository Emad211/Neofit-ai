import { NextResponse, type NextRequest } from 'next/server';
import { safeInternalPath } from '@/lib/auth/redirect';
import { setRecoveryIntent } from '@/lib/auth/recovery-intent';
import { bootstrapAccount } from '@/lib/supabase/account';
import { hasSupabasePublicEnv } from '@/lib/supabase/env';
import { createClient } from '@/lib/supabase/server';

function authRedirect(request: NextRequest, value: string): NextResponse {
  return NextResponse.redirect(new URL(`/auth?${value}`, request.url));
}

function verificationInterstitial(request: NextRequest, tokenHash: string, type: string, next: string): NextResponse {
  const destination = new URL('/auth/verify', request.url);
  destination.searchParams.set('token_hash', tokenHash);
  destination.searchParams.set('type', type);
  destination.searchParams.set('next', next);
  return NextResponse.redirect(destination, 303);
}

export async function GET(request: NextRequest) {
  if (!hasSupabasePublicEnv()) return authRedirect(request, 'error=config');

  const next = safeInternalPath(request.nextUrl.searchParams.get('next'), '/onboarding');
  const recoveryFlow = next === '/auth/update-password';
  if (request.nextUrl.searchParams.get('error')) {
    return recoveryFlow
      ? NextResponse.redirect(new URL('/auth/recover?error=invalid-link', request.url))
      : authRedirect(request, 'error=callback');
  }

  const tokenHash = request.nextUrl.searchParams.get('token_hash');
  const type = request.nextUrl.searchParams.get('type');
  if (tokenHash && type) {
    // GET must never consume a one-time token. Email security scanners commonly
    // prefetch links; only the explicit POST on /auth/verify is allowed to call verifyOtp.
    return verificationInterstitial(request, tokenHash, type, next);
  }

  const code = request.nextUrl.searchParams.get('code');
  if (!code) {
    return recoveryFlow
      ? NextResponse.redirect(new URL('/auth/recover?error=invalid-link', request.url))
      : authRedirect(request, 'message=confirmed-login');
  }

  // Legacy PKCE compatibility for already-issued links. New email templates use
  // token_hash + explicit POST so this path can be removed after old links expire.
  const supabase = await createClient();
  const { data, error } = await supabase.auth.exchangeCodeForSession(code);
  if (error || !data.user) {
    return recoveryFlow
      ? NextResponse.redirect(new URL('/auth/recover?error=invalid-link', request.url))
      : authRedirect(request, 'message=confirmed-login');
  }

  try {
    await bootstrapAccount(supabase, {
      userId: data.user.id,
      email: data.user.email ?? '',
      displayName: typeof data.user.user_metadata?.display_name === 'string'
        ? data.user.user_metadata.display_name
        : null,
    });
  } catch {
    console.error('NeoFit legacy-confirm bootstrap remained incomplete after retry.');
  }

  if (recoveryFlow) await setRecoveryIntent(data.user.id);
  return NextResponse.redirect(new URL(next, request.url), 303);
}
