export const ONBOARDING_SCHEMA_VERSION = 2 as const;
export const ONBOARDING_TOTAL_STEPS = 15;
export const PROGRAM_DURATION_MIN_DAYS = 14;
export const PROGRAM_DURATION_MAX_DAYS = 84;

export const onboardingSteps = [
  { number: 1, slug: 'welcome', label: 'اتصال مربی' },
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
  { number: 15, slug: 'confirmation', label: 'دوره' },
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
  targetTimeline: 'steady' | 'balanced' | 'fast' | null;
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
  hasHighBloodPressure: boolean | null;
  hasDiabetes: boolean | null;
  hasCardiacHistory: boolean | null;
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
  noInjuries: boolean | null;
  areas: InjuryArea[];
  painDuringExercise: boolean | null;
  painScale: number | null;
  generalLimitations: string;
}

export interface LifestyleSection {
  occupation: string;
  activityLevel: 'sedentary' | 'light' | 'moderate' | 'high' | null;
  sittingHours: number | null;
  dailySteps: number | null;
  sleepHours: number | null;
  sleepQuality: 'poor' | 'average' | 'good' | null;
  stressLevel: 'low' | 'medium' | 'high' | null;
  smoking: 'never' | 'sometimes' | 'daily' | null;
  routineNotes: string;
}

export interface NutritionSection {
  mealsPerDay: number | null;
  dietType: 'balanced' | 'vegetarian' | 'vegan' | 'pescatarian' | 'low-carb' | 'other' | null;
  allergies: string[];
  dislikedFoods: string[];
  favoriteIranianFoods: string[];
  budget: 'economy' | 'balanced' | 'flexible' | null;
  cookingAbility: 'beginner' | 'intermediate' | 'advanced' | null;
  kitchenAccess: boolean | null;
  eatingOutFrequency: 'rare' | 'weekly' | 'frequent' | null;
  notes: string;
}

export interface TrainingHistorySection {
  level: 'beginner' | 'intermediate' | 'advanced' | null;
  trainingAgeMonths: number | null;
  previousSports: string[];
  recentBreakWeeks: number | null;
  familiarMovements: string[];
  cardioExperience: 'none' | 'basic' | 'regular' | null;
  strengthExperience: 'none' | 'basic' | 'regular' | null;
  notes: string;
}

export interface AvailabilitySection {
  location: 'home' | 'gym' | 'both' | null;
  equipment: string[];
  customEquipment: string;
  daysPerWeek: number | null;
  sessionDuration: 30 | 45 | 60 | 75 | 90 | null;
  preferredDays: string[];
  preferredTime: 'morning' | 'afternoon' | 'evening' | 'flexible' | null;
  scheduleNotes: string;
}

export interface PreferencesSection {
  intensity: 'gentle' | 'moderate' | 'challenging' | null;
  cardioPreference: 'low' | 'balanced' | 'high' | null;
  trainingStyle: 'resistance' | 'functional' | 'mixed' | null;
  variety: 'stable' | 'balanced' | 'varied' | null;
  nutritionStrictness: 'flexible' | 'structured' | 'strict' | null;
  coachingTone: 'supportive' | 'direct' | 'analytical' | null;
  reminderLevel: 'minimal' | 'normal' | 'high' | null;
}

export interface ConfirmationSection {
  startDate: string;
  programDurationDays: number | null;
  workoutReminders: boolean;
  mealReminders: boolean;
  waterReminders: boolean;
  weeklyReport: boolean;
  finalConsent: boolean;
  completedAt: string | null;
}

export interface OnboardingDraft {
  version: 2;
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
  trainingDays: number | null;
  sessionMinutes: number | null;
  weeklyStructure: string[];
  healthCautions: string[];
}

export interface NormalizedOnboardingDraft {
  readonly draft: OnboardingDraft;
  readonly migratedFromVersion: number | null;
}

export const goalLabels: Record<GoalId, string> = {
  'weight-loss': 'کاهش وزن',
  'muscle-gain': 'افزایش عضله',
  maintenance: 'حفظ وزن و فرم',
  fitness: 'افزایش آمادگی جسمانی',
  lifestyle: 'بهبود سبک زندگی',
};

const goalIds = new Set<GoalId>(['weight-loss', 'muscle-gain', 'maintenance', 'fitness', 'lifestyle']);
const genderIds = new Set<GenderId>(['male', 'female', 'other', 'prefer-not-to-say']);

