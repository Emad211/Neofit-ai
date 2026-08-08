import assert from 'node:assert/strict';
import { access, readFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';
import { hasSupabasePublicEnv } from '@/lib/supabase/env';

const testDirectory = dirname(fileURLToPath(import.meta.url));
const webRoot = resolve(testDirectory, '..');

async function readWeb(relativePath: string): Promise<string> {
  return readFile(resolve(webRoot, relativePath), 'utf8');
}

const requiredFiles = [
  'app/auth/actions.ts',
  'app/auth/page.tsx',
  'app/auth/callback/route.ts',
  'app/auth/confirm/route.ts',
  'app/auth/signout/route.ts',
  'lib/supabase/account.ts',
  'lib/supabase/bootstrap.ts',
  'lib/local-date.ts',
  'lib/web-diary-storage.ts',
] as const;

test('Auth and account integration files exist', async () => {
  await Promise.all(requiredFiles.map((filePath) => access(resolve(webRoot, filePath))));
});

test('optional Supabase configuration is explicit and fail-closed', () => {
  assert.equal(hasSupabasePublicEnv({}), false);
  assert.equal(hasSupabasePublicEnv({
    NEXT_PUBLIC_SUPABASE_URL: 'https://rjwrobltmjodfarnltal.supabase.co',
    NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: 'sb_publishable_test_value',
  }), true);
  assert.equal(hasSupabasePublicEnv({
    NEXT_PUBLIC_SUPABASE_URL: 'javascript:alert(1)',
    NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: 'not-empty',
  }), false);
});

test('Browser, Server and Proxy clients are typed and use verified claims', async () => {
  const browser = await readWeb('lib/supabase/client.ts');
  const server = await readWeb('lib/supabase/server.ts');
  const proxy = await readWeb('lib/supabase/proxy.ts');
  const combined = `${browser}\n${server}\n${proxy}`;

  assert.match(browser, /createBrowserClient<Database>/);
  assert.match(server, /createServerClient<Database>/);
  assert.match(proxy, /createServerClient<Database>/);
  assert.match(proxy, /auth\.getClaims\(\)/);
  assert.match(proxy, /private, no-store/);
  assert.doesNotMatch(combined, /service[_-]?role/i);
});

test('email/password Auth uses Server Actions and safe callback routes', async () => {
  const actions = await readWeb('app/auth/actions.ts');
  const callback = await readWeb('app/auth/callback/route.ts');
  const confirm = await readWeb('app/auth/confirm/route.ts');
  const signout = await readWeb('app/auth/signout/route.ts');

  assert.match(actions, /^['"]use server['"];?/m);
  assert.match(actions, /signInWithPassword/);
  assert.match(actions, /auth\.signUp/);
  assert.match(actions, /bootstrapAccount/);
  assert.match(actions, /password\.length < 8/);
  assert.doesNotMatch(actions, /redirect\([^\n]*(error\.message|error\.code)/);
  assert.match(callback, /exchangeCodeForSession/);
  assert.match(callback, /safeNext/);
  assert.match(confirm, /verifyOtp/);
  assert.match(confirm, /token_hash/);
  assert.match(signout, /auth\.getClaims\(\)/);
  assert.match(signout, /auth\.signOut\(\)/);
});

test('account bootstrap and snapshot use only the four merged RLS tables', async () => {
  const account = await readWeb('lib/supabase/account.ts');
  const bootstrap = await readWeb('lib/supabase/bootstrap.ts');
  const source = `${account}\n${bootstrap}`;

  for (const table of ['profiles', 'user_settings', 'nutrition_goals', 'nutrition_entries']) {
    assert.match(source, new RegExp(`from\\(['"]${table}['"]\\)`));
  }
  assert.match(bootstrap, /NUTRITION_CORE_SCHEMA_VERSION/);
  assert.match(bootstrap, /ignoreDuplicates:\s*true/g);
  assert.match(account, /webMacrosFromEstimate/);
  assert.match(account, /parseNutritionEstimate/);
  assert.match(account, /select\(['"]display_name, timezone['"]\)/);
  assert.doesNotMatch(source, /from\(['"](?:foods|recipes|sync_queue|events)['"]\)/);
  assert.doesNotMatch(source, /service[_-]?role/i);
});

test('authenticated diary writes directly and Guest state uses validated local persistence', async () => {
  const source = await readWeb('components/nutrition-state.tsx');

  assert.match(source, /from\(['"]nutrition_entries['"]\)\s*\n\s*\.insert/);
  assert.match(source, /client_mutation_id/);
  assert.match(source, /core_schema_version:\s*NUTRITION_CORE_SCHEMA_VERSION/);
  assert.match(source, /current\.filter\(\(item\) => item\.core\.id !== clientMutationId\)/);
  assert.match(source, /\.delete\(\)\s*\n\s*\.eq\(['"]user_id['"], account\.id\)/);
  assert.match(source, /formatLocalDate/);
  assert.match(source, /parseStoredWebDiary/);
  assert.match(source, /serializeStoredWebDiary/);
  assert.doesNotMatch(source, /toISOString\(\)\.slice\(0, 10\)/);
  assert.doesNotMatch(source, /indexedDB|sync[_ -]?queue|event[_ -]?bus|background[_ -]?sync/i);
  assert.doesNotMatch(source, /calories\s*[+*\/-]|proteinG\s*[+*\/-]|carbsG\s*[+*\/-]|fatG\s*[+*\/-]/);
});

test('main routes hydrate from the optional server account snapshot', async () => {
  const layout = await readWeb('app/(main)/layout.tsx');
  const shell = await readWeb('components/app-shell.tsx');
  const profile = await readWeb('components/profile-screen.tsx');

  assert.match(layout, /loadAccountSnapshot/);
  assert.match(layout, /initialDiary=\{snapshot\.diary\}/);
  assert.doesNotMatch(layout, /force-dynamic/);
  assert.match(shell, /account\?\.displayName/);
  assert.match(shell, /ورود برای ذخیره در حساب/);
  assert.match(profile, /from\(['"]profiles['"]\)\.upsert/);
  assert.match(profile, /action=["']\/auth\/signout["']/);
});

test('Service Worker keeps Auth and private account HTML outside shared cache', async () => {
  const sw = await readWeb('public/sw.js');

  assert.match(sw, /CACHE_VERSION = ['"]v4['"]/);
  assert.match(sw, /url\.pathname\.startsWith\(['"]\/auth\/['"]\)/);
  assert.match(sw, /no-store\|private/i);
  assert.match(sw, /Authenticated HTML is private\/no-store/);
  assert.match(sw, /cache\.delete\(request\)/);
  assert.match(sw, /REQUIRED_DOCUMENTS = \[['"]\/offline['"]\]/);
});

test('integration contains no privileged key material', async () => {
  const combined = (
    await Promise.all([
      ...requiredFiles,
      'components/nutrition-state.tsx',
      'components/profile-screen.tsx',
      'lib/supabase/client.ts',
      'lib/supabase/server.ts',
      'lib/supabase/proxy.ts',
    ].map(readWeb))
  ).join('\n');

  assert.doesNotMatch(combined, /SUPABASE_SERVICE_ROLE_KEY|sb_secret_|service[_-]?role/i);
  assert.doesNotMatch(combined, /eyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+/);
});
