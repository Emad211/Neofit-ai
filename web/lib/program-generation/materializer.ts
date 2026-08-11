import { EXERCISES, evaluateExerciseSafety, type ExerciseDefinition, type ExerciseEquipment, type MovementPattern } from '@neofit/exercise-registry';
import { foodFixtures, type FoodFixture } from '@/data/fixtures';
import { safetyProfileFromOnboarding } from '@/lib/exercise-registry/onboarding-safety';
import type { OnboardingDraft, WeekdayId } from '@/lib/onboarding/model';
import type { Json } from '@/lib/supabase/database.types';
import type { NutritionPlanDocument, NutritionPlanItemDocument } from '@/lib/nutrition-plan-core';
import type { WorkoutPlanDocument } from '@/lib/workout-plan-core';
import type { ProgramPlannerSelections } from './planner-contract';

export type ProgramMaterializationErrorCode =
  | 'profile_incomplete'
  | 'clinical_review_required'
  | 'nutrition_clinical_review_required'
  | 'allergy_review_required'
  | 'diet_catalog_unsupported'
  | 'insufficient_safe_exercises'
  | 'insufficient_catalog_foods'
  | 'planner_selection_invalid';

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
  'pull-up-bar', 'cardio-machine',
];

const VEGETARIAN_ALLOWED_IDS = new Set([
  'boiled-egg',
  'adasi',
  'omelet-gojeh',
  'bread-cheese-tea',
  'panir',
  'sangak',
  'shir',
  'mast',
  'doogh',
  'adas-polo',
  'soup-jo',
  'kuku-sabzi',
  'loobia-chiti',
  'mirza-ghasemi',
  'ash-reshteh',
]);

const PATTERN_LABELS: Readonly<Record<MovementPattern, string>> = {
  squat: 'اسکوات',
  hinge: 'هیپ‌هینج',
  horizontal_push: 'فشار افقی',
  vertical_push: 'فشار عمودی',
  horizontal_pull: 'کشش افقی',
  vertical_pull: 'کشش عمودی',
  lunge: 'لانج',
  isolation: 'حرکات تک‌مفصلی',
};

function databaseJson(value: unknown): Json {
  return JSON.parse(JSON.stringify(value)) as Json;
}

function normalize(value: string): string {
  return value
    .trim()
    .toLocaleLowerCase('fa-IR')
    .replace(/[\u200c\u200f\u202a-\u202e]/g, ' ')
    .replace(/\s+/g, ' ');
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
  const equipment = new Set<ExerciseEquipment>(['bodyweight']);
  if (draft.availability.equipment.includes('full-gym')) {
    for (const item of FULL_GYM_EQUIPMENT) equipment.add(item);
  } else {
    for (const item of draft.availability.equipment) equipment.add(item);
  }
  const custom = normalize(draft.availability.customEquipment);
  if (custom.includes('landmine') || custom.includes('لندماین')) equipment.add('landmine');
  return equipment;
}

function difficultyRank(value: ExerciseDefinition['difficulty']): number {
  return value === 'beginner' ? 0 : value === 'intermediate' ? 1 : 2;
}

export function safeExercisesForProgram(draft: OnboardingDraft): readonly ExerciseDefinition[] {
  const profile = safetyProfileFromOnboarding(safetyInput(draft));
  if (profile.reviewReasons.length > 0) throw new ProgramMaterializationError('clinical_review_required');
  if (!draft.trainingHistory.level) throw new ProgramMaterializationError('profile_incomplete');

  const equipment = availableEquipment(draft);
  const maxDifficulty = draft.trainingHistory.level === 'beginner'
    ? 0
    : draft.trainingHistory.level === 'intermediate' ? 1 : 2;

  return EXERCISES.filter((exercise) => (
    exercise.equipment.every((item) => equipment.has(item))
    && evaluateExerciseSafety(exercise, profile).status === 'allowed'
    && difficultyRank(exercise.difficulty) <= maxDifficulty
  ));
}

function foodMatchesAny(food: FoodFixture, values: readonly string[]): boolean {
  if (values.length === 0) return false;
  const haystack = [
    food.id,
    food.nameFa,
    food.nameEn,
    ...food.aliasesFa,
    ...food.aliasesEn,
  ].map(normalize);
  return values.some((value) => {
    const needle = normalize(value);
    return needle.length > 0 && haystack.some((candidate) => candidate.includes(needle) || needle.includes(candidate));
  });
}

