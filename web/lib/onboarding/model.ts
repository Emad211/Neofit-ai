export const ONBOARDING_SCHEMA_VERSION = 1 as const;
export const ONBOARDING_TOTAL_STEPS = 15;

export const onboardingSteps = [
  { number: 1, slug: 'welcome', label: 'شروع' },
  { number: 2, slug: 'goal', label: 'هدف' },
  { number: 3, slug: 'basics', label: 'مشخصات پایه' },
  { number: 4, slug: 'body', label: 'اندازه‌های بدنی' },
  { number: 5, slug: 'medical', label: 'سابقه پزشکی' },
  { number: 6, slug: 'injuries', label: 'آسیب‌ها' },
  { number: 7, slug: 'lifestyle', label: 'سبک زندگی' },
  { number: 8, slug: 'nutrition', label: 'تغذیه' },
  { number: 9, slug: 'training-history', label: 'سابقه تمرین' },
  { number: 10, slug: 'availability', label: 'زمان و تجهیزات' },
  { number: 11, slug: 'preferences', label: 'ترجیحات' },
  { number: 12, slug: 'review', label: 'مرور' },
  { number: 13, slug: 'analysis', label: 'تحلیل' },
  { number: 14, slug: 'result', label: 'نتیجه اولیه' },
  { number: 15, slug: 'confirmation', label: 'شروع برنامه' },
] as const;

export type OnboardingStepSlug = (typeof onboardingSteps)[number]['slug'];
export type GoalId = 'weight-loss' | 'muscle-gain' | 'maintenance' | 'fitness' | 'lifestyle';
export type GenderId = 'male' | 'female' | 'other' | 'prefer-not-to-say';
export type UnitSystem = 'metric' | 'imperial';
export type InjurySeverity = 'mild' | 'moderate' | 'severe';
export type InjuryStatus = 'current' | 'past';

export interface GoalSection {
  primaryGoal: GoalId | null;
  secondaryGoals: GoalId[];
  targetTimeline: 'steady' | 'balanced' | 'fast';
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
  face: 'ant' | 'post';
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
  activityLevel: 'sedentary' | 'light' | 'moderate' | 'high';
  sittingHours: number | null;
  dailySteps: number | null;
  sleepHours: number | null;
  sleepQuality: 'poor' | 'average' | 'good';
  stressLevel: 'low' | 'medium' | 'high';
  smoking: 'never' | 'sometimes' | 'daily';
  routineNotes: string;
}

export interface NutritionSection {
  mealsPerDay: number;
  dietType: 'balanced' | 'vegetarian' | 'vegan' | 'pescatarian' | 'low-carb' | 'other';
  allergies: string[];
  dislikedFoods: string[];
  favoriteIranianFoods: string[];
  budget: 'economy' | 'balanced' | 'flexible';
  cookingAbility: 'beginner' | 'intermediate' | 'advanced';
  kitchenAccess: boolean;
  eatingOutFrequency: 'rare' | 'weekly' | 'frequent';
  notes: string;
}

export interface TrainingHistorySection {
  level: 'beginner' | 'intermediate' | 'advanced';
  trainingAgeMonths: number | null;
  previousSports: string[];
  recentBreakWeeks: number | null;
  familiarMovements: string[];
  cardioExperience: 'none' | 'basic' | 'regular';
  strengthExperience: 'none' | 'basic' | 'regular';
  notes: string;
}

export interface AvailabilitySection {
  location: 'home' | 'gym' | 'both';
  equipment: string[];
  customEquipment: string;
  daysPerWeek: number;
  sessionDuration: 30 | 45 | 60 | 75 | 90;
  preferredDays: string[];
  preferredTime: 'morning' | 'afternoon' | 'evening' | 'flexible';
  scheduleNotes: string;
}

