import { z } from 'zod';
import { IRANIAN_FOOD_SEED } from '@/data/iranian-food-seed';
import {
  FoodEstimate,
  FoodEstimateSchema,
  MovementPatternSchema,
  NutritionPlan,
  Profile,
  WorkoutPlan,
  WorkoutPlanSchema,
} from '@/domain/models';
import { createId } from '@/lib/id';
import { getAvalAiSettings } from '@/services/ai-settings';
import { AvalAiError, requestStructured } from '@/services/avalai-client';
import { calculateNutritionTargets } from '@/services/nutrition-targets';
import { resolveNutritionPlanDraft } from '@/services/nutrition-plan-resolver';

const AiExerciseSchema = z.object({
  name: z.string().trim().min(1).max(160),
  canonicalNameEn: z.string().trim().min(2).max(160),
  canonicalNameFa: z.string().trim().min(2).max(160),
  movementPattern: MovementPatternSchema,
  primaryMuscles: z.array(z.string().trim().min(1).max(100)).min(1).max(8),
  secondaryMuscles: z.array(z.string().trim().min(1).max(100)).max(8).default([]),
  equipment: z.array(z.string().trim().min(1).max(100)).max(8).default([]),
  difficulty: z.enum(['beginner', 'intermediate', 'advanced']),
  sets: z.number().int().min(1).max(12),
  reps: z.string().trim().min(1).max(40),
  tempo: z.string().trim().min(1).max(40),
  targetRir: z.number().int().min(0).max(5),
  restSeconds: z.number().int().min(15).max(600),
  notes: z.string().trim().max(700).default(''),
  formCues: z.array(z.string().trim().min(1).max(220)).min(2).max(8),
  commonMistakes: z.array(z.string().trim().min(1).max(220)).min(1).max(8),
  videoSearchQueries: z.object({
    en: z.array(z.string().trim().min(2).max(160)).min(1).max(3),
    fa: z.array(z.string().trim().min(2).max(160)).min(1).max(3),
  }),
});

type AiExercise = z.infer<typeof AiExerciseSchema>;

