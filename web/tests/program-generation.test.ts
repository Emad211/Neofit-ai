import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';
import { EXERCISES, evaluateExerciseSafety } from '@neofit/exercise-registry';
import { foodFixtures } from '@/data/fixtures';
import { safetyProfileFromOnboarding } from '@/lib/exercise-registry/onboarding-safety';
import { createEmptyOnboardingDraft, type OnboardingDraft } from '@/lib/onboarding/model';
import {
  eligibleFoodsForProgram,
  exercisesPerDayForProgram,
  materializeProgramPlans,
  ProgramMaterializationError,
  safeExercisesForProgram,
} from '@/lib/program-generation/materializer';
import {
  parseNutritionPlannerOutput,
  parseTrainingPlannerOutput,
  type ProgramPlannerSelections,
} from '@/lib/program-generation/planner-contract';
import { parseNutritionPlanDocument, resolveNutritionPlanDocument } from '@/lib/nutrition-plan-core';
import { parseWorkoutPlanDocument } from '@/lib/workout-plan-core';

const webRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const repoRoot = resolve(webRoot, '..');

function completeDraft() {
  const draft = createEmptyOnboardingDraft();
  draft.goal.primaryGoal = 'fitness';
  draft.goal.targetTimeline = 'balanced';
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

function validSelections(draft: OnboardingDraft): ProgramPlannerSelections {
  const exercises = safeExercisesForProgram(draft);
  const exerciseCount = Math.min(exercisesPerDayForProgram(draft), exercises.length);
  const trainingDays = draft.availability.daysPerWeek!;
  const training = {
    days: Array.from({ length: trainingDays }, (_, dayIndex) => {
      const rotated = [...exercises.slice(dayIndex), ...exercises.slice(0, dayIndex)];
      return rotated.slice(0, exerciseCount).map((exercise) => exercise.id);
    }),
  };

  const foods = eligibleFoodsForProgram(draft);
  const mealsPerDay = draft.nutrition.mealsPerDay!;
  const nutrition = {
    days: Array.from({ length: 7 }, (_, dayIndex) => (
      Array.from({ length: mealsPerDay }, (_, mealIndex) => [{
        id: foods[(dayIndex + mealIndex) % foods.length]!.id,
        portion: 1,
      }])
    )),
  };
  return { training, nutrition };
}

test('materializer creates registry-safe workout and catalog-resolvable nutrition plans from bounded planner selections', () => {
  const draft = completeDraft();
  const result = materializeProgramPlans(draft, validSelections(draft));
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

test('planner contracts reject prose, extra fields, duplicate or invented identities and unbounded portions', () => {
  const draft = completeDraft();
  const exercises = safeExercisesForProgram(draft);
  const allowedExercises = new Set(exercises.map((exercise) => exercise.id));
  const exerciseCount = Math.min(exercisesPerDayForProgram(draft), exercises.length);
  const validExerciseIds = exercises.slice(0, exerciseCount).map((exercise) => exercise.id);
  const trainingObject = { days: Array.from({ length: 4 }, () => validExerciseIds) };
  const trainingJson = JSON.stringify(trainingObject);
  assert.equal(parseTrainingPlannerOutput(trainingJson, {
    expectedDays: 4,
    exercisesPerDay: exerciseCount,
    allowedIds: allowedExercises,
  }).days.length, 4);
  assert.throws(() => parseTrainingPlannerOutput(`result: ${trainingJson}`, {
    expectedDays: 4,
    exercisesPerDay: exerciseCount,
    allowedIds: allowedExercises,
  }));
  assert.throws(() => parseTrainingPlannerOutput(JSON.stringify({ ...trainingObject, note: 'extra' }), {
    expectedDays: 4,
    exercisesPerDay: exerciseCount,
    allowedIds: allowedExercises,
  }));
  assert.throws(() => parseTrainingPlannerOutput(
    JSON.stringify({ days: Array.from({ length: 4 }, () => [...validExerciseIds.slice(0, -1), 'invented-id']) }),
    { expectedDays: 4, exercisesPerDay: exerciseCount, allowedIds: allowedExercises },
  ));
  if (exerciseCount >= 2) {
    assert.throws(() => parseTrainingPlannerOutput(
      JSON.stringify({ days: Array.from({ length: 4 }, () => [validExerciseIds[0], validExerciseIds[0], ...validExerciseIds.slice(2)]) }),
      { expectedDays: 4, exercisesPerDay: exerciseCount, allowedIds: allowedExercises },
    ));
  }

  const foods = eligibleFoodsForProgram(draft);
  const allowedFoods = new Set(foods.map((food) => food.id));
  const validMeal = [{ id: foods[0]!.id, portion: 1 }];
  assert.equal(parseNutritionPlannerOutput(
    JSON.stringify({ days: Array.from({ length: 7 }, () => Array.from({ length: 3 }, () => validMeal)) }),
    { expectedDays: 7, mealsPerDay: 3, allowedIds: allowedFoods },
  ).days.length, 7);
  assert.throws(() => parseNutritionPlannerOutput(
    JSON.stringify({ days: Array.from({ length: 7 }, () => Array.from({ length: 3 }, () => [{ id: foods[0]!.id, portion: 1, calories: 100 }])) }),
    { expectedDays: 7, mealsPerDay: 3, allowedIds: allowedFoods },
  ));
  assert.throws(() => parseNutritionPlannerOutput(
    JSON.stringify({ days: Array.from({ length: 7 }, () => Array.from({ length: 3 }, () => [{ id: foods[0]!.id, portion: 3.25 }])) }),
    { expectedDays: 7, mealsPerDay: 3, allowedIds: allowedFoods },
  ));
  assert.throws(() => parseNutritionPlannerOutput(
    JSON.stringify({ days: Array.from({ length: 7 }, () => Array.from({ length: 3 }, () => [
      { id: foods[0]!.id, portion: 1 },
      { id: foods[0]!.id, portion: 1 },
    ])) }),
    { expectedDays: 7, mealsPerDay: 3, allowedIds: allowedFoods },
  ));
});

test('materializer fails closed for allergy and clinical nutrition review', () => {
  const allergyDraft = completeDraft();
  allergyDraft.nutrition.allergies = ['بادام زمینی'];
  assert.throws(
    () => eligibleFoodsForProgram(allergyDraft),
    (error) => error instanceof ProgramMaterializationError && error.code === 'allergy_review_required',
  );

  const diabetesDraft = completeDraft();
  diabetesDraft.medical.hasDiabetes = true;
  assert.throws(
    () => eligibleFoodsForProgram(diabetesDraft),
    (error) => error instanceof ProgramMaterializationError && error.code === 'nutrition_clinical_review_required',
  );

  const bloodPressureDraft = completeDraft();
  bloodPressureDraft.medical.hasHighBloodPressure = true;
  assert.throws(
    () => eligibleFoodsForProgram(bloodPressureDraft),
    (error) => error instanceof ProgramMaterializationError && error.code === 'nutrition_clinical_review_required',
  );
});

test('an absurd daily energy total is rejected by the Core-computed sanity ceiling, a real day is not', () => {
  const draft = completeDraft();
  const training = validSelections(draft).training;
  // Two highest-energy catalog rice dishes at the max portion, in every meal —
  // a Core-computed daily total far above any real plan. The numbers come from
  // Nutrition Core (invariant 1), never from the model or this test.
  const absurdMeal = [{ id: 'zereshk-polo-morgh', portion: 3 }, { id: 'loobia-polo', portion: 3 }];
  const absurd = { days: Array.from({ length: 7 }, () => Array.from({ length: 3 }, () => absurdMeal)) };
  assert.throws(
    () => materializeProgramPlans(draft, { training, nutrition: absurd }),
    (error) => error instanceof ProgramMaterializationError && error.code === 'planner_selection_invalid',
  );
  // The ceiling is an integrity guard, not a hidden calorie target: the same
  // foods at a normal portion materialize without complaint.
  const realMeal = [{ id: 'zereshk-polo-morgh', portion: 1 }, { id: 'loobia-polo', portion: 1 }];
  const real = { days: Array.from({ length: 7 }, () => Array.from({ length: 3 }, () => realMeal)) };
  assert.ok(materializeProgramPlans(draft, { training, nutrition: real }));
});

test('exercise safety fails closed for unset medical history and prototype-chain injury ids', () => {
  // unset (null) is neither an explicit "no" nor a technical default: an
  // unanswered cardiovascular question must go to clinical review, never be
  // silently treated as "no risk".
  const unsetMedical = completeDraft();
  unsetMedical.medical.hasHighBloodPressure = null;
  assert.throws(
    () => safeExercisesForProgram(unsetMedical),
    (error) => error instanceof ProgramMaterializationError && error.code === 'clinical_review_required',
  );

  // A forged injury body-part id that only exists on Object's prototype
  // ('constructor') must resolve to no mapping and fail closed, never inherit a
  // function off the prototype chain.
  const prototypeInjury = completeDraft();
  prototypeInjury.injuries.noInjuries = false;
  prototypeInjury.injuries.areas = [{
    key: 'forged-1', bodyPartId: 'constructor', face: 'ant', label: 'x', severity: 'severe', status: 'current', forbiddenMovements: '', notes: '',
  }];
  assert.throws(
    () => safeExercisesForProgram(prototypeInjury),
    (error) => error instanceof ProgramMaterializationError && error.code === 'clinical_review_required',
  );

  // The fully-answered explicit-"no" baseline must still yield a usable set, so
  // the fail-closed checks above are the null/forged paths, not a blanket block.
  assert.ok(safeExercisesForProgram(completeDraft()).length >= 4);
});

test('free-text equipment is affirmed by presence but never by a negated mention', () => {
  const affirmed = completeDraft();
  affirmed.availability.customEquipment = 'لندماین دارم';
  const negated = completeDraft();
  negated.availability.customEquipment = 'بدون لندماین';

  const affirmedIds = new Set(safeExercisesForProgram(affirmed).map((exercise) => exercise.id));
  const negatedIds = new Set(safeExercisesForProgram(negated).map((exercise) => exercise.id));
  // A positive mention adds the landmine-only movement; a negated mention of the
  // same equipment must not, or the plan would offer a movement the user said
  // they cannot perform.
  assert.equal(affirmedIds.has('half-kneeling-landmine-press'), true);
  assert.equal(negatedIds.has('half-kneeling-landmine-press'), false);
});

test('disliked-food exclusion folds Arabic orthography onto Persian before matching', () => {
  const baseline = new Set(eligibleFoodsForProgram(completeDraft()).map((food) => food.id));
  assert.equal(baseline.has('zereshk-polo-morgh'), true);

  const disliked = completeDraft();
  // Written with the Arabic kaf (U+0643) rather than the Persian keheh (U+06A9);
  // normalize() must fold it so the disliked dish is still excluded.
  disliked.nutrition.dislikedFoods = ['زرشك پلو'];
  const filtered = new Set(eligibleFoodsForProgram(disliked).map((food) => food.id));
  assert.equal(filtered.has('zereshk-polo-morgh'), false);
});

test('materializer fails closed on incomplete profile fields and unsupported diet catalogs', () => {
  const noMeals = completeDraft();
  noMeals.nutrition.mealsPerDay = null;
  assert.throws(
    () => materializeProgramPlans(noMeals, validSelections(completeDraft())),
    (error) => error instanceof ProgramMaterializationError && error.code === 'profile_incomplete',
  );

  const noSession = completeDraft();
  noSession.availability.sessionDuration = null;
  assert.throws(
    () => exercisesPerDayForProgram(noSession),
    (error) => error instanceof ProgramMaterializationError && error.code === 'profile_incomplete',
  );

  for (const diet of ['vegan', 'low-carb'] as const) {
    const unsupported = completeDraft();
    unsupported.nutrition.dietType = diet;
    assert.throws(
      () => eligibleFoodsForProgram(unsupported),
      (error) => error instanceof ProgramMaterializationError && error.code === 'diet_catalog_unsupported',
    );
  }
});

test('planner contract rejects a non-standard portion, an oversized meal and a wrong-sized training day, each with its own named code', () => {
  const draft = completeDraft();
  const foods = eligibleFoodsForProgram(draft);
  const allowedFoods = new Set(foods.map((food) => food.id));

  // A model may select a catalog identity but never author its own serving
  // multiplier: portion must equal exactly 1 (one catalog-defined serving).
  // Prescribing more or fewer servings is a distinct, named portion-authority
  // rejection — the plan document owns the portion count and Nutrition Core owns
  // the arithmetic, not the planner selection.
  assert.throws(
    () => parseNutritionPlannerOutput(
      JSON.stringify({ days: Array.from({ length: 7 }, () => Array.from({ length: 3 }, () => [{ id: foods[0]!.id, portion: 2 }])) }),
      { expectedDays: 7, mealsPerDay: 3, allowedIds: allowedFoods },
    ),
    /planner_portion_authority_invalid/,
  );

  // A meal may hold one or two catalog items; three is rejected before any id or
  // portion is even inspected.
  const threeItemMeal = [
    { id: foods[0]!.id, portion: 1 },
    { id: foods[1]!.id, portion: 1 },
    { id: foods[2]!.id, portion: 1 },
  ];
  assert.throws(
    () => parseNutritionPlannerOutput(
      JSON.stringify({ days: Array.from({ length: 7 }, () => Array.from({ length: 3 }, () => threeItemMeal)) }),
      { expectedDays: 7, mealsPerDay: 3, allowedIds: allowedFoods },
    ),
    /planner_nutrition_meal_size_invalid/,
  );

  // A training day whose size does not match the requested exercises-per-day is
  // rejected rather than silently truncated or padded.
  const exercises = safeExercisesForProgram(draft);
  const allowedExercises = new Set(exercises.map((exercise) => exercise.id));
  const exerciseCount = Math.min(exercisesPerDayForProgram(draft), exercises.length);
  const shortDay = exercises.slice(0, exerciseCount - 1).map((exercise) => exercise.id);
  assert.throws(
    () => parseTrainingPlannerOutput(
      JSON.stringify({ days: Array.from({ length: 4 }, () => shortDay) }),
      { expectedDays: 4, exercisesPerDay: exerciseCount, allowedIds: allowedExercises },
    ),
    /planner_training_day_size_invalid/,
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

test('Program generation claims the cycle before adaptive bounded planner requests and can recover a stale attempt', async () => {
  const page = await readFile(resolve(webRoot, 'app/(main)/program/page.tsx'), 'utf8');
  const actions = await readFile(resolve(webRoot, 'app/(main)/program/actions.ts'), 'utf8');
  const planners = await readFile(resolve(webRoot, 'lib/program-generation/planners.ts'), 'utf8');
  const google = await readFile(resolve(webRoot, 'lib/ai/providers/google.ts'), 'utf8');

  assert.match(page, /ساخت برنامهٔ تمرین و تغذیه/);
  assert.match(page, /فعال‌سازی برنامه/);
  assert.match(page, /تلاش دوباره/);
  assert.equal((planners.match(/generateWithProviderFallback\(/g) ?? []).length, 2);
  assert.match(planners, /plannerPreflight/);
  assert.match(planners, /safeExercisesForProgram/);
  assert.match(planners, /eligibleFoodsForProgram/);
  assert.match(planners, /recentBreakWeeks/);
  assert.match(planners, /strengthExperience/);
  assert.match(planners, /recentTraining/);
  assert.match(planners, /recentExerciseIds/);
  assert.match(planners, /completedSessions/);
  assert.match(planners, /validateTrainingQuality/);
  assert.match(planners, /coverPushPullAndLowerBodyWhenCandidatesAllow/);
  assert.match(planners, /responseSchema/);
  assert.doesNotMatch(planners, /uniqueItems:/);
  assert.match(planners, /planner_training_duplicate_exercise|uniqueExerciseIdsWithinDay/);
  assert.match(planners, /AI_MAX_STRUCTURED_OUTPUT_TOKENS/);
  assert.match(planners, /portionMustEqual: 1/);
  assert.match(planners, /doNotInferPersonalCalorieMacroOrPortionTargets/);
  assert.match(planners, /avoidSameDayDuplicatesWhenAlternativesExist/);
  const nutritionPlanner = planners.split("task: 'select_meal_structure'")[1] ?? '';
  assert.ok(nutritionPlanner.length > 0);
  assert.doesNotMatch(nutritionPlanner, /goal: draft\.goal|targetTimeline:|activityLevel:/);
  assert.doesNotMatch(planners, /weightKg: draft\.basics\.weightKg/);
  assert.match(google, /response_format/);
  assert.match(google, /application\/json/);
  assert.match(google, /schema: request\.responseSchema/);

  const transitionIndex = actions.indexOf("p_target_status: 'generating'");
  const evidenceIndex = actions.indexOf('const evidence = await recentPlannerEvidence');
  const plannerCallIndex = actions.indexOf('const selections = await generateProgramPlannerSelections(draft, evidence);');
  assert.ok(transitionIndex >= 0 && evidenceIndex >= 0 && plannerCallIndex >= 0);
  assert.ok(transitionIndex < evidenceIndex && evidenceIndex < plannerCallIndex);
  assert.match(actions, /from\('workout_sessions'\)/);
  assert.match(actions, /from\('workout_sets'\)/);
  assert.match(actions, /GENERATION_STALE_MS = 5 \* 60_000/);
  assert.match(actions, /generation_stale_recovered/);
  assert.match(actions, /materializeProgramPlans\(draft, selections\)/);
  assert.match(actions, /finalize_program_cycle_generation/);
  assert.match(actions, /activate_program_cycle_plans/);
});
