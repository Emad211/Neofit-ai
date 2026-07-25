import * as React from 'react';
import { View } from 'react-native';
import { getCalendars } from 'expo-localization';
import { router } from 'expo-router';
import { z } from 'zod';
import { AppText, Card, ChoiceGrid, Field, InlineNotice, PageTitle, PrimaryButton, Screen } from '@/components/ui';
import { MultiChoiceGrid } from '@/components/multi-choice-grid';
import { deleteSetting, getSetting, setSetting } from '@/db/settings-repository';
import {
  ActivityLevel,
  ActivityLevelSchema,
  FitnessLevel,
  FitnessLevelSchema,
  Gender,
  GenderSchema,
  Goal,
  GoalSchema,
  Profile,
  ProfileSchema,
  TrainingPriority,
  TrainingPrioritySchema,
  WorkoutLocation,
  WorkoutLocationSchema,
} from '@/domain/models';
import { useApp } from '@/providers/app-provider';

const DRAFT_KEY = 'onboarding.profile-draft.v2';
const STEP_COUNT = 6;

const DraftSchema = z.object({
  step: z.number().int().min(0).max(STEP_COUNT - 1),
  name: z.string(),
  goal: GoalSchema,
  gender: GenderSchema,
  age: z.string(),
  height: z.string(),
  weight: z.string(),
  targetWeight: z.string(),
  waist: z.string(),
  bodyFat: z.string(),
  targetRate: z.string(),
  fitnessLevel: FitnessLevelSchema,
  activityLevel: ActivityLevelSchema,
  experienceMonths: z.string(),
  trainingPriority: TrainingPrioritySchema,
  trainingDays: z.string(),
  sessionMinutes: z.string(),
  preferredTrainingTime: z.enum(['morning', 'afternoon', 'evening', 'flexible']),
  preferredDays: z.array(z.number().int().min(0).max(6)),
  location: WorkoutLocationSchema,
  equipment: z.string(),
  trainingStyles: z.string(),
  dislikedExercises: z.string(),
  diet: z.string(),
  allergies: z.string(),
  dislikedFoods: z.string(),
  mealsPerDay: z.string(),
  cookingAccess: z.enum(['full_kitchen', 'basic', 'none']),
  cookingMinutes: z.string(),
  budgetLevel: z.enum(['low', 'medium', 'high']),
  sleepHours: z.string(),
  stressLevel: z.string(),
  averageSteps: z.string(),
  hydrationLiters: z.string(),
  workSchedule: z.string(),
  goalNotes: z.string(),
  healthFlags: z.array(z.string()),
  painAreas: z.string(),
  injuries: z.string(),
  medications: z.string(),
  medicalNotes: z.string(),
});
type Draft = z.infer<typeof DraftSchema>;

function splitList(value: string) {
  return value
    .split(/[,،\n]/)
    .map((item) => item.trim())
    .filter(Boolean)
    .slice(0, 50);
}

function optionalNumber(value: string) {
  if (!value.trim()) return null;
  const number = Number(value);
  return Number.isFinite(number) ? number : Number.NaN;
}

