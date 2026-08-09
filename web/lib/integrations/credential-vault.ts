import 'server-only';

import { decryptSecret, encryptSecret, type EncryptedSecret } from '@/lib/ai/crypto-primitives';
import type { ExternalIntegration } from './types';

const KEY_VERSION = 1;

function readEncryptionKey(): Buffer {
  const value = process.env.AI_CREDENTIAL_ENCRYPTION_KEY?.trim();
  if (!value) throw new Error('AI_CREDENTIAL_ENCRYPTION_KEY is required for integration credentials.');
  const key = Buffer.from(value, 'base64');
  if (key.byteLength !== 32) {
    throw new Error('AI_CREDENTIAL_ENCRYPTION_KEY must decode to exactly 32 bytes.');
  }
  return key;
}

function aad(userId: string, integration: ExternalIntegration): string {
  return `neofit:integration-credential:v${KEY_VERSION}:${userId}:${integration}`;
}

function keyHint(apiKey: string): string {
  const suffix = apiKey.trim().slice(-4);
  return suffix ? `••••${suffix}` : '••••';
}

export interface StoredIntegrationCiphertext extends EncryptedSecret {
  readonly keyVersion: number;
  readonly keyHint: string;
}

export function encryptIntegrationApiKey(
  apiKey: string,
  userId: string,
  integration: ExternalIntegration,
): StoredIntegrationCiphertext {
  const normalized = apiKey.trim();
  if (normalized.length < 16 || normalized.length > 512) {
    throw new Error('Integration API key length is invalid.');
  }
  return {
    ...encryptSecret(normalized, readEncryptionKey(), aad(userId, integration)),
    keyVersion: KEY_VERSION,
    keyHint: keyHint(normalized),
  };
}

export function decryptIntegrationApiKey(
  encrypted: EncryptedSecret & { readonly keyVersion: number },
  userId: string,
  integration: ExternalIntegration,
): string {
  if (encrypted.keyVersion !== KEY_VERSION) {
    throw new Error('Unsupported integration credential key version.');
  }
  return decryptSecret(encrypted, readEncryptionKey(), aad(userId, integration));
}
