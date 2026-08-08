'use client';

import { createBrowserClient } from '@supabase/ssr';
import type { Database } from './database.types';
import { parseSupabasePublicEnv } from './env';

export function createClient() {
  const { url, publishableKey } = parseSupabasePublicEnv({
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY:
      process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
  });

  return createBrowserClient<Database>(url, publishableKey);
}
