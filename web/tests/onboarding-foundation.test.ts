import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';
import { getBodyPart } from '@/components/onboarding/body-map/body-parts';
import {
  NUTRITION_AUTHORITY_NOTE,
  ONBOARDING_SCHEMA_VERSION,
  ONBOARDING_TOTAL_STEPS,
  PROGRAM_DURATION_MAX_DAYS,
  PROGRAM_DURATION_MIN_DAYS,
  buildTrainingPreview,
  createEmptyOnboardingDraft,
  equipmentOptions,
  markStepCompleted,
  migrateLegacyOnboardingDraft,
  onboardingSteps,
  parseOnboardingDraft,
  validateOnboardingStep,
  weekdayOptions,
} from '@/lib/onboarding/model';

async function source(path: string) {
  return readFile(new URL(`../${path}`, import.meta.url), 'utf8');
}

test('Onboarding v2 uses a focused 13-step journey and starts with the AI gate', () => {
  assert.equal(ONBOARDING_SCHEMA_VERSION, 2);
  assert.equal(ONBOARDING_TOTAL_STEPS, 13);
  assert.equal(onboardingSteps.length, 13);
  assert.deepEqual(onboardingSteps.map((step) => step.number), Array.from({ length: 13 }, (_, index) => index + 1));
  assert.equal(new Set(onboardingSteps.map((step) => step.slug)).size, 13);
  assert.equal(onboardingSteps[0]?.slug, 'welcome');
  assert.equal(onboardingSteps[0]?.label, 'اتصال مربی');
  assert.equal(onboardingSteps.at(-1)?.slug, 'confirmation');
  const slugs = onboardingSteps.map((step) => String(step.slug));
  assert.ok(!slugs.includes('analysis'));
  assert.ok(!slugs.includes('result'));
});

test('injury body map retains exactly 73 unique front/back regions', () => {
  const parts = getBodyPart('en');
  assert.equal(parts.length, 73);
  assert.equal(new Set(parts.map((part) => `${part.face}:${part.id}`)).size, 73);
  assert.ok(parts.some((part) => part.face === 'ant'));
  assert.ok(parts.some((part) => part.face === 'post'));
});

test('mobile injury map uses one-face navigation, collapsible details and a non-precision list fallback', async () => {
  const map = await source('components/onboarding/body-map/injury-body-map.tsx');
  const css = await source('app/onboarding/onboarding-mobile-polish.css');
  const listCss = await source('app/onboarding/onboarding-body-map-list.css');
  assert.match(map, /onboarding-body-map__face-switch/);
  assert.match(map, /role="tablist"/);
  assert.match(map, /onboarding-body-map__list-picker/);
  assert.match(map, /<optgroup label="جلوی بدن"/);
  assert.match(map, /<details/);
  assert.match(css, /figure\.is-active/);
  assert.match(css, /59dvh/);
  assert.match(css, /safe-area-inset-bottom/);
  assert.match(listCss, /min-block-size: 52px/);
});

test('empty v2 draft does not preselect self-report or future-only preferences', () => {
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
  assert.equal(draft.preferences.reminderLevel, null);
  assert.equal(draft.confirmation.programDurationDays, null);
});

test('availability stores stable locale-independent weekday and equipment ids', () => {
  assert.deepEqual(weekdayOptions.map((item) => item.value), ['sat', 'sun', 'mon', 'tue', 'wed', 'thu', 'fri']);
  assert.ok(equipmentOptions.some((item) => item.value === 'bodyweight'));
  assert.ok(equipmentOptions.some((item) => item.value === 'full-gym'));
  assert.equal(new Set(equipmentOptions.map((item) => item.value)).size, equipmentOptions.length);
});

test('legacy v1 migration preserves unambiguous entries, maps availability ids and resets ambiguous defaults', () => {
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
    availability: { location: 'gym', equipment: ['دمبل', 'دستگاه‌های باشگاه'], customEquipment: '', daysPerWeek: 3, sessionDuration: 60, preferredDays: ['سه‌شنبه'], preferredTime: 'flexible', scheduleNotes: '' },
    preferences: { intensity: 'moderate', cardioPreference: 'balanced', trainingStyle: 'mixed', variety: 'balanced', nutritionStrictness: 'structured', coachingTone: 'supportive', reminderLevel: 'normal' },
    confirmation: { startDate: '2026-08-10', workoutReminders: true, mealReminders: true, waterReminders: false, weeklyReport: true, finalConsent: true, completedAt: '2026-08-09T00:00:00.000Z' },
  };
  const migrated = migrateLegacyOnboardingDraft(legacy);
  assert.ok(migrated);
  assert.equal(migrated.basics.name, 'Emad');
  assert.equal(migrated.basics.age, 30);
  assert.equal(migrated.goal.primaryGoal, 'muscle-gain');
  assert.deepEqual(migrated.nutrition.allergies, ['peanut']);
  assert.deepEqual(migrated.availability.equipment, ['dumbbell', 'full-gym']);
  assert.deepEqual(migrated.availability.preferredDays, ['tue']);
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

  const badAvailability = structuredClone(draft) as unknown as Record<string, unknown>;
  (badAvailability.availability as { equipment: string[] }).equipment = ['دمبل'];
  assert.equal(parseOnboardingDraft(badAvailability), null);

  const oversized = structuredClone(draft);
  oversized.medical.physicianRestrictions = 'x'.repeat(2001);
  assert.equal(parseOnboardingDraft(oversized), null);
});

