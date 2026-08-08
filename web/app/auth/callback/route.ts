import { NextResponse, type NextRequest } from 'next/server';
import { bootstrapAccount } from '@/lib/supabase/account';
import { hasSupabasePublicEnv } from '@/lib/supabase/env';
import { createClient } from '@/lib/supabase/server';

function safeNext(value: string | null): string {
  return value && value.startsWith('/') && !value.startsWith('//') ? value : '/today';
}

export async function GET(request: NextRequest) {
  if (!hasSupabasePublicEnv()) {
    return NextResponse.redirect(new URL('/auth?error=config', request.url));
  }

  const code = request.nextUrl.searchParams.get('code');
  const next = safeNext(request.nextUrl.searchParams.get('next'));
  if (!code) return NextResponse.redirect(new URL('/auth?error=callback', request.url));

  const supabase = await createClient();
  const { data, error } = await supabase.auth.exchangeCodeForSession(code);
  if (error || !data.user) {
    return NextResponse.redirect(new URL('/auth?error=callback', request.url));
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
    await supabase.auth.signOut();
    return NextResponse.redirect(new URL('/auth?error=bootstrap', request.url));
  }

  return NextResponse.redirect(new URL(next, request.url));
}
