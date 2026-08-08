import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';
import { AUTH_PASSWORD_MIN_LENGTH, validNewPassword, validSignInPassword } from '@/lib/auth/password';
import { safeInternalPath } from '@/lib/auth/redirect';

async function source(path: string) {
  return readFile(new URL(`../${path}`, import.meta.url), 'utf8');
}

test('internal redirects reject external, protocol-relative and backslash paths', () => {
  assert.equal(safeInternalPath('/today?x=1', '/fallback'), '/today?x=1');
  assert.equal(safeInternalPath('https://evil.example/path', '/fallback'), '/fallback');
  assert.equal(safeInternalPath('//evil.example/path', '/fallback'), '/fallback');
  assert.equal(safeInternalPath('/\\evil.example/path', '/fallback'), '/fallback');
  assert.equal(safeInternalPath('\\evil.example', '/fallback'), '/fallback');
});

test('new passwords are stronger without locking out existing shorter passwords at sign-in', () => {
  assert.equal(AUTH_PASSWORD_MIN_LENGTH, 12);
  assert.equal(validNewPassword('12345678901'), false);
  assert.equal(validNewPassword('correct horse battery staple'), true);
  assert.equal(validSignInPassword('oldpass8'), true);
});

test('confirmation GET stages token without consuming it and removes token from clean verification URL', async () => {
  const confirm = await source('app/auth/confirm/route.ts');
  assert.match(confirm, /EMAIL_LINK_TOKEN_COOKIE/);
  assert.match(confirm, /response\.cookies\.set/);
  assert.match(confirm, /Referrer-Policy', 'no-referrer/);
  assert.doesNotMatch(confirm, /destination\.searchParams\.set\(['"]token_hash/);
  assert.doesNotMatch(confirm, /verifyOtp/);
});

test('only explicit verification POST calls verifyOtp with a server-only staged token', async () => {
  const page = await source('app/auth/verify/page.tsx');
  const action = await source('app/auth/verify/actions.ts');
  assert.match(page, /pendingEmailLinkToken/);
  assert.doesNotMatch(page, /name=["']token_hash/);
  assert.match(action, /pendingEmailLinkToken\(\)/);
  assert.match(action, /verifyOtp\(\{ token_hash: tokenHash, type \}\)/);
  assert.match(action, /clearPendingEmailLinkToken\(\)/);
});

test('password recovery is non-enumerating and gated by signed recovery intent', async () => {
  const recovery = await source('app/auth/recovery-actions.ts');
  const intent = await source('lib/auth/recovery-intent.ts');
  assert.match(recovery, /resetPasswordForEmail/);
  assert.match(recovery, /message=sent/);
  assert.match(recovery, /hasValidRecoveryIntent/);
  assert.match(recovery, /auth\.getClaims\(\)/);
  assert.match(recovery, /auth\.updateUser\(\{ password \}\)/);
  assert.match(recovery, /scope: 'others'/);
  assert.match(intent, /AUTH_RECOVERY_INTENT_KEY/);
  assert.match(intent, /createHmac\(['"]sha256['"]/);
  assert.match(intent, /timingSafeEqual/);
  assert.match(intent, /httpOnly:\s*true/);
  assert.match(intent, /MAX_AGE_SECONDS = 15 \* 60/);
});

test('signed-in password changes require current password and revoke other refresh sessions', async () => {
  const security = await source('app/(main)/profile/security/actions.ts');
  assert.match(security, /current_password:\s*currentPassword/);
  assert.match(security, /auth\.getClaims\(\)/);
  assert.match(security, /scope: 'others'/);
});

test('normal logout is local while global logout is explicit and POST-only', async () => {
  const signout = await source('app/auth/signout/route.ts');
  const securityPage = await source('app/(main)/profile/security/page.tsx');
  assert.match(signout, /scope: 'local' \| 'global' = 'local'/);
  assert.match(signout, /scope === 'global'/);
  assert.match(signout, /sameOriginRequest/);
  assert.doesNotMatch(signout, /export async function GET/);
  assert.match(securityPage, /name="scope" value="global"/);
});

test('Supabase SSR proxy preserves refresh headers and verifies claims immediately', async () => {
  const proxy = await source('lib/supabase/proxy.ts');
  assert.match(proxy, /setAll\(cookiesToSet, headers\)/);
  assert.match(proxy, /Object\.entries\(headers \?\? \{\}\)/);
  assert.match(proxy, /auth\.getClaims\(\)/);
  assert.match(proxy, /private, no-store/);
});

test('repo contains scanner-safe confirmation and recovery templates', async () => {
  const confirmation = await readFile(new URL('../../supabase/templates/confirm-signup.html', import.meta.url), 'utf8');
  const recovery = await readFile(new URL('../../supabase/templates/recovery.html', import.meta.url), 'utf8');
  assert.match(confirmation, /token_hash=\{\{ \.TokenHash \}\}/);
  assert.match(confirmation, /type=email/);
  assert.match(recovery, /token_hash=\{\{ \.TokenHash \}\}/);
  assert.match(recovery, /type=recovery/);
  assert.match(recovery, /next=\/auth\/update-password/);
});