function draftFromProfile(profile: Profile | null): Draft {
  return {
    step: 0,
    name: profile?.name || '',
    goal: profile?.goal || 'improve_fitness',
    gender: profile?.gender || 'male',
    age: String(profile?.age || 25),
    height: String(profile?.heightCm || 175),
    weight: String(profile?.weightKg || 75),
    targetWeight: profile?.details.targetWeightKg ? String(profile.details.targetWeightKg) : '',
    waist: profile?.details.waistCm ? String(profile.details.waistCm) : '',
    bodyFat: profile?.details.bodyFatPercent ? String(profile.details.bodyFatPercent) : '',
    targetRate: String(profile?.details.targetRateKgPerWeek || 0.4),
    fitnessLevel: profile?.fitnessLevel || 'beginner',
    activityLevel: profile?.activityLevel || 'sedentary',
    experienceMonths: String(profile?.details.trainingExperienceMonths || 0),
    trainingPriority: profile?.details.trainingPriority || 'general_fitness',
    trainingDays: String(profile?.trainingDays || 3),
    sessionMinutes: String(profile?.sessionMinutes || 45),
    preferredTrainingTime: profile?.details.preferredTrainingTime || 'flexible',
    preferredDays: profile?.details.preferredDays || [],
    location: profile?.workoutLocation || 'home',
    equipment: profile?.availableEquipment.join(', ') || '',
    trainingStyles: profile?.details.preferredTrainingStyles.join(', ') || '',
    dislikedExercises: profile?.details.dislikedExercises.join(', ') || '',
    diet: profile?.dietaryPreferences.join(', ') || '',
    allergies: profile?.allergies.join(', ') || '',
    dislikedFoods: profile?.details.dislikedFoods.join(', ') || '',
    mealsPerDay: String(profile?.details.mealsPerDay || 3),
    cookingAccess: profile?.details.cookingAccess || 'full_kitchen',
    cookingMinutes: String(profile?.details.cookingMinutes || 30),
    budgetLevel: profile?.details.budgetLevel || 'medium',
    sleepHours: String(profile?.sleepHours || 7),
    stressLevel: String(profile?.stressLevel || 5),
    averageSteps: String(profile?.details.averageSteps || 5_000),
    hydrationLiters: String(profile?.details.hydrationLiters || 2),
    workSchedule: profile?.details.workSchedule || '',
    goalNotes: profile?.details.goalNotes || '',
    healthFlags: profile?.details.healthFlags || [],
    painAreas: profile?.details.painAreas.join(', ') || '',
    injuries: profile?.details.injuries.join(', ') || '',
    medications: profile?.details.medications.join(', ') || '',
    medicalNotes: profile?.medicalNotes || '',
  };
}

