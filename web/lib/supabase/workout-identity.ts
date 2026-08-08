import 'server-only';

import { hasSupabasePublicEnv } from './env';
import { createClient } from './server';

export interface WorkoutIdentity {
  readonly configured: boolean;
  readonly userId: string | null;
}

export async function loadWorkoutIdentity(): Promise<WorkoutIdentity> {
  if (!hasSupabasePublicEnv()) return { configured: false, userId: null };
  try {
    const supabase = await createClient();
    const { data, error } = await supabase.auth.getClaims();
    const userId = typeof data?.claims?.sub === 'string' ? data.claims.sub : null;
    return { configured: true, userId: error ? null : userId };
  } catch {
    return { configured: true, userId: null };
  }
}
