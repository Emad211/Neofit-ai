import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';
import { AUTH_PASSWORD_MIN_LENGTH, validNewPassword, validSignInPassword } from '@/lib/auth/password';
import { safeInternalPath } from '@/lib/auth/redirect';

async function source(path: string) { return readFile(new URL(`../${path}`, import.meta.url), 'utf8'); }

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
  assert.match(confirm, /canonicalAuthOrigin/);
});

test('only explicit verification POST calls verifyOtp with a server-only staged token', async () => {
  const page = await source('app/auth/verify/page.tsx');
  const action = await source('app/auth/verify/actions.ts');
  const tokenCookie = await source('lib/auth/email-link-intent.ts');
  assert.match(page, /pendingEmailLinkToken/);
  assert.doesNotMatch(page, /name=["']token_hash/);
  assert.match(action, /pendingEmailLinkToken\(\)/);
  assert.match(action, /verifyOtp\(\{ token_hash: tokenHash, type \}\)/);
  assert.match(action, /clearPendingEmailLinkToken\(\)/);
  assert.match(tokenCookie, /path:\s*['"]\/auth\/verify['"]/);
  assert.match(tokenCookie, /maxAge:\s*0/);
});

test('recovery signing config is checked before sending or consuming a one-time recovery token', async () => {
  const recovery = await source('app/auth/recovery-actions.ts');
  const verify = await source('app/auth/verify/actions.ts');
  const confirm = await source('app/auth/confirm/route.ts');
  assert.match(recovery, /!hasRecoveryIntentKey\(\)/);
  assert.match(confirm, /recoveryFlow && !hasRecoveryIntentKey\(\)/);
  const keyCheck = verify.indexOf("typeValue === 'recovery' && !hasRecoveryIntentKey()");
  const verification = verify.indexOf('auth.verifyOtp');
  assert.ok(keyCheck >= 0 && verification > keyCheck, 'recovery key must be checked before verifyOtp');
});

test('password recovery is non-enumerating and bound to signed exact session intent', async () => {
  const recovery = await source('app/auth/recovery-actions.ts');
  const verify = await source('app/auth/verify/actions.ts');
  const intent = await source('lib/auth/recovery-intent.ts');
  assert.match(recovery, /resetPasswordForEmail/);
  assert.match(recovery, /message=sent/);
  assert.match(recovery, /activeAuthSession\(supabase\)/);
  assert.match(recovery, /hasValidRecoveryIntent\(active\.userId, active\.sessionId\)/);
  assert.match(recovery, /auth\.updateUser\(\{ password \}\)/);
  assert.match(recovery, /scope: 'others'/);
  assert.match(verify, /setRecoveryIntent\(data\.user\.id, sessionId\)/);
  assert.match(intent, /AUTH_RECOVERY_INTENT_KEY/);
  assert.match(intent, /createHmac\(['"]sha256['"]/);
  assert.match(intent, /timingSafeEqual/);
  assert.match(intent, /payloadFor\(userId: string, sessionId: string/);
  assert.match(intent, /httpOnly:\s*true/);
  assert.match(intent, /MAX_AGE_SECONDS = 15 \* 60/);
  assert.match(intent, /path:\s*['"]\/auth\/update-password['"]/);
  assert.match(intent, /maxAge:\s*0/);
});

test('sensitive Auth mutations require both local claims and live Auth-server user validation', async () => {
  const active = await source('lib/auth/active-session.ts');
  const security = await source('app/(main)/profile/security/actions.ts');
  const securityPage = await source('app/(main)/profile/security/page.tsx');
  const recoveryPage = await source('app/auth/update-password/page.tsx');
  const aiCredentials = await source('lib/ai/credential-store.ts');
  assert.match(active, /auth\.getClaims\(\)/);
  assert.match(active, /auth\.getUser\(\)/);
  assert.match(active, /session_id/);
  assert.match(security, /activeAuthSession\(supabase\)/);
  assert.match(securityPage, /activeAuthSession\(supabase\)/);
  assert.match(recoveryPage, /activeAuthSession\(supabase\)/);
  assert.match(aiCredentials, /activeAuthSession\(supabase\)/);
});

test('signed-in password changes require current password and revoke other refresh sessions', async () => {
  const security = await source('app/(main)/profile/security/actions.ts');
  assert.match(security, /current_password:\s*currentPassword/);
  assert.match(security, /scope: 'others'/);
});

test('cookie-authenticated mutation routes share a fail-closed same-origin guard', async () => {
  const origin = await source('lib/auth/request-origin.ts');
  const signout = await source('app/auth/signout/route.ts');
  const provider = await source('app/api/ai/providers/[provider]/route.ts');
  const respond = await source('app/api/ai/respond/route.ts');
  const coach = await source('app/api/ai/coach/route.ts');

  assert.match(origin, /origin/);
  assert.match(origin, /sec-fetch-site/);
  assert.match(origin, /same-origin/);
  // The attacker-controllable Host header may only widen the allow-list in local
  // development. In preview/production the canonical origin is requestUrl.origin
  // plus the environment-controlled NEXT_PUBLIC_APP_URL, never a spoofable Host.
  assert.match(origin, /deploymentEnvironment === 'development'/);
  const hostGate = origin.indexOf("deploymentEnvironment === 'development'");
  const hostRead = origin.indexOf("headers.get('host')");
  assert.ok(hostGate >= 0 && hostRead > hostGate, 'Host header trust must be gated behind the development check');
  for (const route of [signout, provider, respond, coach]) {
    assert.match(route, /isSameOriginBrowserMutation/);
  }
  assert.doesNotMatch(signout, /export async function GET/);
  assert.match(provider, /cross_origin_request/);
  assert.match(respond, /cross_origin_request/);
  assert.match(coach, /cross_origin_request/);
});

test('global response headers ship a safe CSP subset and production-only HSTS', async () => {
  const config = await readFile(new URL('../next.config.ts', import.meta.url), 'utf8');
  // The CSP hardens framing, base hijacking, plugin embedding and off-origin form
  // posts — directives that cannot silently break hydration.
  assert.match(config, /Content-Security-Policy/);
  assert.match(config, /frame-ancestors 'none'/);
  assert.match(config, /base-uri 'self'/);
  assert.match(config, /object-src 'none'/);
  assert.match(config, /form-action 'self'/);
  assert.match(config, /upgrade-insecure-requests/);
  // A fetch directive without a nonce architecture would break React hydration
  // past the build gate, so none may be added until proven on a hosted run.
  assert.doesNotMatch(config, /script-src|style-src|default-src|connect-src|img-src/);
  // HSTS is a long-lived HTTPS commitment: production only, never preview/dev http.
  assert.match(config, /Strict-Transport-Security/);
  assert.match(config, /max-age=63072000; includeSubDomains; preload/);
  const hstsGuard = config.indexOf('isProduction');
  const hstsHeader = config.indexOf('Strict-Transport-Security');
  assert.ok(hstsGuard >= 0 && hstsHeader > hstsGuard, 'HSTS must be emitted only under the production guard');
  assert.match(config, /=== 'production'/);
});

test('normal logout is local while global logout is explicit', async () => {
  const signout = await source('app/auth/signout/route.ts');
  const securityPage = await source('app/(main)/profile/security/page.tsx');
  assert.match(signout, /scope: 'local' \| 'global' = 'local'/);
  assert.match(signout, /scope === 'global'/);
  assert.match(securityPage, /name="scope" value="global"/);
});

test('auth forms disable duplicate submissions while pending', async () => {
  const button = await source('app/auth/auth-submit-button.tsx');
  const authPage = await source('app/auth/page.tsx');
  const recoveryPage = await source('app/auth/recover/page.tsx');
  const verifyPage = await source('app/auth/verify/page.tsx');
  assert.match(button, /useFormStatus/);
  assert.match(button, /disabled=\{disabled \|\| pending\}/);
  assert.match(authPage, /AuthSubmitButton/);
  assert.match(recoveryPage, /AuthSubmitButton/);
  assert.match(verifyPage, /AuthSubmitButton/);
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

test('hosted root never silently falls back to Guest when Supabase public env is missing', async () => {
  const home = await source('app/page.tsx');
  const envGuard = home.indexOf('if (!hasSupabasePublicEnv())');
  const hostedGuard = home.indexOf("deploymentEnvironment === 'preview' || deploymentEnvironment === 'production'");
  const authRedirect = home.indexOf("redirect('/auth?error=config')");
  const guestRedirect = home.indexOf("redirect('/today')");

  assert.ok(envGuard >= 0, 'root must explicitly guard missing Supabase public configuration');
  assert.ok(hostedGuard > envGuard, 'hosted environment check must happen inside the missing-config guard');
  assert.ok(authRedirect > hostedGuard, 'hosted missing configuration must redirect to Auth');
  assert.ok(guestRedirect > authRedirect, 'Guest fallback must remain development-only after hosted fail-closed logic');
});