export default function ProfileSetupScreen() {
  const { locale, profile, saveProfile, t } = useApp();
  const [draft, setDraft] = React.useState<Draft>(() => draftFromProfile(profile));
  const [ready, setReady] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [saving, setSaving] = React.useState(false);
  const label = React.useCallback((en: string, fa: string) => locale === 'fa' ? fa : en, [locale]);

  React.useEffect(() => {
    let active = true;
    const load = async () => {
      if (profile) {
        if (active) setDraft(draftFromProfile(profile));
      } else {
        const fallback = draftFromProfile(null);
        const stored = await getSetting(DRAFT_KEY, DraftSchema, fallback);
        if (active) setDraft(stored);
      }
      if (active) setReady(true);
    };
    void load();
    return () => { active = false; };
  }, [profile]);

  React.useEffect(() => {
    if (!ready || profile) return;
    const timer = setTimeout(() => {
      void setSetting(DRAFT_KEY, draft).catch((caught) => console.error('Onboarding draft save failed:', caught));
    }, 250);
    return () => clearTimeout(timer);
  }, [draft, profile, ready]);

  const update = <K extends keyof Draft>(key: K, value: Draft[K]) => {
    setDraft((current) => ({ ...current, [key]: value }));
    setError(null);
  };

  const validateStep = (step: number) => {
    if (step === 0) {
      if (draft.name.trim().length < 1) throw new Error(label('Enter your name.', 'نام خود را وارد کنید.'));
      const age = Number(draft.age);
      const height = Number(draft.height);
      const weight = Number(draft.weight);
      if (!Number.isInteger(age) || age < 16 || age > 100) throw new Error(label('Age must be between 16 and 100.', 'سن باید بین ۱۶ تا ۱۰۰ باشد.'));
      if (!Number.isFinite(height) || height < 100 || height > 250) throw new Error(label('Height is outside the supported range.', 'قد خارج از محدوده قابل قبول است.'));
      if (!Number.isFinite(weight) || weight < 30 || weight > 300) throw new Error(label('Weight is outside the supported range.', 'وزن خارج از محدوده قابل قبول است.'));
      const targetWeight = optionalNumber(draft.targetWeight);
      if (targetWeight !== null && (!Number.isFinite(targetWeight) || targetWeight < 20 || targetWeight > 500)) throw new Error(label('Target weight is invalid.', 'وزن هدف معتبر نیست.'));
    }
    if (step === 1) {
      const experience = Number(draft.experienceMonths);
      const days = Number(draft.trainingDays);
      const minutes = Number(draft.sessionMinutes);
      if (!Number.isInteger(experience) || experience < 0 || experience > 1_200) throw new Error(label('Training experience is invalid.', 'سابقه تمرین معتبر نیست.'));
      if (!Number.isInteger(days) || days < 2 || days > 7) throw new Error(label('Choose 2 to 7 training days.', 'بین ۲ تا ۷ روز تمرین انتخاب کنید.'));
      if (!Number.isInteger(minutes) || minutes < 15 || minutes > 180) throw new Error(label('Session duration must be 15 to 180 minutes.', 'مدت جلسه باید بین ۱۵ تا ۱۸۰ دقیقه باشد.'));
      if (draft.preferredDays.length > 0 && draft.preferredDays.length !== days) {
        throw new Error(label(`Choose exactly ${days} preferred days or leave all days unselected.`, `دقیقاً ${days} روز ترجیحی انتخاب کنید یا همه روزها را خالی بگذارید.`));
      }
    }
    if (step === 2) {
      const meals = Number(draft.mealsPerDay);
      const cooking = Number(draft.cookingMinutes);
      if (!Number.isInteger(meals) || meals < 2 || meals > 7) throw new Error(label('Meals per day must be 2 to 7.', 'تعداد وعده روزانه باید بین ۲ تا ۷ باشد.'));
      if (!Number.isInteger(cooking) || cooking < 0 || cooking > 240) throw new Error(label('Cooking time is invalid.', 'زمان آشپزی معتبر نیست.'));
    }
    if (step === 3) {
      const sleep = Number(draft.sleepHours);
      const stress = Number(draft.stressLevel);
      const steps = Number(draft.averageSteps);
      const water = Number(draft.hydrationLiters);
      if (!Number.isFinite(sleep) || sleep < 0 || sleep > 24) throw new Error(label('Sleep hours are invalid.', 'ساعت خواب معتبر نیست.'));
      if (!Number.isInteger(stress) || stress < 1 || stress > 10) throw new Error(label('Stress must be 1 to 10.', 'استرس باید بین ۱ تا ۱۰ باشد.'));
      if (!Number.isInteger(steps) || steps < 0 || steps > 100_000) throw new Error(label('Daily steps are invalid.', 'تعداد قدم روزانه معتبر نیست.'));
      if (!Number.isFinite(water) || water < 0 || water > 15) throw new Error(label('Hydration value is invalid.', 'مقدار آب مصرفی معتبر نیست.'));
    }
  };

  const next = () => {
    try {
      validateStep(draft.step);
      update('step', Math.min(STEP_COUNT - 1, draft.step + 1));
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : label('Review this step.', 'این مرحله را بررسی کنید.'));
    }
  };

  const previous = () => {
    if (draft.step === 0) {
      router.back();
      return;
    }
    update('step', draft.step - 1);
  };

  const submit = async () => {
    setSaving(true);
    setError(null);
    try {
      for (let step = 0; step < STEP_COUNT - 1; step += 1) validateStep(step);
      const nextProfile = ProfileSchema.parse({
        name: draft.name,
        locale,
        goal: draft.goal,
        gender: draft.gender,
        age: Number(draft.age),
        heightCm: Number(draft.height),
        weightKg: Number(draft.weight),
        fitnessLevel: draft.fitnessLevel,
        activityLevel: draft.activityLevel,
        trainingDays: Number(draft.trainingDays),
        sessionMinutes: Number(draft.sessionMinutes),
        workoutLocation: draft.location,
        availableEquipment: splitList(draft.equipment),
        dietaryPreferences: splitList(draft.diet),
        allergies: splitList(draft.allergies),
        medicalNotes: draft.medicalNotes,
        sleepHours: Number(draft.sleepHours),
        stressLevel: Number(draft.stressLevel),
        timezone: profile?.timezone || getCalendars()[0]?.timeZone || 'UTC',
        details: {
          targetWeightKg: optionalNumber(draft.targetWeight),
          waistCm: optionalNumber(draft.waist),
          bodyFatPercent: optionalNumber(draft.bodyFat),
          targetRateKgPerWeek: Number(draft.targetRate),
          trainingExperienceMonths: Number(draft.experienceMonths),
          trainingPriority: draft.trainingPriority,
          preferredTrainingStyles: splitList(draft.trainingStyles),
          preferredTrainingTime: draft.preferredTrainingTime,
          preferredDays: draft.preferredDays,
          dislikedExercises: splitList(draft.dislikedExercises),
          painAreas: splitList(draft.painAreas),
          injuries: splitList(draft.injuries),
          healthFlags: draft.healthFlags,
          medications: splitList(draft.medications),
          mealsPerDay: Number(draft.mealsPerDay),
          cookingAccess: draft.cookingAccess,
          cookingMinutes: Number(draft.cookingMinutes),
          budgetLevel: draft.budgetLevel,
          dislikedFoods: splitList(draft.dislikedFoods),
          averageSteps: Number(draft.averageSteps),
          hydrationLiters: Number(draft.hydrationLiters),
          workSchedule: draft.workSchedule,
          goalNotes: draft.goalNotes,
        },
      });
      await saveProfile(nextProfile);
      await deleteSetting(DRAFT_KEY);
      router.replace('/(tabs)/today');
    } catch (caught) {
      const message = caught instanceof z.ZodError
        ? caught.issues[0]?.message
        : caught instanceof Error
          ? caught.message
          : null;
      setError(message || label('Please review the profile fields.', 'لطفاً فیلدهای پروفایل را بررسی کنید.'));
    } finally {
      setSaving(false);
    }
  };

  if (!ready) return <Screen><AppText>{t('common.loading')}</AppText></Screen>;

  const stepTitles = [
    label('Body and goal', 'بدن و هدف'),
    label('Training design', 'طراحی تمرین'),
    label('Nutrition reality', 'واقعیت تغذیه'),
    label('Recovery and routine', 'ریکاوری و برنامه روزانه'),
    label('Health and limitations', 'سلامت و محدودیت‌ها'),
    label('Review', 'مرور نهایی'),
  ];
  const dayOptions = [
    label('Monday', 'دوشنبه'), label('Tuesday', 'سه‌شنبه'), label('Wednesday', 'چهارشنبه'),
    label('Thursday', 'پنج‌شنبه'), label('Friday', 'جمعه'), label('Saturday', 'شنبه'), label('Sunday', 'یکشنبه'),
  ];
  const healthOptions = [
    { value: 'high_blood_pressure', label: label('High blood pressure', 'فشار خون بالا') },
    { value: 'heart_condition', label: label('Known heart condition', 'بیماری قلبی شناخته‌شده') },
    { value: 'chest_pain_fainting', label: label('Chest pain, fainting, unexplained dizziness', 'درد قفسه سینه، غش یا سرگیجه بی‌علت') },
    { value: 'diabetes', label: label('Diabetes', 'دیابت') },
    { value: 'kidney_disease', label: label('Kidney condition', 'بیماری کلیه') },
    { value: 'respiratory_condition', label: label('Respiratory condition', 'بیماری تنفسی') },
    { value: 'neurological_condition', label: label('Neurological condition', 'بیماری عصبی') },
    { value: 'pregnancy', label: label('Pregnancy', 'بارداری') },
    { value: 'eating_disorder_history', label: label('Eating-disorder history', 'سابقه اختلال خوردن') },
    { value: 'recent_surgery', label: label('Recent surgery', 'جراحی اخیر') },
  ];

  return (
    <Screen gap={20}>
      <PageTitle title={profile ? label('Update your personal profile', 'به‌روزرسانی پروفایل شخصی') : t('onboarding.title')} subtitle={stepTitles[draft.step]} />
      <View accessibilityRole="progressbar" accessibilityValue={{ min: 1, max: STEP_COUNT, now: draft.step + 1 }} style={{ flexDirection: 'row', gap: 6 }}>
        {Array.from({ length: STEP_COUNT }, (_, index) => (
          <View key={index} style={{ flex: 1, height: 6, borderRadius: 99, backgroundColor: index <= draft.step ? '#2563EB' : 'rgba(128,128,128,0.22)' }} />
        ))}
      </View>
      <AppText muted size={13}>{label(`Step ${draft.step + 1} of ${STEP_COUNT}`, `مرحله ${draft.step + 1} از ${STEP_COUNT}`)}</AppText>

      {draft.step === 0 ? (
        <>
          <InlineNotice>{label(
            'Targets are planning inputs, not guaranteed outcomes. Enter measured values only when you know them.',
            'هدف‌ها ورودی برنامه‌ریزی هستند، نه نتیجه تضمین‌شده. فقط اندازه‌هایی را وارد کنید که واقعاً می‌دانید.',
          )}</InlineNotice>
          <Card>
            <AppText size={20} weight="800">{label('Basic information', 'اطلاعات پایه')}</AppText>
            <Field label={t('onboarding.name')} value={draft.name} onChangeText={(value) => update('name', value)} autoCapitalize="words" />
            <AppText weight="600">{t('onboarding.goal')}</AppText>
            <ChoiceGrid<Goal> value={draft.goal} onChange={(value) => update('goal', value)} options={[
              { value: 'lose_weight', label: t('onboarding.loseWeight') },
              { value: 'gain_muscle', label: t('onboarding.gainMuscle') },
              { value: 'improve_fitness', label: t('onboarding.improveFitness') },
            ]} columns={1} />
            <AppText weight="600">{t('onboarding.gender')}</AppText>
            <ChoiceGrid<Gender> value={draft.gender} onChange={(value) => update('gender', value)} options={[
              { value: 'male', label: t('onboarding.male') },
              { value: 'female', label: t('onboarding.female') },
              { value: 'other', label: t('onboarding.other') },
            ]} columns={3} />
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}>
              <View style={{ flex: 1, minWidth: 95 }}><Field label={t('onboarding.age')} value={draft.age} onChangeText={(value) => update('age', value)} keyboardType="number-pad" /></View>
              <View style={{ flex: 1, minWidth: 95 }}><Field label={t('onboarding.height')} value={draft.height} onChangeText={(value) => update('height', value)} keyboardType="decimal-pad" /></View>
              <View style={{ flex: 1, minWidth: 95 }}><Field label={t('onboarding.weight')} value={draft.weight} onChangeText={(value) => update('weight', value)} keyboardType="decimal-pad" /></View>
            </View>
          </Card>
          <Card>
            <AppText size={20} weight="800">{label('Optional measurements and target', 'اندازه‌ها و هدف اختیاری')}</AppText>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}>
              <View style={{ flex: 1, minWidth: 140 }}><Field label={label('Target weight (kg)', 'وزن هدف (کیلوگرم)')} value={draft.targetWeight} onChangeText={(value) => update('targetWeight', value)} keyboardType="decimal-pad" /></View>
              <View style={{ flex: 1, minWidth: 140 }}><Field label={label('Waist (cm)', 'دور کمر (سانتی‌متر)')} value={draft.waist} onChangeText={(value) => update('waist', value)} keyboardType="decimal-pad" /></View>
              <View style={{ flex: 1, minWidth: 140 }}><Field label={label('Body fat %', 'درصد چربی بدن')} value={draft.bodyFat} onChangeText={(value) => update('bodyFat', value)} keyboardType="decimal-pad" /></View>
            </View>
            {draft.goal === 'lose_weight' ? <Field label={label('Preferred weekly loss (kg)', 'کاهش هفتگی ترجیحی (کیلوگرم)')} hint={label('A conservative default is 0.4 kg/week.', 'مقدار محافظه‌کارانه پیش‌فرض ۰٫۴ کیلوگرم در هفته است.')} value={draft.targetRate} onChangeText={(value) => update('targetRate', value)} keyboardType="decimal-pad" /> : null}
          </Card>
        </>
      ) : null}

      {draft.step === 1 ? (
        <>
          <Card>
            <AppText size={20} weight="800">{label('Training experience and priority', 'سابقه و اولویت تمرینی')}</AppText>
            <AppText weight="600">{t('onboarding.fitnessLevel')}</AppText>
            <ChoiceGrid<FitnessLevel> value={draft.fitnessLevel} onChange={(value) => update('fitnessLevel', value)} options={[
              { value: 'beginner', label: t('onboarding.beginner') },
              { value: 'intermediate', label: t('onboarding.intermediate') },
              { value: 'advanced', label: t('onboarding.advanced') },
            ]} columns={3} />
            <Field label={label('Consistent training experience (months)', 'سابقه تمرین منظم (ماه)')} value={draft.experienceMonths} onChangeText={(value) => update('experienceMonths', value)} keyboardType="number-pad" />
            <AppText weight="600">{label('Main training priority', 'اولویت اصلی تمرین')}</AppText>
            <ChoiceGrid<TrainingPriority> value={draft.trainingPriority} onChange={(value) => update('trainingPriority', value)} options={[
              { value: 'general_fitness', label: label('General fitness', 'آمادگی عمومی') },
              { value: 'hypertrophy', label: label('Muscle growth', 'عضله‌سازی') },
              { value: 'strength', label: label('Strength', 'قدرت') },
              { value: 'endurance', label: label('Endurance', 'استقامت') },
              { value: 'mobility', label: label('Mobility', 'تحرک‌پذیری') },
            ]} columns={2} />
            <AppText weight="600">{t('onboarding.activityLevel')}</AppText>
            <ChoiceGrid<ActivityLevel> value={draft.activityLevel} onChange={(value) => update('activityLevel', value)} options={[
              { value: 'sedentary', label: t('onboarding.sedentary') },
              { value: 'lightly_active', label: t('onboarding.lightlyActive') },
              { value: 'moderately_active', label: t('onboarding.moderatelyActive') },
              { value: 'very_active', label: t('onboarding.veryActive') },
            ]} columns={2} />
          </Card>
          <Card>
            <AppText size={20} weight="800">{label('Schedule and equipment', 'زمان‌بندی و تجهیزات')}</AppText>
            <AppText weight="600">{t('onboarding.trainingDays')}</AppText>
            <ChoiceGrid value={draft.trainingDays} onChange={(value) => update('trainingDays', value)} options={['2', '3', '4', '5', '6', '7'].map((value) => ({ value, label: value }))} columns={3} />
            <AppText weight="600">{label('Preferred days (optional)', 'روزهای ترجیحی (اختیاری)')}</AppText>
            <MultiChoiceGrid<number> values={draft.preferredDays} onChange={(value) => update('preferredDays', value)} options={dayOptions.map((day, index) => ({ value: index, label: day }))} columns={2} maxSelections={Number(draft.trainingDays)} />
            <AppText weight="600">{t('onboarding.sessionMinutes')}</AppText>
            <ChoiceGrid value={draft.sessionMinutes} onChange={(value) => update('sessionMinutes', value)} options={['30', '45', '60', '75', '90', '120'].map((value) => ({ value, label: label(`${value} min`, `${value} دقیقه`) }))} columns={2} />
            <AppText weight="600">{label('Preferred training time', 'زمان ترجیحی تمرین')}</AppText>
            <ChoiceGrid value={draft.preferredTrainingTime} onChange={(value) => update('preferredTrainingTime', value)} options={[
              { value: 'morning', label: label('Morning', 'صبح') },
              { value: 'afternoon', label: label('Afternoon', 'بعدازظهر') },
              { value: 'evening', label: label('Evening', 'شب') },
              { value: 'flexible', label: label('Flexible', 'انعطاف‌پذیر') },
            ]} columns={2} />
            <AppText weight="600">{t('onboarding.location')}</AppText>
            <ChoiceGrid<WorkoutLocation> value={draft.location} onChange={(value) => update('location', value)} options={[
              { value: 'home', label: t('onboarding.home') },
              { value: 'gym', label: t('onboarding.gym') },
              { value: 'outdoor', label: t('onboarding.outdoor') },
            ]} columns={3} />
            <Field label={t('onboarding.equipment')} value={draft.equipment} onChangeText={(value) => update('equipment', value)} placeholder={label('Dumbbells, bands, bench; leave blank for bodyweight only', 'دمبل، کش، نیمکت؛ برای فقط وزن بدن خالی بگذارید')} />
            <Field label={label('Preferred training styles', 'سبک‌های تمرینی مورد علاقه')} value={draft.trainingStyles} onChangeText={(value) => update('trainingStyles', value)} placeholder={label('Bodybuilding, circuit, running…', 'بدنسازی، دایره‌ای، دویدن و…')} />
            <Field label={label('Exercises you dislike or refuse', 'حرکاتی که دوست ندارید یا انجام نمی‌دهید')} value={draft.dislikedExercises} onChangeText={(value) => update('dislikedExercises', value)} />
          </Card>
        </>
      ) : null}

      {draft.step === 2 ? (
        <>
          <InlineNotice>{label('Allergies are treated as hard exclusions. Put preferences and dislikes in their separate fields.', 'حساسیت‌ها حذف قطعی محسوب می‌شوند. ترجیحات و غذاهای نامطلوب را در فیلدهای جدا بنویسید.')}</InlineNotice>
          <Card>
            <AppText size={20} weight="800">{label('Food constraints', 'محدودیت‌های غذایی')}</AppText>
            <Field label={t('onboarding.diet')} value={draft.diet} onChangeText={(value) => update('diet', value)} placeholder={label('Halal, vegetarian, low-lactose…', 'حلال، گیاه‌خواری، کم‌لاکتوز و…')} />
            <Field label={t('onboarding.allergies')} value={draft.allergies} onChangeText={(value) => update('allergies', value)} placeholder={label('Separate confirmed allergies with commas', 'حساسیت‌های قطعی را با ویرگول جدا کنید')} />
            <Field label={label('Foods you dislike', 'غذاهای نامطلوب')} value={draft.dislikedFoods} onChangeText={(value) => update('dislikedFoods', value)} />
          </Card>
          <Card>
            <AppText size={20} weight="800">{label('Cooking and budget', 'آشپزی و بودجه')}</AppText>
            <AppText weight="600">{label('Meals per day', 'تعداد وعده در روز')}</AppText>
            <ChoiceGrid value={draft.mealsPerDay} onChange={(value) => update('mealsPerDay', value)} options={['2', '3', '4', '5', '6'].map((value) => ({ value, label: value }))} columns={3} />
            <AppText weight="600">{label('Cooking access', 'امکانات آشپزی')}</AppText>
            <ChoiceGrid value={draft.cookingAccess} onChange={(value) => update('cookingAccess', value)} options={[
              { value: 'full_kitchen', label: label('Full kitchen', 'آشپزخانه کامل') },
              { value: 'basic', label: label('Basic appliances', 'امکانات محدود') },
              { value: 'none', label: label('No cooking', 'بدون امکان آشپزی') },
            ]} columns={1} />
            <Field label={label('Maximum cooking time per meal (minutes)', 'حداکثر زمان پخت هر وعده (دقیقه)')} value={draft.cookingMinutes} onChangeText={(value) => update('cookingMinutes', value)} keyboardType="number-pad" />
            <AppText weight="600">{label('Food budget', 'بودجه غذا')}</AppText>
            <ChoiceGrid value={draft.budgetLevel} onChange={(value) => update('budgetLevel', value)} options={[
              { value: 'low', label: label('Economical', 'اقتصادی') },
              { value: 'medium', label: label('Medium', 'متوسط') },
              { value: 'high', label: label('Flexible', 'آزاد') },
            ]} columns={3} />
          </Card>
        </>
      ) : null}

      {draft.step === 3 ? (
        <>
          <Card>
            <AppText size={20} weight="800">{label('Recovery and daily movement', 'ریکاوری و تحرک روزانه')}</AppText>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}>
              <View style={{ flex: 1, minWidth: 130 }}><Field label={t('onboarding.sleep')} value={draft.sleepHours} onChangeText={(value) => update('sleepHours', value)} keyboardType="decimal-pad" /></View>
              <View style={{ flex: 1, minWidth: 130 }}><Field label={t('onboarding.stress')} value={draft.stressLevel} onChangeText={(value) => update('stressLevel', value)} keyboardType="number-pad" /></View>
              <View style={{ flex: 1, minWidth: 130 }}><Field label={label('Average steps/day', 'میانگین قدم روزانه')} value={draft.averageSteps} onChangeText={(value) => update('averageSteps', value)} keyboardType="number-pad" /></View>
              <View style={{ flex: 1, minWidth: 130 }}><Field label={label('Water/day (litres)', 'آب روزانه (لیتر)')} value={draft.hydrationLiters} onChangeText={(value) => update('hydrationLiters', value)} keyboardType="decimal-pad" /></View>
            </View>
          </Card>
          <Card>
            <AppText size={20} weight="800">{label('Real-life schedule', 'برنامه واقعی زندگی')}</AppText>
            <Field label={label('Work/study schedule and difficult days', 'برنامه کار/تحصیل و روزهای سخت')} value={draft.workSchedule} onChangeText={(value) => update('workSchedule', value)} multiline placeholder={label('Example: night shifts on Monday and Thursday', 'مثلاً شیفت شب دوشنبه و پنج‌شنبه')} />
            <Field label={label('Specific goal or performance notes', 'توضیح دقیق هدف یا عملکرد')} value={draft.goalNotes} onChangeText={(value) => update('goalNotes', value)} multiline placeholder={label('Example: complete 10 push-ups, train for a 5 km run…', 'مثلاً انجام ۱۰ شنا، آمادگی برای دویدن ۵ کیلومتر و…')} />
          </Card>
        </>
      ) : null}

      {draft.step === 4 ? (
        <>
          <InlineNotice tone="warning">{label(
            'NeoFit does not diagnose or clear you for exercise. Chest pain, fainting, sudden weakness, severe pain, or unusual shortness of breath needs qualified assessment before training.',
            'نئوفیت تشخیص پزشکی یا مجوز ورزش نمی‌دهد. درد قفسه سینه، غش، ضعف ناگهانی، درد شدید یا تنگی نفس غیرعادی پیش از تمرین نیازمند ارزیابی متخصص است.',
          )}</InlineNotice>
          <Card>
            <AppText size={20} weight="800">{label('Important health context', 'شرایط مهم سلامت')}</AppText>
            <MultiChoiceGrid<string> values={draft.healthFlags} onChange={(value) => update('healthFlags', value)} options={healthOptions} columns={1} />
          </Card>
          <Card>
            <AppText size={20} weight="800">{label('Pain, injury, medication, restrictions', 'درد، آسیب، دارو و محدودیت')}</AppText>
            <Field label={label('Current or recurring pain areas', 'نواحی درد فعلی یا تکرارشونده')} value={draft.painAreas} onChangeText={(value) => update('painAreas', value)} placeholder={label('Knee, lower back, shoulder…', 'زانو، کمر، شانه و…')} />
            <Field label={label('Previous injuries or surgery details', 'آسیب یا جراحی قبلی')} value={draft.injuries} onChangeText={(value) => update('injuries', value)} multiline />
            <Field label={label('Medications relevant to exercise or appetite', 'داروهای مرتبط با ورزش یا اشتها')} value={draft.medications} onChangeText={(value) => update('medications', value)} multiline />
            <Field label={t('onboarding.medicalNotes')} value={draft.medicalNotes} onChangeText={(value) => update('medicalNotes', value)} multiline placeholder={label('Include clinician restrictions exactly as stated.', 'محدودیت اعلام‌شده توسط پزشک را دقیق بنویسید.')} />
          </Card>
        </>
      ) : null}

      {draft.step === 5 ? (
        <>
          <InlineNotice>{label('Review the main constraints. You can edit this profile later; generated plans are never saved unless they pass validation.', 'محدودیت‌های اصلی را مرور کنید. بعداً می‌توانید پروفایل را تغییر دهید؛ برنامه تولیدشده فقط پس از عبور از اعتبارسنجی ذخیره می‌شود.')}</InlineNotice>
          <Card>
            <AppText size={22} weight="800">{draft.name}</AppText>
            <AppText>{label('Goal', 'هدف')}: {draft.goal}</AppText>
            <AppText>{label('Body', 'بدن')}: {draft.age} · {draft.height} cm · {draft.weight} kg</AppText>
            <AppText>{label('Training', 'تمرین')}: {draft.trainingDays} × {draft.sessionMinutes} min · {draft.location} · {draft.trainingPriority}</AppText>
            <AppText>{label('Experience', 'سابقه')}: {draft.experienceMonths} {label('months', 'ماه')}</AppText>
            <AppText>{label('Meals', 'وعده‌ها')}: {draft.mealsPerDay}/day · {draft.cookingAccess} · {draft.budgetLevel}</AppText>
            <AppText>{label('Allergies', 'حساسیت‌ها')}: {draft.allergies || label('None entered', 'وارد نشده')}</AppText>
            <AppText>{label('Pain/injuries', 'درد/آسیب')}: {[draft.painAreas, draft.injuries].filter(Boolean).join(' · ') || label('None entered', 'وارد نشده')}</AppText>
            <AppText>{label('Health flags', 'شرایط سلامت')}: {draft.healthFlags.join(' · ') || label('None selected', 'انتخاب نشده')}</AppText>
          </Card>
          <PrimaryButton title={profile ? label('Save updated profile', 'ذخیره پروفایل به‌روز') : t('onboarding.create')} onPress={submit} loading={saving} />
        </>
      ) : null}

      {error ? <InlineNotice tone="danger">{error}</InlineNotice> : null}
      <View style={{ flexDirection: 'row', gap: 10 }}>
        <View style={{ flex: 1 }}><PrimaryButton title={t('common.back')} variant="secondary" onPress={previous} disabled={saving} /></View>
        {draft.step < STEP_COUNT - 1 ? <View style={{ flex: 1 }}><PrimaryButton title={t('common.continue')} onPress={next} disabled={saving} /></View> : null}
      </View>
    </Screen>
  );
}