export function eligibleFoodsForProgram(draft: OnboardingDraft): readonly FoodFixture[] {
  if (draft.nutrition.allergies.length > 0) throw new ProgramMaterializationError('allergy_review_required');
  if (
    draft.basics.age === null
    || draft.basics.age < 18
    || draft.medical.hasHighBloodPressure === true
    || draft.medical.hasDiabetes === true
    || draft.medical.hasCardiacHistory === true
    || draft.medical.conditions.length > 0
    || draft.medical.medications.trim().length > 0
  ) {
    throw new ProgramMaterializationError('nutrition_clinical_review_required');
  }
  if (draft.nutrition.dietType !== 'balanced' && draft.nutrition.dietType !== 'vegetarian') {
    throw new ProgramMaterializationError('diet_catalog_unsupported');
  }

  const foods = foodFixtures.filter((food) => (
    Boolean(food.sourceVersion)
    && (draft.nutrition.dietType === 'balanced' || VEGETARIAN_ALLOWED_IDS.has(food.id))
    && !foodMatchesAny(food, draft.nutrition.dislikedFoods)
  ));
  if (foods.length < 6) throw new ProgramMaterializationError('insufficient_catalog_foods');
  return foods;
}

export function exercisesPerDayForProgram(draft: OnboardingDraft): number {
  const durationMinutes = draft.availability.sessionDuration;
  if (!durationMinutes) throw new ProgramMaterializationError('profile_incomplete');
  return durationMinutes <= 30 ? 4 : durationMinutes >= 75 ? 7 : 5;
}

function setsFor(draft: OnboardingDraft): number {
  if (draft.trainingHistory.level === 'beginner') return 2;
  if (draft.preferences.intensity === 'challenging') return 4;
  return 3;
}

function repRange(draft: OnboardingDraft, exercise: ExerciseDefinition): string {
  if (draft.goal.primaryGoal === 'muscle-gain') {
    return exercise.movementPattern === 'isolation' ? '۱۰–۱۵' : '۶–۱۲';
  }
  if (draft.goal.primaryGoal === 'weight-loss' || draft.goal.primaryGoal === 'fitness') {
    return exercise.movementPattern === 'isolation' ? '۱۲–۱۵' : '۸–۱۵';
  }
  return exercise.movementPattern === 'isolation' ? '۱۲–۱۵' : '۸–۱۲';
}

function restSeconds(draft: OnboardingDraft, exercise: ExerciseDefinition): number {
  if (exercise.movementPattern === 'isolation') return 60;
  return draft.goal.primaryGoal === 'muscle-gain' ? 120 : 90;
}

function workoutDocument(
  draft: OnboardingDraft,
  selection: ProgramPlannerSelections['training'],
): WorkoutPlanDocument {
  const trainingDays = draft.availability.daysPerWeek;
  const durationMinutes = draft.availability.sessionDuration;
  if (!trainingDays || !durationMinutes) throw new ProgramMaterializationError('profile_incomplete');

  const candidates = safeExercisesForProgram(draft);
  const byId = new Map(candidates.map((exercise) => [exercise.id, exercise]));
  const perDay = Math.min(exercisesPerDayForProgram(draft), candidates.length);
  if (candidates.length < 4 || perDay < 4) throw new ProgramMaterializationError('insufficient_safe_exercises');
  if (selection.days.length !== trainingDays) throw new ProgramMaterializationError('planner_selection_invalid');

  const preferred = draft.availability.preferredDays.length >= trainingDays
    ? draft.availability.preferredDays
    : DEFAULT_WEEKDAYS;
  const sets = setsFor(draft);

  const days = selection.days.map((ids, dayIndex) => {
    if (ids.length !== perDay || new Set(ids).size !== ids.length) {
      throw new ProgramMaterializationError('planner_selection_invalid');
    }
    const exercises = ids.map((id) => byId.get(id));
    if (exercises.some((exercise) => !exercise)) {
      throw new ProgramMaterializationError('planner_selection_invalid');
    }
    const selected = exercises as ExerciseDefinition[];
    const weekday = preferred[dayIndex] ?? DEFAULT_WEEKDAYS[dayIndex] ?? 'sat';
    const patterns = Array.from(new Set(selected.map((exercise) => exercise.movementPattern)))
      .filter((pattern) => pattern !== 'isolation')
      .slice(0, 3);

    return {
      id: `cycle-workout-${dayIndex + 1}`,
      day: WEEKDAYS[weekday],
      title: trainingDays <= 3 ? `تمام بدن ${dayIndex + 1}` : `جلسه ${dayIndex + 1}`,
      focus: patterns.length > 0
        ? `تمرکز: ${patterns.map((pattern) => PATTERN_LABELS[pattern]).join('، ')}`
        : 'تمرین کنترل‌شده با افزایش تدریجی فشار',
      durationMinutes,
      exercises: selected.map((exercise) => ({
        id: exercise.id,
        name: exercise.nameFa,
        sets,
        targetReps: repRange(draft, exercise),
        restSeconds: restSeconds(draft, exercise),
      })),
    };
  });

  return { days };
}

