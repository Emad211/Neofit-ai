import { z } from 'zod';

export const LocaleSchema = z.enum(['en', 'fa']).default('en');
export type Locale = z.infer<typeof LocaleSchema>;

const boundedText = (max = 2_000) => z.string().trim().min(1).max(max);
const optionalText = (max = 2_000) => z.string().trim().max(max).optional();

export const ExerciseSchema = z.object({
  name: boundedText(120),
  sets: boundedText(20),
  reps: boundedText(30),
});

export const DailyWorkoutSchema = z.object({
  id: z.string().trim().min(1).max(80).regex(/^[a-z0-9-]+$/i),
  day: boundedText(40),
  title: boundedText(120),
  focus: boundedText(120),
  duration: boundedText(40),
  calories: boundedText(40),
  exercises: z.array(ExerciseSchema).min(1).max(15),
});

export const GenerateWorkoutProgramInputSchema = z.object({
  userId: z.string().optional(),
  goals: boundedText(100),
  performanceGoals: optionalText(500),
  fitnessLevel: z.enum(['beginner', 'intermediate', 'advanced']),
  trainingDays: z.number().int().min(2).max(6),
  trainingDuration: boundedText(40),
  trainingTime: boundedText(40),
  workoutLocation: z.enum(['gym', 'home']),
  availableEquipment: boundedText(1_000),
  medicalHistory: z.string().trim().max(2_000).default('None'),
  physicalSpecifications: boundedText(500),
  sleepHours: boundedText(40),
  stressLevel: boundedText(40),
  history: optionalText(6_000),
  locale: LocaleSchema.optional(),
});
export type GenerateWorkoutProgramInput = z.infer<typeof GenerateWorkoutProgramInputSchema>;

export const GenerateWorkoutProgramOutputSchema = z.object({
  weeklyWorkoutPlan: z.array(DailyWorkoutSchema).min(2).max(6),
  summary: boundedText(1_500),
  safetyNotes: z.array(boundedText(300)).max(8).default([]),
});
export type GenerateWorkoutProgramOutput = z.infer<typeof GenerateWorkoutProgramOutputSchema>;

export const IngredientSchema = z.object({
  name: boundedText(120),
  quantity: boundedText(80),
  category: z.enum(['Produce', 'Fruits', 'Protein', 'Dairy & Alternatives', 'Pantry', 'Other']),
});

export const MealSchema = z.object({
  id: z.string().trim().min(1).max(100).optional(),
  type: boundedText(50),
  name: boundedText(160),
  calories: z.number().int().min(0).max(3_000),
  protein: z.number().min(0).max(500).default(0),
  carbohydrates: z.number().min(0).max(1_000).default(0),
  fat: z.number().min(0).max(500).default(0),
  ingredients: z.array(IngredientSchema).min(1).max(30),
});

export const DailyMealPlanSchema = z.object({
  day: boundedText(30),
  meals: z.array(MealSchema).min(2).max(6),
  totalCalories: z.number().int().min(800).max(7_000),
});

export const GenerateNutritionProgramInputSchema = z.object({
  userId: z.string().optional(),
  goals: boundedText(100),
  performanceGoals: optionalText(500),
  fitnessLevel: z.enum(['beginner', 'intermediate', 'advanced']),
  physicalSpecifications: boundedText(500),
  lifestyle: boundedText(100),
  sleepHours: boundedText(40),
  stressLevel: boundedText(40),
  eatingHabits: z.string().trim().max(2_000).default('None'),
  cookingSkill: z.enum(['beginner', 'intermediate', 'advanced']),
  costLevel: z.enum(['low', 'medium', 'high']),
  trainingDays: z.number().int().min(0).max(7),
  trainingDuration: boundedText(40),
  trainingTime: boundedText(40),
  history: optionalText(6_000),
  locale: LocaleSchema.optional(),
});
export type GenerateNutritionProgramInput = z.infer<typeof GenerateNutritionProgramInputSchema>;

export const GenerateNutritionProgramOutputSchema = z.object({
  weeklyMealPlan: z.array(DailyMealPlanSchema).length(7),
  summary: boundedText(1_500),
  dailyCalorieTarget: z.number().int().min(800).max(7_000),
  safetyNotes: z.array(boundedText(300)).max(8).default([]),
});
export type GenerateNutritionProgramOutput = z.infer<typeof GenerateNutritionProgramOutputSchema>;

export const CalculateActivityCaloriesInputSchema = z.object({
  userId: z.string().optional(),
  activityType: boundedText(120),
  durationMinutes: z.number().int().min(1).max(1_440),
  intensity: z.enum(['low', 'medium', 'high']),
  userProfile: z.object({
    weightKg: z.number().min(20).max(500),
    heightCm: z.number().int().min(80).max(280),
    age: z.number().int().min(13).max(120),
    gender: z.enum(['male', 'female', 'other']),
  }),
  averageHeartRate: z.number().int().min(30).max(250).optional(),
  locale: LocaleSchema.optional(),
});
export type CalculateActivityCaloriesInput = z.infer<typeof CalculateActivityCaloriesInputSchema>;
export const CalculateActivityCaloriesOutputSchema = z.object({
  caloriesBurned: z.number().int().min(0).max(20_000),
  method: z.enum(['met']),
  confidence: z.enum(['low', 'medium', 'high']),
});
export type CalculateActivityCaloriesOutput = z.infer<typeof CalculateActivityCaloriesOutputSchema>;

