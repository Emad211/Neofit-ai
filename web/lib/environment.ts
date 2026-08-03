export type DeploymentEnvironment = 'development' | 'preview' | 'production';

function resolveEnvironment(value: string | undefined): DeploymentEnvironment {
  if (value === 'production' || value === 'preview' || value === 'development') return value;
  return 'development';
}

function normalizeAbsoluteUrl(value: string | undefined): string | null {
  const candidate = value?.trim();
  if (!candidate) return null;
  const withProtocol = /^https?:\/\//i.test(candidate) ? candidate : `https://${candidate}`;
  try {
    return new URL(withProtocol).origin;
  } catch {
    return null;
  }
}

export const deploymentEnvironment = resolveEnvironment(
  process.env.NEXT_PUBLIC_VERCEL_ENV ?? process.env.VERCEL_ENV,
);

export const publicAppUrl =
  normalizeAbsoluteUrl(process.env.NEXT_PUBLIC_APP_URL) ??
  normalizeAbsoluteUrl(process.env.VERCEL_PROJECT_PRODUCTION_URL) ??
  normalizeAbsoluteUrl(process.env.VERCEL_URL) ??
  'http://localhost:3000';
