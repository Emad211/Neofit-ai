export interface SupabasePublicEnvironment {
  readonly url: string;
  readonly publishableKey: string;
}

export type SupabaseEnvironmentSource = Readonly<
  Record<string, string | undefined>
>;

function requireValue(
  source: SupabaseEnvironmentSource,
  name: 'NEXT_PUBLIC_SUPABASE_URL' | 'NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY',
): string {
  const value = source[name]?.trim();
  if (!value) throw new Error(`${name} is required.`);
  return value;
}

function normalizeSupabaseUrl(value: string): string {
  let parsed: URL;
  try {
    parsed = new URL(value);
  } catch {
    throw new Error('NEXT_PUBLIC_SUPABASE_URL must be a valid Supabase URL.');
  }

  const isLocalDevelopmentHost =
    parsed.hostname === 'localhost' || parsed.hostname === '127.0.0.1';
  const hasAllowedProtocol =
    parsed.protocol === 'https:' ||
    (parsed.protocol === 'http:' && isLocalDevelopmentHost);

  if (!hasAllowedProtocol || parsed.username || parsed.password) {
    throw new Error('NEXT_PUBLIC_SUPABASE_URL must be a valid Supabase URL.');
  }

  return parsed.origin;
}

export function parseSupabasePublicEnv(
  source: SupabaseEnvironmentSource,
): SupabasePublicEnvironment {
  return {
    url: normalizeSupabaseUrl(requireValue(source, 'NEXT_PUBLIC_SUPABASE_URL')),
    publishableKey: requireValue(
      source,
      'NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY',
    ),
  };
}

export function readSupabasePublicEnv(): SupabasePublicEnvironment {
  return parseSupabasePublicEnv({
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY:
      process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
  });
}
