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
});
export type Profile = z.infer<typeof ProfileSchema>;

export const IngredientSchema = z.object({
  name: z.string().trim().min(1).max(120),
  quantity: z.string().trim().min(1).max(80),
  category: z.enum(['produce', 'fruit', 'protein', 'dairy', 'pantry', 'other']),
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
  ingredients: z.array(IngredientSchema).min(1).max(30),
});
export type Meal = z.infer<typeof MealSchema>;

export const NutritionDaySchema = z.object({
  dayIndex: z.number().int().min(0).max(6),
  meals: z.array(MealSchema).min(2).max(6),
  totalCalories: z.number().int().min(800).max(7_000),
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
});
export type NutritionPlan = z.infer<typeof NutritionPlanSchema>;

export const ExerciseSchema = z.object({
  id: z.string().min(1).max(100),
  name: z.string().trim().min(1).max(160),
  sets: z.number().int().min(1).max(12),
  reps: z.string().trim().min(1).max(40),
  restSeconds: z.number().int().min(15).max(600),
  notes: z.string().trim().max(500),
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

export type MealLogInput = {
  eatenAt: string;
  mealType: Meal['type'];
  description: string;
  calories: number;
  proteinG: number;
  carbsG: number;
  fatG: number;
  source: 'manual' | 'plan' | 'ai_photo' | 'ai_text';
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
