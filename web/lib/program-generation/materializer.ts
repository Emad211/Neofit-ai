import { EXERCISES, evaluateExerciseSafety, type ExerciseDefinition, type ExerciseEquipment } from '@neofit/exercise-registry';
import { foodFixtures } from '@/data/fixtures';
import { safetyProfileFromOnboarding } from '@/lib/exercise-registry/onboarding-safety';
import type { OnboardingDraft, WeekdayId } from '@/lib/onboarding/model';
import type { Json } from '@/lib/supabase/database.types';
import type { NutritionPlanDocument, NutritionPlanItemDocument } from '@/lib/nutrition-plan-core';
import type { WorkoutPlanDocument } from '@/lib/workout-plan-core';

export type ProgramMaterializationErrorCode =
  | 'profile_incomplete'
  | 'clinical_review_required'
  | 'allergy_review_required'
  | 'diet_catalog_unsupported'
  | 'insufficient_safe_exercises'
  | 'insufficient_catalog_foods';

export class ProgramMaterializationError extends Error {
  constructor(readonly code: ProgramMaterializationErrorCode) {
    super(code);
    this.name = 'ProgramMaterializationError';
  }
}

export interface MaterializedProgramPlans {
  readonly workoutTitle: string;
  readonly workoutPlan: Json;
  readonly nutritionTitle: string;
  readonly nutritionPlan: Json;
  readonly safetyNote: string;
}

const WEEKDAYS: Readonly<Record<WeekdayId, string>> = {
  sat: 'شنبه',
  sun: 'یکشنبه',
  mon: 'دوشنبه',
  tue: 'سه‌شنبه',
  wed: 'چهارشنبه',
  thu: 'پنجشنبه',
  fri: 'جمعه',
};

const DEFAULT_WEEKDAYS: readonly WeekdayId[] = ['sat', 'mon', 'wed', 'thu', 'fri', 'sun'];
const FULL_GYM_EQUIPMENT: readonly ExerciseEquipment[] = [
  'bodyweight', 'dumbbell', 'barbell', 'cable', 'bands', 'bench', 'full-gym',
  'pull-up-bar', 'cardio-machine', 'landmine',
];

function databaseJson(value: unknown): Json {
  return JSON.parse(JSON.stringify(value)) as Json;
}

function safetyInput(draft: OnboardingDraft) {
  return {
    highBloodPressure: draft.medical.hasHighBloodPressure,
    cardiacHistory: draft.medical.hasCardiacHistory,
    physicianRestrictions: draft.medical.physicianRestrictions,
    generalLimitations: draft.injuries.generalLimitations,
    painDuringExercise: draft.injuries.painDuringExercise,
    painScale: draft.injuries.painScale,
    injuries: draft.injuries.areas.map((injury) => ({
      bodyPartId: injury.bodyPartId,
      severity: injury.severity,
      status: injury.status,
      forbiddenMovements: injury.forbiddenMovements,
    })),
  };
}

function availableEquipment(draft: OnboardingDraft): ReadonlySet<ExerciseEquipment> {
  if (draft.availability.equipment.includes('full-gym')) return new Set(FULL_GYM_EQUIPMENT);
  return new Set<ExerciseEquipment>(['bodyweight', ...draft.availability.equipment]);
}

function safeExercises(draft: OnboardingDraft): readonly ExerciseDefinition[] {
  const profile = safetyProfileFromOnboarding(safetyInput(draft));
  if (profile.reviewReasons.length > 0) throw new ProgramMaterializationError('clinical_review_required');
  const equipment = availableEquipment(draft);
  return EXERCISES.filter((exercise) => (
    exercise.equipment.every((item) => equipment.has(item))
    && evaluateExerciseSafety(exercise, profile).status === 'allowed'
    && (draft.trainingHistory.level !== 'beginner' || exercise.difficulty === 'beginner')
  ));
}

function workoutDocument(draft: OnboardingDraft): WorkoutPlanDocument {
  const trainingDays = draft.availability.daysPerWeek;
  const durationMinutes = draft.availability.sessionDuration;
  if (!trainingDays || !durationMinutes) throw new ProgramMaterializationError('profile_incomplete');
  const candidates = safeExercises(draft);
  if (candidates.length < 4) throw new ProgramMaterializationError('insufficient_safe_exercises');

  const preferred = draft.availability.preferredDays.length >= trainingDays
    ? draft.availability.preferredDays
    : DEFAULT_WEEKDAYS;
  const sets = draft.trainingHistory.level === 'beginner'
    ? 2
    : draft.preferences.intensity === 'challenging' ? 4 : 3;
  const exercisesPerDay = Math.min(durationMinutes <= 30 ? 4 : durationMinutes >= 75 ? 7 : 5, candidates.length);

  const days = Array.from({ length: trainingDays }, (_, dayIndex) => {
    const rotated = [...candidates.slice(dayIndex), ...candidates.slice(0, dayIndex)];
    const selected = rotated.slice(0, exercisesPerDay);
    const weekday = preferred[dayIndex] ?? DEFAULT_WEEKDAYS[dayIndex] ?? 'sat';
    return {
      id: `cycle-workout-${dayIndex + 1}`,
      day: WEEKDAYS[weekday],
      title: trainingDays <= 3 ? `تمام بدن ${dayIndex + 1}` : `جلسه ${dayIndex + 1}`,
      focus: 'الگوی تمام‌بدن با افزایش تدریجی فشار و توقف در صورت درد',
      durationMinutes,
      exercises: selected.map((exercise) => ({
        id: exercise.id,
        name: exercise.nameFa,
        sets,
        targetReps: exercise.movementPattern === 'isolation' ? '۱۲–۱۵' : '۸–۱۲',
        restSeconds: exercise.movementPattern === 'isolation' ? 60 : 90,
      })),
    };
  });
  return { days };
}

