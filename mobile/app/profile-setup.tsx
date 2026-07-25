import * as React from 'react';
import { View } from 'react-native';
import { getCalendars } from 'expo-localization';
import { router } from 'expo-router';
import { z } from 'zod';
import { AppText, Card, ChoiceGrid, Field, InlineNotice, PageTitle, PrimaryButton, Screen } from '@/components/ui';
import {
  ActivityLevel,
  FitnessLevel,
  Gender,
  Goal,
  ProfileSchema,
  WorkoutLocation,
} from '@/domain/models';
import { useApp } from '@/providers/app-provider';

function splitList(value: string) {
  return value
    .split(/[,،\n]/)
    .map((item) => item.trim())
    .filter(Boolean)
    .slice(0, 30);
}

export default function ProfileSetupScreen() {
  const { locale, profile, saveProfile, t } = useApp();
  const [name, setName] = React.useState(profile?.name || '');
  const [goal, setGoal] = React.useState<Goal>(profile?.goal || 'improve_fitness');
  const [gender, setGender] = React.useState<Gender>(profile?.gender || 'male');
  const [age, setAge] = React.useState(String(profile?.age || 25));
  const [height, setHeight] = React.useState(String(profile?.heightCm || 175));
  const [weight, setWeight] = React.useState(String(profile?.weightKg || 75));
  const [fitnessLevel, setFitnessLevel] = React.useState<FitnessLevel>(profile?.fitnessLevel || 'beginner');
  const [activityLevel, setActivityLevel] = React.useState<ActivityLevel>(profile?.activityLevel || 'sedentary');
  const [trainingDays, setTrainingDays] = React.useState(String(profile?.trainingDays || 3));
  const [sessionMinutes, setSessionMinutes] = React.useState(String(profile?.sessionMinutes || 45));
  const [location, setLocation] = React.useState<WorkoutLocation>(profile?.workoutLocation || 'home');
  const [equipment, setEquipment] = React.useState(profile?.availableEquipment.join(', ') || '');
  const [diet, setDiet] = React.useState(profile?.dietaryPreferences.join(', ') || '');
  const [allergies, setAllergies] = React.useState(profile?.allergies.join(', ') || '');
  const [medicalNotes, setMedicalNotes] = React.useState(profile?.medicalNotes || '');
  const [sleepHours, setSleepHours] = React.useState(String(profile?.sleepHours || 7));
  const [stressLevel, setStressLevel] = React.useState(String(profile?.stressLevel || 5));
  const [error, setError] = React.useState<string | null>(null);
  const [saving, setSaving] = React.useState(false);
  const label = (en: string, fa: string) => locale === 'fa' ? fa : en;

  const submit = async () => {
    setSaving(true);
    setError(null);
    try {
      const nextProfile = ProfileSchema.parse({
        name,
        locale,
        goal,
        gender,
        age: Number(age),
        heightCm: Number(height),
        weightKg: Number(weight),
        fitnessLevel,
        activityLevel,
        trainingDays: Number(trainingDays),
        sessionMinutes: Number(sessionMinutes),
        workoutLocation: location,
        availableEquipment: splitList(equipment),
        dietaryPreferences: splitList(diet),
        allergies: splitList(allergies),
        medicalNotes,
        sleepHours: Number(sleepHours),
        stressLevel: Number(stressLevel),
        timezone: profile?.timezone || getCalendars()[0]?.timeZone || 'UTC',
      });
      await saveProfile(nextProfile);
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

  return (
    <Screen gap={22}>
      <PageTitle title={t('onboarding.title')} subtitle={t('onboarding.subtitle')} />
      <InlineNotice>{label(
        'NeoFit is for general fitness planning. Pain, chest symptoms, fainting, severe shortness of breath, or a serious medical condition needs qualified care.',
        'نئوفیت برای برنامه‌ریزی عمومی تمرین است. درد، علائم قفسه سینه، غش، تنگی نفس شدید یا بیماری مهم نیازمند بررسی متخصص است.',
      )}</InlineNotice>

      <Card>
        <AppText size={20} weight="800">{label('Basic information', 'اطلاعات پایه')}</AppText>
        <Field label={t('onboarding.name')} value={name} onChangeText={setName} autoCapitalize="words" />
        <AppText weight="600">{t('onboarding.goal')}</AppText>
        <ChoiceGrid value={goal} onChange={setGoal} options={[
          { value: 'lose_weight', label: t('onboarding.loseWeight') },
          { value: 'gain_muscle', label: t('onboarding.gainMuscle') },
          { value: 'improve_fitness', label: t('onboarding.improveFitness') },
        ]} columns={1} />
        <AppText weight="600">{t('onboarding.gender')}</AppText>
        <ChoiceGrid value={gender} onChange={setGender} options={[
          { value: 'male', label: t('onboarding.male') },
          { value: 'female', label: t('onboarding.female') },
          { value: 'other', label: t('onboarding.other') },
        ]} columns={3} />
        <View style={{ flexDirection: 'row', gap: 10 }}>
          <View style={{ flex: 1 }}><Field label={t('onboarding.age')} value={age} onChangeText={setAge} keyboardType="number-pad" /></View>
          <View style={{ flex: 1 }}><Field label={t('onboarding.height')} value={height} onChangeText={setHeight} keyboardType="decimal-pad" /></View>
          <View style={{ flex: 1 }}><Field label={t('onboarding.weight')} value={weight} onChangeText={setWeight} keyboardType="decimal-pad" /></View>
        </View>
      </Card>

      <Card>
        <AppText size={20} weight="800">{label('Training profile', 'پروفایل تمرینی')}</AppText>
        <AppText weight="600">{t('onboarding.fitnessLevel')}</AppText>
        <ChoiceGrid value={fitnessLevel} onChange={setFitnessLevel} options={[
          { value: 'beginner', label: t('onboarding.beginner') },
          { value: 'intermediate', label: t('onboarding.intermediate') },
          { value: 'advanced', label: t('onboarding.advanced') },
        ]} columns={3} />
        <AppText weight="600">{t('onboarding.activityLevel')}</AppText>
        <ChoiceGrid value={activityLevel} onChange={setActivityLevel} options={[
          { value: 'sedentary', label: t('onboarding.sedentary') },
          { value: 'lightly_active', label: t('onboarding.lightlyActive') },
          { value: 'moderately_active', label: t('onboarding.moderatelyActive') },
          { value: 'very_active', label: t('onboarding.veryActive') },
        ]} columns={2} />
        <AppText weight="600">{t('onboarding.trainingDays')}</AppText>
        <ChoiceGrid value={trainingDays} onChange={setTrainingDays} options={['2', '3', '4', '5', '6', '7'].map((value) => ({ value, label: value }))} columns={3} />
        <AppText weight="600">{t('onboarding.sessionMinutes')}</AppText>
        <ChoiceGrid value={sessionMinutes} onChange={setSessionMinutes} options={['30', '45', '60', '75', '90'].map((value) => ({ value, label: label(`${value} min`, `${value} دقیقه`) }))} columns={2} />
        <AppText weight="600">{t('onboarding.location')}</AppText>
        <ChoiceGrid value={location} onChange={setLocation} options={[
          { value: 'home', label: t('onboarding.home') },
          { value: 'gym', label: t('onboarding.gym') },
          { value: 'outdoor', label: t('onboarding.outdoor') },
        ]} columns={3} />
        <Field label={t('onboarding.equipment')} value={equipment} onChangeText={setEquipment} placeholder={label('Dumbbells, bands, bench…', 'دمبل، کش، نیمکت و…')} />
      </Card>

      <Card>
        <AppText size={20} weight="800">{label('Nutrition and recovery', 'تغذیه و ریکاوری')}</AppText>
        <Field label={t('onboarding.diet')} value={diet} onChangeText={setDiet} placeholder={label('Halal, vegetarian, dislikes…', 'حلال، گیاه‌خواری، غذاهای نامطلوب و…')} />
        <Field label={t('onboarding.allergies')} value={allergies} onChangeText={setAllergies} placeholder={label('Separate items with commas', 'موارد را با ویرگول جدا کنید')} />
        <Field label={t('onboarding.medicalNotes')} value={medicalNotes} onChangeText={setMedicalNotes} multiline />
        <View style={{ flexDirection: 'row', gap: 10 }}>
          <View style={{ flex: 1 }}><Field label={t('onboarding.sleep')} value={sleepHours} onChangeText={setSleepHours} keyboardType="decimal-pad" /></View>
          <View style={{ flex: 1 }}><Field label={t('onboarding.stress')} value={stressLevel} onChangeText={setStressLevel} keyboardType="number-pad" /></View>
        </View>
      </Card>

      {error ? <InlineNotice tone="danger">{error}</InlineNotice> : null}
      <PrimaryButton title={t('onboarding.create')} onPress={submit} loading={saving} />
    </Screen>
  );
}
