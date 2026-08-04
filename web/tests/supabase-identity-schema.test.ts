import assert from 'node:assert/strict';
import { access, readFile, readdir } from 'node:fs/promises';
import test from 'node:test';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const testDirectory = dirname(fileURLToPath(import.meta.url));
const webRoot = resolve(testDirectory, '..');
const repositoryRoot = resolve(webRoot, '..');
const migrationsRoot = resolve(repositoryRoot, 'supabase/migrations');
const expectedMigration = '20260805000100_identity_foundation.sql';

async function readMigration(): Promise<string> {
  return readFile(resolve(migrationsRoot, expectedMigration), 'utf8');
}

test('Stage 4C has exactly one identity migration and generated database types', async () => {
  const migrations = (await readdir(migrationsRoot)).filter((name) => name.endsWith('.sql'));
  assert.deepEqual(migrations, [expectedMigration]);
  await access(resolve(webRoot, 'lib/supabase/database.types.ts'));
});

test('identity migration creates bounded owner-linked tables', async () => {
  const sql = await readMigration();

  assert.match(sql, /create table public\.profiles/i);
  assert.match(sql, /id\s+uuid\s+primary key\s+references auth\.users\s*\(id\)\s+on delete cascade/i);
  assert.match(sql, /display_name\s+text/i);
  assert.match(sql, /char_length\s*\(\s*btrim\s*\(\s*display_name\s*\)\s*\)\s+between\s+1\s+and\s+80/i);
  assert.match(sql, /locale\s+text\s+not null\s+default\s+'fa'/i);
  assert.match(sql, /locale\s+in\s*\(\s*'fa'\s*,\s*'en'\s*\)/i);
  assert.match(sql, /timezone\s+text\s+not null\s+default\s+'Asia\/Tehran'/i);

  assert.match(sql, /create table public\.user_settings/i);
  assert.match(sql, /user_id\s+uuid\s+primary key\s+references auth\.users\s*\(id\)\s+on delete cascade/i);
  assert.match(sql, /theme\s+text\s+not null\s+default\s+'system'/i);
  assert.match(sql, /theme\s+in\s*\(\s*'system'\s*,\s*'light'\s*,\s*'dark'\s*\)/i);
  assert.match(sql, /units\s+text\s+not null\s+default\s+'metric'/i);
  assert.match(sql, /units\s+in\s*\(\s*'metric'\s*,\s*'imperial'\s*\)/i);

  assert.match(sql, /created_at\s+timestamptz\s+not null\s+default\s+now\(\)/gi);
  assert.match(sql, /updated_at\s+timestamptz\s+not null\s+default\s+now\(\)/gi);
});

test('identity migration enables RLS and defines fail-closed own-row policies', async () => {
  const sql = await readMigration();

  assert.match(sql, /alter table public\.profiles enable row level security/i);
  assert.match(sql, /alter table public\.user_settings enable row level security/i);

  const expectedPolicies = [
    ['profiles_select_own', 'select', 'id'],
    ['profiles_insert_own', 'insert', 'id'],
    ['profiles_update_own', 'update', 'id'],
    ['profiles_delete_own', 'delete', 'id'],
    ['user_settings_select_own', 'select', 'user_id'],
    ['user_settings_insert_own', 'insert', 'user_id'],
    ['user_settings_update_own', 'update', 'user_id'],
    ['user_settings_delete_own', 'delete', 'user_id'],
  ] as const;

  for (const [name, command, ownerColumn] of expectedPolicies) {
    assert.match(sql, new RegExp(`create policy\\s+"?${name}"?`, 'i'));
    assert.match(sql, new RegExp(`for\\s+${command}`, 'i'));
    assert.match(sql, new RegExp(`\\(select auth\\.uid\\(\\)\\)\\s*=\\s*${ownerColumn}`, 'i'));
  }

  assert.doesNotMatch(sql, /using\s*\(\s*true\s*\)/i);
  assert.doesNotMatch(sql, /with check\s*\(\s*true\s*\)/i);
  assert.doesNotMatch(sql, /to\s+anon/i);
});

test('write policies include both USING and WITH CHECK where required', async () => {
  const sql = await readMigration();

  for (const policy of ['profiles_update_own', 'user_settings_update_own']) {
    const block = sql.match(
      new RegExp(`create policy\\s+"?${policy}"?[\\s\\S]*?;`, 'i'),
    )?.[0];
    assert.ok(block, `Missing policy block: ${policy}`);
    assert.match(block, /using\s*\(/i);
    assert.match(block, /with check\s*\(/i);
  }

  for (const policy of ['profiles_insert_own', 'user_settings_insert_own']) {
    const block = sql.match(
      new RegExp(`create policy\\s+"?${policy}"?[\\s\\S]*?;`, 'i'),
    )?.[0];
    assert.ok(block, `Missing policy block: ${policy}`);
    assert.match(block, /with check\s*\(/i);
  }
});

test('identity migration grants authenticated users only and secures helper function', async () => {
  const sql = await readMigration();

  assert.match(sql, /revoke all on table public\.profiles from anon/i);
  assert.match(sql, /revoke all on table public\.user_settings from anon/i);
  assert.match(sql, /grant select, insert, update, delete on table public\.profiles to authenticated/i);
  assert.match(sql, /grant select, insert, update, delete on table public\.user_settings to authenticated/i);

  assert.match(sql, /create or replace function public\.set_updated_at\(\)/i);
  assert.match(sql, /set search_path\s*=\s*''/i);
  assert.match(sql, /revoke all on function public\.set_updated_at\(\) from public/i);
  assert.match(sql, /create trigger profiles_set_updated_at/i);
  assert.match(sql, /create trigger user_settings_set_updated_at/i);
});

test('generated types expose both identity tables and no nutrition tables', async () => {
  const source = await readFile(resolve(webRoot, 'lib/supabase/database.types.ts'), 'utf8');

  assert.match(source, /profiles:/);
  assert.match(source, /user_settings:/);
  assert.match(source, /display_name:/);
  assert.match(source, /locale:/);
  assert.match(source, /timezone:/);
  assert.match(source, /theme:/);
  assert.match(source, /units:/);
  assert.doesNotMatch(source, /nutrition_entries:/);
  assert.doesNotMatch(source, /nutrition_goals:/);
});

test('Stage 4C migration contains no Nutrition arithmetic or key material', async () => {
  const sql = await readMigration();

  assert.doesNotMatch(sql, /calories|protein|carbs|fat_g|energy_kcal/i);
  assert.doesNotMatch(sql, /service[_-]?role|sb_secret_|sb_publishable_|eyJ[A-Za-z0-9_-]+\./i);
});
