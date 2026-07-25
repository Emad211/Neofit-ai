import { z } from 'zod';
import {
  FoodEstimate,
  FoodEstimateSchema,
  NutritionPlan,
  NutritionPlanSchema,
  Profile,
  WorkoutPlan,
  WorkoutPlanSchema,
} from '@/domain/models';
import { createId } from '@/lib/id';
import { getAvalAiSettings } from '@/services/ai-settings';
import { AvalAiError, requestStructured } from '@/services/avalai-client';

const AiExerciseSchema = z.object({
  name: z.string().trim().min(1).max(160),
  sets: z.number().int().min(1).max(12),
  reps: z.string().trim().min(1).max(40),
  restSeconds: z.number().int().min(15).max(600),
  notes: z.string().trim().max(500).default(''),
});

const AiWorkoutPlanSchema = z.object({
  title: z.string().trim().min(1).max(160),
  summary: z.string().trim().min(1).max(2_000),
  days: z.array(z.object({
    dayIndex: z.number().int().min(0).max(6),
    title: z.string().trim().min(1).max(160),
    focus: z.string().trim().min(1).max(160),
    durationMinutes: z.number().int().min(10).max(240),
    exercises: z.array(AiExerciseSchema).min(1).max(20),
  })).min(2).max(7),
  safetyNotes: z.array(z.string().trim().min(1).max(500)).max(12).default([]),
}).superRefine((plan, context) => {
  const indexes = plan.days.map((day) => day.dayIndex);
  if (new Set(indexes).size !== indexes.length) {
    context.addIssue({
      code: 'custom',
      path: ['days'],
      message: 'Workout dayIndex values must be unique.',
    });
  }
});

const AiIngredientSchema = z.object({
  name: z.string().trim().min(1).max(120),
  quantity: z.string().trim().min(1).max(80),
  category: z.enum(['produce', 'fruit', 'protein', 'dairy', 'pantry', 'other']),
});

const AiMealSchema = z.object({
  type: z.enum(['breakfast', 'lunch', 'dinner', 'snack']),
  name: z.string().trim().min(1).max(160),
  calories: z.number().int().min(0).max(3_000),
  proteinG: z.number().min(0).max(500),
  carbsG: z.number().min(0).max(1_000),
  fatG: z.number().min(0).max(500),
  ingredients: z.array(AiIngredientSchema).min(1).max(30),
});

const AiNutritionPlanSchema = z.object({
  title: z.string().trim().min(1).max(160),
  summary: z.string().trim().min(1).max(2_000),
  dailyCalorieTarget: z.number().int().min(800).max(7_000),
  days: z.array(z.object({
    dayIndex: z.number().int().min(0).max(6),
    meals: z.array(AiMealSchema).min(2).max(6),
    totalCalories: z.number().int().min(800).max(7_000),
  })).length(7),
  safetyNotes: z.array(z.string().trim().min(1).max(500)).max(12).default([]),
}).superRefine((plan, context) => {
  const indexes = new Set(plan.days.map((day) => day.dayIndex));
  if (indexes.size !== 7 || ![0, 1, 2, 3, 4, 5, 6].every((index) => indexes.has(index))) {
    context.addIssue({
      code: 'custom',
      path: ['days'],
      message: 'Nutrition plan must contain dayIndex 0 through 6 exactly once.',
    });
  }
});

function profilePrompt(profile: Profile) {
  return JSON.stringify({
    goal: profile.goal,
    gender: profile.gender,
    age: profile.age,
    heightCm: profile.heightCm,
    weightKg: profile.weightKg,
    fitnessLevel: profile.fitnessLevel,
    activityLevel: profile.activityLevel,
    trainingDays: profile.trainingDays,
    sessionMinutes: profile.sessionMinutes,
    workoutLocation: profile.workoutLocation,
    availableEquipment: profile.availableEquipment,
    dietaryPreferences: profile.dietaryPreferences,
    allergies: profile.allergies,
    medicalNotes: profile.medicalNotes,
    sleepHours: profile.sleepHours,
    stressLevel: profile.stressLevel,
    timezone: profile.timezone,
  }, null, 2);
}

