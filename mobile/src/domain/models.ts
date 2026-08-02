import { z } from 'zod';

export const LocaleSchema = z.enum(['fa', 'en']);
export type Locale = z.infer<typeof LocaleSchema>;

export const GoalSchema = z.enum(['lose_weight', 'gain_muscle', 'improve_fitness']);
export type Goal = z.infer<typeof GoalSchema>;

export const GenderSchema = z.enum(['male', 'female', 'other']);
export type Gender = z.infer<typeof GenderSchema>;

export const FitnessLevelSchema = z.enum(['beginner', 'intermediate', 'advanced']);
export type FitnessLevel = z.infer<typeof FitnessLevelSchema>;

export const ActivityLevelSchema = z.enum([
  'sedentary',
  'lightly_active',
  'moderately_active',
  'very_active',
]);
export type ActivityLevel = z.infer<typeof ActivityLevelSchema>;

export const WorkoutLocationSchema = z.enum(['home', 'gym', 'outdoor']);
export type WorkoutLocation = z.infer<typeof WorkoutLocationSchema>;

export const TrainingPrioritySchema = z.enum([
  'general_fitness',
  'hypertrophy',
  'strength',
  'endurance',
  'mobility',
]);
export type TrainingPriority = z.infer<typeof TrainingPrioritySchema>;

export const ProfileDetailsSchema = z.object({
  targetWeightKg: z.number().min(20).max(500).nullable().default(null),
  waistCm: z.number().min(30).max(250).nullable().default(null),
  bodyFatPercent: z.number().min(2).max(70).nullable().default(null),
  targetRateKgPerWeek: z.number().min(0).max(1.5).default(0.4),
  trainingExperienceMonths: z.number().int().min(0).max(1_200).default(0),
  trainingPriority: TrainingPrioritySchema.default('general_fitness'),
  preferredTrainingStyles: z.array(z.string().trim().min(1).max(80)).max(20).default([]),
  preferredTrainingTime: z.enum(['morning', 'afternoon', 'evening', 'flexible']).default('flexible'),
  preferredDays: z.array(z.number().int().min(0).max(6)).max(7).default([]),
  dislikedExercises: z.array(z.string().trim().min(1).max(120)).max(30).default([]),
  painAreas: z.array(z.string().trim().min(1).max(120)).max(30).default([]),
  injuries: z.array(z.string().trim().min(1).max(300)).max(30).default([]),
  healthFlags: z.array(z.string().trim().min(1).max(120)).max(30).default([]),
  medications: z.array(z.string().trim().min(1).max(160)).max(40).default([]),
  mealsPerDay: z.number().int().min(2).max(7).default(3),
  cookingAccess: z.enum(['full_kitchen', 'basic', 'none']).default('full_kitchen'),
  cookingMinutes: z.number().int().min(0).max(240).default(30),
  budgetLevel: z.enum(['low', 'medium', 'high']).default('medium'),
  dislikedFoods: z.array(z.string().trim().min(1).max(120)).max(50).default([]),
  averageSteps: z.number().int().min(0).max(100_000).default(5_000),
  hydrationLiters: z.number().min(0).max(15).default(2),
  workSchedule: z.string().trim().max(500).default(''),
  goalNotes: z.string().trim().max(1_000).default(''),
}).default({
  targetWeightKg: null,
  waistCm: null,
  bodyFatPercent: null,
  targetRateKgPerWeek: 0.4,
  trainingExperienceMonths: 0,
  trainingPriority: 'general_fitness',
  preferredTrainingStyles: [],
  preferredTrainingTime: 'flexible',
  preferredDays: [],
  dislikedExercises: [],
  painAreas: [],
  injuries: [],
  healthFlags: [],
  medications: [],
  mealsPerDay: 3,
  cookingAccess: 'full_kitchen',
  cookingMinutes: 30,
  budgetLevel: 'medium',
  dislikedFoods: [],
  averageSteps: 5_000,
  hydrationLiters: 2,
  workSchedule: '',
  goalNotes: '',
});
export type ProfileDetails = z.infer<typeof ProfileDetailsSchema>;

export const ProfileSchema = z.object({
  name: z.string().trim().min(1).max(80),
  locale: LocaleSchema,
  goal: GoalSchema,
  gender: GenderSchema,
  age: z.number().int().min(16).max(100),
  heightCm: z.number().min(100).max(250),
  weightKg: z.number().min(30).max(300),
  fitnessLevel: FitnessLevelSchema,
  activityLevel: ActivityLevelSchema,
  trainingDays: z.number().int().min(2).max(7),
  sessionMinutes: z.number().int().min(15).max(180),
  workoutLocation: WorkoutLocationSchema,
  availableEquipment: z.array(z.string().trim().min(1).max(100)).max(30),
  dietaryPreferences: z.array(z.string().trim().min(1).max(100)).max(30),
  allergies: z.array(z.string().trim().min(1).max(100)).max(30),
  medicalNotes: z.string().trim().max(2_000),
  sleepHours: z.number().min(0).max(24),
  stressLevel: z.number().int().min(1).max(10),
  timezone: z.string().trim().min(1).max(100),
  details: ProfileDetailsSchema,
});
export type Profile = z.infer<typeof ProfileSchema>;

