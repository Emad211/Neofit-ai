import { redirect } from 'next/navigation';
import { activeAuthSession } from '@/lib/auth/active-session';
import { hasSupabasePublicEnv } from '@/lib/supabase/env';
import { createClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

export default async function HomePage() {
  // Local/no-config development may intentionally use the explicit Guest demo.
  if (!hasSupabasePublicEnv()) redirect('/today');

  const supabase = await createClient();
  const active = await activeAuthSession(supabase);

  // A locally valid JWT is not enough here. If the Auth user was deleted or
  // the session was revoked, the application entry must expose Sign in/Sign up
  // instead of trapping the browser in authenticated routes.
  if (!active) redirect('/auth');

  const onboarding = await supabase
    .from('user_onboarding')
    .select('status')
    .eq('user_id', active.userId)
    .maybeSingle();

  if (!onboarding.error && onboarding.data?.status !== 'completed') {
    redirect('/onboarding');
  }

  redirect('/today');
}
