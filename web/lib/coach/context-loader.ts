import 'server-only';

import {
  NUTRIENT_KEYS,
  calculateGoalProgress,
  summarizeDiaryDay,
  type DiaryEntry,
  type MealType,
  type NutritionEstimate,
  type NutritionGoals,
  type NutritionVector,
} from '@neofit/nutrition-core';
import { formatLocalDate, normalizeTimeZone } from '@/lib/local-date';
import { exerciseRegistryContext } from '@/lib/exercise-registry/coach-context';
import { goalLabels, parseOnboardingDraft } from '@/lib/onboarding/model';
import type { Json } from '@/lib/supabase/database.types';
import type { AiAuthenticatedContext } from '@/lib/ai/credential-store';
import type { CoachContextDomain } from './context-router';

function isRecord(value: Json | undefined | null): value is { [key: string]: Json | undefined } {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function parseVector(value: Json | undefined | null): NutritionVector | null {
  if (!isRecord(value)) return null;
  const vector: Partial<Record<(typeof NUTRIENT_KEYS)[number], number>> = {};
  for (const key of NUTRIENT_KEYS) {
    const nutrient = value[key];
    if (nutrient === undefined) continue;
    if (typeof nutrient !== 'number' || !Number.isFinite(nutrient)) return null;
    vector[key] = nutrient;
  }
  return vector;
}

function parseEstimate(value: Json): NutritionEstimate | null {
  if (!isRecord(value)) return null;
  const center = parseVector(value.center);
  if (!center) return null;
  const gramsValue = value.grams;
  const grams = gramsValue === null ? null : typeof gramsValue === 'number' && Number.isFinite(gramsValue) && gramsValue >= 0 ? gramsValue : undefined;
  if (grams === undefined) return null;
  return { grams, center };
}

function parseMealType(value: string): MealType | null {
  return value === 'breakfast' || value === 'lunch' || value === 'dinner' || value === 'snack' ? value : null;
}

function macroView(vector: NutritionVector) {
  const finite = (key: 'energyKcal' | 'proteinG' | 'carbsG' | 'fatG') => {
    const value = vector[key];
    return typeof value === 'number' && Number.isFinite(value) ? Math.round(value * 10) / 10 : null;
  };
  return { calories: finite('energyKcal'), proteinG: finite('proteinG'), carbsG: finite('carbsG'), fatG: finite('fatG') };
}

function bounded(value: string | null | undefined, limit = 500) {
  const text = value?.trim();
  return text ? text.slice(0, limit) : null;
}

function rounded(value: number | null | undefined) {
  return typeof value === 'number' && Number.isFinite(value) ? Math.round(value * 10) / 10 : null;
}

export async function loadCoachContext(
  auth: AiAuthenticatedContext,
  domains: readonly CoachContextDomain[],
  message = '',
) {
  const { supabase, userId } = auth;
  const [profileResult, onboardingResult] = await Promise.all([
    supabase.from('profiles').select('display_name,timezone').eq('id', userId).maybeSingle(),
    supabase.from('user_onboarding').select('draft,status,completed_at').eq('user_id', userId).maybeSingle(),
  ]);
  if (profileResult.error || onboardingResult.error) throw new Error('Unable to load Coach profile context.');

  const onboarding = parseOnboardingDraft(onboardingResult.data?.draft ?? null);
  const timezone = normalizeTimeZone(profileResult.data?.timezone);
  const context: Record<string, unknown> = {
    generatedAt: new Date().toISOString(),
    domains,
    profile: {
      displayName: bounded(profileResult.data?.display_name, 80),
      onboardingStatus: onboardingResult.data?.status ?? 'missing',
      primaryGoal: onboarding?.goal.primaryGoal ? goalLabels[onboarding.goal.primaryGoal] : null,
      basics: onboarding ? { age: onboarding.basics.age, gender: onboarding.basics.gender, heightCm: onboarding.basics.heightCm, weightKg: onboarding.basics.weightKg } : null,
      availability: onboarding ? { daysPerWeek: onboarding.availability.daysPerWeek, sessionDuration: onboarding.availability.sessionDuration, location: onboarding.availability.location, equipment: onboarding.availability.equipment.slice(0, 20) } : null,
      coachingPreferences: onboarding ? { tone: onboarding.preferences.coachingTone, intensity: onboarding.preferences.intensity, trainingStyle: onboarding.preferences.trainingStyle, nutritionStrictness: onboarding.preferences.nutritionStrictness } : null,
    },
  };

  if (domains.includes('safety')) {
    context.safety = onboarding ? {
      medical: {
        conditions: onboarding.medical.conditions.slice(0, 20).map((item) => bounded(item, 120)),
        medications: bounded(onboarding.medical.medications),
        highBloodPressure: onboarding.medical.hasHighBloodPressure,
        diabetes: onboarding.medical.hasDiabetes,
        cardiacHistory: onboarding.medical.hasCardiacHistory,
        physicianRestrictions: bounded(onboarding.medical.physicianRestrictions, 700),
      },
      injuries: {
        painDuringExercise: onboarding.injuries.painDuringExercise,
        painScale: onboarding.injuries.painScale,
        generalLimitations: bounded(onboarding.injuries.generalLimitations, 700),
        areaCount: onboarding.injuries.areas.length,
        areas: onboarding.injuries.areas.slice(0, 24).map((area) => ({ bodyPartId: area.bodyPartId, label: area.label, severity: area.severity, status: area.status, forbiddenMovements: bounded(area.forbiddenMovements, 160), notes: bounded(area.notes, 160) })),
      },
    } : null;
  }

  if (domains.includes('workout')) {
    context.exerciseRegistry = exerciseRegistryContext(message, onboarding);
  }

  const tasks: Array<Promise<void>> = [];

  if (domains.includes('nutrition')) {
    tasks.push((async () => {
      const localDate = formatLocalDate(new Date(), timezone);
      const [goalsResult, entriesResult] = await Promise.all([
        supabase.from('nutrition_goals').select('daily').eq('user_id', userId).maybeSingle(),
        supabase.from('nutrition_entries').select('id,local_date,meal_type,label,source_type,source_id,estimate,created_at,updated_at').eq('user_id', userId).eq('local_date', localDate).order('logged_at', { ascending: true }).limit(40),
      ]);
      if (goalsResult.error || entriesResult.error) throw new Error('Unable to load Coach nutrition context.');
      const daily = parseVector(goalsResult.data?.daily ?? null);
      const goals: NutritionGoals | null = daily ? { daily } : null;
      const diary: DiaryEntry[] = [];
      const meals: Array<{ label: string; mealType: MealType; grams: number | null }> = [];
      for (const row of entriesResult.data ?? []) {
        const mealType = parseMealType(row.meal_type);
        const estimate = parseEstimate(row.estimate);
        const sourceType = row.source_type === 'food' || row.source_type === 'recipe' || row.source_type === 'custom' ? row.source_type : null;
        if (!mealType || !estimate || !sourceType) continue;
        diary.push({ id: row.id, localDate: row.local_date, mealType, label: row.label, sourceType, sourceId: row.source_id, estimate, createdAt: row.created_at, updatedAt: row.updated_at });
        meals.push({ label: row.label.slice(0, 160), mealType, grams: estimate.grams });
      }
      if (!goals) {
        context.nutrition = { localDate, goalsConfigured: false, meals };
        return;
      }
      const summary = summarizeDiaryDay(diary, localDate);
      const progress = calculateGoalProgress(summary.total.center, goals);
      const remaining = Object.fromEntries(['energyKcal', 'proteinG', 'carbsG', 'fatG'].map((nutrient) => {
        const item = progress.find((candidate) => candidate.nutrient === nutrient);
        return [nutrient, item?.remaining ?? null];
      }));
      context.nutrition = {
        localDate,
        goalsConfigured: true,
        totals: macroView(summary.total.center),
        targets: macroView(goals.daily),
        remaining,
        entryCount: summary.entryCount,
        meals,
        authority: '@neofit/nutrition-core',
      };
    })());
  }

  if (domains.includes('workout')) {
    tasks.push((async () => {
      const sessionsResult = await supabase.from('workout_sessions')
        .select('id,workout_id,workout_title,status,started_at,completed_at,duration_minutes,total_volume_kg,rpe,pain_scale')
        .eq('user_id', userId).order('started_at', { ascending: false }).limit(6);
      if (sessionsResult.error) throw new Error('Unable to load Coach workout context.');
      const sessions = sessionsResult.data ?? [];
      const sessionIds = sessions.map((session) => session.id);
      let sets: Array<{ session_id: string; exercise_id: string; exercise_name: string; reps: number | null; weight_kg: number | null; completed_at: string | null }> = [];
      if (sessionIds.length) {
        const setsResult = await supabase.from('workout_sets')
          .select('session_id,exercise_id,exercise_name,reps,weight_kg,completed_at')
          .eq('user_id', userId).in('session_id', sessionIds).not('completed_at', 'is', null).limit(120);
        if (setsResult.error) throw new Error('Unable to load Coach workout sets.');
        sets = setsResult.data ?? [];
      }
      const bestWeights = new Map<string, { exerciseName: string; weightKg: number }>();
      for (const set of sets) {
        if (typeof set.weight_kg !== 'number') continue;
        const current = bestWeights.get(set.exercise_id);
        if (!current || set.weight_kg > current.weightKg) bestWeights.set(set.exercise_id, { exerciseName: set.exercise_name, weightKg: set.weight_kg });
      }
      context.workout = {
        active: sessions.find((session) => session.status === 'active') ?? null,
        recent: sessions.filter((session) => session.status === 'completed').slice(0, 5),
        recentCompletedSetCount: sets.length,
        bestWeights: Array.from(bestWeights.values()).slice(0, 20),
      };
    })());
  }

  if (domains.includes('progress')) {
    tasks.push((async () => {
      const result = await supabase
        .from('body_measurements')
        .select('local_date,measured_at,weight_kg,waist_cm,body_fat_percent')
        .eq('user_id', userId)
        .order('measured_at', { ascending: false })
        .limit(30);
      if (result.error) throw new Error('Unable to load Coach progress context.');

      const rows = result.data ?? [];
      const latestWeight = rows.find((row) => typeof row.weight_kg === 'number') ?? null;
      const latestWaist = rows.find((row) => typeof row.waist_cm === 'number') ?? null;
      const latestBodyFat = rows.find((row) => typeof row.body_fat_percent === 'number') ?? null;
      const weightRows = rows.filter((row) => typeof row.weight_kg === 'number');
      const newestWeight = weightRows[0] ?? null;
      const oldestWeight = weightRows.at(-1) ?? null;
      const weightTrend = newestWeight && oldestWeight && weightRows.length >= 2
        ? {
            fromLocalDate: oldestWeight.local_date,
            toLocalDate: newestWeight.local_date,
            startWeightKg: rounded(oldestWeight.weight_kg),
            endWeightKg: rounded(newestWeight.weight_kg),
            changeKg: rounded((newestWeight.weight_kg ?? 0) - (oldestWeight.weight_kg ?? 0)),
            sampleCount: weightRows.length,
          }
        : null;

      context.progress = {
        source: 'body_measurements',
        measurementCount: rows.length,
        latestWeight: latestWeight ? { localDate: latestWeight.local_date, measuredAt: latestWeight.measured_at, weightKg: rounded(latestWeight.weight_kg) } : null,
        latestWaist: latestWaist ? { localDate: latestWaist.local_date, measuredAt: latestWaist.measured_at, waistCm: rounded(latestWaist.waist_cm) } : null,
        latestBodyFat: latestBodyFat ? { localDate: latestBodyFat.local_date, measuredAt: latestBodyFat.measured_at, bodyFatPercent: rounded(latestBodyFat.body_fat_percent) } : null,
        weightTrend,
      };
    })());
  }

  await Promise.all(tasks);
  return context;
}
