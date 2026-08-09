import { redirect } from 'next/navigation';
import { activeAuthSession } from '@/lib/auth/active-session';
import { ONBOARDING_SCHEMA_VERSION } from '@/lib/onboarding/model';
import { hasSupabasePublicEnv } from '@/lib/supabase/env';
import { createClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

export default async function HomePage() {
  // Local/no-config development may intentionally use the explicit Guest demo.
  if (!hasSupabasePublicEnv()) redirect('/today');

  const supabase = await createClient();
  const active = await activeAuthSession(supabase);

  // A locally valid JWT is not enough here. If the Auth user was deleted or
  // the session was revoked, expose Sign in/Sign up instead of trapping them.
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
      .select('status,schema_version')
      .eq('user_id', active.userId)
      .maybeSingle(),
  ]);

  // The AI credential is the first real Onboarding gate. It now lives inside
  // /onboarding/welcome rather than a non-existent /onboarding/ai route.
  if (googleCredential.error || googleCredential.data?.status !== 'active') {
    redirect('/onboarding/welcome');
  }

  // v1 completion is deliberately not accepted as v2 completion because old
  // categorical defaults cannot be distinguished from explicit self-report.
  if (
    onboarding.error ||
    onboarding.data?.status !== 'completed' ||
    onboarding.data.schema_version !== ONBOARDING_SCHEMA_VERSION
  ) {
    redirect('/onboarding/welcome');
  }

  // Stage21 ends at a truthful lifecycle handoff. Until Program Cycle +
  // planners exist, do not pretend that a personalized course was generated.
  redirect('/onboarding/ready');
}