export const createEmptyOnboardingDraft = (): OnboardingDraft => {
  const now = new Date().toISOString();
  return {
    version: ONBOARDING_SCHEMA_VERSION,
    startedAt: now,
    updatedAt: now,
    completedSteps: [],
    goal: { primaryGoal: null, secondaryGoals: [], targetTimeline: null },
    basics: { name: '', age: null, gender: null, heightCm: null, weightKg: null, country: '', unitSystem: 'metric' },
    body: { waistCm: null, hipCm: null, neckCm: null, bodyFatPercent: null, targetWeightKg: null, progressPhotoOptIn: false },
    medical: { conditions: [], medications: '', hasHighBloodPressure: null, hasDiabetes: null, hasCardiacHistory: null, physicianRestrictions: '', medicalAcknowledged: false },
    injuries: { noInjuries: null, areas: [], painDuringExercise: null, painScale: null, generalLimitations: '' },
    lifestyle: { occupation: '', activityLevel: null, sittingHours: null, dailySteps: null, sleepHours: null, sleepQuality: null, stressLevel: null, smoking: null, routineNotes: '' },
    nutrition: { mealsPerDay: null, dietType: null, allergies: [], dislikedFoods: [], favoriteIranianFoods: [], budget: null, cookingAbility: null, kitchenAccess: null, eatingOutFrequency: null, notes: '' },
    trainingHistory: { level: null, trainingAgeMonths: null, previousSports: [], recentBreakWeeks: null, familiarMovements: [], cardioExperience: null, strengthExperience: null, notes: '' },
    availability: { location: null, equipment: [], customEquipment: '', daysPerWeek: null, sessionDuration: null, preferredDays: [], preferredTime: null, scheduleNotes: '' },
    preferences: { intensity: null, cardioPreference: null, trainingStyle: null, variety: null, nutritionStrictness: null, coachingTone: null, reminderLevel: null },
    confirmation: { startDate: '', programDurationDays: null, workoutReminders: false, mealReminders: false, waterReminders: false, weeklyReport: false, finalConsent: false, completedAt: null },
  };
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function finiteOrNull(value: unknown): value is number | null {
  return value === null || (typeof value === 'number' && Number.isFinite(value));
}

function stringArray(value: unknown): value is string[] {
  return Array.isArray(value) && value.every((item) => typeof item === 'string');
}

function nullableEnum<T extends string>(value: unknown, values: readonly T[]): value is T | null {
  return value === null || (typeof value === 'string' && values.includes(value as T));
}

function nullableBoolean(value: unknown): value is boolean | null {
  return value === null || typeof value === 'boolean';
}

export function parseOnboardingDraft(value: unknown): OnboardingDraft | null {
  if (!isRecord(value) || value.version !== ONBOARDING_SCHEMA_VERSION || !Array.isArray(value.completedSteps)) return null;
  if (!value.completedSteps.every((step) => Number.isInteger(step) && Number(step) >= 1 && Number(step) <= ONBOARDING_TOTAL_STEPS)) return null;
  const sections = ['goal', 'basics', 'body', 'medical', 'injuries', 'lifestyle', 'nutrition', 'trainingHistory', 'availability', 'preferences', 'confirmation'] as const;
  if (!sections.every((key) => isRecord(value[key]))) return null;

  const goal = value.goal;
  const basics = value.basics;
  const body = value.body;
  const medical = value.medical;
  const injuries = value.injuries;
  const lifestyle = value.lifestyle;
  const nutrition = value.nutrition;
  const training = value.trainingHistory;
  const availability = value.availability;
  const preferences = value.preferences;
  const confirmation = value.confirmation;

  if (!nullableEnum(goal.primaryGoal, [...goalIds]) || !stringArray(goal.secondaryGoals) || !goal.secondaryGoals.every((item) => goalIds.has(item as GoalId)) || !nullableEnum(goal.targetTimeline, ['steady', 'balanced', 'fast'])) return null;
  if (typeof basics.name !== 'string' || !finiteOrNull(basics.age) || !nullableEnum(basics.gender, [...genderIds]) || !finiteOrNull(basics.heightCm) || !finiteOrNull(basics.weightKg) || typeof basics.country !== 'string' || !['metric', 'imperial'].includes(String(basics.unitSystem))) return null;
  if (![body.waistCm, body.hipCm, body.neckCm, body.bodyFatPercent, body.targetWeightKg].every(finiteOrNull) || typeof body.progressPhotoOptIn !== 'boolean') return null;
  if (!stringArray(medical.conditions) || typeof medical.medications !== 'string' || !nullableBoolean(medical.hasHighBloodPressure) || !nullableBoolean(medical.hasDiabetes) || !nullableBoolean(medical.hasCardiacHistory) || typeof medical.physicianRestrictions !== 'string' || typeof medical.medicalAcknowledged !== 'boolean') return null;
  if (!nullableBoolean(injuries.noInjuries) || !Array.isArray(injuries.areas) || !nullableBoolean(injuries.painDuringExercise) || !finiteOrNull(injuries.painScale) || typeof injuries.generalLimitations !== 'string') return null;
  if (typeof lifestyle.occupation !== 'string' || !nullableEnum(lifestyle.activityLevel, ['sedentary', 'light', 'moderate', 'high']) || !finiteOrNull(lifestyle.sittingHours) || !finiteOrNull(lifestyle.dailySteps) || !finiteOrNull(lifestyle.sleepHours) || !nullableEnum(lifestyle.sleepQuality, ['poor', 'average', 'good']) || !nullableEnum(lifestyle.stressLevel, ['low', 'medium', 'high']) || !nullableEnum(lifestyle.smoking, ['never', 'sometimes', 'daily']) || typeof lifestyle.routineNotes !== 'string') return null;
  if (!finiteOrNull(nutrition.mealsPerDay) || !nullableEnum(nutrition.dietType, ['balanced', 'vegetarian', 'vegan', 'pescatarian', 'low-carb', 'other']) || !stringArray(nutrition.allergies) || !stringArray(nutrition.dislikedFoods) || !stringArray(nutrition.favoriteIranianFoods) || !nullableEnum(nutrition.budget, ['economy', 'balanced', 'flexible']) || !nullableEnum(nutrition.cookingAbility, ['beginner', 'intermediate', 'advanced']) || !nullableBoolean(nutrition.kitchenAccess) || !nullableEnum(nutrition.eatingOutFrequency, ['rare', 'weekly', 'frequent']) || typeof nutrition.notes !== 'string') return null;
  if (!nullableEnum(training.level, ['beginner', 'intermediate', 'advanced']) || !finiteOrNull(training.trainingAgeMonths) || !stringArray(training.previousSports) || !finiteOrNull(training.recentBreakWeeks) || !stringArray(training.familiarMovements) || !nullableEnum(training.cardioExperience, ['none', 'basic', 'regular']) || !nullableEnum(training.strengthExperience, ['none', 'basic', 'regular']) || typeof training.notes !== 'string') return null;
  if (!nullableEnum(availability.location, ['home', 'gym', 'both']) || !stringArray(availability.equipment) || typeof availability.customEquipment !== 'string' || !finiteOrNull(availability.daysPerWeek) || !nullableEnum(availability.sessionDuration, ['30', '45', '60', '75', '90'].map(Number) as unknown as never[]) || !stringArray(availability.preferredDays) || !nullableEnum(availability.preferredTime, ['morning', 'afternoon', 'evening', 'flexible']) || typeof availability.scheduleNotes !== 'string') return null;
  if (!nullableEnum(preferences.intensity, ['gentle', 'moderate', 'challenging']) || !nullableEnum(preferences.cardioPreference, ['low', 'balanced', 'high']) || !nullableEnum(preferences.trainingStyle, ['resistance', 'functional', 'mixed']) || !nullableEnum(preferences.variety, ['stable', 'balanced', 'varied']) || !nullableEnum(preferences.nutritionStrictness, ['flexible', 'structured', 'strict']) || !nullableEnum(preferences.coachingTone, ['supportive', 'direct', 'analytical']) || !nullableEnum(preferences.reminderLevel, ['minimal', 'normal', 'high'])) return null;
  if (typeof confirmation.startDate !== 'string' || !finiteOrNull(confirmation.programDurationDays) || typeof confirmation.workoutReminders !== 'boolean' || typeof confirmation.mealReminders !== 'boolean' || typeof confirmation.waterReminders !== 'boolean' || typeof confirmation.weeklyReport !== 'boolean' || typeof confirmation.finalConsent !== 'boolean' || !(confirmation.completedAt === null || typeof confirmation.completedAt === 'string')) return null;
  if (typeof value.startedAt !== 'string' || typeof value.updatedAt !== 'string') return null;

  return value as unknown as OnboardingDraft;
}

function legacyString(record: Record<string, unknown>, key: string): string {
  return typeof record[key] === 'string' ? String(record[key]) : '';
}

function legacyNumber(record: Record<string, unknown>, key: string): number | null {
  const value = record[key];
  return typeof value === 'number' && Number.isFinite(value) ? value : null;
}

function legacyStrings(record: Record<string, unknown>, key: string): string[] {
  return stringArray(record[key]) ? record[key] : [];
}

export function migrateLegacyOnboardingDraft(value: unknown): OnboardingDraft | null {
  if (!isRecord(value) || value.version !== 1) return null;
  const next = createEmptyOnboardingDraft();
  const goal = isRecord(value.goal) ? value.goal : {};
  const basics = isRecord(value.basics) ? value.basics : {};
  const body = isRecord(value.body) ? value.body : {};
  const medical = isRecord(value.medical) ? value.medical : {};
  const injuries = isRecord(value.injuries) ? value.injuries : {};
  const lifestyle = isRecord(value.lifestyle) ? value.lifestyle : {};
  const nutrition = isRecord(value.nutrition) ? value.nutrition : {};
  const training = isRecord(value.trainingHistory) ? value.trainingHistory : {};
  const availability = isRecord(value.availability) ? value.availability : {};
  const confirmation = isRecord(value.confirmation) ? value.confirmation : {};

  if (typeof value.startedAt === 'string') next.startedAt = value.startedAt;
  if (typeof goal.primaryGoal === 'string' && goalIds.has(goal.primaryGoal as GoalId)) next.goal.primaryGoal = goal.primaryGoal as GoalId;
  next.goal.secondaryGoals = legacyStrings(goal, 'secondaryGoals').filter((item): item is GoalId => goalIds.has(item as GoalId));

  next.basics.name = legacyString(basics, 'name');
  next.basics.age = legacyNumber(basics, 'age');
  if (typeof basics.gender === 'string' && genderIds.has(basics.gender as GenderId)) next.basics.gender = basics.gender as GenderId;
  next.basics.heightCm = legacyNumber(basics, 'heightCm');
  next.basics.weightKg = legacyNumber(basics, 'weightKg');
  next.basics.country = legacyString(basics, 'country');
  if (basics.unitSystem === 'imperial') next.basics.unitSystem = 'imperial';

  next.body.waistCm = legacyNumber(body, 'waistCm');
  next.body.hipCm = legacyNumber(body, 'hipCm');
  next.body.neckCm = legacyNumber(body, 'neckCm');
  next.body.bodyFatPercent = legacyNumber(body, 'bodyFatPercent');
  next.body.targetWeightKg = legacyNumber(body, 'targetWeightKg');
  next.body.progressPhotoOptIn = body.progressPhotoOptIn === true;

  next.medical.conditions = legacyStrings(medical, 'conditions');
  next.medical.medications = legacyString(medical, 'medications');
  next.medical.physicianRestrictions = legacyString(medical, 'physicianRestrictions');

  next.injuries.areas = Array.isArray(injuries.areas) ? injuries.areas as InjuryArea[] : [];
  next.injuries.generalLimitations = legacyString(injuries, 'generalLimitations');

  next.lifestyle.occupation = legacyString(lifestyle, 'occupation');
  next.lifestyle.sittingHours = legacyNumber(lifestyle, 'sittingHours');
  next.lifestyle.dailySteps = legacyNumber(lifestyle, 'dailySteps');
  next.lifestyle.sleepHours = legacyNumber(lifestyle, 'sleepHours');
  next.lifestyle.routineNotes = legacyString(lifestyle, 'routineNotes');

  next.nutrition.allergies = legacyStrings(nutrition, 'allergies');
  next.nutrition.dislikedFoods = legacyStrings(nutrition, 'dislikedFoods');
  next.nutrition.favoriteIranianFoods = legacyStrings(nutrition, 'favoriteIranianFoods');
  next.nutrition.notes = legacyString(nutrition, 'notes');

  next.trainingHistory.trainingAgeMonths = legacyNumber(training, 'trainingAgeMonths');
  next.trainingHistory.previousSports = legacyStrings(training, 'previousSports');
  next.trainingHistory.recentBreakWeeks = legacyNumber(training, 'recentBreakWeeks');
  next.trainingHistory.familiarMovements = legacyStrings(training, 'familiarMovements');
  next.trainingHistory.notes = legacyString(training, 'notes');

  next.availability.equipment = legacyStrings(availability, 'equipment');
  next.availability.customEquipment = legacyString(availability, 'customEquipment');
  next.availability.preferredDays = legacyStrings(availability, 'preferredDays');
  next.availability.scheduleNotes = legacyString(availability, 'scheduleNotes');

  next.confirmation.startDate = legacyString(confirmation, 'startDate');
  next.completedSteps = [];
  next.confirmation.completedAt = null;
  next.confirmation.finalConsent = false;
  return next;
}

export function normalizeOnboardingDraft(value: unknown): NormalizedOnboardingDraft | null {
  const current = parseOnboardingDraft(value);
  if (current) return { draft: current, migratedFromVersion: null };
  const migrated = migrateLegacyOnboardingDraft(value);
  return migrated ? { draft: migrated, migratedFromVersion: 1 } : null;
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
  if (step === 2) {
    if (!draft.goal.primaryGoal) errors.push('یک هدف اصلی انتخاب کن.');
    if (!draft.goal.targetTimeline) errors.push('سرعت مورد انتظار را خودت انتخاب کن.');
  }
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
  if (step === 5) {
    if (draft.medical.hasHighBloodPressure === null || draft.medical.hasDiabetes === null || draft.medical.hasCardiacHistory === null) errors.push('وضعیت سه مورد پزشکی را صریحاً مشخص کن.');
    if (!draft.medical.medicalAcknowledged) errors.push('تأیید کن که این اطلاعات جایگزین ارزیابی پزشکی نیست.');
  }
  if (step === 6) {
    if (draft.injuries.noInjuries === null) errors.push('مشخص کن آیا آسیب یا محدودیت مهمی داری.');
    if (draft.injuries.noInjuries === false && draft.injuries.areas.length === 0 && !draft.injuries.generalLimitations.trim()) errors.push('حداقل یک ناحیه آسیب یا محدودیت کلی ثبت کن.');
    if (draft.injuries.noInjuries === true && draft.injuries.areas.length > 0) errors.push('اگر «بدون آسیب» را انتخاب کرده‌ای، ناحیه آسیب‌دیده نباید باقی بماند.');
    if (draft.injuries.painDuringExercise === null) errors.push('وضعیت درد هنگام تمرین را مشخص کن.');
    if (draft.injuries.painDuringExercise === true && !inRange(draft.injuries.painScale, 0, 10)) errors.push('شدت درد را بین صفر تا ۱۰ وارد کن.');
  }
  if (step === 7) {
    if (!draft.lifestyle.activityLevel || !draft.lifestyle.sleepQuality || !draft.lifestyle.stressLevel || !draft.lifestyle.smoking) errors.push('فعالیت، کیفیت خواب، استرس و وضعیت سیگار را صریحاً انتخاب کن.');
    if (draft.lifestyle.sleepHours !== null && !inRange(draft.lifestyle.sleepHours, 0, 24)) errors.push('ساعت خواب معتبر وارد کن.');
    if (draft.lifestyle.sittingHours !== null && !inRange(draft.lifestyle.sittingHours, 0, 24)) errors.push('ساعت نشستن معتبر وارد کن.');
    if (draft.lifestyle.dailySteps !== null && !inRange(draft.lifestyle.dailySteps, 0, 100000)) errors.push('تعداد قدم روزانه معتبر وارد کن.');
  }
  if (step === 8) {
    if (!inRange(draft.nutrition.mealsPerDay, 1, 8)) errors.push('تعداد وعده‌ها باید بین ۱ تا ۸ باشد.');
    if (!draft.nutrition.dietType || !draft.nutrition.budget || !draft.nutrition.cookingAbility || draft.nutrition.kitchenAccess === null || !draft.nutrition.eatingOutFrequency) errors.push('الگوی غذایی، بودجه، آشپزی، دسترسی آشپزخانه و غذای بیرون را صریحاً مشخص کن.');
  }
  if (step === 9) {
    if (!draft.trainingHistory.level || !draft.trainingHistory.cardioExperience || !draft.trainingHistory.strengthExperience) errors.push('سطح تمرین و تجربه هوازی/قدرتی را صریحاً انتخاب کن.');
    if (draft.trainingHistory.trainingAgeMonths !== null && !inRange(draft.trainingHistory.trainingAgeMonths, 0, 1200)) errors.push('سابقه تمرین معتبر وارد کن.');
  }
  if (step === 10) {
    if (!draft.availability.location) errors.push('محل تمرین را انتخاب کن.');
    if (!inRange(draft.availability.daysPerWeek, 1, 6)) errors.push('تعداد روز تمرین باید بین ۱ تا ۶ باشد.');
    if (![30, 45, 60, 75, 90].includes(draft.availability.sessionDuration ?? -1)) errors.push('مدت جلسه معتبر انتخاب کن.');
    if (!draft.availability.preferredTime) errors.push('زمان ترجیحی تمرین را مشخص کن.');
  }
  if (step === 11) {
    if (!draft.preferences.intensity || !draft.preferences.cardioPreference || !draft.preferences.trainingStyle || !draft.preferences.variety || !draft.preferences.nutritionStrictness || !draft.preferences.coachingTone || !draft.preferences.reminderLevel) errors.push('همه ترجیحات مربی‌گری را خودت انتخاب کن.');
  }
  if (step === 15) {
    if (!draft.confirmation.startDate) errors.push('تاریخ شروع را انتخاب کن.');
    if (!inRange(draft.confirmation.programDurationDays, PROGRAM_DURATION_MIN_DAYS, PROGRAM_DURATION_MAX_DAYS)) errors.push(`مدت دوره باید بین ${PROGRAM_DURATION_MIN_DAYS.toLocaleString('fa-IR')} تا ${PROGRAM_DURATION_MAX_DAYS.toLocaleString('fa-IR')} روز باشد.`);
    if (!draft.confirmation.finalConsent) errors.push('برای تولید برنامه تمرین و تغذیه، تأیید نهایی لازم است.');
  }
  return errors;
}

export function buildTrainingPreview(draft: OnboardingDraft): TrainingPreview {
  const trainingDays = draft.availability.daysPerWeek;
  const sessionMinutes = draft.availability.sessionDuration;
  const weeklyStructure = trainingDays === null
    ? []
    : trainingDays <= 2
      ? ['تمام بدن A', ...(trainingDays === 2 ? ['تمام بدن B'] : [])]
      : trainingDays === 3
        ? ['تمام بدن A', 'تمام بدن B', 'تمام بدن C']
        : trainingDays === 4
          ? ['بالاتنه A', 'پایین‌تنه A', 'بالاتنه B', 'پایین‌تنه B']
          : ['فشار', 'کشش', 'پا', 'بالاتنه ترکیبی', 'پایین‌تنه و هوازی', ...(trainingDays === 6 ? ['ریکاوری فعال'] : [])];

  const healthCautions: string[] = [];
  if (draft.medical.hasHighBloodPressure === true) healthCautions.push('شدت‌های بسیار بالا و حبس نفس باید محافظه‌کارانه مدیریت شوند.');
  if (draft.medical.hasDiabetes === true) healthCautions.push('زمان‌بندی وعده و تمرین باید با پایش قند و برنامه درمانی هماهنگ شود.');
  if (draft.medical.hasCardiacHistory === true) healthCautions.push('تمرین پرفشار بدون تأیید مناسب نباید پیشنهاد شود.');
  if (draft.injuries.areas.length) healthCautions.push(`${draft.injuries.areas.length.toLocaleString('fa-IR')} ناحیه آسیب‌دیده در انتخاب حرکت و دامنه حرکت محدودکننده است.`);
  if (draft.medical.physicianRestrictions.trim()) healthCautions.push('محدودیت ثبت‌شده پزشک بر پیشنهادهای تمرینی اولویت دارد.');
  if ([draft.medical.hasHighBloodPressure, draft.medical.hasDiabetes, draft.medical.hasCardiacHistory, draft.injuries.noInjuries, draft.injuries.painDuringExercise].some((item) => item === null)) {
    healthCautions.push('بخشی از وضعیت ایمنی هنوز گزارش نشده و نباید به‌عنوان «بدون محدودیت» تفسیر شود.');
  } else if (!healthCautions.length) {
    healthCautions.push('محدودیت پرخطر گزارش نشده؛ افزایش فشار تمرین همچنان باید تدریجی باشد.');
  }

  return {
    trainingDays,
    sessionMinutes,
    weeklyStructure: trainingDays === null ? [] : weeklyStructure.slice(0, trainingDays),
    healthCautions,
  };
}

export const NUTRITION_AUTHORITY_NOTE = 'هدف‌های کالری و ماکرو در این مرحله از Onboarding محاسبه نمی‌شوند؛ Nutrition Core تنها مرجع محاسبات تغذیه‌ای نئوفیت باقی می‌ماند.';
