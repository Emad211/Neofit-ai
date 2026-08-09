import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';
import { getBodyPart } from '@/components/onboarding/body-map/body-parts';
import {
  NUTRITION_AUTHORITY_NOTE,
  ONBOARDING_SCHEMA_VERSION,
  PROGRAM_DURATION_MAX_DAYS,
  PROGRAM_DURATION_MIN_DAYS,
  buildTrainingPreview,
  createEmptyOnboardingDraft,
  markStepCompleted,
  migrateLegacyOnboardingDraft,
  onboardingSteps,
  parseOnboardingDraft,
  validateOnboardingStep,
} from '@/lib/onboarding/model';

async function source(path: string) {
  return readFile(new URL(`../${path}`, import.meta.url), 'utf8');
}

test('Onboarding v2 keeps the 15-step product flow and starts with the AI gate', () => {
  assert.equal(ONBOARDING_SCHEMA_VERSION, 2);
  assert.equal(onboardingSteps.length, 15);
  assert.deepEqual(onboardingSteps.map((step) => step.number), Array.from({ length: 15 }, (_, index) => index + 1));
  assert.equal(new Set(onboardingSteps.map((step) => step.slug)).size, 15);
  assert.equal(onboardingSteps[0]?.slug, 'welcome');
  assert.equal(onboardingSteps[0]?.label, 'اتصال مربی');
});

test('injury body map retains exactly 73 unique front/back regions', () => {
  const parts = getBodyPart('en');
  assert.equal(parts.length, 73);
  assert.equal(new Set(parts.map((part) => `${part.face}:${part.id}`)).size, 73);
  assert.ok(parts.some((part) => part.face === 'ant'));
  assert.ok(parts.some((part) => part.face === 'post'));
});

