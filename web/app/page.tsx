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

  const [avalaiCredential, onboarding, programCycle] = await Promise.all([
    supabase
      .from('encrypted_provider_credentials')
      .select('status')
      .eq('user_id', active.userId)
      .eq('provider', 'avalai')
      .maybeSingle(),
    supabase
      .from('user_onboarding')
      .select('status,schema_version')
      .eq('user_id', active.userId)
      .maybeSingle(),
    supabase
      .from('program_cycles')
      .select('id,status')
      .eq('user_id', active.userId)
      .neq('status', 'completed')
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle(),
  ]);

  // The AI credential is the first real Onboarding gate and lives directly
  // inside the welcome step rather than in a separate prerequisite screen.
  if (avalaiCredential.error || avalaiCredential.data?.status !== 'active') {
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

  if (!programCycle.error && programCycle.data) redirect('/program');

  // A completed Onboarding without a cycle reaches the explicit Stage22
  // creation boundary. Ready never claims that planners have already run.
  redirect('/onboarding/ready');
}