export const IngredientSchema = z.object({
  name: z.string().trim().min(1).max(120),
  quantity: z.string().trim().min(1).max(80),
  category: z.enum(['produce', 'fruit', 'protein', 'dairy', 'pantry', 'other']),
  // Optional for backward compatibility. Every newly generated AI plan must fill all five fields.
  grams: z.number().positive().max(5_000).optional(),
  catalogQuery: z.string().trim().min(1).max(200).optional(),
  catalogSource: z.enum(['ifkb', 'fndds', 'sr_legacy']).optional(),
  catalogFoodId: z.string().trim().min(1).max(240).optional(),
  resolvedName: z.string().trim().min(1).max(300).optional(),
});
export type Ingredient = z.infer<typeof IngredientSchema>;
export const MealSchema = z.object({
  id: z.string().min(1).max(100),
  type: z.enum(['breakfast', 'lunch', 'dinner', 'snack']),
  name: z.string().trim().min(1).max(160),
  calories: z.number().int().min(0).max(3_000),
  proteinG: z.number().min(0).max(500),
  carbsG: z.number().min(0).max(1_000),
  fatG: z.number().min(0).max(500),
  // Undefined means a readable legacy plan. It is not eligible for one-tap meal logging.
  nutritionSource: z.enum(['ifkb_resolved', 'legacy_plan']).optional(),
  ingredients: z.array(IngredientSchema).min(1).max(30),
});
export type Meal = z.infer<typeof MealSchema>;

export const NutritionDaySchema = z.object({
  dayIndex: z.number().int().min(0).max(6),
  meals: z.array(MealSchema).min(2).max(7),
  totalCalories: z.number().int().min(600).max(7_000),
});
export type NutritionDay = z.infer<typeof NutritionDaySchema>;

export const NutritionPlanSchema = z.object({
  id: z.string().min(1).max(100),
  title: z.string().trim().min(1).max(160),
  summary: z.string().trim().min(1).max(2_000),
  dailyCalorieTarget: z.number().int().min(800).max(7_000),
  days: z.array(NutritionDaySchema).length(7),
  safetyNotes: z.array(z.string().trim().min(1).max(500)).max(12),
  createdAt: z.string().datetime(),
}).superRefine((plan, context) => {
  const dayIndexes = plan.days.map((day) => day.dayIndex);
  const uniqueIndexes = new Set(dayIndexes);
  if (uniqueIndexes.size !== 7 || ![0, 1, 2, 3, 4, 5, 6].every((index) => uniqueIndexes.has(index))) {
    context.addIssue({
      code: 'custom',
      path: ['days'],
      message: 'Nutrition plan must contain each dayIndex from 0 through 6 exactly once.',
    });
  }
});
export type NutritionPlan = z.infer<typeof NutritionPlanSchema>;

export const MovementPatternSchema = z.enum([
  'squat',
  'hinge',
  'horizontal_push',
  'vertical_push',
  'horizontal_pull',
  'vertical_pull',
  'lunge',
  'carry',
  'core_anti_extension',
  'core_anti_rotation',
  'core_flexion',
  'isolation',
  'locomotion',
  'mobility',
  'other',
]);
export type MovementPattern = z.infer<typeof MovementPatternSchema>;

export const ExerciseSchema = z.object({
  id: z.string().min(1).max(100),
  name: z.string().trim().min(1).max(160),
  canonicalNameEn: z.string().trim().max(160).default(''),
  canonicalNameFa: z.string().trim().max(160).default(''),
  movementPattern: MovementPatternSchema.default('other'),
  primaryMuscles: z.array(z.string().trim().min(1).max(100)).max(12).default([]),
  secondaryMuscles: z.array(z.string().trim().min(1).max(100)).max(12).default([]),
  equipment: z.array(z.string().trim().min(1).max(100)).max(12).default([]),
  difficulty: FitnessLevelSchema.default('beginner'),
  sets: z.number().int().min(1).max(12),
  reps: z.string().trim().min(1).max(40),
  tempo: z.string().trim().min(1).max(40).default('controlled'),
  targetRir: z.number().int().min(0).max(5).default(2),
  restSeconds: z.number().int().min(15).max(600),
  notes: z.string().trim().max(700),
  formCues: z.array(z.string().trim().min(1).max(220)).max(8).default([]),
  commonMistakes: z.array(z.string().trim().min(1).max(220)).max(8).default([]),
  videoSearchQueries: z.object({
    en: z.array(z.string().trim().min(2).max(160)).min(1).max(4),
    fa: z.array(z.string().trim().min(2).max(160)).min(1).max(4),
  }).default({ en: ['exercise tutorial proper form'], fa: ['آموزش حرکت ورزشی فرم صحیح'] }),
});
export type Exercise = z.infer<typeof ExerciseSchema>;

