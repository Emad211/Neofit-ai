export const ONBOARDING_TOTAL_STEPS = 15;

export const onboardingSteps = [
  { number: 1, slug: "welcome", label: "شروع" },
  { number: 2, slug: "goal", label: "هدف" },
  { number: 3, slug: "basics", label: "مشخصات پایه" },
  { number: 4, slug: "body", label: "اندازه‌های بدنی" },
  { number: 5, slug: "medical", label: "سابقه پزشکی" },
  { number: 6, slug: "injuries", label: "آسیب‌ها" },
  { number: 7, slug: "lifestyle", label: "سبک زندگی" },
  { number: 8, slug: "nutrition", label: "تغذیه" },
  { number: 9, slug: "training-history", label: "سابقه تمرین" },
  { number: 10, slug: "availability", label: "زمان و تجهیزات" },
  { number: 11, slug: "preferences", label: "ترجیحات" },
  { number: 12, slug: "review", label: "مرور" },
  { number: 13, slug: "analysis", label: "تحلیل" },
  { number: 14, slug: "result", label: "نتیجه اولیه" },
  { number: 15, slug: "confirmation", label: "شروع برنامه" },
] as const;

export type GoalId =
  | "weight-loss"
  | "muscle-gain"
  | "maintenance"
  | "fitness"
  | "lifestyle";

export type GenderId = "male" | "female" | "other" | "prefer-not-to-say";
export type UnitSystem = "metric" | "imperial";
export type InjurySeverity = "mild" | "moderate" | "severe";
export type InjuryStatus = "current" | "past";

export interface GoalSection {
  primaryGoal: GoalId | null;
  secondaryGoals: GoalId[];
  targetTimeline: "steady" | "balanced" | "fast";
}

export interface BasicsSection {
  name: string;
  age: number | null;
  gender: GenderId | null;
  heightCm: number | null;
  weightKg: number | null;
  country: string;
  unitSystem: UnitSystem;
}

export interface BodySection {
  waistCm: number | null;
  hipCm: number | null;
  neckCm: number | null;
  bodyFatPercent: number | null;
  targetWeightKg: number | null;
  progressPhotoOptIn: boolean;
}

export interface MedicalSection {
  conditions: string[];
  medications: string;
  hasHighBloodPressure: boolean;
  hasDiabetes: boolean;
  hasCardiacHistory: boolean;
  physicianRestrictions: string;
  medicalAcknowledged: boolean;
}

export interface InjuryArea {
  key: string;
  bodyPartId: string;
  face: "ant" | "post";
  label: string;
  severity: InjurySeverity;
  status: InjuryStatus;
  forbiddenMovements: string;
  notes: string;
}

export interface InjuriesSection {
  noInjuries: boolean;
  areas: InjuryArea[];
  painDuringExercise: boolean;
  painScale: number | null;
  generalLimitations: string;
}

export interface LifestyleSection {
  occupation: string;
  activityLevel: "sedentary" | "light" | "moderate" | "high";
  sittingHours: number | null;
  dailySteps: number | null;
  sleepHours: number | null;
  sleepQuality: "poor" | "average" | "good";
  stressLevel: "low" | "medium" | "high";
  smoking: "never" | "sometimes" | "daily";
  routineNotes: string;
}

export interface NutritionSection {
  mealsPerDay: number;
  dietType: "balanced" | "vegetarian" | "vegan" | "pescatarian" | "low-carb" | "other";
  allergies: string[];
  dislikedFoods: string[];
  favoriteIranianFoods: string[];
  budget: "economy" | "balanced" | "flexible";
  cookingAbility: "beginner" | "intermediate" | "advanced";
  kitchenAccess: boolean;
  eatingOutFrequency: "rare" | "weekly" | "frequent";
  notes: string;
}

export interface TrainingHistorySection {
  level: "beginner" | "intermediate" | "advanced";
  trainingAgeMonths: number | null;
  previousSports: string[];
  recentBreakWeeks: number | null;
  familiarMovements: string[];
  cardioExperience: "none" | "basic" | "regular";
  strengthExperience: "none" | "basic" | "regular";
  notes: string;
}

export interface AvailabilitySection {
  location: "home" | "gym" | "both";
  equipment: string[];
  customEquipment: string;
  daysPerWeek: number;
  sessionDuration: 30 | 45 | 60 | 75 | 90;
  preferredDays: string[];
  preferredTime: "morning" | "afternoon" | "evening" | "flexible";
  scheduleNotes: string;
}

