import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  PROGRAM_CYCLE_SCHEMA_VERSION,
  parseProgramCycleStatus,
  programCycleEndDate,
  programCycleStatusLabel,
} from '@/lib/program-cycle/core';

const webRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const repoRoot = resolve(webRoot, '..');
async function web(path: string) { return readFile(resolve(webRoot, path), 'utf8'); }
async function repo(path: string) { return readFile(resolve(repoRoot, path), 'utf8'); }

test('Program Cycle core keeps status and duration boundaries deterministic', () => {
  assert.equal(PROGRAM_CYCLE_SCHEMA_VERSION, 1);
  assert.equal(parseProgramCycleStatus('draft'), 'draft');
  assert.equal(parseProgramCycleStatus('paused'), 'paused');
  assert.equal(parseProgramCycleStatus('unknown'), null);
  assert.equal(programCycleEndDate('2026-08-11', 14), '2026-08-24');
  assert.equal(programCycleEndDate('2026-12-20', 84), '2027-03-13');
  assert.throws(() => programCycleEndDate('2026-02-30', 14));
  assert.throws(() => programCycleEndDate('2026-08-11', 85));
  assert.equal(programCycleStatusLabel('generating'), 'در حال ساخت');
});

test('Program Cycle migration enforces ownership, one open cycle, idempotency and revision checks', async () => {
  const migration = await repo('supabase/migrations/20260811120000_program_cycle_lifecycle.sql');
  assert.match(migration, /create table public\.program_cycles/);
  assert.match(migration, /enable row level security/);
  assert.match(migration, /program_cycles_select_own/);
  assert.match(migration, /program_cycles_one_open_per_user_idx/);
  assert.match(migration, /generation_idempotency_key/);
  assert.match(migration, /onboarding_snapshot_sha256/);
  assert.match(migration, /create or replace function public\.ensure_program_cycle/);
  assert.match(migration, /create or replace function public\.transition_program_cycle/);
  assert.match(migration, /enforce_program_cycle_transition/);
  assert.match(migration, /immutable_program_cycle_metadata/);
  assert.match(migration, /program_cycle_plan_linkage_locked/);
  assert.match(migration, /user_onboarding onboarding/);
  assert.match(migration, /p_expected_revision/);
  assert.match(migration, /stale_program_cycle_revision/);
  assert.match(migration, /security invoker/);
  const insertGrant = migration.match(/grant insert \(([\s\S]*?)\) on table public\.program_cycles to authenticated;/)?.[1] ?? '';
  assert.doesNotMatch(insertGrant, /\b(status|revision|generation_attempt|active_workout_plan_id)\b/);
  assert.doesNotMatch(migration, /\b(raw_prompt|provider_key|provider_payload|health_snapshot)\b/i);
});

test('Ready creates a real draft cycle without claiming planner output', async () => {
  const ready = await web('app/onboarding/ready/page.tsx');
  const actions = await web('app/onboarding/ready/actions.ts');
  const button = await web('app/onboarding/ready/create-cycle-button.tsx');
  assert.match(ready, /createProgramCycle/);
  assert.match(ready, /CreateCycleButton/);
  assert.match(button, /رفتن به برنامه من/);
  assert.doesNotMatch(ready, /برنامه با موفقیت ساخته شد|Demo Onboarding|ورودی معتبر چرخه/);
  assert.match(actions, /activeAuthSession/);
  assert.match(actions, /\.eq\('provider', 'avalai'\)/);
  assert.match(actions, /parseOnboardingDraft/);
  assert.match(actions, /ensureProgramCycle/);
  assert.match(actions, /redirect\('\/program'\)/);
  assert.match(button, /useFormStatus/);
  assert.match(button, /disabled=\{pending\}/);
});

test('Program page reads the current user cycle and exposes the real generation lifecycle', async () => {
  const page = await web('app/(main)/program/page.tsx');
  const data = await web('lib/program-cycle/data.ts');
  assert.match(page, /loadProgramCycleSnapshot/);
  assert.match(page, /ساخت برنامهٔ تمرین و تغذیه/);
  assert.match(page, /activateProgramCycle/);
  assert.doesNotMatch(page, /Stage \d+|provenance|idempotency/);
  assert.match(data, /activeAuthSession/);
  assert.match(data, /from\('program_cycles'\)/);
  assert.match(data, /\.eq\('user_id', active\.userId\)/);
  assert.match(data, /\.limit\(1\)/);
});

test('generated database types expose Program Cycle tables and RPCs', async () => {
  const types = await web('lib/supabase/database.types.ts');
  assert.match(types, /program_cycles:/);
  assert.match(types, /ensure_program_cycle:/);
  assert.match(types, /transition_program_cycle:/);
});

test('Data-integrity hardening migration locks reference tables and freezes terminal history', async () => {
  const migration = await repo('supabase/migrations/20260819090000_data_integrity_hardening.sql');
  // Reference tables become RLS-protected and read-only for everyone, so a
  // future write grant or a direct PostgREST call can never mutate them.
  assert.match(migration, /alter table public\.exercise_registry enable row level security/);
  assert.match(migration, /alter table public\.exercise_substitutions enable row level security/);
  assert.match(migration, /create policy exercise_registry_read[\s\S]*?for select to anon, authenticated/);
  assert.doesNotMatch(migration, /for (insert|update|delete|all) to (anon|authenticated)/i);
  // Covering indexes for the composite plan foreign keys.
  assert.match(migration, /program_cycles_active_workout_plan_fk_idx/);
  assert.match(migration, /program_cycles_active_nutrition_plan_fk_idx/);
  // Invariant 6 enforced at the database edge: terminal history is frozen.
  assert.match(migration, /freeze_terminal_workout_session[\s\S]*?workout_session_frozen/);
  assert.match(migration, /freeze_workout_sets_when_session_inactive[\s\S]*?workout_set_session_not_active/);
  assert.match(migration, /freeze_nutrition_entry_update[\s\S]*?nutrition_entry_immutable/);
  // A malformed plan cannot become persisted authority.
  assert.match(migration, /enforce_workout_plan_day_shape[\s\S]*?workout_plan_day_exercise_count/);
  // Every function keeps the search_path discipline the repo mandates.
  const functions = migration.match(/create or replace function[\s\S]*?\$\$;/g) ?? [];
  assert.ok(functions.length >= 4);
  for (const fn of functions) assert.match(fn, /set search_path = ''/);
});
