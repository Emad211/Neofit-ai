import { NextResponse } from 'next/server';
import { DEFAULT_AI_MODELS } from '@/lib/ai/config';
import { decryptProviderApiKey, encryptProviderApiKey } from '@/lib/ai/credential-vault';
import { deleteStoredCredential, listStoredCredentials, upsertStoredCredential } from '@/lib/ai/credential-store';
import { validateProviderCredential } from '@/lib/ai/provider-adapter';
import { ProviderRequestError } from '@/lib/ai/provider-error';
import { isAiProvider, type AiProvider } from '@/lib/ai/types';

export const dynamic = 'force-dynamic';

type RouteContext = { params: Promise<{ provider: string }> };

async function providerFrom(context: RouteContext): Promise<AiProvider | null> {
  const { provider } = await context.params;
  return isAiProvider(provider) ? provider : null;
}

function jsonError(error: string, status: number) {
  return NextResponse.json({ error }, { status, headers: { 'Cache-Control': 'private, no-store' } });
}

export async function PUT(request: Request, context: RouteContext) {
  const provider = await providerFrom(context);
  if (!provider) return jsonError('provider_not_supported', 404);

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return jsonError('invalid_json', 400);
  }
  const record = body && typeof body === 'object' ? body as Record<string, unknown> : {};
  const apiKey = typeof record.apiKey === 'string' ? record.apiKey.trim() : '';
  const modelId = typeof record.modelId === 'string' && record.modelId.trim()
    ? record.modelId.trim()
    : DEFAULT_AI_MODELS[provider];
  if (apiKey.length < 8 || apiKey.length > 512 || modelId.length > 120) {
    return jsonError('credential_input_invalid', 400);
  }

  try {
    await validateProviderCredential(provider, apiKey, modelId);
    const { userId } = await listStoredCredentials();
    const encrypted = encryptProviderApiKey(apiKey, userId, provider);
    const metadata = await upsertStoredCredential({
      provider,
      ciphertext: encrypted.ciphertext,
      iv: encrypted.iv,
      authTag: encrypted.authTag,
      keyVersion: encrypted.keyVersion,
      keyHint: encrypted.keyHint,
      modelId,
    });
    return NextResponse.json(metadata, { headers: { 'Cache-Control': 'private, no-store' } });
  } catch (error) {
    if (error instanceof ProviderRequestError) {
      return jsonError(error.kind === 'auth' ? 'credential_invalid' : error.kind, 400);
    }
    return jsonError('credential_save_failed', 500);
  }
}

export async function POST(_request: Request, context: RouteContext) {
  const provider = await providerFrom(context);
  if (!provider) return jsonError('provider_not_supported', 404);
  try {
    const { userId, credentials } = await listStoredCredentials();
    const credential = credentials.find((item) => item.provider === provider);
    if (!credential) return jsonError('credential_not_configured', 404);
    const apiKey = decryptProviderApiKey({
      ciphertext: credential.ciphertext,
      iv: credential.iv,
      authTag: credential.authTag,
      keyVersion: credential.keyVersion,
    }, userId, provider);
    await validateProviderCredential(provider, apiKey, credential.modelId);
    return NextResponse.json({ provider, modelId: credential.modelId, ok: true }, {
      headers: { 'Cache-Control': 'private, no-store' },
    });
  } catch (error) {
    if (error instanceof ProviderRequestError) {
      return jsonError(error.kind === 'auth' ? 'credential_invalid' : error.kind, 400);
    }
    return jsonError('credential_test_failed', 500);
  }
}

export async function DELETE(_request: Request, context: RouteContext) {
  const provider = await providerFrom(context);
  if (!provider) return jsonError('provider_not_supported', 404);
  try {
    await deleteStoredCredential(provider);
    return new NextResponse(null, { status: 204, headers: { 'Cache-Control': 'private, no-store' } });
  } catch {
    return jsonError('credential_delete_failed', 500);
  }
}
