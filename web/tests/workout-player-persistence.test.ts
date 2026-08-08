import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { findWorkout } from '@/data/workout-fixtures';
import {
  completeWorkoutSet,
  createWorkoutPlayerState,
  currentWorkoutPosition,
  parseStoredWorkoutState,
  updateWorkoutSetDraft,
  workoutVolumeKg,
} from '@/lib/workout-session';

const webRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const repoRoot = resolve(webRoot, '..');

async function read(relativePath: string) {
  return readFile(resolve(webRoot, relativePath), 'utf8');
}

test('player state advances from completed set data and derives volume in TypeScript', () => {
  const workout = findWorkout('push-a');
  assert.ok(workout);
  let state = createWorkoutPlayerState(workout, { clientMutationId: 'test-session', startedAt: '2026-08-08T10:00:00.000Z' });
  assert.deepEqual(currentWorkoutPosition(workout, state), { exerciseIndex: 0, setIndex: 0 });
  state = updateWorkoutSetDraft(state, { exerciseIndex: 0, setIndex: 0 }, { reps: '8', weightKg: '10' });
  state = completeWorkoutSet(state, { exerciseIndex: 0, setIndex: 0 }, '2026-08-08T10:01:00.000Z');
  assert.deepEqual(currentWorkoutPosition(workout, state), { exerciseIndex: 0, setIndex: 1 });
  assert.equal(workoutVolumeKg(state), 80);
});

test('guest active-session parser is versioned and fails closed', () => {
  const workout = findWorkout('pull-a');
  assert.ok(workout);
  const state = createWorkoutPlayerState(workout, { clientMutationId: 'guest-session', startedAt: '2026-08-08T10:00:00.000Z' });
  assert.equal(parseStoredWorkoutState(JSON.stringify(state), workout)?.workoutId, 'pull-a');
  assert.equal(parseStoredWorkoutState(JSON.stringify({ ...state, workoutId: 'other' }), workout), null);
  assert.equal(parseStoredWorkoutState('{bad-json', workout), null);
});

test('workout schema has own-row RLS and composite parent ownership', async () => {
  const migration = await readFile(resolve(repoRoot, 'supabase/migrations/20260808170000_workout_session_persistence.sql'), 'utf8');
  assert.match(migration, /workout_sessions/);
  assert.match(migration, /workout_sets/);
  assert.match(migration, /foreign key \(session_id, user_id\).*workout_sessions \(id, user_id\)/s);
  assert.match(migration, /enable row level security/);
  assert.match(migration, /to authenticated/);
  assert.match(migration, /auth\.uid\(\).*user_id/s);
});

test('account set persistence upserts only the completed set and completion updates session once', async () => {
  const persistence = await read('lib/workout-persistence.ts');
  assert.match(persistence, /from\('workout_sets'\)\.upsert/);
  assert.match(persistence, /onConflict: 'session_id,exercise_order,set_order'/);
  assert.match(persistence, /from\('workout_sessions'\)[\s\S]*\.update\(\{[\s\S]*status: 'completed'/);
  assert.doesNotMatch(persistence, /indexedDB|event[_ -]?bus|background[_ -]?sync/i);
});

test('immersive player uses a claims-only identity read and details route launches it', async () => {
  const page = await read('app/workout-player/[id]/page.tsx');
  const identity = await read('lib/supabase/workout-identity.ts');
  const details = await read('components/workout-details-screen.tsx');
  assert.match(page, /loadWorkoutIdentity/);
  assert.doesNotMatch(page, /loadAccountSnapshot/);
  assert.match(identity, /auth\.getClaims\(\)/);
  assert.match(details, /href=\{`\/workout-player\/\$\{workout\.id\}`\}/);
});
