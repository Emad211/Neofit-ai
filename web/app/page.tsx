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

  const [googleCredential, onboarding] = await Promise.all([
    supabase
      .from('encrypted_provider_credentials')
      .select('status')
      .eq('user_id', active.userId)
      .eq('provider', 'google')
      .maybeSingle(),
    supabase
      .from('user_onboarding')
      .select('status')
      .eq('user_id', active.userId)
      .maybeSingle(),
  ]);

  // A real personalized NeoFit lifecycle requires a usable Google provider
  // before collecting the self-report that will later feed program generation.
  if (googleCredential.error || googleCredential.data?.status !== 'active') {
    redirect('/onboarding/ai');
  }

  if (onboarding.error || onboarding.data?.status !== 'completed') {
    redirect('/onboarding/welcome');
  }

  redirect('/today');
}