function catalogItem(foodId: string, portionCount = 1): NutritionPlanItemDocument {
  const food = foodFixtures.find((candidate) => candidate.id === foodId);
  if (!food?.sourceVersion) throw new ProgramMaterializationError('insufficient_catalog_foods');
  return { foodId: food.id, sourceVersion: food.sourceVersion, portionCount };
}

const BALANCED_DAYS = [
  { breakfast: ['boiled-egg', 'sangak'], lunch: ['ghormeh-sabzi', 'chelo-sefid'], dinner: ['soup-jo', 'mast'] },
  { breakfast: ['adasi'], lunch: ['zereshk-polo-morgh'], dinner: ['kuku-sabzi', 'sangak'] },
  { breakfast: ['omelet-gojeh', 'sangak'], lunch: ['adas-polo'], dinner: ['joojeh-kebab', 'mast'] },
  { breakfast: ['bread-cheese-tea'], lunch: ['gheimeh', 'chelo-sefid'], dinner: ['loobia-chiti'] },
  { breakfast: ['boiled-egg', 'shir'], lunch: ['loobia-polo'], dinner: ['mirza-ghasemi', 'sangak'] },
  { breakfast: ['adasi'], lunch: ['kebab-koobideh', 'chelo-sefid'], dinner: ['ash-reshteh'] },
  { breakfast: ['omelet-gojeh'], lunch: ['fesenjan', 'chelo-sefid'], dinner: ['soup-jo', 'mast'] },
] as const;

const VEGETARIAN_DAYS = [
  { breakfast: ['adasi'], lunch: ['adas-polo'], dinner: ['mirza-ghasemi', 'sangak'] },
  { breakfast: ['omelet-gojeh', 'sangak'], lunch: ['loobia-chiti'], dinner: ['ash-reshteh'] },
  { breakfast: ['bread-cheese-tea'], lunch: ['adas-polo'], dinner: ['kuku-sabzi', 'mast'] },
  { breakfast: ['adasi'], lunch: ['mirza-ghasemi', 'sangak'], dinner: ['soup-jo', 'mast'] },
  { breakfast: ['omelet-gojeh'], lunch: ['loobia-chiti'], dinner: ['kuku-sabzi', 'sangak'] },
  { breakfast: ['bread-cheese-tea'], lunch: ['adas-polo'], dinner: ['ash-reshteh'] },
  { breakfast: ['adasi'], lunch: ['mirza-ghasemi', 'sangak'], dinner: ['soup-jo', 'mast'] },
] as const;

function nutritionDocument(draft: OnboardingDraft): NutritionPlanDocument {
  if (draft.nutrition.allergies.length > 0) throw new ProgramMaterializationError('allergy_review_required');
  if (draft.nutrition.dietType === 'vegan' || draft.nutrition.dietType === 'low-carb' || draft.nutrition.dietType === 'other') {
    throw new ProgramMaterializationError('diet_catalog_unsupported');
  }
  const sourceDays = draft.nutrition.dietType === 'vegetarian' || draft.nutrition.dietType === 'pescatarian'
    ? VEGETARIAN_DAYS
    : BALANCED_DAYS;
  const weekdays = ['شنبه', 'یکشنبه', 'دوشنبه', 'سه‌شنبه', 'چهارشنبه', 'پنجشنبه', 'جمعه'] as const;
  return {
    days: sourceDays.map((source, dayIndex) => ({
      id: `cycle-nutrition-${dayIndex + 1}`,
      day: weekdays[dayIndex]!,
      title: 'الگوی غذایی روزانه',
      meals: [
        { id: `meal-${dayIndex + 1}-breakfast`, mealType: 'breakfast' as const, label: 'صبحانه', items: source.breakfast.map((id) => catalogItem(id)) },
        { id: `meal-${dayIndex + 1}-lunch`, mealType: 'lunch' as const, label: 'ناهار', items: source.lunch.map((id) => catalogItem(id)) },
        { id: `meal-${dayIndex + 1}-dinner`, mealType: 'dinner' as const, label: 'شام', items: source.dinner.map((id) => catalogItem(id)) },
      ],
    })),
  };
}

export function materializeProgramPlans(draft: OnboardingDraft): MaterializedProgramPlans {
  if (!draft.goal.primaryGoal || !draft.nutrition.dietType) {
    throw new ProgramMaterializationError('profile_incomplete');
  }
  const workout = workoutDocument(draft);
  const nutrition = nutritionDocument(draft);
  return {
    workoutTitle: `برنامه تمرینی ${workout.days.length} روزه NeoFit`,
    workoutPlan: databaseJson(workout),
    nutritionTitle: 'برنامه غذایی هفتگی NeoFit',
    nutritionPlan: databaseJson(nutrition),
    safetyNote: 'این نسخه فقط از حرکت‌های رجیستری‌شده و غذاهای کاتالوگ نسخه‌دار ساخته شده است.',
  };
}
