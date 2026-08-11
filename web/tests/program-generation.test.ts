import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';
import { EXERCISES, evaluateExerciseSafety } from '@neofit/exercise-registry';
import { foodFixtures } from '@/data/fixtures';
import { safetyProfileFromOnboarding } from '@/lib/exercise-registry/onboarding-safety';
import { createEmptyOnboardingDraft } from '@/lib/onboarding/model';
import { materializeProgramPlans, ProgramMaterializationError } from '@/lib/program-generation/materializer';
import { parseNutritionPlanDocument, resolveNutritionPlanDocument } from '@/lib/nutrition-plan-core';
import { parseWorkoutPlanDocument } from '@/lib/workout-plan-core';

const webRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const repoRoot = resolve(webRoot, '..');

function completeDraft() {
  const draft = createEmptyOnboardingDraft();
  draft.goal.primaryGoal = 'fitness';
  draft.basics.age = 31;
  draft.basics.gender = 'male';
  draft.basics.heightCm = 178;
  draft.basics.weightKg = 82;
  draft.medical.hasHighBloodPressure = false;
  draft.medical.hasDiabetes = false;
  draft.medical.hasCardiacHistory = false;
  draft.medical.medicalAcknowledged = true;
  draft.injuries.noInjuries = true;
  draft.injuries.painDuringExercise = false;
  draft.lifestyle.activityLevel = 'moderate';
  draft.lifestyle.sleepHours = 7;
  draft.lifestyle.sleepQuality = 'good';
  draft.lifestyle.stressLevel = 'medium';
  draft.lifestyle.smoking = 'never';
  draft.nutrition.mealsPerDay = 3;
  draft.nutrition.dietType = 'balanced';
  draft.nutrition.budget = 'balanced';
  draft.nutrition.cookingAbility = 'intermediate';
  draft.nutrition.kitchenAccess = true;
  draft.nutrition.eatingOutFrequency = 'weekly';
  draft.trainingHistory.level = 'beginner';
  draft.trainingHistory.trainingAgeMonths = 2;
  draft.trainingHistory.recentBreakWeeks = 0;
  draft.trainingHistory.cardioExperience = 'basic';
  draft.trainingHistory.strengthExperience = 'basic';
  draft.availability.location = 'home';
  draft.availability.equipment = ['bodyweight', 'dumbbell', 'bands'];
  draft.availability.daysPerWeek = 4;
  draft.availability.sessionDuration = 45;
  draft.availability.preferredDays = ['sat', 'mon', 'wed', 'fri'];
  draft.availability.preferredTime = 'evening';
  draft.preferences.intensity = 'moderate';
  draft.preferences.cardioPreference = 'balanced';
  draft.preferences.trainingStyle = 'mixed';
  draft.preferences.variety = 'balanced';
  draft.preferences.nutritionStrictness = 'structured';
  draft.preferences.coachingTone = 'supportive';
  draft.confirmation.startDate = '2026-09-10';
  draft.confirmation.programDurationDays = 15;
  draft.confirmation.finalConsent = true;
  return draft;
}

test('materializer creates registry-safe workout and catalog-resolvable nutrition plans', () => {
  const draft = completeDraft();
  const result = materializeProgramPlans(draft);
  const workout = parseWorkoutPlanDocument(result.workoutPlan);
  const nutrition = parseNutritionPlanDocument(result.nutritionPlan);

  assert.ok(workout);
  assert.ok(nutrition);
  assert.equal(workout.days.length, 4);
  assert.equal(nutrition.days.length, 7);
  assert.ok(resolveNutritionPlanDocument(nutrition, foodFixtures));

  const safety = safetyProfileFromOnboarding({
    highBloodPressure: false,
    cardiacHistory: false,
    physicianRestrictions: '',
    generalLimitations: '',
    painDuringExercise: false,
    painScale: null,
    injuries: [],
  });
  for (const planned of workout.days.flatMap((day) => day.exercises)) {
    const exercise = EXERCISES.find((candidate) => candidate.id === planned.id);
    assert.ok(exercise, `missing registry exercise ${planned.id}`);
    assert.equal(exercise.nameFa, planned.name);
    assert.equal(evaluateExerciseSafety(exercise, safety).status, 'allowed');
  }
});

test('materializer fails closed when allergen metadata cannot prove a safe plan', () => {
  const draft = completeDraft();
  draft.nutrition.allergies = ['بادام زمینی'];
  assert.throws(
    () => materializeProgramPlans(draft),
    (error) => error instanceof ProgramMaterializationError && error.code === 'allergy_review_required',
  );
});

test('web catalog is no longer the six-item placeholder', () => {
  assert.ok(foodFixtures.length >= 20);
  assert.ok(foodFixtures.some((food) => food.id === 'adasi'));
  assert.ok(foodFixtures.some((food) => food.id === 'zereshk-polo-morgh'));
});

test('Stage 24 migration finalizes and activates both plan versions atomically', async () => {
  const migration = await readFile(resolve(repoRoot, 'supabase/migrations/20260811170000_program_generation.sql'), 'utf8');
  assert.match(migration, /create or replace function public\.finalize_program_cycle_generation/);
  assert.match(migration, /create or replace function public\.activate_program_cycle_plans/);
  assert.match(migration, /insert into public\.workout_plans/);
  assert.match(migration, /insert into public\.nutrition_plans/);
  assert.match(migration, /status = 'ready'/);
  assert.match(migration, /status = 'active'/);
  assert.match(migration, /stale_program_cycle_revision/);
  assert.match(migration, /security invoker/);
});

test('Program UI exposes generation, review and activation actions', async () => {
  const page = await readFile(resolve(webRoot, 'app/(main)/program/page.tsx'), 'utf8');
  const actions = await readFile(resolve(webRoot, 'app/(main)/program/actions.ts'), 'utf8');
  assert.match(page, /ساخت برنامهٔ تمرین و تغذیه/);
  assert.match(page, /فعال‌سازی برنامه/);
  assert.match(actions, /materializeProgramPlans/);
  assert.match(actions, /finalize_program_cycle_generation/);
  assert.match(actions, /activate_program_cycle_plans/);
});
