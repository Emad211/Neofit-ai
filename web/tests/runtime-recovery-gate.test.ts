import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const webRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..');
async function source(path: string) { return readFile(resolve(webRoot, path), 'utf8'); }

test('app entry uses live Auth validation and does not blindly redirect to Today', async () => {
  const entry = await source('app/page.tsx');
  assert.match(entry, /activeAuthSession\(supabase\)/);
  assert.match(entry, /if \(!active\) redirect\('\/auth'\)/);
  assert.match(entry, /user_onboarding/);
  assert.match(entry, /status.*completed/s);
  assert.match(entry, /provider', 'avalai'/);
  assert.doesNotMatch(entry, /provider', 'google'/);
  assert.match(entry, /from\('program_cycles'\)/);
  assert.match(entry, /redirect\('\/program'\)/);
  assert.doesNotMatch(entry, /export default function HomePage\(\)\s*\{\s*redirect\('\/today'\)/);
});

test('Auth page only hides login/register for a live Auth-server user', async () => {
  const auth = await source('app/auth/page.tsx');
  assert.match(auth, /activeAuthSession\(supabase\)/);
  assert.match(auth, /if \(active\) redirect\('\/'\)/);
  assert.doesNotMatch(auth, /supabase\.auth\.getClaims\(\)/);
});

test('successful sign-in returns through lifecycle entry instead of hard-coded Today', async () => {
  const actions = await source('app/auth/actions.ts');
  const signIn = actions.slice(actions.indexOf('export async function signIn'), actions.indexOf('export async function signUp'));
  assert.match(signIn, /redirect\('\/'\)/);
  assert.doesNotMatch(signIn, /redirect\('\/today'\)/);
});

test('empty Nutrition day is a zero macro view, not a sparse-vector crash', async () => {
  const adapter = await source('lib/nutrition-adapter.ts');
  assert.match(adapter, /ZERO_WEB_MACROS/);
  assert.match(adapter, /summary\.entryCount === 0 \? ZERO_WEB_MACROS/);
  assert.match(adapter, /requiredFiniteNutrient/);
});

test('PWA registration is production-only and non-production clears stale workers/caches', async () => {
  const register = await source('components/pwa-register.tsx');
  const worker = await source('public/sw.js');
  const layout = await source('app/layout.tsx');
  assert.match(register, /environment !== 'production'/);
  assert.match(register, /navigator\.serviceWorker\.getRegistrations\(\)/);
  assert.match(register, /registration\.unregister\(\)/);
  assert.match(register, /neofit-app-shell-/);
  assert.match(register, /window\.caches\.delete/);
  assert.match(register, /\.register\('\/sw\.js'/);
  assert.match(register, /mix stale Next\.js chunks with fresh server HTML/);
  assert.match(worker, /LOCAL_DEVELOPMENT_HOSTS/);
  assert.match(worker, /localhost/);
  assert.match(worker, /IS_LOCAL_DEVELOPMENT/);
  assert.match(worker, /self\.registration\.unregister\(\)/);
  assert.match(worker, /clearNeoFitCaches\(\)/);
  assert.match(worker, /if \(IS_LOCAL_DEVELOPMENT\) return;/);
  assert.match(layout, /<PwaRegister environment=\{deploymentEnvironment\}/);
});