export async function generateWorkoutPlan(profile: Profile): Promise<WorkoutPlan> {
  const settings = await getAvalAiSettings();
  const response = await requestStructured({
    kind: 'generate_workout_plan',
    schema: AiWorkoutPlanSchema,
    locale: profile.locale,
    model: settings.textModel,
    maxTokens: 7_000,
    system: 'You are a cautious evidence-informed strength and conditioning planner. Create general fitness programming, not medical treatment or rehabilitation.',
    prompt: `Create a one-week workout plan from the validated profile below.

PROFILE DATA:
${profilePrompt(profile)}

Hard requirements:
- Return exactly ${profile.trainingDays} workout days with unique dayIndex values from 0 to 6.
- Keep each day close to ${profile.sessionMinutes} minutes.
- Use only the declared location and available equipment.
- Beginners need conservative volume and simple movements. Advanced users still need recoverable volume.
- Medical notes, pain, surgery, pregnancy, cardiovascular, respiratory, neurological, metabolic, or severe musculoskeletal concerns are hard safety constraints.
- Do not diagnose, prescribe rehabilitation, or tell the user to push through pain.
- Include safetyNotes whenever professional clearance or supervision may be appropriate.
- Every exercise needs numeric sets, a clear reps string, restSeconds, and concise notes.
- Never invent precision about calories burned.`,
  });

  if (response.data.days.length !== profile.trainingDays) {
    throw new AvalAiError(
      `AvalAI returned ${response.data.days.length} workout days instead of ${profile.trainingDays}.`,
      'OUTPUT_VALIDATION_FAILED',
      502,
      response.metadata.requestId,
    );
  }

  const createdAt = new Date().toISOString();
  return WorkoutPlanSchema.parse({
    id: createId('workout-plan'),
    title: response.data.title,
    summary: response.data.summary,
    safetyNotes: response.data.safetyNotes,
    createdAt,
    days: response.data.days
      .sort((a, b) => a.dayIndex - b.dayIndex)
      .map((day) => ({
        id: createId('workout-day'),
        dayIndex: day.dayIndex,
        title: day.title,
        focus: day.focus,
        durationMinutes: day.durationMinutes,
        exercises: day.exercises.map((exercise) => ({
          id: createId('exercise'),
          ...exercise,
        })),
      })),
  });
}

export async function generateNutritionPlan(profile: Profile): Promise<NutritionPlan> {
  const settings = await getAvalAiSettings();
  const response = await requestStructured({
    kind: 'generate_nutrition_plan',
    schema: AiNutritionPlanSchema,
    locale: profile.locale,
    model: settings.textModel,
    maxTokens: 10_000,
    system: 'You are an evidence-informed nutrition planning assistant. Create practical general-wellness meal plans, never diagnosis or disease treatment.',
    prompt: `Create a practical seven-day meal plan from this validated profile.

PROFILE DATA:
${profilePrompt(profile)}

Hard requirements:
- Return exactly seven unique dayIndex values from 0 through 6.
- Respect allergies as absolute exclusions and dietary preferences as constraints.
- Use realistic foods and quantities that a normal person can prepare.
- Every meal must include calories and proteinG, carbsG, fatG.
- Daily totalCalories must approximately equal the sum of meal calories.
- Do not recommend crash dieting, detoxes, unsafe supplements, or extreme restriction.
- If the profile includes diabetes, kidney disease, pregnancy, eating-disorder history, severe allergy, or another condition needing individualized care, keep guidance conservative and add a safety note.
- Do not claim the plan treats or cures any condition.`,
  });

  const createdAt = new Date().toISOString();
  return NutritionPlanSchema.parse({
    id: createId('nutrition-plan'),
    title: response.data.title,
    summary: response.data.summary,
    dailyCalorieTarget: response.data.dailyCalorieTarget,
    safetyNotes: response.data.safetyNotes,
    createdAt,
    days: response.data.days
      .sort((a, b) => a.dayIndex - b.dayIndex)
      .map((day) => ({
        dayIndex: day.dayIndex,
        totalCalories: Math.round(day.meals.reduce((sum, meal) => sum + meal.calories, 0)),
        meals: day.meals.map((meal) => ({
          id: createId('meal'),
          ...meal,
        })),
      })),
  });
}

export async function estimateFoodFromText(input: {
  description: string;
  locale: 'fa' | 'en';
}): Promise<FoodEstimate> {
  const settings = await getAvalAiSettings();
  const response = await requestStructured({
    kind: 'estimate_food_text',
    schema: FoodEstimateSchema,
    locale: input.locale,
    model: settings.textModel,
    system: 'You estimate food nutrition conservatively. You must clearly represent uncertainty about portion size and ingredients.',
    prompt: `Estimate nutrition for this food description:
${JSON.stringify(input.description.trim())}

Use the stated quantity when present. When quantity or ingredients are unclear, choose one plausible standard serving, lower confidence, and list assumptions. Never claim laboratory precision.`,
  });
  return response.data;
}

export async function estimateFoodFromPhoto(input: {
  imageDataUrl: string;
  description?: string;
  locale: 'fa' | 'en';
}): Promise<FoodEstimate> {
  const settings = await getAvalAiSettings();
  const response = await requestStructured({
    kind: 'estimate_food_photo',
    schema: FoodEstimateSchema,
    locale: input.locale,
    model: settings.visionModel,
    imageDataUrl: input.imageDataUrl,
    system: 'You estimate food identity and nutrition conservatively from images. Images cannot establish exact ingredients, cooking fat, or portion weight.',
    prompt: `Estimate the meal shown in the image.
Optional user description: ${JSON.stringify(input.description?.trim() || '')}

Hard requirements:
- Choose a plausible serving size and state it.
- Use low or medium confidence unless the food and portion are exceptionally clear.
- List all assumptions that materially change calories or macros.
- Do not call the result exact.
- If the image is not clearly food, return a low-confidence result explaining the limitation in assumptions.`,
  });
  return response.data;
}
