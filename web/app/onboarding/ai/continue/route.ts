import { NextResponse } from 'next/server';
import { activeAuthSession } from '@/lib/auth/active-session';
import { createClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  const supabase = await createClient();
  const active = await activeAuthSession(supabase);
  if (!active) return NextResponse.redirect(new URL('/auth', request.url), 303);

  const credentialResult = await supabase
    .from('encrypted_provider_credentials')
    .select('status')
    .eq('user_id', active.userId)
    .eq('provider', 'google')
    .maybeSingle();

  if (credentialResult.error || credentialResult.data?.status !== 'active') {
    return NextResponse.redirect(new URL('/onboarding/ai?error=google-required', request.url), 303);
  }

  return NextResponse.redirect(new URL('/onboarding/welcome', request.url), 303);
}
