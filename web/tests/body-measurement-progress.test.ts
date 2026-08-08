import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

async function source(path: string) {
  return readFile(new URL(`../${path}`, import.meta.url), 'utf8');
}

test('Progress no longer contains synthetic personal weight fixtures', async () => {
  const progress = await source('components/progress-screen.tsx');
  assert.doesNotMatch(progress, /weightPoints\s*=\s*\[/);
  assert.doesNotMatch(progress, /95,\s*94\.4,\s*93\.8/);
  assert.match(progress, /NeoFit هیچ روند شخصی را از خودش نمی‌سازد/);
  assert.match(progress, /body_measurements/);
});

test('body measurement storage is versioned and does not seed personal values', async () => {
  const storage = await source('lib/progress/body-measurements.ts');
  assert.match(storage, /neofit:body-measurements:v1/);
  assert.match(storage, /STORAGE_VERSION = 1/);
  assert.doesNotMatch(storage, /weightKg:\s*\d+(?:\.\d+)?[,}]/);
  assert.doesNotMatch(storage, /waistCm:\s*\d+(?:\.\d+)?[,}]/);
});

test('measurement schema has ownership, idempotency and a real trend index', async () => {
  const migration = await readFile(new URL('../../supabase/migrations/20260808141651_body_measurement_progress.sql', import.meta.url), 'utf8');
  assert.match(migration, /enable row level security/i);
  assert.match(migration, /body_measurements_user_mutation_unique unique \(user_id, client_mutation_id\)/);
  assert.match(migration, /body_measurements_user_measured_idx/);
  assert.match(migration, /\(user_id, measured_at desc\)/);
  assert.match(migration, /\(select auth\.uid\(\)\) = user_id/g);
});

test('measurement persistence requires at least one real body value', async () => {
  const migration = await readFile(new URL('../../supabase/migrations/20260808141651_body_measurement_progress.sql', import.meta.url), 'utf8');
  assert.match(migration, /weight_kg is not null or waist_cm is not null or body_fat_percent is not null/);
  assert.match(migration, /body_fat_percent >= 0 and body_fat_percent <= 100/);
});

test('Progress account requests are page-scoped and filtered by authenticated user id', async () => {
  const progress = await source('components/progress-screen.tsx');
  assert.match(progress, /\.eq\('user_id', account\.id\)/g);
  assert.match(progress, /\.limit\(180\)/);
  assert.doesNotMatch(progress, /setInterval|polling|subscribe\(/);
});
