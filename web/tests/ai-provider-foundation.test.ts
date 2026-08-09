import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { encryptSecret, decryptSecret } from '@/lib/ai/crypto-primitives';
import { classifyHttpFailure, cooldownUntilFor, ProviderRequestError, shouldFallback } from '@/lib/ai/provider-error';
import { DEFAULT_AI_MODELS } from '@/lib/ai/config';

const webRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const repoRoot = resolve(webRoot, '..');

async function read(relativePath: string) {
  return readFile(resolve(webRoot, relativePath), 'utf8');
}

test('AES-256-GCM primitive round-trips and binds ciphertext to AAD', () => {
  const key = Buffer.alloc(32, 7);
  const encrypted = encryptSecret('secret-provider-key', key, 'user-a:google');
  assert.equal(decryptSecret(encrypted, key, 'user-a:google'), 'secret-provider-key');
  assert.throws(() => decryptSecret(encrypted, key, 'user-b:google'));
});

test('Google is primary and provider defaults use documented model identifiers', () => {
  assert.equal(DEFAULT_AI_MODELS.google, 'gemini-3.5-flash-lite');
  assert.equal(DEFAULT_AI_MODELS.avalai, 'gemini-flash-latest');
});

test('fallback only covers provider availability and credential failures', () => {
  assert.equal(classifyHttpFailure(400), 'invalid_request');
  assert.equal(classifyHttpFailure(401), 'auth');
  assert.equal(classifyHttpFailure(429), 'rate_limit');
  assert.equal(classifyHttpFailure(503), 'transient');
  assert.equal(shouldFallback(new ProviderRequestError({ kind: 'transient', code: 'x' })), true);
  assert.equal(shouldFallback(new ProviderRequestError({ kind: 'invalid_request', code: 'x' })), false);
  assert.ok(cooldownUntilFor(new ProviderRequestError({ kind: 'rate_limit', code: 'x' }), 0));
});

test('provider adapters keep API keys in headers and never query-string credentials', async () => {
  const google = await read('lib/ai/providers/google.ts');
  const avalai = await read('lib/ai/providers/avalai.ts');
  assert.match(google, /x-goog-api-key/);
  assert.match(google, /\/v1/);
  assert.match(google, /\/interactions/);
  assert.doesNotMatch(google, /\?key=/);
  assert.match(avalai, /Authorization: `Bearer \$\{apiKey\}`/);
  assert.match(avalai, /\/responses/);
});

test('credential table is encrypted, owner-RLS protected and explicitly granted', async () => {
  const migration = await readFile(
    resolve(repoRoot, 'supabase/migrations/20260808160000_encrypted_provider_credentials.sql'),
    'utf8',
  );
  assert.match(migration, /encrypted_provider_credentials/);
  assert.match(migration, /ciphertext text not null/);
  assert.match(migration, /auth_tag text not null/);
  assert.match(migration, /enable row level security/);
  assert.match(migration, /to authenticated/);
  assert.match(migration, /auth\.uid\(\).*user_id/s);
  assert.doesNotMatch(migration, /api_key\s+text/i);
});

test('AI secrets remain server-only and API responses are private no-store', async () => {
  const env = await read('.env.example');
  const providerRoute = await read('app/api/ai/providers/[provider]/route.ts');
  const respondRoute = await read('app/api/ai/respond/route.ts');
  assert.match(env, /AI_CREDENTIAL_ENCRYPTION_KEY/);
  assert.doesNotMatch(env, /NEXT_PUBLIC_AI_CREDENTIAL/);
  assert.match(providerRoute, /private, no-store/);
  assert.match(respondRoute, /private, no-store/);
});

test('AI Settings keeps raw keys in ephemeral form state and uses server provider routes', async () => {
  const screen = await read('components/ai-provider-settings-screen.tsx');
  const profile = await read('components/profile-screen.tsx');
  assert.match(screen, /\/api\/ai\/providers/);
  assert.match(screen, /type="password"/);
  assert.match(screen, /apiKey:\s*''/);
  assert.doesNotMatch(screen, /localStorage|sessionStorage|indexedDB/i);
  assert.match(profile, /href="\/profile\/ai"/);
});

test('credential save authenticates the NeoFit account before contacting a provider', async () => {
  const route = await read('app/api/ai/providers/[provider]/route.ts');
  assert.match(route, /try \{\s*const \{ userId \} = await listStoredCredentials\(\);\s*await validateProviderCredential\(provider, apiKey, modelId\)/s);
  assert.match(route, /markCredentialValidated\(provider\)/);
});
