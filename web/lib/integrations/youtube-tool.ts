import 'server-only';

import type { AiAuthenticatedContext } from '@/lib/ai/credential-store';
import {
  listIntegrationCredentials,
  markIntegrationFailure,
  type IntegrationAuthenticatedContext,
} from './credential-store';
import { decryptIntegrationApiKey } from './credential-vault';
import { beginYouTubeToolAudit, completeYouTubeToolAudit } from './tool-audit';
import type { YouTubeSearchToolResult } from './types';
import { searchYouTubeVideos, YouTubeRequestError } from './youtube-client';

export class YouTubeIntegrationNotConfiguredError extends Error {
  constructor() {
    super('YouTube integration is not configured.');
    this.name = 'YouTubeIntegrationNotConfiguredError';
  }
}

function asIntegrationContext(auth: AiAuthenticatedContext): IntegrationAuthenticatedContext {
  return { supabase: auth.supabase, userId: auth.userId, sessionId: auth.sessionId };
}

export async function runYouTubeSearchTool(
  auth: AiAuthenticatedContext,
  query: string,
): Promise<YouTubeSearchToolResult> {
  const context = asIntegrationContext(auth);
  const { credentials } = await listIntegrationCredentials(context);
  const credential = credentials.find((item) => item.integration === 'youtube');
  if (!credential || credential.status !== 'active') throw new YouTubeIntegrationNotConfiguredError();
  if (credential.cooldownUntil && Date.parse(credential.cooldownUntil) > Date.now()) {
    throw new YouTubeRequestError({ kind: 'rate_limit', code: 'youtube_integration_cooldown' });
  }

  const apiKey = decryptIntegrationApiKey({
    ciphertext: credential.ciphertext,
    iv: credential.iv,
    authTag: credential.authTag,
    keyVersion: credential.keyVersion,
  }, auth.userId, 'youtube');

  const reservation = await beginYouTubeToolAudit(context, query);
  const startedAt = performance.now();
  try {
    const result = await searchYouTubeVideos(apiKey, query);
    await completeYouTubeToolAudit({
      context,
      reservation,
      status: 'success',
      resultCount: result.videos.length,
      latencyMs: performance.now() - startedAt,
    });
    return result;
  } catch (error) {
    const code = error instanceof YouTubeRequestError ? error.code : 'youtube_tool_internal_error';
    await completeYouTubeToolAudit({
      context,
      reservation,
      status: 'failure',
      latencyMs: performance.now() - startedAt,
      failureCode: code,
    });
    if (error instanceof YouTubeRequestError) {
      await markIntegrationFailure({
        integration: 'youtube',
        status: error.kind === 'auth' ? 'invalid' : 'active',
        failureCode: error.code,
        cooldownUntil: error.kind === 'rate_limit'
          ? new Date(Date.now() + 5 * 60 * 1000).toISOString()
          : null,
      }, context);
    }
    throw error;
  }
}