test('mobile injury map uses one-face navigation and collapsible detail cards', async () => {
  const map = await source('components/onboarding/body-map/injury-body-map.tsx');
  const css = await source('app/onboarding/onboarding-mobile-polish.css');
  assert.match(map, /onboarding-body-map__face-switch/);
  assert.match(map, /role="tablist"/);
  assert.match(map, /<details/);
  assert.match(css, /figure\.is-active/);
  assert.match(css, /max-height:min\(59dvh|59dvh/);
  assert.match(css, /safe-area-inset-bottom/);
});

test('empty v2 draft does not preselect self-report or course duration', () => {
  const draft = createEmptyOnboardingDraft();
  assert.equal(draft.version, 2);
  assert.equal(draft.goal.primaryGoal, null);
  assert.equal(draft.goal.targetTimeline, null);
  assert.equal(draft.basics.gender, null);
  assert.equal(draft.lifestyle.activityLevel, null);
  assert.equal(draft.lifestyle.sleepQuality, null);
  assert.equal(draft.lifestyle.stressLevel, null);
  assert.equal(draft.lifestyle.smoking, null);
  assert.equal(draft.nutrition.mealsPerDay, null);
  assert.equal(draft.nutrition.dietType, null);
  assert.equal(draft.nutrition.kitchenAccess, null);
  assert.equal(draft.trainingHistory.level, null);
  assert.equal(draft.availability.location, null);
  assert.equal(draft.availability.daysPerWeek, null);
  assert.equal(draft.availability.sessionDuration, null);
  assert.equal(draft.preferences.coachingTone, null);
  assert.equal(draft.confirmation.programDurationDays, null);
});

test('legacy v1 migration preserves unambiguous entries but resets ambiguous defaults', () => {
  const legacy = {
    version: 1,
    startedAt: '2026-08-01T00:00:00.000Z',
    completedSteps: [1, 2, 3, 7, 15],
    goal: { primaryGoal: 'muscle-gain', secondaryGoals: ['fitness'], targetTimeline: 'balanced' },
    basics: { name: 'Emad', age: 30, gender: 'male', heightCm: 180, weightKg: 80, country: 'Iran', unitSystem: 'metric' },
    body: { waistCm: 90, hipCm: null, neckCm: null, bodyFatPercent: null, targetWeightKg: 84, progressPhotoOptIn: false },
    medical: { conditions: [], medications: '', hasHighBloodPressure: false, hasDiabetes: false, hasCardiacHistory: false, physicianRestrictions: '', medicalAcknowledged: true },
    injuries: { noInjuries: false, areas: [], painDuringExercise: false, painScale: null, generalLimitations: '' },
    lifestyle: { occupation: 'desk', activityLevel: 'sedentary', sittingHours: 8, dailySteps: 5000, sleepHours: 7, sleepQuality: 'average', stressLevel: 'medium', smoking: 'never', routineNotes: '' },
    nutrition: { mealsPerDay: 3, dietType: 'balanced', allergies: ['peanut'], dislikedFoods: [], favoriteIranianFoods: [], budget: 'balanced', cookingAbility: 'intermediate', kitchenAccess: true, eatingOutFrequency: 'weekly', notes: '' },
    trainingHistory: { level: 'beginner', trainingAgeMonths: 12, previousSports: [], recentBreakWeeks: 2, familiarMovements: [], cardioExperience: 'basic', strengthExperience: 'basic', notes: '' },
    availability: { location: 'gym', equipment: ['دمبل'], customEquipment: '', daysPerWeek: 3, sessionDuration: 60, preferredDays: ['شنبه'], preferredTime: 'flexible', scheduleNotes: '' },
    preferences: { intensity: 'moderate', cardioPreference: 'balanced', trainingStyle: 'mixed', variety: 'balanced', nutritionStrictness: 'structured', coachingTone: 'supportive', reminderLevel: 'normal' },
    confirmation: { startDate: '2026-08-10', workoutReminders: true, mealReminders: true, waterReminders: false, weeklyReport: true, finalConsent: true, completedAt: '2026-08-09T00:00:00.000Z' },
  };
  const migrated = migrateLegacyOnboardingDraft(legacy);
  assert.ok(migrated);
  assert.equal(migrated.basics.name, 'Emad');
  assert.equal(migrated.basics.age, 30);
  assert.equal(migrated.goal.primaryGoal, 'muscle-gain');
  assert.deepEqual(migrated.nutrition.allergies, ['peanut']);
  assert.equal(migrated.lifestyle.activityLevel, null);
  assert.equal(migrated.lifestyle.smoking, null);
  assert.equal(migrated.trainingHistory.level, null);
  assert.equal(migrated.availability.daysPerWeek, null);
  assert.equal(migrated.preferences.coachingTone, null);
  assert.equal(migrated.confirmation.programDurationDays, null);
  assert.equal(migrated.confirmation.finalConsent, false);
  assert.deepEqual(migrated.completedSteps, []);
});

test('v2 parser accepts valid explicit values and rejects malformed self-report payloads', () => {
  const draft = createEmptyOnboardingDraft();
  draft.availability.sessionDuration = 60;
  assert.ok(parseOnboardingDraft(draft));
  assert.equal(parseOnboardingDraft({ ...draft, version: 1 }), null);

  const duplicateGoal = structuredClone(draft);
  duplicateGoal.goal.primaryGoal = 'fitness';
  duplicateGoal.goal.secondaryGoals = ['fitness'];
  assert.equal(parseOnboardingDraft(duplicateGoal), null);

  const malformedInjury = structuredClone(draft) as typeof draft;
  malformedInjury.injuries.areas = [{
    key: 'ant:knee',
    bodyPartId: 'different-id',
    face: 'ant',
    label: 'زانو',
    severity: 'mild',
    status: 'current',
    forbiddenMovements: '',
    notes: '',
  }];
  assert.equal(parseOnboardingDraft(malformedInjury), null);

  const oversized = structuredClone(draft);
  oversized.medical.physicianRestrictions = 'x'.repeat(2001);
  assert.equal(parseOnboardingDraft(oversized), null);
});

test('step validation requires explicit choices and a bounded course duration', () => {
  const draft = createEmptyOnboardingDraft();
  assert.ok(validateOnboardingStep(draft, 2).length > 0);
  assert.ok(validateOnboardingStep(draft, 5).length > 0);
  assert.ok(validateOnboardingStep(draft, 7).length > 0);
  assert.ok(validateOnboardingStep(draft, 8).length > 0);
  assert.ok(validateOnboardingStep(draft, 9).length > 0);
  assert.ok(validateOnboardingStep(draft, 10).length > 0);
  assert.ok(validateOnboardingStep(draft, 11).length > 0);
  assert.ok(validateOnboardingStep(draft, 15).length > 0);
  assert.equal(PROGRAM_DURATION_MIN_DAYS, 14);
  assert.equal(PROGRAM_DURATION_MAX_DAYS, 84);
});

test('step completion remains idempotent', () => {
  const draft = createEmptyOnboardingDraft();
  const once = markStepCompleted(draft, 4);
  const twice = markStepCompleted(once, 4);
  assert.deepEqual(twice.completedSteps, [4]);
});

test('training preview only materializes from explicit availability and nutrition arithmetic stays outside Onboarding', async () => {
  const draft = createEmptyOnboardingDraft();
  assert.equal(buildTrainingPreview(draft).trainingDays, null);
  draft.availability.daysPerWeek = 6;
  draft.availability.sessionDuration = 75;
  const preview = buildTrainingPreview(draft);
  assert.equal(preview.trainingDays, 6);
  assert.equal(preview.sessionMinutes, 75);
  assert.equal(preview.weeklyStructure.length, 6);
  assert.match(NUTRITION_AUTHORITY_NOTE, /Nutrition Core/);

  const model = await source('lib/onboarding/model.ts');
  assert.doesNotMatch(model, /\b(calorieTarget|proteinGrams|carbohydrateGrams|fatGrams|\bbmr\b)\b/i);
});

test('AI key is gated inside Onboarding without entering draft or Browser storage', async () => {
  const gate = await source('components/onboarding/onboarding-ai-gate.tsx');
  const screen = await source('components/onboarding/onboarding-screen.tsx');
  assert.match(gate, /\/api\/ai\/providers/);
  assert.match(gate, /DEFAULT_AI_MODELS\.google|DEFAULT_AI_MODELS\[provider\]/);
  assert.match(gate, /AvalAI/);
  assert.doesNotMatch(gate, /localStorage|sessionStorage/);
  assert.match(screen, /mode === 'account'.*!googleReady/s);
  assert.doesNotMatch(await source('lib/onboarding/model.ts'), /apiKey|ciphertext|authTag/);
});

test('only one AI onboarding route exists and legacy duplicate route is deleted', async () => {
  const root = await source('app/page.tsx');
  const index = await source('app/onboarding/page.tsx');
  assert.doesNotMatch(root, /\/onboarding\/ai/);
  assert.match(index, /\/onboarding\/welcome/);
  await assert.rejects(() => source('app/onboarding/ai/page.tsx'));
  await assert.rejects(() => source('app/onboarding/ai/continue/route.ts'));
});

test('account draft persistence uses optimistic concurrency instead of silent upsert overwrite', async () => {
  const persistence = await source('lib/onboarding/persistence.ts');
  const context = await source('components/onboarding/onboarding-context.tsx');
  assert.match(persistence, /OnboardingConflictError/);
  assert.match(persistence, /\.eq\('updated_at', input\.expectedDatabaseUpdatedAt\)/);
  assert.match(persistence, /\.insert\(payload\)/);
  assert.match(context, /databaseUpdatedAt/);
  assert.match(context, /OnboardingConflictError/);
});

test('final onboarding asks only for real course inputs and review has direct edit affordances', async () => {
  const screen = await source('components/onboarding/onboarding-screen.tsx');
  assert.match(screen, /programDurationDays/);
  assert.match(screen, /editHref="\/onboarding\/goal"/);
  assert.match(screen, /editHref="\/onboarding\/availability"/);
  assert.doesNotMatch(screen, /draft\.confirmation\.workoutReminders/);
  assert.doesNotMatch(screen, /draft\.confirmation\.mealReminders/);
  assert.doesNotMatch(screen, /<option value="imperial">/);
  assert.match(screen, /errorsRef\.current\?\.focus\(\)/);
});

test('lifecycle stops truthfully before planners exist', async () => {
  const root = await source('app/page.tsx');
  const screen = await source('components/onboarding/onboarding-screen.tsx');
  assert.match(root, /schema_version/);
  assert.match(root, /ONBOARDING_SCHEMA_VERSION/);
  assert.match(screen, /router\.push\('\/onboarding\/ready'\)/);
  assert.doesNotMatch(screen, /router\.push\('\/today'\)/);
});
