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
  'app/auth/verify/actions.ts',
  'app/auth/signout/route.ts',
  'components/account-state.tsx',
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

test('email/password Auth uses Server Actions and scanner-safe verification', async () => {
  const actions = await readWeb('app/auth/actions.ts');
  const callback = await readWeb('app/auth/callback/route.ts');
  const confirm = await readWeb('app/auth/confirm/route.ts');
  const verify = await readWeb('app/auth/verify/actions.ts');
  const password = await readWeb('lib/auth/password.ts');
  const signout = await readWeb('app/auth/signout/route.ts');

  assert.match(actions, /^['"]use server['"];?/m);
  assert.match(actions, /signInWithPassword/);
  assert.match(actions, /auth\.signUp/);
  assert.match(actions, /bootstrapAccount/);
  assert.match(actions, /validNewPassword/);
  assert.match(password, /AUTH_PASSWORD_MIN_LENGTH = 12/);
  assert.doesNotMatch(actions, /redirect\([^\n]*(error\.message|error\.code)/);
  assert.match(callback, /exchangeCodeForSession/);
  assert.match(callback, /safeInternalPath/);
  assert.doesNotMatch(confirm, /verifyOtp/);
  assert.match(confirm, /EMAIL_LINK_TOKEN_COOKIE/);
  assert.match(verify, /verifyOtp/);
  assert.match(verify, /pendingEmailLinkToken/);
  assert.match(signout, /auth\.getClaims\(\)/);
  assert.match(signout, /auth\.signOut\(\{ scope \}\)/);
});

test('shared identity and route-scoped nutrition use separate request contracts', async () => {
  const account = await readWeb('lib/supabase/account.ts');
  const bootstrap = await readWeb('lib/supabase/bootstrap.ts');

  assert.match(account, /loadAccountIdentity/);
  assert.match(account, /loadNutritionSnapshot/);
  assert.match(account, /from\(['"]profiles['"]\)/);
  assert.match(account, /from\(['"]nutrition_goals['"]\)/);
  assert.match(account, /from\(['"]nutrition_entries['"]\)/);
  assert.match(account, /\.eq\(['"]local_date['"], localDate\)/);
  assert.match(account, /webMacrosFromEstimate/);
  assert.match(account, /parseNutritionEstimate/);
  assert.doesNotMatch(account, /dailyTargets/);
  assert.match(bootstrap, /from\(['"]profiles['"]\)/);
  assert.match(bootstrap, /from\(['"]user_settings['"]\)/);
  assert.doesNotMatch(bootstrap, /from\(['"]nutrition_goals['"]\)/);
  assert.doesNotMatch(bootstrap, /NUTRITION_CORE_SCHEMA_VERSION|dailyTargets/);
  assert.match(bootstrap, /ignoreDuplicates:\s*true/g);
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
  assert.match(source, /accountMode \? initialGoals : \(initialGoals \?\? dailyTargets\)/);
  assert.doesNotMatch(source, /toISOString\(\)\.slice\(0, 10\)/);
  assert.doesNotMatch(source, /indexedDB|sync[_ -]?queue|event[_ -]?bus|background[_ -]?sync/i);
  assert.doesNotMatch(source, /calories\s*[+*\/-]|proteinG\s*[+*\/-]|carbsG\s*[+*\/-]|fatG\s*[+*\/-]/);
});

test('main shell is identity-only and Nutrition loads only on routes that need it', async () => {
  const layout = await readWeb('app/(main)/layout.tsx');
  const today = await readWeb('app/(main)/today/page.tsx');
  const nutrition = await readWeb('app/(main)/nutrition/page.tsx');
  const shell = await readWeb('components/app-shell.tsx');
  const profile = await readWeb('components/profile-screen.tsx');

  assert.match(layout, /loadAccountIdentity/);
  assert.match(layout, /AccountStateProvider/);
  assert.doesNotMatch(layout, /NutritionStateProvider|initialDiary|loadAccountSnapshot/);
  assert.match(today, /loadNutritionSnapshot/);
  assert.match(today, /NutritionStateProvider/);
  assert.match(nutrition, /NutritionStateProvider/);
  assert.doesNotMatch(nutrition, /loadNutritionSnapshot/);
  assert.match(shell, /useAccountState/);
  assert.doesNotMatch(shell, /useNutritionState/);
  assert.match(profile, /useAccountState/);
  assert.doesNotMatch(profile, /useNutritionState|summary\.entryCount|resetDiary/);
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
      'components/app-shell.tsx',
      'lib/supabase/client.ts',
      'lib/supabase/server.ts',
      'lib/supabase/proxy.ts',
    ].map(readWeb))
  ).join('\n');

  assert.doesNotMatch(combined, /SUPABASE_SERVICE_ROLE_KEY|sb_secret_|service[_-]?role/i);
  assert.doesNotMatch(combined, /eyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+/);
});
