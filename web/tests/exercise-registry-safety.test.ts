import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';
import { EXERCISES } from '@neofit/exercise-registry';
import { buildCoachSystemInstruction } from '@/lib/coach/system-prompt';
import { deterministicWorkoutSafetyResponse } from '@/lib/exercise-registry/coach-safety-guard';
import { safetyProfileFromOnboarding } from '@/lib/exercise-registry/onboarding-safety';

const webRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const repoRoot = resolve(webRoot, '..');
const readWeb = (path: string) => readFile(resolve(webRoot, path), 'utf8');
const readRepo = (path: string) => readFile(resolve(repoRoot, path), 'utf8');

test('Onboarding safety mapping turns severe knee injury and cardiovascular risk into hard tags', () => {
  const profile = safetyProfileFromOnboarding({
    highBloodPressure: true,
    cardiacHistory: false,
    physicianRestrictions: '',
    generalLimitations: '',
    painDuringExercise: true,
    painScale: 8,
    injuries: [{ bodyPartId: '7', severity: 'severe', status: 'current', forbiddenMovements: '' }],
  });
  assert.ok(profile.blockedTags.includes('knee_deep_flexion'));
  assert.ok(profile.blockedTags.includes('knee_shear'));
  assert.ok(profile.blockedTags.includes('valsalva_risk'));
  assert.ok(profile.reviewReasons.includes('severe_exercise_pain'));
});

test('free-text physician restrictions fail closed into human review', () => {
  const profile = safetyProfileFromOnboarding({
    highBloodPressure: false,
    cardiacHistory: false,
    physicianRestrictions: 'از فشار بالای سر پرهیز شود',
    generalLimitations: '',
    painDuringExercise: false,
    painScale: null,
    injuries: [],
  });
  assert.ok(profile.reviewReasons.includes('physician_restriction_requires_review'));
});

test('critical workout safety is answered deterministically without inference', () => {
  const answer = deterministicWorkoutSafetyResponse({
    safety: { injuries: { painDuringExercise: true, painScale: 8 } },
    exerciseRegistry: {
      candidates: [{ nameFa: 'اسکوات هالتر', decision: { status: 'blocked' } }],
    },
  }, ['safety', 'workout']);
  assert.match(answer ?? '', /متوقف/);
  assert.match(answer ?? '', /پزشک|فیزیوتراپیست/);
  assert.match(answer ?? '', /اسکوات هالتر/);
});

test('database registry is read-only and gates every future workout plan exercise id', async () => {
  const migration = await readRepo('supabase/migrations/20260811150000_exercise_registry_safety.sql');
  assert.match(migration, /create table public\.exercise_registry/);
  assert.match(migration, /create table public\.exercise_substitutions/);
  assert.match(migration, /grant select on table public\.exercise_registry to anon, authenticated/);
  assert.doesNotMatch(migration, /grant (?:insert|update|delete).*exercise_registry/i);
  assert.match(migration, /validate_workout_plan_exercise_registry/);
  assert.match(migration, /create trigger validate_workout_plan_exercise_registry/);
  assert.match(migration, /unregistered_exercise_id/);
  assert.match(migration, /exercise_name_mismatch/);

  const seedSection = migration.split('insert into public.exercise_substitutions')[0] ?? '';
  const seedIds = Array.from(seedSection.matchAll(/^\s*\('([^']+)'/gm), (match) => match[1]).sort();
  assert.deepEqual(seedIds, EXERCISES.map((exercise) => exercise.id).sort());
});

test('Coach receives bounded local registry evidence without an extra classifier inference', async () => {
  const loader = await readWeb('lib/coach/context-loader.ts');
  const prompt = await readWeb('lib/coach/system-prompt.ts');
  const route = await readWeb('app/api/ai/coach/route.ts');
  assert.match(loader, /exerciseRegistryContext/);
  assert.match(loader, /message/);
  assert.match(prompt, /@neofit\/exercise-registry/);
  assert.match(prompt, /هویت حرکت جدید اختراع نکن/);
  assert.match(route, /deterministicWorkoutSafetyResponse/);
  assert.doesNotMatch(route, /classif(?:y|ier).*generateWithProviderFallback/is);
});

test('Coach system context fails closed before unbounded prompt cost', () => {
  assert.throws(
    () => buildCoachSystemInstruction({ untrusted: 'x'.repeat(9_100) }, ['workout']),
    /coach_context_too_large/,
  );
});

test('provider payloads enforce default and hard per-request output-token ceilings and detect truncation', async () => {
  const config = await readWeb('lib/ai/config.ts');
  const google = await readWeb('lib/ai/providers/google.ts');
  const avalai = await readWeb('lib/ai/providers/avalai.ts');
  assert.match(config, /AI_MAX_OUTPUT_TOKENS = 700/);
  assert.match(config, /AI_MAX_STRUCTURED_OUTPUT_TOKENS = 1_800/);
  assert.match(config, /AI_HARD_MAX_OUTPUT_TOKENS = 2_000/);
  for (const provider of [google, avalai]) {
    assert.match(provider, /function outputTokenLimit/);
    assert.match(provider, /Math\.min\(requested, AI_HARD_MAX_OUTPUT_TOKENS\)/);
    assert.match(provider, /: AI_MAX_OUTPUT_TOKENS/);
    // The ceiling is resolved ONCE (clamped) and the SAME value is both sent to
    // the provider and used for truncation detection — never two divergent
    // numbers, or truncation would be under-reported above the hard cap.
    assert.match(provider, /const maxOutputTokens = outputTokenLimit\(request\)/);
    assert.match(provider, /max_output_tokens: maxOutputTokens/);
    assert.match(provider, /incomplete: outputReachedCeiling\(payload\.usage, maxOutputTokens\)/);
  }
});

test('live benchmark requires an explicit secret path and never embeds a credential', async () => {
  const benchmark = await readWeb('scripts/live-agent-benchmark.ts');
  assert.match(benchmark, /NEOFIT_LIVE_KEY_FILE/);
  assert.match(benchmark, /max_output_tokens/);
  assert.match(benchmark, /transactions\/lookup/);
  assert.doesNotMatch(benchmark, /api pasha|AIza|sk-[A-Za-z0-9]/i);
});
