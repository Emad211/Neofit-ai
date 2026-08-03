export type DeploymentEnvironment = 'development' | 'preview' | 'production';

function resolveEnvironment(value: string | undefined): DeploymentEnvironment {
  if (value === 'production' || value === 'preview' || value === 'development') return value;
  return 'development';
}

export const deploymentEnvironment = resolveEnvironment(
  process.env.NEXT_PUBLIC_VERCEL_ENV ?? process.env.VERCEL_ENV,
);

export const publicAppUrl =
  process.env.NEXT_PUBLIC_APP_URL?.trim() ||
  (deploymentEnvironment === 'production' ? 'https://neofit.app' : 'http://localhost:3000');
