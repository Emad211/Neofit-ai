import assert from 'node:assert/strict';
import { access, readFile, readdir } from 'node:fs/promises';
import test from 'node:test';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const testDirectory = dirname(fileURLToPath(import.meta.url));
const webRoot = resolve(testDirectory, '..');
const repositoryRoot = resolve(webRoot, '..');

const requiredFiles = [
  'lib/supabase/env.ts',
  'lib/supabase/client.ts',
  'lib/supabase/server.ts',
  'lib/supabase/proxy.ts',
  'proxy.ts',
  '.env.example',
] as const;

async function readWeb(relativePath: string): Promise<string> {
  return readFile(resolve(webRoot, relativePath), 'utf8');
}

test('Stage 4B foundation files and local Supabase config exist', async () => {
  await Promise.all(requiredFiles.map((relativePath) => access(resolve(webRoot, relativePath))));
  await access(resolve(repositoryRoot, 'supabase/config.toml'));
});

test('public environment parser is fail-closed and accepts the project contract', async () => {
  const { parseSupabasePublicEnv } = await import('../lib/supabase/env');

  assert.throws(() => parseSupabasePublicEnv({}), /NEXT_PUBLIC_SUPABASE_URL/);
  assert.throws(
    () =>
      parseSupabasePublicEnv({
        NEXT_PUBLIC_SUPABASE_URL: 'javascript:alert(1)',
        NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: 'not-empty',
      }),
    /valid Supabase URL/,
  );
  assert.throws(
    () =>
      parseSupabasePublicEnv({
        NEXT_PUBLIC_SUPABASE_URL: 'https://rjwrobltmjodfarnltal.supabase.co',
        NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: '   ',
      }),
    /NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY/,
  );

  assert.deepEqual(
    parseSupabasePublicEnv({
      NEXT_PUBLIC_SUPABASE_URL: 'https://rjwrobltmjodfarnltal.supabase.co/',
      NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: 'sb_publishable_test_value',
    }),
    {
      url: 'https://rjwrobltmjodfarnltal.supabase.co',
      publishableKey: 'sb_publishable_test_value',
    },
  );

  assert.deepEqual(
    parseSupabasePublicEnv({
      NEXT_PUBLIC_SUPABASE_URL: 'http://127.0.0.1:54321',
      NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: 'local-publishable-key',
    }),
    {
      url: 'http://127.0.0.1:54321',
      publishableKey: 'local-publishable-key',
    },
  );
});

test('browser client is client-only and uses createBrowserClient', async () => {
  const source = await readWeb('lib/supabase/client.ts');
  assert.match(source, /^['"]use client['"];?/m);
  assert.match(source, /createBrowserClient/);
  assert.match(source, /parseSupabasePublicEnv/);
  assert.doesNotMatch(source, /next\/headers|createServerClient|cookies\(/);
});

test('server client is server-only, cookie-aware and uses createServerClient', async () => {
  const source = await readWeb('lib/supabase/server.ts');
  assert.match(source, /import ['"]server-only['"]/);
  assert.match(source, /createServerClient/);
  assert.match(source, /from ['"]next\/headers['"]/);
  assert.match(source, /await cookies\(\)/);
  assert.match(source, /getAll\(\)/);
  assert.match(source, /setAll\(/);
  assert.doesNotMatch(source, /createBrowserClient/);
});

test('proxy refreshes verified claims and synchronizes cookies', async () => {
  const source = await readWeb('lib/supabase/proxy.ts');
  assert.match(source, /createServerClient/);
  assert.match(source, /request\.cookies\.getAll\(\)/);
  assert.match(source, /request\.cookies\.set/);
  assert.match(source, /response\.cookies\.set/);
  assert.match(source, /auth\.getClaims\(\)/);
  assert.doesNotMatch(source, /auth\.getSession\(\)/);
  assert.match(source, /Cache-Control/);
  assert.match(source, /private, no-store/);
});

test('Next.js root proxy delegates to the Supabase session helper', async () => {
  const source = await readWeb('proxy.ts');
  assert.match(source, /updateSupabaseSession/);
  assert.match(source, /export async function proxy/);
  assert.match(source, /matcher/);
  assert.match(source, /_next\/static/);
  assert.match(source, /sw\.js/);
  assert.match(source, /manifest\.webmanifest/);
});

test('environment example preserves app settings and contains blank Supabase values', async () => {
  const source = await readWeb('.env.example');
  const assignments = new Map(
    source
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter((line) => line && !line.startsWith('#') && line.includes('='))
      .map((line) => {
        const separator = line.indexOf('=');
        return [line.slice(0, separator), line.slice(separator + 1)] as const;
      }),
  );

  assert.equal(assignments.get('NEXT_PUBLIC_SUPABASE_URL'), '');
  assert.equal(assignments.get('NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY'), '');
  assert.equal(assignments.get('NEXT_PUBLIC_APP_URL'), 'http://localhost:3000');
  assert.equal(assignments.get('NEXT_PUBLIC_VERCEL_ENV'), 'development');
  assert.doesNotMatch(source, /sb_publishable_[A-Za-z0-9_-]+/);
  assert.doesNotMatch(source, /eyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+/);
});

test('browser-reachable Supabase files contain no service-role contract', async () => {
  const browserReachableFiles = [
    'lib/supabase/env.ts',
    'lib/supabase/client.ts',
    'lib/supabase/server.ts',
    'lib/supabase/proxy.ts',
    'proxy.ts',
  ];
  const combined = (
    await Promise.all(browserReachableFiles.map((relativePath) => readWeb(relativePath)))
  ).join('\n');

  assert.doesNotMatch(combined, /SUPABASE_SERVICE_ROLE_KEY/);
  assert.doesNotMatch(combined, /service[_-]?role/i);
});

test('package dependencies use the reviewed Supabase SSR packages', async () => {
  const packageJson = JSON.parse(await readWeb('package.json')) as {
    dependencies?: Record<string, string>;
    scripts?: Record<string, string>;
  };

  assert.equal(packageJson.dependencies?.['@supabase/supabase-js'], '2.110.9');
  assert.equal(packageJson.dependencies?.['@supabase/ssr'], '0.12.3');
  assert.equal(
    packageJson.scripts?.['test:supabase-foundation'],
    'node --import tsx --test tests/supabase-foundation.test.ts',
  );
});

test('Stage 4B config remains secret-free and later migrations stay versioned', async () => {
  const config = await readFile(resolve(repositoryRoot, 'supabase/config.toml'), 'utf8');
  assert.match(config, /^project_id = ['"]neofit['"]/m);
  assert.match(config, /site_url = ['"]http:\/\/127\.0\.0\.1:3000['"]/);
  assert.doesNotMatch(config, /rjwrobltmjodfarnltal|sb_publishable_|service[_-]?role/i);

  const migrationsDirectory = resolve(repositoryRoot, 'supabase/migrations');
  const entries = await readdir(migrationsDirectory).catch((error: NodeJS.ErrnoException) => {
    if (error.code === 'ENOENT') return [];
    throw error;
  });
  const migrations = entries.filter((entry) => entry.endsWith('.sql'));
  for (const migration of migrations) {
    assert.match(migration, /^\d{14}_[a-z0-9_]+\.sql$/);
    const sql = await readFile(resolve(migrationsDirectory, migration), 'utf8');
    assert.doesNotMatch(sql, /SUPABASE_SERVICE_ROLE_KEY|sb_secret_|sb_publishable_/i);
    assert.doesNotMatch(sql, /using\s*\(\s*true\s*\)|with check\s*\(\s*true\s*\)/i);
  }
});
