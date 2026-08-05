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

export interface OnboardingDraft {
  version: 1;
  startedAt: string;
  updatedAt: string;
  completedSteps: number[];
  goal: GoalSection;
  basics: BasicsSection;
  body: BodySection;
  medical: MedicalSection;
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
  };
};

export const goalLabels: Record<GoalId, string> = {
  "weight-loss": "کاهش وزن",
  "muscle-gain": "افزایش عضله",
  maintenance: "حفظ وزن و فرم",
  fitness: "افزایش آمادگی جسمانی",
  lifestyle: "بهبود سبک زندگی",
};