export interface PreferencesSection {
  intensity: 'gentle' | 'moderate' | 'challenging';
  cardioPreference: 'low' | 'balanced' | 'high';
  trainingStyle: 'resistance' | 'functional' | 'mixed';
  variety: 'stable' | 'balanced' | 'varied';
  nutritionStrictness: 'flexible' | 'structured' | 'strict';
  coachingTone: 'supportive' | 'direct' | 'analytical';
  reminderLevel: 'minimal' | 'normal' | 'high';
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

export interface TrainingPreview {
  trainingDays: number;
  sessionMinutes: number;
  weeklyStructure: string[];
  healthCautions: string[];
}

export const goalLabels: Record<GoalId, string> = {
  'weight-loss': 'کاهش وزن',
  'muscle-gain': 'افزایش عضله',
  maintenance: 'حفظ وزن و فرم',
  fitness: 'افزایش آمادگی جسمانی',
  lifestyle: 'بهبود سبک زندگی',
};

export const createEmptyOnboardingDraft = (): OnboardingDraft => {
  const now = new Date().toISOString();
  return {
    version: ONBOARDING_SCHEMA_VERSION,
    startedAt: now,
    updatedAt: now,
    completedSteps: [],
    goal: { primaryGoal: null, secondaryGoals: [], targetTimeline: 'balanced' },
    basics: { name: '', age: null, gender: null, heightCm: null, weightKg: null, country: '', unitSystem: 'metric' },
    body: { waistCm: null, hipCm: null, neckCm: null, bodyFatPercent: null, targetWeightKg: null, progressPhotoOptIn: false },
    medical: { conditions: [], medications: '', hasHighBloodPressure: false, hasDiabetes: false, hasCardiacHistory: false, physicianRestrictions: '', medicalAcknowledged: false },
    injuries: { noInjuries: false, areas: [], painDuringExercise: false, painScale: null, generalLimitations: '' },
    lifestyle: { occupation: '', activityLevel: 'sedentary', sittingHours: null, dailySteps: null, sleepHours: null, sleepQuality: 'average', stressLevel: 'medium', smoking: 'never', routineNotes: '' },
    nutrition: { mealsPerDay: 3, dietType: 'balanced', allergies: [], dislikedFoods: [], favoriteIranianFoods: [], budget: 'balanced', cookingAbility: 'intermediate', kitchenAccess: true, eatingOutFrequency: 'weekly', notes: '' },
    trainingHistory: { level: 'beginner', trainingAgeMonths: null, previousSports: [], recentBreakWeeks: null, familiarMovements: [], cardioExperience: 'basic', strengthExperience: 'basic', notes: '' },
    availability: { location: 'gym', equipment: [], customEquipment: '', daysPerWeek: 3, sessionDuration: 60, preferredDays: [], preferredTime: 'flexible', scheduleNotes: '' },
    preferences: { intensity: 'moderate', cardioPreference: 'balanced', trainingStyle: 'mixed', variety: 'balanced', nutritionStrictness: 'structured', coachingTone: 'supportive', reminderLevel: 'normal' },
    confirmation: { startDate: '', workoutReminders: true, mealReminders: true, waterReminders: false, weeklyReport: true, finalConsent: false, completedAt: null },
  };
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

export function parseOnboardingDraft(value: unknown): OnboardingDraft | null {
  if (!isRecord(value) || value.version !== ONBOARDING_SCHEMA_VERSION || !Array.isArray(value.completedSteps)) return null;
  const sections = ['goal', 'basics', 'body', 'medical', 'injuries', 'lifestyle', 'nutrition', 'trainingHistory', 'availability', 'preferences', 'confirmation'] as const;
  if (!sections.every((key) => isRecord(value[key]))) return null;
  return value as unknown as OnboardingDraft;
}

export function getOnboardingStep(slug: string) {
  return onboardingSteps.find((step) => step.slug === slug) ?? null;
}

export function getNextOnboardingStep(number: number) {
  return onboardingSteps.find((step) => step.number === Math.min(ONBOARDING_TOTAL_STEPS, number + 1)) ?? onboardingSteps.at(-1)!;
}

export function getPreviousOnboardingStep(number: number) {
  return onboardingSteps.find((step) => step.number === Math.max(1, number - 1)) ?? onboardingSteps[0];
}

export function resumeStepNumber(draft: OnboardingDraft): number {
  const completed = new Set(draft.completedSteps.filter((step) => Number.isInteger(step) && step >= 1 && step <= ONBOARDING_TOTAL_STEPS));
  for (let step = 1; step <= ONBOARDING_TOTAL_STEPS; step += 1) {
    if (!completed.has(step)) return step;
  }
  return ONBOARDING_TOTAL_STEPS;
}

export function markStepCompleted(draft: OnboardingDraft, step: number): OnboardingDraft {
  const completedSteps = Array.from(new Set([...draft.completedSteps, step])).sort((a, b) => a - b);
  return { ...draft, completedSteps, updatedAt: new Date().toISOString() };
}

function inRange(value: number | null, min: number, max: number) {
  return value !== null && Number.isFinite(value) && value >= min && value <= max;
}

export function validateOnboardingStep(draft: OnboardingDraft, step: number): string[] {
  const errors: string[] = [];
  if (step === 2 && !draft.goal.primaryGoal) errors.push('یک هدف اصلی انتخاب کن.');
  if (step === 3) {
    if (!draft.basics.name.trim()) errors.push('نام نمایشی را وارد کن.');
    if (!inRange(draft.basics.age, 10, 120)) errors.push('سن معتبر وارد کن.');
    if (!draft.basics.gender) errors.push('گزینه جنسیت را مشخص کن.');
    if (!inRange(draft.basics.heightCm, 100, 250)) errors.push('قد را به سانتی‌متر و در بازه معتبر وارد کن.');
    if (!inRange(draft.basics.weightKg, 25, 350)) errors.push('وزن را به کیلوگرم و در بازه معتبر وارد کن.');
  }
  if (step === 4) {
    if (draft.body.bodyFatPercent !== null && !inRange(draft.body.bodyFatPercent, 2, 70)) errors.push('درصد چربی بدن باید بین ۲ تا ۷۰ باشد.');
    if (draft.body.targetWeightKg !== null && !inRange(draft.body.targetWeightKg, 25, 350)) errors.push('وزن هدف معتبر وارد کن.');
  }
  if (step === 5 && !draft.medical.medicalAcknowledged) errors.push('تأیید کن که این اطلاعات جایگزین ارزیابی پزشکی نیست.');
  if (step === 6) {
    if (draft.injuries.noInjuries && draft.injuries.areas.length > 0) errors.push('اگر «بدون آسیب» را انتخاب کرده‌ای، ناحیه آسیب‌دیده نباید باقی بماند.');
    if (draft.injuries.painDuringExercise && !inRange(draft.injuries.painScale, 0, 10)) errors.push('شدت درد را بین صفر تا ۱۰ وارد کن.');
  }
  if (step === 7) {
    if (draft.lifestyle.sleepHours !== null && !inRange(draft.lifestyle.sleepHours, 0, 24)) errors.push('ساعت خواب معتبر وارد کن.');
    if (draft.lifestyle.sittingHours !== null && !inRange(draft.lifestyle.sittingHours, 0, 24)) errors.push('ساعت نشستن معتبر وارد کن.');
    if (draft.lifestyle.dailySteps !== null && !inRange(draft.lifestyle.dailySteps, 0, 100000)) errors.push('تعداد قدم روزانه معتبر وارد کن.');
  }
  if (step === 8 && (draft.nutrition.mealsPerDay < 1 || draft.nutrition.mealsPerDay > 8)) errors.push('تعداد وعده‌ها باید بین ۱ تا ۸ باشد.');
  if (step === 9 && draft.trainingHistory.trainingAgeMonths !== null && !inRange(draft.trainingHistory.trainingAgeMonths, 0, 1200)) errors.push('سابقه تمرین معتبر وارد کن.');
  if (step === 10) {
    if (draft.availability.daysPerWeek < 1 || draft.availability.daysPerWeek > 6) errors.push('تعداد روز تمرین باید بین ۱ تا ۶ باشد.');
    if (![30, 45, 60, 75, 90].includes(draft.availability.sessionDuration)) errors.push('مدت جلسه معتبر انتخاب کن.');
  }
  if (step === 15) {
    if (!draft.confirmation.startDate) errors.push('تاریخ شروع را انتخاب کن.');
    if (!draft.confirmation.finalConsent) errors.push('برای شروع برنامه، تأیید نهایی لازم است.');
  }
  return errors;
}

export function buildTrainingPreview(draft: OnboardingDraft): TrainingPreview {
  const trainingDays = Math.max(1, Math.min(6, draft.availability.daysPerWeek));
  const weeklyStructure = trainingDays <= 2
    ? ['تمام بدن A', ...(trainingDays === 2 ? ['تمام بدن B'] : [])]
    : trainingDays === 3
      ? ['تمام بدن A', 'تمام بدن B', 'تمام بدن C']
      : trainingDays === 4
        ? ['بالاتنه A', 'پایین‌تنه A', 'بالاتنه B', 'پایین‌تنه B']
        : ['فشار', 'کشش', 'پا', 'بالاتنه ترکیبی', 'پایین‌تنه و هوازی', ...(trainingDays === 6 ? ['ریکاوری فعال'] : [])];

  const healthCautions: string[] = [];
  if (draft.medical.hasHighBloodPressure) healthCautions.push('شدت‌های بسیار بالا و حبس نفس باید محافظه‌کارانه مدیریت شوند.');
  if (draft.medical.hasDiabetes) healthCautions.push('زمان‌بندی وعده و تمرین باید با پایش قند و برنامه درمانی هماهنگ شود.');
  if (draft.medical.hasCardiacHistory) healthCautions.push('تمرین پرفشار بدون تأیید مناسب نباید پیشنهاد شود.');
  if (draft.injuries.areas.length) healthCautions.push(`${draft.injuries.areas.length.toLocaleString('fa-IR')} ناحیه آسیب‌دیده در انتخاب حرکت و دامنه حرکت محدودکننده است.`);
  if (draft.medical.physicianRestrictions.trim()) healthCautions.push('محدودیت ثبت‌شده پزشک بر پیشنهادهای تمرینی اولویت دارد.');
  if (!healthCautions.length) healthCautions.push('محدودیت پرخطر گزارش نشده؛ افزایش فشار تمرین همچنان باید تدریجی باشد.');

  return { trainingDays, sessionMinutes: draft.availability.sessionDuration, weeklyStructure: weeklyStructure.slice(0, trainingDays), healthCautions };
}

export const NUTRITION_AUTHORITY_NOTE = 'هدف‌های کالری و ماکرو در این مرحله از Onboarding محاسبه نمی‌شوند؛ Nutrition Core تنها مرجع محاسبات تغذیه‌ای نئوفیت باقی می‌ماند.';
