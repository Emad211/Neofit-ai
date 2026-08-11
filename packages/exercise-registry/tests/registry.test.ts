import assert from 'node:assert/strict';
import test from 'node:test';
import {
  EXERCISE_REGISTRY_VERSION,
  EXERCISES,
  evaluateExerciseSafety,
  findExerciseById,
  registryIntegrityErrors,
  searchExerciseRegistry,
  selectSafeSubstitutes,
  type ExerciseSafetyProfile,
} from '../src/index';

const CLEAR_PROFILE: ExerciseSafetyProfile = {
  blockedTags: [],
  reviewTags: [],
  reviewReasons: [],
};

test('registry v1 has unique stable ids and resolves every fixture exercise', () => {
  assert.equal(EXERCISE_REGISTRY_VERSION, 1);
  assert.deepEqual(registryIntegrityErrors(), []);
  assert.equal(new Set(EXERCISES.map((exercise) => exercise.id)).size, EXERCISES.length);
  for (const id of [
    'bench-press', 'incline-db-press', 'shoulder-press', 'triceps-pushdown',
    'lat-pulldown', 'row', 'rear-delt', 'curl', 'squat', 'rdl', 'leg-press', 'calf-raise',
  ]) {
    assert.ok(findExerciseById(id), `missing fixture exercise: ${id}`);
  }
});

test('search is deterministic, bounded and returns only registered identities', () => {
  const first = searchExerciseRegistry('آموزش اسکوات برای پا', 4);
  const second = searchExerciseRegistry('آموزش اسکوات برای پا', 4);
  assert.deepEqual(first, second);
  assert.ok(first.length >= 1 && first.length <= 4);
  assert.equal(first[0]?.id, 'squat');
  assert.ok(first.every((exercise) => findExerciseById(exercise.id) === exercise));
  assert.deepEqual(searchExerciseRegistry('حرکت کاملاً ساختگی ناشناخته', 4), []);
});

test('hard safety tags block unsafe exercises before model ranking', () => {
  const severeKnee: ExerciseSafetyProfile = {
    ...CLEAR_PROFILE,
    blockedTags: ['knee_deep_flexion', 'knee_shear'],
  };
  const squat = findExerciseById('squat');
  assert.ok(squat);
  const decision = evaluateExerciseSafety(squat, severeKnee);
  assert.equal(decision.status, 'blocked');
  assert.ok(decision.matchedTags.includes('knee_deep_flexion'));

  const alternatives = selectSafeSubstitutes('squat', severeKnee, ['bodyweight'], 3);
  assert.ok(alternatives.some((item) => item.exercise.id === 'glute-bridge'));
  assert.ok(alternatives.every((item) => item.decision.status === 'allowed'));
});

test('review-only constraints never become an automatic safe claim', () => {
  const shoulderPress = findExerciseById('shoulder-press');
  assert.ok(shoulderPress);
  const decision = evaluateExerciseSafety(shoulderPress, {
    blockedTags: [],
    reviewTags: ['shoulder_overhead'],
    reviewReasons: ['current_moderate_injury'],
  });
  assert.equal(decision.status, 'review');
  assert.ok(decision.reasons.includes('current_moderate_injury'));
});

test('substitutions respect available equipment without asking an LLM', () => {
  const alternatives = selectSafeSubstitutes('bench-press', CLEAR_PROFILE, ['bodyweight'], 5);
  assert.ok(alternatives.length >= 1);
  assert.equal(alternatives[0]?.exercise.id, 'push-up');
  assert.ok(alternatives.every((item) => item.exercise.equipment.every((equipment) => equipment === 'bodyweight')));
});
