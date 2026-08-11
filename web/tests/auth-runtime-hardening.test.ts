import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

async function source(path: string) {
  return readFile(new URL(`../${path}`, import.meta.url), 'utf8');
}

test('signup confirmation targets the server confirm endpoint and exposes resend', async () => {
  const actions = await source('app/auth/actions.ts');
  assert.match(actions, /\/auth\/confirm\?next=\/onboarding/);
  assert.doesNotMatch(actions, /emailRedirectTo:\s*`\$\{publicAppUrl\}\/auth\/callback/);
  assert.match(actions, /auth\.resend\(\{/);
  assert.match(actions, /type:\s*'signup'/);
});

test('repo confirmation template stages a token hash on the requested canonical redirect', async () => {
  const template = await readFile(new URL('../../supabase/templates/confirm-signup.html', import.meta.url), 'utf8');
  assert.match(template, /\.RedirectTo/);
  assert.match(template, /token_hash=\{\{ \.TokenHash \}\}/);
  assert.match(template, /type=email/);
  assert.doesNotMatch(template, /\.ConfirmationURL/);
});

test('confirm GET stages token while explicit verification POST consumes it and PKCE remains compatible', async () => {
  const confirm = await source('app/auth/confirm/route.ts');
  const verify = await source('app/auth/verify/actions.ts');
  assert.match(confirm, /verificationInterstitial\(tokenHash, type, next\)/);
  assert.doesNotMatch(confirm, /verifyOtp\(/);
  assert.match(verify, /verifyOtp\(\{ token_hash: tokenHash, type \}\)/);
  assert.match(confirm, /exchangeCodeForSession\(code\)/);
  assert.match(confirm, /message=confirmed-login/);
  assert.match(verify, /clearPendingEmailLinkToken\(\)/);
});

test('legacy callback does not report a confirmed-email hostname mismatch as failed confirmation', async () => {
  const callback = await source('app/auth/callback/route.ts');
  assert.match(callback, /if \(!code\) return authRedirect\(request, 'message=confirmed-login'\)/);
  assert.match(callback, /exchangeCodeForSession\(code\)/);
  assert.doesNotMatch(callback, /auth\.signOut\(/);
});

test('first-account bootstrap retries only failed idempotent writes', async () => {
  const bootstrap = await source('lib/supabase/bootstrap.ts');
  assert.match(bootstrap, /retryBootstrapWrite/);
  assert.match(bootstrap, /setTimeout\(resolve, 150\)/);
  assert.match(bootstrap, /Promise\.all/);
  assert.match(bootstrap, /ignoreDuplicates:\s*true/g);
});

test('Preview proxy canonicalizes GET and HEAD traffic before Supabase cookie work', async () => {
  const proxy = await source('proxy.ts');
  assert.match(proxy, /environment !== 'preview'/);
  assert.match(proxy, /request\.method !== 'GET' && request\.method !== 'HEAD'/);
  assert.match(proxy, /NEXT_PUBLIC_APP_URL/);
  assert.ok(proxy.indexOf('canonicalPreviewRedirect(request)') < proxy.indexOf('updateSupabaseSession(request)'));
});

test('Auth UI provides explicit resend and confirmed-login recovery states', async () => {
  const page = await source('app/auth/page.tsx');
  assert.match(page, /resendConfirmation/);
  assert.match(page, /confirmed-login/);
  assert.match(page, /ارسال دوباره/);
});