function catalogItem(foodId: string, portionCount: number): NutritionPlanItemDocument {
  const food = foodFixtures.find((candidate) => candidate.id === foodId);
  if (!food?.sourceVersion) throw new ProgramMaterializationError('insufficient_catalog_foods');
  return { foodId: food.id, sourceVersion: food.sourceVersion, portionCount };
}

function mealSlot(index: number, count: number): { type: 'breakfast' | 'lunch' | 'dinner' | 'snack'; label: string } {
  if (count === 1) return { type: 'dinner', label: 'وعده اصلی' };
  if (count === 2) return index === 0
    ? { type: 'lunch', label: 'ناهار' }
    : { type: 'dinner', label: 'شام' };
  if (index === 0) return { type: 'breakfast', label: 'صبحانه' };
  if (index === count - 1) return { type: 'dinner', label: 'شام' };
  const lunchIndex = Math.floor((count - 1) / 2);
  if (index === lunchIndex) return { type: 'lunch', label: 'ناهار' };
  const snackNumber = index < lunchIndex ? index : index - 1;
  return { type: 'snack', label: `میان‌وعده ${snackNumber}` };
}

function validQuarterPortion(value: number): boolean {
  if (!Number.isFinite(value) || value < 0.25 || value > 3) return false;
  const quarters = value * 4;
  return Math.abs(quarters - Math.round(quarters)) <= 1e-9;
}

function nutritionDocument(
  draft: OnboardingDraft,
  selection: ProgramPlannerSelections['nutrition'],
): NutritionPlanDocument {
  const mealsPerDay = draft.nutrition.mealsPerDay;
  if (!mealsPerDay || mealsPerDay < 1 || mealsPerDay > 8) {
    throw new ProgramMaterializationError('profile_incomplete');
  }

  const foods = eligibleFoodsForProgram(draft);
  const allowedIds = new Set(foods.map((food) => food.id));
  if (selection.days.length !== 7) throw new ProgramMaterializationError('planner_selection_invalid');
  const weekdays = ['شنبه', 'یکشنبه', 'دوشنبه', 'سه‌شنبه', 'چهارشنبه', 'پنجشنبه', 'جمعه'] as const;

  return {
    days: selection.days.map((meals, dayIndex) => {
      if (meals.length !== mealsPerDay) throw new ProgramMaterializationError('planner_selection_invalid');
      return {
        id: `cycle-nutrition-${dayIndex + 1}`,
        day: weekdays[dayIndex]!,
        title: 'الگوی غذایی روزانه',
        meals: meals.map((items, mealIndex) => {
          if (
            items.length < 1
            || items.length > 2
            || new Set(items.map((item) => item.id)).size !== items.length
          ) {
            throw new ProgramMaterializationError('planner_selection_invalid');
          }
          const slot = mealSlot(mealIndex, mealsPerDay);
          return {
            id: `meal-${dayIndex + 1}-${mealIndex + 1}`,
            mealType: slot.type,
            label: slot.label,
            items: items.map((item) => {
              if (!allowedIds.has(item.id) || !validQuarterPortion(item.portion)) {
                throw new ProgramMaterializationError('planner_selection_invalid');
              }
              return catalogItem(item.id, item.portion);
            }),
          };
        }),
      };
    }),
  };
}

export function materializeProgramPlans(
  draft: OnboardingDraft,
  selections: ProgramPlannerSelections,
): MaterializedProgramPlans {
  if (!draft.goal.primaryGoal || !draft.nutrition.dietType) {
    throw new ProgramMaterializationError('profile_incomplete');
  }
  const workout = workoutDocument(draft, selections.training);
  const nutrition = nutritionDocument(draft, selections.nutrition);
  return {
    workoutTitle: `برنامه تمرینی ${workout.days.length} روزه NeoFit`,
    workoutPlan: databaseJson(workout),
    nutritionTitle: 'برنامه غذایی هفتگی NeoFit',
    nutritionPlan: databaseJson(nutrition),
    safetyNote: 'Planner فقط از حرکت‌های ایمن رجیستری‌شده و غذاهای کاتالوگ نسخه‌دار انتخاب کرده و NeoFit خروجی را دوباره اعتبارسنجی کرده است.',
  };
}
