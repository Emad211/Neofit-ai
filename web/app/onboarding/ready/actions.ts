'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { activeAuthSession } from '@/lib/auth/active-session';
import { ONBOARDING_SCHEMA_VERSION, parseOnboardingDraft } from '@/lib/onboarding/model';
import { ensureProgramCycle } from '@/lib/program-cycle/persistence';
import { createClient } from '@/lib/supabase/server';

export async function createProgramCycle(): Promise<void> {
  const supabase = await createClient();
  const active = await activeAuthSession(supabase);
  if (!active) redirect('/auth');

  const [{ data, error }, avalaiCredential] = await Promise.all([
    supabase
      .from('user_onboarding')
      .select('status,schema_version,draft,updated_at')
      .eq('user_id', active.userId)
      .maybeSingle(),
    supabase
      .from('encrypted_provider_credentials')
      .select('status')
      .eq('user_id', active.userId)
      .eq('provider', 'avalai')
      .maybeSingle(),
  ]);
  const draft = parseOnboardingDraft(data?.draft ?? null);
  if (
    error
    || avalaiCredential.error
    || avalaiCredential.data?.status !== 'active'
    || data?.status !== 'completed'
    || data.schema_version !== ONBOARDING_SCHEMA_VERSION
    || !draft
  ) {
    redirect('/onboarding/welcome');
  }

  try {
    await ensureProgramCycle({
      supabase,
      userId: active.userId,
      draft,
      onboardingUpdatedAt: data.updated_at,
    });
  } catch {
    redirect('/onboarding/ready?error=cycle');
  }
  revalidatePath('/program');
  revalidatePath('/');
  redirect('/program');
}