export interface PreferencesSection {
  intensity: "gentle" | "moderate" | "challenging";
  cardioPreference: "low" | "balanced" | "high";
  trainingStyle: "resistance" | "functional" | "mixed";
  variety: "stable" | "balanced" | "varied";
  nutritionStrictness: "flexible" | "structured" | "strict";
  coachingTone: "supportive" | "direct" | "analytical";
  reminderLevel: "minimal" | "normal" | "high";
}

export interface ConfirmationSection {
  startDate: string;
  workoutReminders: boolean;
  mealReminders: boolean;
  waterReminders: boolean;
  weeklyReport: boolean;
  finalConsent: boolean;
  completedAt: string | null;
}

export interface OnboardingDraft {
  version: 1;
  startedAt: string;
  updatedAt: string;
  completedSteps: number[];
  goal: GoalSection;
  basics: BasicsSection;
  body: BodySection;
  medical: MedicalSection;
  injuries: InjuriesSection;
  lifestyle: LifestyleSection;
  nutrition: NutritionSection;
  trainingHistory: TrainingHistorySection;
  availability: AvailabilitySection;
  preferences: PreferencesSection;
  confirmation: ConfirmationSection;
}

export interface InitialPlanPreview {
  calorieTarget: number;
  proteinGrams: number;
  carbohydrateGrams: number;
  fatGrams: number;
  trainingDays: number;
  sessionMinutes: number;
  weeklyStructure: string[];
  healthCautions: string[];
  rationale: string[];
}

export const createEmptyOnboardingDraft = (): OnboardingDraft => {
  const now = new Date().toISOString();
  return {
    version: 1,
    startedAt: now,
    updatedAt: now,
    completedSteps: [],
    goal: {
      primaryGoal: null,
      secondaryGoals: [],
      targetTimeline: "balanced",
    },
    basics: {
      name: "",
      age: null,
      gender: null,
      heightCm: 176,
      weightKg: 75,
      country: "ایران",
      unitSystem: "metric",
    },
    body: {
      waistCm: null,
      hipCm: null,
      neckCm: null,
      bodyFatPercent: null,
      targetWeightKg: null,
      progressPhotoOptIn: false,
    },
    medical: {
      conditions: [],
      medications: "",
      hasHighBloodPressure: false,
      hasDiabetes: false,
      hasCardiacHistory: false,
      physicianRestrictions: "",
      medicalAcknowledged: false,
    },
    injuries: {
      noInjuries: false,
      areas: [],
      painDuringExercise: false,
      painScale: null,
      generalLimitations: "",
    },
    lifestyle: {
      occupation: "",
      activityLevel: "sedentary",
      sittingHours: 8,
      dailySteps: 3000,
      sleepHours: 7,
      sleepQuality: "average",
      stressLevel: "medium",
      smoking: "never",
      routineNotes: "",
    },
    nutrition: {
      mealsPerDay: 3,
      dietType: "balanced",
      allergies: [],
      dislikedFoods: [],
      favoriteIranianFoods: [],
      budget: "balanced",
      cookingAbility: "intermediate",
      kitchenAccess: true,
      eatingOutFrequency: "weekly",
      notes: "",
    },
    trainingHistory: {
      level: "beginner",
      trainingAgeMonths: 0,
      previousSports: [],
      recentBreakWeeks: 0,
      familiarMovements: [],
      cardioExperience: "basic",
      strengthExperience: "basic",
      notes: "",
    },
    availability: {
      location: "gym",
      equipment: ["full-gym"],
      customEquipment: "",
      daysPerWeek: 3,
      sessionDuration: 60,
      preferredDays: [],
      preferredTime: "flexible",
      scheduleNotes: "",
    },
    preferences: {
      intensity: "moderate",
      cardioPreference: "balanced",
      trainingStyle: "mixed",
      variety: "balanced",
      nutritionStrictness: "structured",
      coachingTone: "supportive",
      reminderLevel: "normal",
    },
    confirmation: {
      startDate: "",
      workoutReminders: true,
      mealReminders: true,
      waterReminders: false,
      weeklyReport: true,
      finalConsent: false,
      completedAt: null,
    },
  };
};

export const goalLabels: Record<GoalId, string> = {
  "weight-loss": "کاهش وزن",
  "muscle-gain": "افزایش عضله",
  maintenance: "حفظ وزن و فرم",
  fitness: "افزایش آمادگی جسمانی",
  lifestyle: "بهبود سبک زندگی",
};

