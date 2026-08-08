import 'server-only';

import { deploymentEnvironment, publicAppUrl } from '@/lib/environment';

function normalizeOrigin(value: string | undefined): string | null {
  const candidate = value?.trim();
  if (!candidate) return null;
  try {
    return new URL(/^https?:\/\//i.test(candidate) ? candidate : `https://${candidate}`).origin;
  } catch {
    return null;
  }
}

export function canonicalAuthOrigin(): string {
  const explicit = normalizeOrigin(process.env.NEXT_PUBLIC_APP_URL);
  if (deploymentEnvironment === 'preview' || deploymentEnvironment === 'production') {
    if (!explicit) throw new Error('NEXT_PUBLIC_APP_URL is required for hosted Auth flows.');
    return explicit;
  }
  return explicit ?? publicAppUrl;
}

export function authRedirectUrl(path: string): string {
  return new URL(path, canonicalAuthOrigin()).toString();
}
