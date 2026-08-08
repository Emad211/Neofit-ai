import { NextResponse, type NextRequest } from 'next/server';
import { EMAIL_LINK_TOKEN_COOKIE, emailLinkTokenCookieOptions } from '@/lib/auth/email-link-intent';
import { authRedirectUrl, canonicalAuthOrigin } from '@/lib/auth/origin';
import { safeInternalPath } from '@/lib/auth/redirect';
import { hasRecoveryIntentKey, setRecoveryIntent } from '@/lib/auth/recovery-intent';
import { bootstrapAccount } from '@/lib/supabase/account';
import { hasSupabasePublicEnv } from '@/lib/supabase/env';
import { createClient } from '@/lib/supabase/server';

function canonicalUrl(path: string): URL {
  return new URL(path, canonicalAuthOrigin());
}

function authRedirect(value: string, status: 302 | 303 = 302): NextResponse {
  return NextResponse.redirect(new URL(authRedirectUrl(`/auth?${value}`)), status);
}

function verificationInterstitial(tokenHash: string, type: string, next: string): NextResponse {
  const destination = canonicalUrl('/auth/verify');
  destination.searchParams.set('type', type);
  destination.searchParams.set('next', next);
  const response = NextResponse.redirect(destination, 303);
  response.cookies.set(EMAIL_LINK_TOKEN_COOKIE, tokenHash, emailLinkTokenCookieOptions());
  response.headers.set('Cache-Control', 'private, no-store');
  response.headers.set('Referrer-Policy', 'no-referrer');
  return response;
}

export async function GET(request: NextRequest) {
  if (!hasSupabasePublicEnv()) return authRedirect('error=config');

  const next = safeInternalPath(request.nextUrl.searchParams.get('next'), '/onboarding');
  const recoveryFlow = next === '/auth/update-password';
  if (recoveryFlow && !hasRecoveryIntentKey()) {
    return NextResponse.redirect(canonicalUrl('/auth/recover?error=config'), 303);
  }

  if (request.nextUrl.searchParams.get('error')) {
    return recoveryFlow
      ? NextResponse.redirect(canonicalUrl('/auth/recover?error=invalid-link'))
      : authRedirect('error=callback');
  }

  const tokenHash = request.nextUrl.searchParams.get('token_hash');
  const type = request.nextUrl.searchParams.get('type');
  if (tokenHash && tokenHash.length <= 4096 && (type === 'email' || type === 'recovery')) {
    return verificationInterstitial(tokenHash, type, next);
  }

  const code = request.nextUrl.searchParams.get('code');
  if (!code) {
    return recoveryFlow
      ? NextResponse.redirect(canonicalUrl('/auth/recover?error=invalid-link'))
      : authRedirect('message=confirmed-login');
  }

  // Legacy PKCE compatibility for already-issued links. New email templates use
  // token_hash + explicit POST so this path can be removed after old links expire.
  const supabase = await createClient();
  const { data, error } = await supabase.auth.exchangeCodeForSession(code);
  if (error || !data.user) {
    return recoveryFlow
      ? NextResponse.redirect(canonicalUrl('/auth/recover?error=invalid-link'))
      : authRedirect('message=confirmed-login');
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

  if (recoveryFlow) {
    const { data: claimsData, error: claimsError } = await supabase.auth.getClaims();
    const sessionId = typeof claimsData?.claims?.session_id === 'string'
      ? claimsData.claims.session_id
      : null;
    if (claimsError || !sessionId) {
      await supabase.auth.signOut({ scope: 'local' });
      return NextResponse.redirect(canonicalUrl('/auth/recover?error=session'), 303);
    }
    await setRecoveryIntent(data.user.id, sessionId);
  }

  return NextResponse.redirect(canonicalUrl(next), 303);
}
