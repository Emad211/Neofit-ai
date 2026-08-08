import 'server-only';

import { decryptSecret, encryptSecret, type EncryptedSecret } from './crypto-primitives';
import type { AiProvider } from './types';

const KEY_VERSION = 1;

function readEncryptionKey(): Buffer {
  const value = process.env.AI_CREDENTIAL_ENCRYPTION_KEY?.trim();
  if (!value) {
    throw new Error('AI_CREDENTIAL_ENCRYPTION_KEY is required for BYOK credentials.');
  }

  let key: Buffer;
  try {
    key = Buffer.from(value, 'base64');
  } catch {
    throw new Error('AI_CREDENTIAL_ENCRYPTION_KEY must be base64 encoded.');
  }

  if (key.byteLength !== 32) {
    throw new Error('AI_CREDENTIAL_ENCRYPTION_KEY must decode to exactly 32 bytes.');
  }
  return key;
}

function aad(userId: string, provider: AiProvider): string {
  return `neofit:ai-credential:v${KEY_VERSION}:${userId}:${provider}`;
}

export interface StoredCredentialCiphertext extends EncryptedSecret {
  readonly keyVersion: number;
  readonly keyHint: string;
}

export function createKeyHint(apiKey: string): string {
  const trimmed = apiKey.trim();
  const suffix = trimmed.slice(-4);
  return suffix ? `••••${suffix}` : '••••';
}

export function encryptProviderApiKey(
  apiKey: string,
  userId: string,
  provider: AiProvider,
): StoredCredentialCiphertext {
  const normalized = apiKey.trim();
  if (normalized.length < 8 || normalized.length > 512) {
    throw new Error('Provider API key length is invalid.');
  }
  return {
    ...encryptSecret(normalized, readEncryptionKey(), aad(userId, provider)),
    keyVersion: KEY_VERSION,
    keyHint: createKeyHint(normalized),
  };
}

export function decryptProviderApiKey(
  encrypted: EncryptedSecret & { readonly keyVersion: number },
  userId: string,
  provider: AiProvider,
): string {
  if (encrypted.keyVersion !== KEY_VERSION) {
    throw new Error('Unsupported AI credential key version.');
  }
  return decryptSecret(encrypted, readEncryptionKey(), aad(userId, provider));
}