export const timelineLabels: Record<GoalSection["targetTimeline"], string> = {
  steady: "آرام و پایدار",
  balanced: "متعادل",
  fast: "سریع‌تر با کنترل بیشتر",
};

export function deriveInitialPlan(draft: OnboardingDraft): InitialPlanPreview {
  const weight = draft.basics.weightKg || 75;
  const height = draft.basics.heightCm || 176;
  const age = draft.basics.age || 30;
  const genderOffset = draft.basics.gender === "male" ? 5 : draft.basics.gender === "female" ? -161 : -78;
  const bmr = 10 * weight + 6.25 * height - 5 * age + genderOffset;
  const activityFactor = {
    sedentary: 1.25,
    light: 1.4,
    moderate: 1.55,
    high: 1.75,
  }[draft.lifestyle.activityLevel];

  const goalAdjustment = {
    "weight-loss": draft.goal.targetTimeline === "fast" ? -550 : draft.goal.targetTimeline === "steady" ? -250 : -400,
    "muscle-gain": draft.goal.targetTimeline === "fast" ? 350 : draft.goal.targetTimeline === "steady" ? 150 : 250,
    maintenance: 0,
    fitness: 0,
    lifestyle: -100,
  }[draft.goal.primaryGoal || "maintenance"];

  const calorieTarget = Math.max(1200, Math.round((bmr * activityFactor + goalAdjustment) / 10) * 10);
  const proteinPerKg = draft.goal.primaryGoal === "muscle-gain" || draft.goal.primaryGoal === "weight-loss" ? 1.9 : 1.6;
  const proteinGrams = Math.round(weight * proteinPerKg);
  const fatGrams = Math.round(weight * 0.8);
  const carbohydrateGrams = Math.max(80, Math.round((calorieTarget - proteinGrams * 4 - fatGrams * 9) / 4));
  const trainingDays = Math.max(2, Math.min(6, draft.availability.daysPerWeek));

  const weeklyStructure =
    trainingDays <= 2
      ? ["تمام بدن A", "تمام بدن B"]
      : trainingDays === 3
        ? ["تمام بدن A", "تمام بدن B", "تمام بدن C"]
        : trainingDays === 4
          ? ["بالاتنه A", "پایین‌تنه A", "بالاتنه B", "پایین‌تنه B"]
          : ["فشار", "کشش", "پا", "بالاتنه ترکیبی", "پایین‌تنه و هوازی", ...(trainingDays === 6 ? ["ریکاوری فعال"] : [])];

  const healthCautions: string[] = [];
  if (draft.medical.hasHighBloodPressure) healthCautions.push("شدت‌های بسیار بالا و حبس نفس باید محافظه‌کارانه مدیریت شوند.");
  if (draft.medical.hasDiabetes) healthCautions.push("زمان‌بندی وعده و تمرین باید با پایش قند و نظر درمانگر هماهنگ شود.");
  if (draft.medical.hasCardiacHistory) healthCautions.push("شروع تمرین پرفشار منوط به مجوز پزشک است.");
  if (draft.injuries.areas.length) healthCautions.push(`${draft.injuries.areas.length} ناحیه آسیب‌دیده در انتخاب حرکات و دامنه حرکت لحاظ می‌شود.`);
  if (draft.medical.physicianRestrictions.trim()) healthCautions.push("محدودیت ثبت‌شده پزشک بر همه پیشنهادهای تمرینی اولویت دارد.");
  if (!healthCautions.length) healthCautions.push("محدودیت پرخطر گزارش نشده؛ افزایش فشار تمرین همچنان تدریجی خواهد بود.");

  return {
    calorieTarget,
    proteinGrams,
    carbohydrateGrams,
    fatGrams,
    trainingDays,
    sessionMinutes: draft.availability.sessionDuration,
    weeklyStructure: weeklyStructure.slice(0, trainingDays),
    healthCautions,
    rationale: [
      `کالری بر اساس وزن، قد، سن، سطح فعالیت و هدف «${goalLabels[draft.goal.primaryGoal || "maintenance"]}» برآورد شده است.`,
      `ساختار تمرین با ${trainingDays} روز در هفته و جلسات ${draft.availability.sessionDuration} دقیقه‌ای تنظیم شده است.`,
      "انتخاب غذاها در نسخه کامل از کتابخانه غذاهای ایرانی و محدودیت‌های ثبت‌شده انجام می‌شود.",
    ],
  };
}
