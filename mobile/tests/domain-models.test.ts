import assert from 'node:assert/strict';
import test from 'node:test';
import { IRANIAN_FOOD_SEED } from '../src/data/iranian-food-seed';
import {
  ProfileSchema,
  WorkoutPlanSchema,
} from '../src/domain/models';

test('Iranian food seed contains 83 valid unique local entries', () => {
  assert.equal(IRANIAN_FOOD_SEED.length, 83);
  assert.equal(new Set(IRANIAN_FOOD_SEED.map((item) => item.id)).size, IRANIAN_FOOD_SEED.length);
  assert.equal(new Set(IRANIAN_FOOD_SEED.map((item) => item.nameFa)).size, IRANIAN_FOOD_SEED.length);

  for (const item of IRANIAN_FOOD_SEED) {
    assert.ok(item.nameFa.length > 0);
    assert.ok(item.nameEn.length > 0);
    assert.ok(item.calories >= 0);
    assert.ok(item.proteinG >= 0);
    assert.ok(item.carbsG >= 0);
    assert.ok(item.fatG >= 0);
    assert.ok(item.variabilityPct >= 0 && item.variabilityPct <= 80);
  }
});

test('old local profile rows receive rich profile defaults', () => {
  const profile = ProfileSchema.parse({
    name: 'Test User',
    locale: 'en',
    goal: 'improve_fitness',
    gender: 'other',
    age: 30,
    heightCm: 170,
    weightKg: 70,
    fitnessLevel: 'beginner',
    activityLevel: 'sedentary',
    trainingDays: 3,
    sessionMinutes: 45,
    workoutLocation: 'home',
    availableEquipment: ['bodyweight'],
    dietaryPreferences: [],
    allergies: [],
    medicalNotes: '',
    sleepHours: 7,
    stressLevel: 5,
    timezone: 'Asia/Baku',
  });

  assert.equal(profile.details.mealsPerDay, 3);
  assert.equal(profile.details.trainingPriority, 'general_fitness');
  assert.deepEqual(profile.details.healthFlags, []);
});

test('old workout plans remain readable with safe exercise defaults', () => {
  const plan = WorkoutPlanSchema.parse({
    id: 'legacy-plan',
    title: 'Legacy plan',
    summary: 'Imported from an earlier local version.',
    safetyNotes: [],
    createdAt: new Date().toISOString(),
    days: [
      {
        id: 'day-1',
        dayIndex: 0,
        title: 'Full body A',
        focus: 'General strength',
        durationMinutes: 45,
        exercises: [
          {
            id: 'exercise-1',
            name: 'Bodyweight squat',
            sets: 3,
            reps: '8-12',
            restSeconds: 90,
            notes: 'Controlled range of motion.',
          },
        ],
      },
      {
        id: 'day-2',
        dayIndex: 2,
        title: 'Full body B',
        focus: 'General strength',
        durationMinutes: 45,
        exercises: [
          {
            id: 'exercise-2',
            name: 'Incline push-up',
            sets: 3,
            reps: '6-10',
            restSeconds: 90,
            notes: '',
          },
        ],
      },
    ],
  });

  const exercise = plan.days[0]?.exercises[0];
  assert.ok(exercise);
  assert.equal(exercise.movementPattern, 'other');
  assert.equal(exercise.targetRir, 2);
  assert.ok(exercise.videoSearchQueries.en.length > 0);
});