const AiWorkoutPlanSchema = z.object({
  title: z.string().trim().min(1).max(160),
  summary: z.string().trim().min(1).max(2_000),
  days: z.array(z.object({
    dayIndex: z.number().int().min(0).max(6),
    title: z.string().trim().min(1).max(160),
    focus: z.string().trim().min(1).max(160),
    durationMinutes: z.number().int().min(10).max(240),
    exercises: z.array(AiExerciseSchema).min(2).max(16),
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
type AiWorkoutPlan = z.infer<typeof AiWorkoutPlanSchema>;

const AiIngredientSchema = z.object({
  name: z.string().trim().min(1).max(120),
  quantity: z.string().trim().min(1).max(80),
  catalogQuery: z.string().trim().min(2).max(200),
  grams: z.number().positive().max(5_000),
  category: z.enum(['produce', 'fruit', 'protein', 'dairy', 'pantry', 'other']),
});
const AiMealSchema = z.object({
  type: z.enum(['breakfast', 'lunch', 'dinner', 'snack']),
  name: z.string().trim().min(1).max(160),
  ingredients: z.array(AiIngredientSchema).min(1).max(30),
});
type AiMeal = z.infer<typeof AiMealSchema>;

const AiNutritionPlanSchema = z.object({
  title: z.string().trim().min(1).max(160),
  summary: z.string().trim().min(1).max(2_000),
  days: z.array(z.object({
    dayIndex: z.number().int().min(0).max(6),
    meals: z.array(AiMealSchema).min(2).max(7),
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
type AiNutritionPlan = z.infer<typeof AiNutritionPlanSchema>;

function normalize(value: string) {
  return value
    .normalize('NFKC')
    .toLocaleLowerCase('fa')
    .replace(/[يى]/g, 'ی')
    .replace(/ك/g, 'ک')
    .replace(/[ۀة]/g, 'ه')
    .replace(/[^\p{L}\p{N}\s]/gu, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

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
    details: profile.details,
  }, null, 2);
}

function workoutJsonContract() {
  return `{
  "title": string,
  "summary": string,
  "days": [{
    "dayIndex": integer 0..6,
    "title": string,
    "focus": string,
    "durationMinutes": integer,
    "exercises": [{
      "name": localized display name,
      "canonicalNameEn": conventional searchable English exercise name,
      "canonicalNameFa": conventional Persian exercise name,
      "movementPattern": one of squat|hinge|horizontal_push|vertical_push|horizontal_pull|vertical_pull|lunge|carry|core_anti_extension|core_anti_rotation|core_flexion|isolation|locomotion|mobility|other,
      "primaryMuscles": string[],
      "secondaryMuscles": string[],
      "equipment": string[],
      "difficulty": beginner|intermediate|advanced,
      "sets": integer,
      "reps": string,
      "tempo": string such as 3-1-1-0 or controlled,
      "targetRir": integer 0..5,
      "restSeconds": integer,
      "notes": string,
      "formCues": string[2..8],
      "commonMistakes": string[1..8],
      "videoSearchQueries": {
        "en": [concise English YouTube search queries],
        "fa": [concise Persian YouTube search queries]
      }
    }]
  }],
  "safetyNotes": string[]
}`;
}

function nutritionJsonContract() {
  return `{
  "title": string,
  "summary": string,
  "days": [{
    "dayIndex": integer 0..6,
    "meals": [{
      "type": breakfast|lunch|dinner|snack,
      "name": localized display name,
      "ingredients": [{
        "name": localized display name,
        "quantity": human-readable planned amount,
        "catalogQuery": exact Iranian catalog name/alias or concise conventional English food query,
        "grams": positive edible mass in grams,
        "category": produce|fruit|protein|dairy|pantry|other
      }]
    }]
  }],
  "safetyNotes": string[]
}`;
}
function equipmentAvailable(exercise: AiExercise, profile: Profile) {
  if (profile.workoutLocation === 'gym') return true;
  const declared = normalize(profile.availableEquipment.join(' '));
  const universallyAvailable = ['bodyweight', 'body weight', 'وزن بدن', 'floor', 'زمین', 'wall', 'دیوار', 'chair', 'صندلی'];
  return exercise.equipment.every((equipment) => {
    const normalized = normalize(equipment);
    return !normalized || universallyAvailable.some((value) => normalized.includes(normalize(value))) || declared.includes(normalized) || normalized.includes(declared);
  });
}

function workoutQualityIssues(plan: AiWorkoutPlan, profile: Profile) {
  const issues: string[] = [];
  if (plan.days.length !== profile.trainingDays) {
    issues.push(`Return exactly ${profile.trainingDays} workout days; received ${plan.days.length}.`);
  }
  const disliked = profile.details.dislikedExercises.map(normalize).filter(Boolean);
  for (const day of plan.days) {
    const tolerance = Math.max(12, profile.sessionMinutes * 0.3);
    if (Math.abs(day.durationMinutes - profile.sessionMinutes) > tolerance) {
      issues.push(`dayIndex ${day.dayIndex} duration ${day.durationMinutes} is too far from ${profile.sessionMinutes} minutes.`);
    }
    const seen = new Set<string>();
    let totalSets = 0;
    for (const exercise of day.exercises) {
      const canonical = normalize(exercise.canonicalNameEn || exercise.name);
      if (seen.has(canonical)) issues.push(`dayIndex ${day.dayIndex} repeats ${exercise.canonicalNameEn}.`);
      seen.add(canonical);
      totalSets += exercise.sets;
      if (!equipmentAvailable(exercise, profile)) {
        issues.push(`${exercise.canonicalNameEn} requires equipment not declared by the user.`);
      }
      if (disliked.some((value) => canonical.includes(value) || normalize(exercise.name).includes(value))) {
        issues.push(`${exercise.canonicalNameEn} conflicts with a disliked exercise.`);
      }
      if (profile.fitnessLevel === 'beginner' && exercise.targetRir < 1) {
        issues.push(`${exercise.canonicalNameEn} uses failure-level effort for a beginner.`);
      }
      if (!exercise.videoSearchQueries.en.some((query) => normalize(query).includes(normalize(exercise.canonicalNameEn)))) {
        issues.push(`${exercise.canonicalNameEn} needs an English video query containing its canonical name.`);
      }
      if (!exercise.videoSearchQueries.fa.some((query) => normalize(query).includes(normalize(exercise.canonicalNameFa)))) {
        issues.push(`${exercise.canonicalNameEn} needs a Persian video query containing its Persian canonical name.`);
      }
    }
    const setCeiling = profile.fitnessLevel === 'beginner' ? 26 : profile.fitnessLevel === 'intermediate' ? 34 : 40;
    if (totalSets > setCeiling) issues.push(`dayIndex ${day.dayIndex} has excessive total working sets (${totalSets}).`);
  }
  return issues.slice(0, 20);
}

async function repairWorkoutPlan(input: {
  plan: AiWorkoutPlan;
  issues: string[];
  profile: Profile;
  model: string;
}) {
  const response = await requestStructured({
    kind: 'repair_workout_plan',
    schema: AiWorkoutPlanSchema,
    locale: input.profile.locale,
    model: input.model,
    maxTokens: 9_000,
    temperature: 0.05,
    system: 'You are a meticulous strength-program quality controller. Repair only the listed defects while preserving safe useful parts. This is general fitness programming, not treatment or rehabilitation.',
    prompt: `Repair the candidate workout plan so every quality defect is resolved.

VALIDATED PROFILE:
${profilePrompt(input.profile)}

QUALITY DEFECTS:
${input.issues.map((issue, index) => `${index + 1}. ${issue}`).join('\n')}

CANDIDATE JSON:
${JSON.stringify(input.plan, null, 2)}

REQUIRED OUTPUT CONTRACT:
${workoutJsonContract()}

Return the complete corrected JSON object. Do not explain the changes outside JSON.`,
  });
  return response;
}

function iranianFoodAnchors() {
  return IRANIAN_FOOD_SEED.map((item) => (
    `${item.nameFa} | ${item.nameEn} | ${item.portionLabelFa}${item.portionGrams ? ` | ${item.portionGrams} g` : ''}`
  )).join('\n');
}

function mealText(meal: {
  readonly name: string;
  readonly ingredients: readonly { readonly name: string }[];
}) {
  return normalize([meal.name, ...meal.ingredients.map((ingredient) => ingredient.name)].join(' '));
}

function nutritionDraftQualityIssues(plan: AiNutritionPlan, profile: Profile) {
  const issues: string[] = [];
  const allergens = profile.allergies.map(normalize).filter(Boolean);
  const disliked = profile.details.dislikedFoods.map(normalize).filter(Boolean);
  const mealNames = new Map<string, number>();

  for (const day of plan.days) {
    if (day.meals.length !== profile.details.mealsPerDay) {
      issues.push(`dayIndex ${day.dayIndex} must contain exactly ${profile.details.mealsPerDay} meals; received ${day.meals.length}.`);
    }
    for (const meal of day.meals) {
      const text = mealText(meal);
      const allergen = allergens.find((value) => text.includes(value));
      if (allergen) issues.push(`${meal.name} contains or names the excluded allergy term "${allergen}".`);
      const dislikedFood = disliked.find((value) => text.includes(value));
      if (dislikedFood) issues.push(`${meal.name} contains the disliked food "${dislikedFood}".`);
      const normalizedName = normalize(meal.name);
      mealNames.set(normalizedName, (mealNames.get(normalizedName) || 0) + 1);
    }
  }
  for (const [name, count] of mealNames) {
    if (count > 3) issues.push(`Meal "${name}" is repeated ${count} times; increase variety.`);
  }
  return issues.slice(0, 24);
}

function resolvedNutritionQualityIssues(plan: NutritionPlan, profile: Profile) {
  const targets = calculateNutritionTargets(profile);
  const issues: string[] = [];
  for (const day of plan.days) {
    const calories = day.totalCalories;
    const protein = day.meals.reduce((sum, meal) => sum + meal.proteinG, 0);
    const lower = targets.calorieRange.low * 0.92;
    const upper = targets.calorieRange.high * 1.08;
    if (calories < lower || calories > upper) {
      issues.push(`dayIndex ${day.dayIndex} resolves to ${Math.round(calories)} local kcal outside ${targets.calorieRange.low}-${targets.calorieRange.high}. Adjust catalog foods or grams.`);
    }
    if (protein < targets.proteinRangeG.low * 0.85 || protein > targets.proteinRangeG.high * 1.2) {
      issues.push(`dayIndex ${day.dayIndex} resolves to ${Math.round(protein)} g local protein outside a practical range near ${targets.proteinRangeG.low}-${targets.proteinRangeG.high} g.`);
    }
    for (const meal of day.meals) {
      const macroCalories = meal.proteinG * 4 + meal.carbsG * 4 + meal.fatG * 9;
      const denominator = Math.max(100, meal.calories, macroCalories);
      if (Math.abs(meal.calories - macroCalories) / denominator > 0.35) {
        issues.push(`${meal.name} has a material energy-versus-macro discrepancy in the selected local records.`);
      }
    }
  }
  return issues.slice(0, 24);
}

async function resolveNutritionCandidate(input: {
  plan: AiNutritionPlan;
  profile: Profile;
  createdAt: string;
}) {
  const draftIssues = nutritionDraftQualityIssues(input.plan, input.profile);
  if (draftIssues.length > 0) return { plan: null, issues: draftIssues };

  const targets = calculateNutritionTargets(input.profile);
  const resolution = await resolveNutritionPlanDraft({
    draft: input.plan,
    dailyCalorieTarget: targets.targetCalories,
    createdAt: input.createdAt,
  });
  if (!resolution.ok) return { plan: null, issues: [...resolution.issues] };

  const issues = resolvedNutritionQualityIssues(resolution.plan, input.profile);
  return { plan: issues.length === 0 ? resolution.plan : null, issues };
}

async function repairNutritionPlan(input: {
  plan: AiNutritionPlan;
  issues: string[];
  profile: Profile;
  model: string;
}) {
  const targets = calculateNutritionTargets(input.profile);
  return requestStructured({
    kind: 'repair_nutrition_plan',
    schema: AiNutritionPlanSchema,
    locale: input.profile.locale,
    model: input.model,
    maxTokens: 12_000,
    temperature: 0.05,
    system: 'You are a meticulous meal-plan quality controller. Repair only food identities, catalog queries, planned gram amounts, practicality, exclusions, and variety. Do not return or invent calories or macronutrients; NeoFit calculates them from its local catalog.',
    prompt: `Repair the complete seven-day meal-plan draft.
VALIDATED PROFILE:
${profilePrompt(input.profile)}

ON-DEVICE TARGETS (use only to adjust food choices and grams; do not output nutrition numbers):
${JSON.stringify(targets, null, 2)}

QUALITY OR LOCAL-CATALOG DEFECTS:
${input.issues.map((issue, index) => `${index + 1}. ${issue}`).join('\n')}

CANDIDATE JSON:
${JSON.stringify(input.plan, null, 2)}

REQUIRED OUTPUT CONTRACT:
${nutritionJsonContract()}

Return the complete corrected JSON object only. Every ingredient must resolve independently through catalogQuery and grams. Never add calories, proteinG, carbsG, or fatG fields.`,
  });
}
function normalizeFoodEstimate(estimate: FoodEstimate): FoodEstimate {
  const macroCalories = estimate.proteinG * 4 + estimate.carbsG * 4 + estimate.fatG * 9;
  const denominator = Math.max(100, estimate.calories, macroCalories);
  const discrepancy = Math.abs(estimate.calories - macroCalories) / denominator;
  if (discrepancy <= 0.3) return estimate;
  return FoodEstimateSchema.parse({
    ...estimate,
    confidence: 'low',
    assumptions: [
      ...estimate.assumptions,
      `The stated calories and macro-derived energy differ materially (${estimate.calories} vs approximately ${Math.round(macroCalories)} kcal); treat this as a broad estimate.`,
    ].slice(0, 10),
  });
}

export async function generateWorkoutPlan(profile: Profile): Promise<WorkoutPlan> {
  const settings = await getAvalAiSettings();
  const initial = await requestStructured({
    kind: 'generate_workout_plan',
    schema: AiWorkoutPlanSchema,
    locale: profile.locale,
    model: settings.textModel,
    maxTokens: 9_000,
    temperature: 0.12,
    system: 'You are a cautious evidence-informed strength and conditioning coach. Build realistic general-fitness programs. Never provide diagnosis, medical treatment, rehabilitation protocols, or advice to train through pain.',
    prompt: `Create one realistic week of training from the validated profile.

VALIDATED PROFILE:
${profilePrompt(profile)}

NON-NEGOTIABLE PROGRAM RULES:
- Return exactly ${profile.trainingDays} workout days with unique dayIndex values from 0 through 6. Prefer the listed preferredDays when they contain enough valid days.
- Each session should fit approximately ${profile.sessionMinutes} minutes including reasonable transitions; do not hide an unrealistic amount of work inside the stated duration.
- Match trainingPriority, experience, fitnessLevel, preferred styles, location, and available equipment.
- Do not include disliked exercises. Treat painAreas, injuries, healthFlags, medications, medicalNotes, surgery, pregnancy, chest symptoms, fainting, neurological symptoms, and significant cardiometabolic conditions as hard safety context.
- When safety cannot be established, choose lower-risk general alternatives and add a concise safetyNote recommending qualified assessment; do not invent clearance.
- Use recoverable weekly volume. Beginners generally keep 1-3 repetitions in reserve and simple stable movements. Do not prescribe routine failure training.
- Balance movement patterns across the week and avoid redundant exercises in one session.
- Every exercise needs a conventional searchable English and Persian canonical name, accurate movement pattern, muscles, equipment, level, tempo, RIR, rest, 2-8 actionable form cues, and 1-8 common mistakes.
- videoSearchQueries must be concise YouTube search phrases. English queries must contain canonicalNameEn plus words such as tutorial/proper form. Persian queries must contain canonicalNameFa plus آموزش/فرم صحیح/نحوه اجرا. Do not return URLs or channel names.
- Do not estimate calories burned.

REQUIRED JSON CONTRACT:
${workoutJsonContract()}`,
  });

  let candidate = initial.data;
  let issues = workoutQualityIssues(candidate, profile);
  let requestId = initial.metadata.requestId;
  if (issues.length > 0) {
    const repaired = await repairWorkoutPlan({
      plan: candidate,
      issues,
      profile,
      model: settings.textModel,
    });
    candidate = repaired.data;
    requestId = repaired.metadata.requestId;
    issues = workoutQualityIssues(candidate, profile);
  }
  if (issues.length > 0) {
    throw new AvalAiError(
      `Generated workout plan failed quality checks: ${issues.slice(0, 4).join(' ')}`,
      'QUALITY_VALIDATION_FAILED',
      502,
      requestId,
    );
  }

  const createdAt = new Date().toISOString();
  return WorkoutPlanSchema.parse({
    id: createId('workout-plan'),
    title: candidate.title,
    summary: candidate.summary,
    safetyNotes: candidate.safetyNotes,
    createdAt,
    days: candidate.days
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
  const targets = calculateNutritionTargets(profile);
  const initial = await requestStructured({
    kind: 'generate_nutrition_plan',
    schema: AiNutritionPlanSchema,
    locale: profile.locale,
    model: settings.textModel,
    maxTokens: 12_000,
    temperature: 0.12,
    system: 'You are an evidence-informed nutrition planning assistant. Build practical general-wellness meal-plan drafts. You select food identities and planned amounts only. Never return calories or macronutrients; NeoFit resolves every ingredient and calculates nutrition from its local IFKB/USDA catalog.',
    prompt: `Create a realistic seven-day meal-plan draft from the validated profile.
VALIDATED PROFILE:
${profilePrompt(profile)}

ON-DEVICE NUTRITION TARGETS (planning constraints only; never return nutrition numbers):
${JSON.stringify(targets, null, 2)}

EXACT IRANIAN NAMES AND DEFAULT-SERVING ANCHORS AVAILABLE IN THE LOCAL CATALOG:
${iranianFoodAnchors()}

NON-NEGOTIABLE PLAN RULES:
- Return each dayIndex 0 through 6 exactly once and exactly ${profile.details.mealsPerDay} meals per day.
- Respect every allergy as an absolute exclusion, including ingredient-level sources. Respect dietary preferences and dislikedFoods.
- Match budgetLevel, cookingAccess, cookingMinutes, workSchedule, preferred meal count, training time, and cultural context.
- Each ingredient needs: a localized name, a human-readable quantity, one catalogQuery, positive edible grams, and a category.
- For an Iranian named dish, use exactly one listed Persian/English anchor as catalogQuery and represent the dish as one ingredient. Add rice, bread, drink, yogurt, salad, and other sides as separate ingredients.
- For generic foods, catalogQuery must be a concise conventional English food name including meaningful preparation, such as "chicken breast grilled", "rice white cooked", or "egg whole cooked".
- Include only nutritionally material components. Do not create separate entries for water or trace salt/spices/herbs unless they materially affect nutrition and have a resolvable catalog query.
- grams is a planned edible default, not measured intake. quantity is the matching human-readable amount. Never claim laboratory precision.
- Avoid monotonous repetition; leftovers can repeat intentionally but no exact meal more than three times in the week.
- Do not prescribe therapeutic diets. For health flags requiring individualized care, keep the plan conservative and add a safetyNote.
- Do not add powders or supplements unless the profile explicitly lists them as acceptable; prefer ordinary foods.
- Do not return calories, proteinG, carbsG, fatG, serving nutrition, or hidden nutrition estimates anywhere in the JSON.
REQUIRED JSON CONTRACT:
${nutritionJsonContract()}`,
  });

  const createdAt = new Date().toISOString();
  let candidate = initial.data;
  let requestId = initial.metadata.requestId;
  let validation = await resolveNutritionCandidate({ plan: candidate, profile, createdAt });

  if (validation.issues.length > 0) {
    const repaired = await repairNutritionPlan({
      plan: candidate,
      issues: validation.issues,
      profile,
      model: settings.textModel,
    });
    candidate = repaired.data;
    requestId = repaired.metadata.requestId;
    validation = await resolveNutritionCandidate({ plan: candidate, profile, createdAt });
  }

  if (!validation.plan || validation.issues.length > 0) {
    throw new AvalAiError(
      `Generated nutrition plan could not be fully resolved through the local catalog: ${validation.issues.slice(0, 4).join(' ')}`,
      'QUALITY_VALIDATION_FAILED',
      502,
      requestId,
    );
  }
  return validation.plan;
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
    temperature: 0.08,
    system: 'You estimate food nutrition conservatively. Parse quantity and cooking method carefully, and represent uncertainty rather than fabricating exact values.',
    prompt: `Estimate nutrition for this exact user description:
${JSON.stringify(input.description.trim())}

Return JSON with itemName, servingSize, calories, proteinG, carbsG, fatG, confidence (low|medium|high), and assumptions (string array).

Rules:
- Preserve the stated number of servings, grams, cups, pieces, oils, sauces, and cooking method.
- For Iranian mixed dishes, distinguish the stew/dish from accompanying rice, bread, sides, or drinks. Do not silently add them.
- If quantity is missing, choose one plausible standard serving and state it explicitly.
- Cooking oil, fatty meat, nuts, sugar, restaurant preparation, and hidden sauces materially change the result; mention them when unknown.
- Do not claim laboratory precision. Use low confidence when the recipe or portion is unclear.
- Calories and macros must be broadly energy-consistent after rounding.`,
  });
  return normalizeFoodEstimate(response.data);
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
    temperature: 0.05,
    system: 'You estimate visible food identity and nutrition conservatively from one image. A photo cannot establish exact weight, hidden ingredients, oil, or recipe.',
    prompt: `Estimate the visible meal in the image.
Optional user description: ${JSON.stringify(input.description?.trim() || '')}

Return JSON with itemName, servingSize, calories, proteinG, carbsG, fatG, confidence (low|medium|high), and assumptions (string array).

Rules:
- First decide whether the image clearly contains food. If not, identify it as an unclear/unknown food image and use low confidence.
- List each visible major component in itemName or assumptions; do not merge rice, stew, bread, drink, and sides into an unexplained number.
- Use plate/bowl geometry only as a weak serving-size cue. Never imply that image pixels reveal grams exactly.
- State a plausible serving size and the hidden-oil/recipe assumptions that drive the estimate.
- Use low or medium confidence unless both food identity and portion are unusually clear.
- Calories and macros must be broadly energy-consistent after rounding.`,
  });
  return normalizeFoodEstimate(response.data);
}
