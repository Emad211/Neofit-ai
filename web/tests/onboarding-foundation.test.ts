import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';
import { getBodyPart } from '@/components/onboarding/body-map/body-parts';
import {
  NUTRITION_AUTHORITY_NOTE,
  buildTrainingPreview,
  createEmptyOnboardingDraft,
  markStepCompleted,
  onboardingSteps,
  validateOnboardingStep,
} from '@/lib/onboarding/model';

test('onboarding keeps the 15-step public contract', () => {
  assert.equal(onboardingSteps.length, 15);
  assert.deepEqual(onboardingSteps.map((step) => step.number), Array.from({ length: 15 }, (_, index) => index + 1));
  assert.equal(new Set(onboardingSteps.map((step) => step.slug)).size, 15);
});

test('injury body map retains exactly 73 unique front/back regions', () => {
  const parts = getBodyPart('en');
  assert.equal(parts.length, 73);
  assert.equal(new Set(parts.map((part) => `${part.face}:${part.id}`)).size, 73);
  assert.ok(parts.some((part) => part.face === 'ant'));
  assert.ok(parts.some((part) => part.face === 'post'));
});

test('empty onboarding does not invent personal facts', () => {
  const draft = createEmptyOnboardingDraft();
  assert.equal(draft.basics.name, '');
  assert.equal(draft.basics.age, null);
  assert.equal(draft.basics.heightCm, null);
  assert.equal(draft.basics.weightKg, null);
  assert.equal(draft.basics.country, '');
  assert.equal(draft.body.targetWeightKg, null);
});

test('step validation enforces goal, basics, medical acknowledgment and final consent', () => {
  const draft = createEmptyOnboardingDraft();
  assert.ok(validateOnboardingStep(draft, 2).length > 0);
  assert.ok(validateOnboardingStep(draft, 3).length > 0);
  assert.ok(validateOnboardingStep(draft, 5).length > 0);
  assert.ok(validateOnboardingStep(draft, 15).length > 0);
});

test('step completion is idempotent', () => {
  const draft = createEmptyOnboardingDraft();
  const once = markStepCompleted(draft, 4);
  const twice = markStepCompleted(once, 4);
  assert.deepEqual(twice.completedSteps, [4]);
});

test('training preview is bounded and nutrition arithmetic remains outside onboarding', async () => {
  const draft = createEmptyOnboardingDraft();
  draft.availability.daysPerWeek = 6;
  draft.availability.sessionDuration = 75;
  const preview = buildTrainingPreview(draft);
  assert.equal(preview.trainingDays, 6);
  assert.equal(preview.sessionMinutes, 75);
  assert.equal(preview.weeklyStructure.length, 6);
  assert.match(NUTRITION_AUTHORITY_NOTE, /Nutrition Core/);

  const source = await readFile(new URL('../lib/onboarding/model.ts', import.meta.url), 'utf8');
  assert.doesNotMatch(source, /\b(calorieTarget|proteinGrams|carbohydrateGrams|fatGrams|\bbmr\b)\b/i);
});
