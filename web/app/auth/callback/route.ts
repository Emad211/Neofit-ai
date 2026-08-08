import { NextResponse, type NextRequest } from 'next/server';
import { bootstrapAccount } from '@/lib/supabase/account';
import { hasSupabasePublicEnv } from '@/lib/supabase/env';
import { createClient } from '@/lib/supabase/server';

function safeNext(value: string | null): string {
  return value && value.startsWith('/') && !value.startsWith('//') ? value : '/today';
}

function authRedirect(request: NextRequest, value: string): NextResponse {
  return NextResponse.redirect(new URL(`/auth?${value}`, request.url));
}

export async function GET(request: NextRequest) {
  if (!hasSupabasePublicEnv()) return authRedirect(request, 'error=config');

  const explicitProviderError = request.nextUrl.searchParams.get('error');
  if (explicitProviderError) return authRedirect(request, 'error=callback');

  const code = request.nextUrl.searchParams.get('code');
  const next = safeNext(request.nextUrl.searchParams.get('next'));

  // Legacy/default confirmation links can verify the email before reaching this
  // endpoint while leaving no server-readable PKCE material. Do not tell the
  // user confirmation failed; the safe recovery is a normal password sign-in.
  if (!code) return authRedirect(request, 'message=confirmed-login');

  const supabase = await createClient();
  const { data, error } = await supabase.auth.exchangeCodeForSession(code);
  if (error || !data.user) {
    return authRedirect(request, 'message=confirmed-login');
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
    // The session is valid and bootstrap is idempotent/retryable. Preserve it.
    console.error('NeoFit callback bootstrap remained incomplete after retry.');
  }

  return NextResponse.redirect(new URL(next, request.url));
}
