import 'server-only';

import type { SupabaseClient, User } from '@supabase/supabase-js';
import type { Database } from '@/lib/supabase/database.types';

export interface ActiveAuthSession {
  readonly userId: string;
  readonly sessionId: string;
  readonly user: User;
}

export async function activeAuthSession(
  supabase: SupabaseClient<Database>,
): Promise<ActiveAuthSession | null> {
  const { data: claimsData, error: claimsError } = await supabase.auth.getClaims();
  const userId = typeof claimsData?.claims?.sub === 'string' ? claimsData.claims.sub : null;
  const sessionId = typeof claimsData?.claims?.session_id === 'string'
    ? claimsData.claims.session_id
    : null;
  if (claimsError || !userId || !sessionId) return null;

  // getUser() performs a network check against Supabase Auth. Use it only for
  // security-sensitive mutations, where a locally valid but server-revoked JWT
  // must not be enough to proceed.
  const { data: userData, error: userError } = await supabase.auth.getUser();
  if (userError || !userData.user || userData.user.id !== userId) return null;

  return { userId, sessionId, user: userData.user };
}