export const FoodLookupInputSchema = z.object({
  userId: z.string().optional(),
  foodName: z.string().trim().max(500).default(''),
  photoDataUri: z.string().max(8_000_000).optional(),
  locale: LocaleSchema.optional(),
}).refine((value) => Boolean(value.foodName || value.photoDataUri), {
  message: 'A food name or photo is required.',
});
export type FoodLookupInput = z.infer<typeof FoodLookupInputSchema>;
export const FoodLookupOutputSchema = z.object({
  itemName: boundedText(160),
  servingSize: boundedText(120),
  calories: z.number().int().min(0).max(10_000),
  protein: z.number().min(0).max(1_000),
  carbohydrates: z.number().min(0).max(2_000),
  fat: z.number().min(0).max(1_000),
  confidence: z.enum(['low', 'medium', 'high']),
  assumptions: z.array(boundedText(300)).max(8).default([]),
});
export type FoodLookupOutput = z.infer<typeof FoodLookupOutputSchema>;

export const GenerateRecipeInputSchema = z.object({
  userId: z.string().optional(),
  mealName: boundedText(160),
  ingredients: z.array(IngredientSchema).min(1).max(30),
  locale: LocaleSchema.optional(),
});
export type GenerateRecipeInput = z.infer<typeof GenerateRecipeInputSchema>;
export const GenerateRecipeOutputSchema = z.object({ recipe: boundedText(8_000) });
export type GenerateRecipeOutput = z.infer<typeof GenerateRecipeOutputSchema>;

export const SuggestMealAlternativeInputSchema = z.object({
  userId: z.string().optional(),
  mealId: boundedText(100),
  context: boundedText(2_000),
  locale: LocaleSchema.optional(),
});
export type SuggestMealAlternativeInput = z.infer<typeof SuggestMealAlternativeInputSchema>;
export const SuggestMealAlternativeOutputSchema = z.object({
  alternativeMeal: boundedText(1_000),
  calories: z.number().int().min(0).max(3_000).optional(),
  warning: z.string().max(500).optional(),
});
export type SuggestMealAlternativeOutput = z.infer<typeof SuggestMealAlternativeOutputSchema>;

export const GetAlternativeExerciseInputSchema = z.object({
  userId: z.string().optional(),
  exerciseName: boundedText(160),
  availableEquipment: boundedText(1_000),
  medicalLimitations: optionalText(2_000),
  reasonForChange: z.enum(['no_equipment', 'causes_pain']),
  locale: LocaleSchema.optional(),
});
export type GetAlternativeExerciseInput = z.infer<typeof GetAlternativeExerciseInputSchema>;
export const GetAlternativeExerciseOutputSchema = z.object({
  alternativeExercise: boundedText(160),
  reason: boundedText(1_000),
  stopWorkout: z.boolean(),
  seekMedicalAdvice: z.boolean(),
});
export type GetAlternativeExerciseOutput = z.infer<typeof GetAlternativeExerciseOutputSchema>;

export const GetExerciseDetailsInputSchema = z.object({
  exerciseName: boundedText(160),
  locale: LocaleSchema.optional(),
});
export type GetExerciseDetailsInput = z.infer<typeof GetExerciseDetailsInputSchema>;
export const GetExerciseDetailsOutputSchema = z.object({
  description: boundedText(8_000),
  commonMistakes: z.array(boundedText(300)).max(10).default([]),
  safetyWarnings: z.array(boundedText(300)).max(10).default([]),
});
export type GetExerciseDetailsOutput = z.infer<typeof GetExerciseDetailsOutputSchema>;

export const GenerateOnDemandReportInputSchema = z.object({
  userData: z.unknown(),
  locale: LocaleSchema.optional(),
});
export type GenerateOnDemandReportInput = z.infer<typeof GenerateOnDemandReportInputSchema>;
export const GenerateOnDemandReportOutputSchema = z.object({
  analysisReport: boundedText(10_000),
});
export type GenerateOnDemandReportOutput = z.infer<typeof GenerateOnDemandReportOutputSchema>;

export const AiActionSchema = z.enum([
  'generateWorkoutProgram',
  'generateNutritionProgram',
  'calculateActivityCalories',
  'foodLookup',
  'generateRecipe',
  'suggestMealAlternative',
  'getAlternativeExercise',
  'getExerciseDetails',
  'generateOnDemandReport',
]);
export type AiAction = z.infer<typeof AiActionSchema>;
