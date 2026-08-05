import assert from 'node:assert/strict';
import { readFile, readdir } from 'node:fs/promises';
import test from 'node:test';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const testDirectory = dirname(fileURLToPath(import.meta.url));
const webRoot = resolve(testDirectory, '..');
const repositoryRoot = resolve(webRoot, '..');
const migrationsRoot = resolve(repositoryRoot, 'supabase/migrations');
const migrationName = '20260805132201_nutrition_persistence.sql';

async function readMigration(): Promise<string> {
  return readFile(resolve(migrationsRoot, migrationName), 'utf8');
}

test('Stage 4D adds exactly one nutrition migration after identity', async () => {
  const migrations = (await readdir(migrationsRoot)).filter((name) => name.endsWith('.sql')).sort();
  assert.deepEqual(migrations, [
    '20260804232149_identity_foundation.sql',
    migrationName,
  ]);
});

test('nutrition goals store Shared Core JSON without SQL arithmetic', async () => {
  const sql = await readMigration();

  assert.match(sql, /create table public\.nutrition_goals/i);
  assert.match(sql, /user_id\s+uuid\s+primary key\s+references auth\.users\s*\(id\)\s+on delete cascade/i);
  assert.match(sql, /daily\s+jsonb\s+not null/i);
  assert.match(sql, /core_schema_version\s+smallint\s+not null\s+default\s+1/i);
  assert.match(sql, /jsonb_typeof\s*\(\s*daily\s*\)\s*=\s*'object'/i);

  assert.doesNotMatch(sql, /energy_kcal\s+(numeric|integer|real|double precision)/i);
  assert.doesNotMatch(sql, /protein_g\s+(numeric|integer|real|double precision)/i);
  assert.doesNotMatch(sql, /carbs_g\s+(numeric|integer|real|double precision)/i);
  assert.doesNotMatch(sql, /fat_g\s+(numeric|integer|real|double precision)/i);
});

test('nutrition entries preserve NutritionEstimate and simple diary identity', async () => {
  const sql = await readMigration();

  assert.match(sql, /create table public\.nutrition_entries/i);
  assert.match(sql, /user_id\s+uuid\s+not null\s+references auth\.users\s*\(id\)\s+on delete cascade/i);
  assert.match(sql, /client_mutation_id\s+text\s+not null/i);
  assert.match(sql, /local_date\s+date\s+not null/i);
  assert.match(sql, /meal_type\s+text\s+not null/i);
  assert.match(sql, /source_type\s+text\s+not null/i);
  assert.match(sql, /source_id\s+text\s+not null/i);
  assert.match(sql, /estimate\s+jsonb\s+not null/i);
  assert.match(sql, /estimate\s*\?\s*'grams'/i);
  assert.match(sql, /estimate\s*\?\s*'center'/i);
  assert.match(sql, /estimate\s*->\s*'grams'\s*=\s*'null'::jsonb/i);
  assert.match(sql, /unique\s*\(\s*user_id\s*,\s*client_mutation_id\s*\)/i);
  assert.match(sql, /meal_type\s+in\s*\(\s*'breakfast'\s*,\s*'lunch'\s*,\s*'dinner'\s*,\s*'snack'\s*\)/i);
  assert.match(sql, /source_type\s+in\s*\(\s*'food'\s*,\s*'recipe'\s*,\s*'custom'\s*\)/i);
});

test('both nutrition tables are RLS protected with own-row policies', async () => {
  const sql = await readMigration();

  for (const table of ['nutrition_goals', 'nutrition_entries']) {
    assert.match(sql, new RegExp(`alter table public\\.${table} enable row level security`, 'i'));
    assert.match(sql, new RegExp(`revoke all on table public\\.${table} from anon`, 'i'));
    assert.match(sql, new RegExp(`grant select, insert, update, delete on table public\\.${table} to authenticated`, 'i'));

    for (const command of ['select', 'insert', 'update', 'delete']) {
      assert.match(sql, new RegExp(`create policy\\s+"?${table}_${command}_own"?`, 'i'));
    }
  }

  for (const policy of ['nutrition_goals_update_own', 'nutrition_entries_update_own']) {
    const block = sql.match(new RegExp(`create policy\\s+"?${policy}"?[\\s\\S]*?;`, 'i'))?.[0];
    assert.ok(block, `Missing policy: ${policy}`);
    assert.match(block, /using\s*\(/i);
    assert.match(block, /with check\s*\(/i);
  }

  assert.doesNotMatch(sql, /using\s*\(\s*true\s*\)/i);
  assert.doesNotMatch(sql, /with check\s*\(\s*true\s*\)/i);
});

test('generated types expose nutrition tables as JSON-backed persistence', async () => {
  const source = await readFile(resolve(webRoot, 'lib/supabase/database.types.ts'), 'utf8');

  assert.match(source, /nutrition_goals:/);
  assert.match(source, /nutrition_entries:/);
  assert.match(source, /daily:\s*Json/);
  assert.match(source, /estimate:\s*Json/);
  assert.match(source, /client_mutation_id:\s*string/);
  assert.match(source, /local_date:\s*string/);
  assert.match(source, /core_schema_version:\s*number/);
});

test('nutrition migration contains no key material or SQL nutrition math', async () => {
  const sql = await readMigration();

  assert.doesNotMatch(sql, /service[_-]?role|sb_secret_|sb_publishable_|eyJ[A-Za-z0-9_-]+\./i);
  assert.doesNotMatch(sql, /\b(sum|avg)\s*\(/i);
  assert.doesNotMatch(sql, /\b(calories|protein|carbs|fat)\s*[+*\/-]/i);
});