test('step validation requires explicit choices, equipment truth and bounded course duration', () => {
  const draft = createEmptyOnboardingDraft();
  assert.ok(validateOnboardingStep(draft, 2).length > 0);
  assert.ok(validateOnboardingStep(draft, 5).length > 0);
  assert.ok(validateOnboardingStep(draft, 7).length > 0);
  assert.ok(validateOnboardingStep(draft, 8).length > 0);
  assert.ok(validateOnboardingStep(draft, 9).length > 0);
  assert.ok(validateOnboardingStep(draft, 10).some((item) => item.includes('تجهیزات')));
  assert.ok(validateOnboardingStep(draft, 11).length > 0);
  assert.ok(validateOnboardingStep(draft, ONBOARDING_TOTAL_STEPS).length > 0);
  assert.equal(PROGRAM_DURATION_MIN_DAYS, 14);
  assert.equal(PROGRAM_DURATION_MAX_DAYS, 84);
});

test('preferences validation requires only the six controls rendered in the UI', () => {
  const draft = createEmptyOnboardingDraft();
  draft.preferences = {
    intensity: 'moderate',
    cardioPreference: 'low',
    trainingStyle: 'resistance',
    variety: 'stable',
    nutritionStrictness: 'structured',
    coachingTone: 'analytical',
    reminderLevel: null,
  };
  assert.deepEqual(validateOnboardingStep(draft, 11), []);
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

test('AI key setup is mobile actionable and enforces the resilient provider policy without persisting raw secrets', async () => {
  const gate = await source('components/onboarding/onboarding-ai-gate.tsx');
  const screen = await source('components/onboarding/onboarding-screen.tsx');
  const router = await source('lib/ai/provider-router.ts');
  const config = await source('lib/ai/config.ts');
  assert.match(gate, /\/api\/ai\/providers/);
  assert.match(gate, /aistudio\.google\.com\/app\/apikey/);
  assert.match(gate, /SecretField/);
  assert.match(gate, /aria-pressed=\{revealed\}/);
  assert.match(gate, /const gateReady = mode === 'guest' \? true : avalaiReady/);
  assert.match(gate, /Google به‌تنهایی شرط عبور نیست/);
  assert.match(gate, /Google AI Studio — اختیاری/);
  assert.doesNotMatch(gate, /localStorage|sessionStorage/);
  assert.match(screen, /mode === 'account'.*!aiReady/s);
  assert.match(screen, /Google به‌تنهایی کافی نیست/);
  assert.match(config, /AI_PROVIDER_PRIORITY[^\n]*\['google', 'avalai'\]/);
  assert.match(router, /const eligibleProviders = priority\.filter/);
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

test('account draft persistence combines autosave, optimistic concurrency and serialized writes', async () => {
  const persistence = await source('lib/onboarding/persistence.ts');
  const context = await source('components/onboarding/onboarding-context.tsx');
  assert.match(persistence, /OnboardingConflictError/);
  assert.match(persistence, /\.eq\('updated_at', input\.expectedDatabaseUpdatedAt\)/);
  assert.match(persistence, /\.insert\(payload\)/);
  assert.doesNotMatch(persistence, /\.upsert\(\{\s*user_id: input\.userId/s);
  assert.match(context, /AUTOSAVE_DELAY_MS/);
  assert.match(context, /parseOnboardingDraft\(draft\)/);
  assert.match(context, /writeQueueRef/);
  assert.match(context, /resumeStepNumber\(draft\)/);
  assert.match(context, /databaseUpdatedAtRef/);
});

test('interactive provider is scoped to step routes and Ready verifies account state server-side', async () => {
  const rootLayout = await source('app/onboarding/layout.tsx');
  const stepLayout = await source('app/onboarding/[step]/layout.tsx');
  const ready = await source('app/onboarding/ready/page.tsx');
  assert.doesNotMatch(rootLayout, /OnboardingProvider/);
  assert.match(stepLayout, /OnboardingProvider/);
  assert.match(ready, /activeAuthSession\(supabase\)/);
  assert.match(ready, /status,schema_version,draft/);
  assert.match(ready, /parseOnboardingDraft/);
  assert.match(ready, /status !== 'completed'/);
  assert.doesNotMatch(ready, /Stage22|Stage24|read-only/);
});

test('review owns safety readiness and final onboarding asks only for real course inputs', async () => {
  const screen = await source('components/onboarding/onboarding-screen.tsx');
  assert.match(screen, /programDurationDays/);
  assert.match(screen, /editHref="\/onboarding\/goal"/);
  assert.match(screen, /editHref="\/onboarding\/availability"/);
  assert.match(screen, /قواعد ایمنی فعال/);
  assert.doesNotMatch(screen, /if \(step === 13\).*کنترل ایمنی/s);
  assert.doesNotMatch(screen, /if \(step === 14\)/);
  assert.doesNotMatch(screen, /draft\.confirmation\.workoutReminders/);
  assert.doesNotMatch(screen, /draft\.confirmation\.mealReminders/);
  assert.doesNotMatch(screen, /draft\.preferences\.reminderLevel/);
  assert.doesNotMatch(screen, /progressPhotoOptIn/);
  assert.doesNotMatch(screen, /<option value="imperial">/);
  assert.match(screen, /errorsRef\.current\?\.focus\(\)/);
  assert.match(screen, /formatLocalDate\(new Date\(\)\)/);
  assert.match(screen, /تاریخ شروع نمی‌تواند قبل از امروز باشد/);
});

test('lifecycle stops truthfully before planners exist', async () => {
  const root = await source('app/page.tsx');
  const screen = await source('components/onboarding/onboarding-screen.tsx');
  assert.match(root, /schema_version/);
  assert.match(root, /ONBOARDING_SCHEMA_VERSION/);
  assert.match(screen, /router\.push\('\/onboarding\/ready'\)/);
  assert.doesNotMatch(screen, /router\.push\('\/today'\)/);
});
