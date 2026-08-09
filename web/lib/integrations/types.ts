export const EXTERNAL_INTEGRATIONS = ['youtube'] as const;

export type ExternalIntegration = (typeof EXTERNAL_INTEGRATIONS)[number];

export interface IntegrationCredentialMetadata {
  readonly integration: ExternalIntegration;
  readonly keyHint: string;
  readonly status: 'active' | 'invalid';
  readonly cooldownUntil: string | null;
  readonly lastValidatedAt: string;
  readonly lastFailureCode: string | null;
}

export interface YouTubeVideoCard {
  readonly videoId: string;
  readonly title: string;
  readonly channelTitle: string;
  readonly publishedAt: string | null;
  readonly thumbnailUrl: string | null;
  readonly durationSeconds: number | null;
  readonly durationLabel: string | null;
  readonly watchUrl: string;
}

export interface YouTubeSearchToolResult {
  readonly query: string;
  readonly videos: readonly YouTubeVideoCard[];
  readonly latencyMs: number;
}

export function isExternalIntegration(value: string): value is ExternalIntegration {
  return (EXTERNAL_INTEGRATIONS as readonly string[]).includes(value);
}
