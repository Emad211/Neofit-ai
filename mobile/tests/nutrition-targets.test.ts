import assert from 'node:assert/strict';
import test from 'node:test';
import { Profile, ProfileSchema } from '../src/domain/models';
import { calculateNutritionTargets } from '../src/services/nutrition-targets';

function profile(overrides: Partial<Profile> = {}) {
  const base = ProfileSchema.parse({
    name: 'Target Test',
    locale: 'en',
    goal: 'improve_fitness',
    gender: 'male',
    age: 30,
    heightCm: 176,
    weightKg: 80,
    fitnessLevel: 'intermediate',
    activityLevel: 'moderately_active',
    trainingDays: 4,
    sessionMinutes: 60,
    workoutLocation: 'gym',
    availableEquipment: ['standard gym equipment'],
    dietaryPreferences: [],
    allergies: [],
    medicalNotes: '',
    sleepHours: 7.5,
    stressLevel: 5,
    timezone: 'Asia/Baku',
  });
  return ProfileSchema.parse({ ...base, ...overrides });
}

test('goal direction changes target calories without changing maintenance', () => {
  const maintain = calculateNutritionTargets(profile({ goal: 'improve_fitness' }));
  const lose = calculateNutritionTargets(profile({ goal: 'lose_weight' }));
  const gain = calculateNutritionTargets(profile({ goal: 'gain_muscle' }));

  assert.equal(maintain.maintenanceCalories, lose.maintenanceCalories);
  assert.equal(maintain.maintenanceCalories, gain.maintenanceCalories);
  assert.ok(lose.targetCalories < maintain.targetCalories);
  assert.ok(gain.targetCalories > maintain.targetCalories);
});

test('generated target ranges are internally ordered and physiologically bounded', () => {
  const targets = calculateNutritionTargets(profile({
    goal: 'lose_weight',
    details: {
      ...profile().details,
      targetRateKgPerWeek: 0.6,
    },
  }));

  assert.ok(targets.bmr > 1_000);
  assert.ok(targets.targetCalories >= 1_200);
  assert.ok(targets.calorieRange.low <= targets.targetCalories);
  assert.ok(targets.targetCalories <= targets.calorieRange.high);
  assert.ok(targets.proteinRangeG.low > 0);
  assert.ok(targets.proteinRangeG.low <= targets.proteinRangeG.high);
  assert.ok(targets.fatRangeG.low <= targets.fatRangeG.high);
  assert.ok(targets.carbohydrateRangeG.low <= targets.carbohydrateRangeG.high);
});

test('high BMI uses a capped protein reference weight', () => {
  const targets = calculateNutritionTargets(profile({
    heightCm: 165,
    weightKg: 140,
    goal: 'lose_weight',
  }));

  assert.ok(targets.referenceWeightKg < 140);
  assert.ok(targets.proteinRangeG.high < 250);
  assert.ok(targets.assumptions.some((assumption) => assumption.includes('capped reference weight')));
});
