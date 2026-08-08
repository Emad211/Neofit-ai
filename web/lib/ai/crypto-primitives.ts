import {
  createCipheriv,
  createDecipheriv,
  randomBytes,
} from 'node:crypto';

const ALGORITHM = 'aes-256-gcm';
const IV_BYTES = 12;

export interface EncryptedSecret {
  readonly ciphertext: string;
  readonly iv: string;
  readonly authTag: string;
}

function assertKey(key: Buffer): void {
  if (key.byteLength !== 32) {
    throw new Error('AI credential encryption key must decode to exactly 32 bytes.');
  }
}

export function encryptSecret(
  plaintext: string,
  key: Buffer,
  aad: string,
): EncryptedSecret {
  assertKey(key);
  const iv = randomBytes(IV_BYTES);
  const cipher = createCipheriv(ALGORITHM, key, iv);
  cipher.setAAD(Buffer.from(aad, 'utf8'));
  const ciphertext = Buffer.concat([
    cipher.update(plaintext, 'utf8'),
    cipher.final(),
  ]);
  const authTag = cipher.getAuthTag();

  return {
    ciphertext: ciphertext.toString('base64url'),
    iv: iv.toString('base64url'),
    authTag: authTag.toString('base64url'),
  };
}

export function decryptSecret(
  encrypted: EncryptedSecret,
  key: Buffer,
  aad: string,
): string {
  assertKey(key);
  const decipher = createDecipheriv(
    ALGORITHM,
    key,
    Buffer.from(encrypted.iv, 'base64url'),
  );
  decipher.setAAD(Buffer.from(aad, 'utf8'));
  decipher.setAuthTag(Buffer.from(encrypted.authTag, 'base64url'));
  const plaintext = Buffer.concat([
    decipher.update(Buffer.from(encrypted.ciphertext, 'base64url')),
    decipher.final(),
  ]);
  return plaintext.toString('utf8');
}
