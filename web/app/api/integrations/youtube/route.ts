import { NextResponse } from 'next/server';
import { isSameOriginBrowserMutation } from '@/lib/auth/request-origin';
import {
  authenticatedIntegrationContext,
  deleteIntegrationCredential,
  listIntegrationCredentials,
  markIntegrationFailure,
  markIntegrationValidated,
  upsertIntegrationCredential,
} from '@/lib/integrations/credential-store';
import { decryptIntegrationApiKey, encryptIntegrationApiKey } from '@/lib/integrations/credential-vault';
import { validateYouTubeApiKey, YouTubeRequestError } from '@/lib/integrations/youtube-client';

export const dynamic = 'force-dynamic';

function json(data: unknown, status = 200) {
  return NextResponse.json(data, {
    status,
    headers: { 'Cache-Control': 'private, no-store' },
  });
}

function rejectMutation(request: Request) {
  return isSameOriginBrowserMutation(request) ? null : json({ error: 'cross_origin_request' }, 403);
}

export async function GET() {
  try {
    const context = await authenticatedIntegrationContext();
    const { credentials } = await listIntegrationCredentials(context);
    const credential = credentials.find((item) => item.integration === 'youtube');
    return json({ credential: credential ? {
      integration: credential.integration,
      keyHint: credential.keyHint,
      status: credential.status,
      cooldownUntil: credential.cooldownUntil,
      lastValidatedAt: credential.lastValidatedAt,
      lastFailureCode: credential.lastFailureCode,
    } : null });
  } catch {
    return json({ error: 'authentication_required' }, 401);
  }
}

export async function PUT(request: Request) {
  const rejected = rejectMutation(request);
  if (rejected) return rejected;

  let body: unknown;
  try { body = await request.json(); }
  catch { return json({ error: 'invalid_json' }, 400); }
  const record = body && typeof body === 'object' ? body as Record<string, unknown> : {};
  const apiKey = typeof record.apiKey === 'string' ? record.apiKey.trim() : '';
  if (apiKey.length < 16 || apiKey.length > 512) {
    return json({ error: 'credential_input_invalid' }, 400);
  }

  try {
    const context = await authenticatedIntegrationContext();
    await validateYouTubeApiKey(apiKey);
    const encrypted = encryptIntegrationApiKey(apiKey, context.userId, 'youtube');
    const metadata = await upsertIntegrationCredential({
      integration: 'youtube',
      ciphertext: encrypted.ciphertext,
      iv: encrypted.iv,
      authTag: encrypted.authTag,
      keyVersion: encrypted.keyVersion,
      keyHint: encrypted.keyHint,
    }, context);
    return json(metadata);
  } catch (error) {
    if (error instanceof YouTubeRequestError) {
      return json({ error: error.kind === 'auth' ? 'credential_invalid' : error.kind }, 400);
    }
    return json({ error: 'credential_save_failed' }, 500);
  }
}

export async function POST(request: Request) {
  const rejected = rejectMutation(request);
  if (rejected) return rejected;

  try {
    const context = await authenticatedIntegrationContext();
    const { credentials } = await listIntegrationCredentials(context);
    const credential = credentials.find((item) => item.integration === 'youtube');
    if (!credential) return json({ error: 'credential_not_configured' }, 404);
    const apiKey = decryptIntegrationApiKey({
      ciphertext: credential.ciphertext,
      iv: credential.iv,
      authTag: credential.authTag,
      keyVersion: credential.keyVersion,
    }, context.userId, 'youtube');
    await validateYouTubeApiKey(apiKey);
    const metadata = await markIntegrationValidated('youtube', context);
    return json({ ...metadata, ok: true });
  } catch (error) {
    if (error instanceof YouTubeRequestError) {
      try {
        const context = await authenticatedIntegrationContext();
        await markIntegrationFailure({
          integration: 'youtube',
          status: error.kind === 'auth' ? 'invalid' : 'active',
          failureCode: error.code,
        }, context);
      } catch {
        // Credential-state bookkeeping must not expose a second failure.
      }
      return json({ error: error.kind === 'auth' ? 'credential_invalid' : error.kind }, 400);
    }
    return json({ error: 'credential_test_failed' }, 500);
  }
}

export async function DELETE(request: Request) {
  const rejected = rejectMutation(request);
  if (rejected) return rejected;
  try {
    const context = await authenticatedIntegrationContext();
    await deleteIntegrationCredential('youtube', context);
    return new NextResponse(null, {
      status: 204,
      headers: { 'Cache-Control': 'private, no-store' },
    });
  } catch {
    return json({ error: 'credential_delete_failed' }, 500);
  }
}