export const WorkoutDaySchema = z.object({
  id: z.string().min(1).max(100),
  dayIndex: z.number().int().min(0).max(6),
  title: z.string().trim().min(1).max(160),
  focus: z.string().trim().min(1).max(160),
  durationMinutes: z.number().int().min(10).max(240),
  exercises: z.array(ExerciseSchema).min(1).max(20),
});
export type WorkoutDay = z.infer<typeof WorkoutDaySchema>;

export const WorkoutPlanSchema = z.object({
  id: z.string().min(1).max(100),
  title: z.string().trim().min(1).max(160),
  summary: z.string().trim().min(1).max(2_000),
  days: z.array(WorkoutDaySchema).min(2).max(7),
  safetyNotes: z.array(z.string().trim().min(1).max(500)).max(12),
  createdAt: z.string().datetime(),
}).superRefine((plan, context) => {
  const dayIndexes = plan.days.map((day) => day.dayIndex);
  if (new Set(dayIndexes).size !== dayIndexes.length) {
    context.addIssue({
      code: 'custom',
      path: ['days'],
      message: 'Workout dayIndex values must be unique.',
    });
  }
});
export type WorkoutPlan = z.infer<typeof WorkoutPlanSchema>;

export const FoodEstimateSchema = z.object({
  itemName: z.string().trim().min(1).max(160),
  servingSize: z.string().trim().min(1).max(120),
  calories: z.number().int().min(0).max(10_000),
  proteinG: z.number().min(0).max(1_000),
  carbsG: z.number().min(0).max(2_000),
  fatG: z.number().min(0).max(1_000),
  confidence: z.enum(['low', 'medium', 'high']),
  assumptions: z.array(z.string().trim().min(1).max(500)).max(10),
});
export type FoodEstimate = z.infer<typeof FoodEstimateSchema>;

export const FoodCatalogItemSchema = z.object({
  id: z.string().min(1).max(120),
  nameFa: z.string().trim().min(1).max(160),
  nameEn: z.string().trim().min(1).max(160),
  aliasesFa: z.array(z.string().trim().min(1).max(120)).max(20).default([]),
  aliasesEn: z.array(z.string().trim().min(1).max(120)).max(20).default([]),
  category: z.enum([
    'stew', 'rice', 'kebab', 'soup', 'breakfast', 'street_food', 'bread',
    'dessert', 'dairy_beverage', 'ingredient', 'custom',
  ]),
  portionLabelFa: z.string().trim().min(1).max(120),
  portionLabelEn: z.string().trim().min(1).max(120),
  portionGrams: z.number().min(1).max(5_000).nullable().default(null),
  calories: z.number().min(0).max(10_000),
  proteinG: z.number().min(0).max(1_000),
  carbsG: z.number().min(0).max(2_000),
  fatG: z.number().min(0).max(1_000),
  variabilityPct: z.number().min(0).max(80).default(20),
  confidence: z.enum(['low', 'medium', 'high']).default('medium'),
  sourceType: z.enum(['seeded', 'custom', 'imported']).default('seeded'),
  sourceLabel: z.string().trim().max(300).default(''),
  notesFa: z.string().trim().max(700).default(''),
  notesEn: z.string().trim().max(700).default(''),
  updatedAt: z.string().datetime(),
});
export type FoodCatalogItem = z.infer<typeof FoodCatalogItemSchema>;

export const ExerciseVideoSchema = z.object({
  videoId: z.string().trim().min(5).max(40),
  title: z.string().trim().min(1).max(300),
  channelTitle: z.string().trim().min(1).max(200),
  thumbnailUrl: z.string().url(),
  publishedAt: z.string().datetime().nullable().default(null),
  durationSeconds: z.number().int().min(0).max(86_400).default(0),
  viewCount: z.number().int().min(0).default(0),
  score: z.number().default(0),
  query: z.string().trim().min(1).max(200),
});
export type ExerciseVideo = z.infer<typeof ExerciseVideoSchema>;

export type MealLogInput = {
  eatenAt: string;
  mealType: Meal['type'];
  description: string;
  calories: number;
  proteinG: number;
  carbsG: number;
  fatG: number;
  source: 'manual' | 'plan' | 'ai_photo' | 'ai_text' | 'catalog';
};

export type ActivityLogInput = {
  startedAt: string;
  activityType: string;
  durationMinutes: number;
  intensity: 'low' | 'medium' | 'high';
  caloriesBurned: number;
  source: 'manual' | 'met';
};

export type WeightLogInput = {
  measuredAt: string;
  weightKg: number;
};

export type WorkoutSetLogInput = {
  exerciseOrder: number;
  exerciseName: string;
  setNumber: number;
  reps: number;
  weightKg: number;
};
