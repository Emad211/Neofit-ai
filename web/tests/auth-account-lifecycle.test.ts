import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

async function source(path: string) {
  return readFile(new URL(`../${path}`, import.meta.url), 'utf8');
}

test('email change reuses the scanner-safe one-time-link boundary', async () => {
  const confirm = await source('app/auth/confirm/route.ts');
  const verify = await source('app/auth/verify/actions.ts');
  const page = await source('app/auth/verify/page.tsx');
  assert.match(confirm, /type === 'email_change'/);
  assert.doesNotMatch(confirm, /verifyOtp/);
  assert.match(verify, /'email_change'/);
  assert.match(verify, /auth\.verifyOtp\(\{ token_hash: tokenHash, type \}\)/);
  assert.match(page, /تأیید تغییر ایمیل/);
});

test('email change requires a live Auth-server validation and does not claim immediate mutation', async () => {
  const actions = await source('app/(main)/profile/security/actions.ts');
  const page = await source('app/(main)/profile/security/page.tsx');
  assert.match(actions, /activeAuthSession\(supabase\)/);
  assert.match(actions, /auth\.updateUser\(\{ email \}\)/);
  assert.match(actions, /email === currentEmail/);
  assert.match(page, /Secure Email Change/);
  assert.match(page, /هیچ تغییر فوری فرض نمی‌شود/);
});

test('canonical account lifecycle templates avoid direct ConfirmationURL consumption', async () => {
  const changeEmail = await readFile(new URL('../../supabase/templates/email-change.html', import.meta.url), 'utf8');
  const emailChanged = await readFile(new URL('../../supabase/templates/email-changed.html', import.meta.url), 'utf8');
  const passwordChanged = await readFile(new URL('../../supabase/templates/password-changed.html', import.meta.url), 'utf8');
  const reauth = await readFile(new URL('../../supabase/templates/reauthentication.html', import.meta.url), 'utf8');
  assert.match(changeEmail, /token_hash=\{\{ \.TokenHash \}\}/);
  assert.match(changeEmail, /type=email_change/);
  assert.match(changeEmail, /next=\/profile\/security/);
  assert.doesNotMatch(changeEmail, /\.ConfirmationURL/);
  assert.match(emailChanged, /\{\{ \.OldEmail \}\}/);
  assert.match(emailChanged, /\{\{ \.Email \}\}/);
  assert.match(emailChanged, /\/profile\/security/);
  assert.match(passwordChanged, /\/auth\/recover/);
  assert.match(reauth, /\{\{ \.Token \}\}/);
});

test('account deletion is not faked into the browser Auth slice', async () => {
  const securityActions = await source('app/(main)/profile/security/actions.ts');
  const securityPage = await source('app/(main)/profile/security/page.tsx');
  assert.doesNotMatch(securityActions, /admin\.deleteUser|service[_-]?role|SUPABASE_SERVICE_ROLE_KEY/);
  assert.doesNotMatch(securityPage, /حذف حساب/);
});
