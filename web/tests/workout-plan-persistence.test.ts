import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseWorkoutPlanDocument, workoutPlanViews } from '@/lib/workout-plan-core';

const webRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const repoRoot = resolve(webRoot, '..');

async function web(path: string) { return readFile(resolve(webRoot, path), 'utf8'); }
async function repo(path: string) { return readFile(resolve(repoRoot, path), 'utf8'); }

test('versioned workout plan parser accepts bounded numeric plan documents', () => {
  const parsed = parseWorkoutPlanDocument({
    days: [{
      id: 'day-1',
      day: 'شنبه',
      title: 'قدرت A',
      focus: 'حرکات اصلی',
      durationMinutes: 55,
      exercises: [{ id: 'squat', name: 'اسکوات', sets: 3, targetReps: '۵–۸', restSeconds: 120 }],
    }],
  });
  assert.ok(parsed);
  const views = workoutPlanViews(parsed!, { planId: 'plan-1', planVersion: 3 });
  assert.equal(views[0]?.planId, 'plan-1');
  assert.equal(views[0]?.planVersion, 3);
  assert.match(views[0]?.duration ?? '', /۵۵/);
  assert.match(views[0]?.exercises[0]?.rest ?? '', /۱۲۰/);
});

test('plan parser rejects malformed, duplicate-day and unsafe-volume documents', () => {
  assert.equal(parseWorkoutPlanDocument({ days: [] }), null);
  assert.equal(parseWorkoutPlanDocument({
    days: [
      { id: 'same', day: 'الف', title: 'الف', focus: 'الف', durationMinutes: 30, exercises: [{ id: 'x', name: 'x', sets: 3, targetReps: '8', restSeconds: 60 }] },
      { id: 'same', day: 'ب', title: 'ب', focus: 'ب', durationMinutes: 30, exercises: [{ id: 'y', name: 'y', sets: 3, targetReps: '8', restSeconds: 60 }] },
    ],
  }), null);
  assert.equal(parseWorkoutPlanDocument({
    days: [{ id: 'x', day: 'x', title: 'x', focus: 'x', durationMinutes: 30, exercises: [{ id: 'x', name: 'x', sets: 999, targetReps: '8', restSeconds: 60 }] }],
  }), null);
});

test('database plan versions are owner-scoped, append-only in content and single-active', async () => {
  const migration = await repo('supabase/migrations/20260809133914_workout_plan_versioning.sql');
  assert.match(migration, /create table public\.workout_plans/);
  assert.match(migration, /unique \(user_id, version\)/);
  assert.match(migration, /where status = 'active'/);
  assert.match(migration, /enable row level security/);
  assert.match(migration, /auth\.uid\(\).*user_id/);
  assert.match(migration, /grant update \(status, activated_at, archived_at\)/);
  assert.doesNotMatch(migration, /grant update \([^)]*plan/i);
  assert.doesNotMatch(migration, /grant delete/i);
  assert.match(migration, /security invoker/);
  assert.match(migration, /workout_plan_id uuid references public\.workout_plans/);
  assert.match(migration, /workout_plan_version integer/);
});

test('plan activation cannot switch definitions while a workout session is active', async () => {
  const guard = await repo('supabase/migrations/20260809134603_guard_workout_plan_activation_during_session.sql');
  assert.match(guard, /status = 'active'/);
  assert.match(guard, /active_workout_session_exists/);
  assert.equal((guard.match(/active_workout_session_exists/g) ?? []).length, 2);
});

test('authenticated workout pages resolve account plan snapshots instead of fixture modules', async () => {
  const page = await web('app/(main)/workout/page.tsx');
  const details = await web('app/(main)/workout/[id]/page.tsx');
  const player = await web('app/workout-player/[id]/page.tsx');
  for (const source of [page, details, player]) {
    assert.match(source, /loadWorkoutPlanSnapshot/);
    assert.doesNotMatch(source, /workout-fixtures/);
  }
  assert.doesNotMatch(details, /generateStaticParams/);
  assert.doesNotMatch(player, /generateStaticParams/);
});

test('account session persistence stores immutable plan provenance', async () => {
  const persistence = await web('lib/workout-persistence.ts');
  assert.match(persistence, /workout_plan_id: planId/);
  assert.match(persistence, /workout_plan_version: planVersion/);
  assert.match(persistence, /session\.workout_plan_id !== planId/);
  assert.match(persistence, /session\.workout_plan_version !== planVersion/);
});

test('workout UI avoids synthetic calories and guest demo plans', async () => {
  const screen = await web('components/workout-screen.tsx');
  const details = await web('components/workout-details-screen.tsx');
  assert.doesNotMatch(screen, /\.calories|kcal/i);
  assert.doesNotMatch(details, /\.calories|kcal/i);
  assert.match(screen, /برای ساخت برنامه شخصی وارد حساب شو/);
  assert.match(screen, /هنوز برنامه تمرینی نداری/);
  assert.match(screen, /رفتن به برنامه من/);
  assert.doesNotMatch(screen, /برنامه نمونه مهمان|Demo|fixture/i);
});

test('generated Supabase types include workout plans and session provenance', async () => {
  const types = await web('lib/supabase/database.types.ts');
  assert.match(types, /workout_plans:/);
  assert.match(types, /activate_workout_plan:/);
  assert.match(types, /create_workout_plan_version:/);
  assert.match(types, /workout_plan_id: string \| null/);
  assert.match(types, /workout_plan_version: number \| null/);
});
