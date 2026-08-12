import {
  EXERCISE_REGISTRY_VERSION,
  evaluateExerciseSafety,
  searchExerciseRegistry,
  selectSafeSubstitutes,
  type ExerciseEquipment,
} from '@neofit/exercise-registry';
import type { OnboardingDraft } from '@/lib/onboarding/model';
import { safetyProfileFromOnboarding } from './onboarding-safety';

const FULL_GYM_EQUIPMENT: readonly ExerciseEquipment[] = [
  'bodyweight', 'dumbbell', 'barbell', 'cable', 'bands', 'bench', 'full-gym',
  'pull-up-bar', 'cardio-machine',
];

function normalize(value: string): string {
  return value
    .trim()
    .toLocaleLowerCase('fa-IR')
    .replace(/[\u200c\u200f\u202a-\u202e]/g, ' ')
    .replace(/\s+/g, ' ');
}

function availableEquipment(draft: OnboardingDraft): ExerciseEquipment[] {
  const equipment = new Set<ExerciseEquipment>(['bodyweight']);
  if (draft.availability.equipment.includes('full-gym')) {
    for (const item of FULL_GYM_EQUIPMENT) equipment.add(item);
  } else {
    for (const item of draft.availability.equipment) equipment.add(item);
  }
  const custom = normalize(draft.availability.customEquipment);
  if (custom.includes('landmine') || custom.includes('لندماین')) equipment.add('landmine');
  return Array.from(equipment);
}

export function exerciseRegistryContext(message: string, draft: OnboardingDraft | null) {
  const authority = '@neofit/exercise-registry';
  if (!draft) return { authority, version: EXERCISE_REGISTRY_VERSION, candidates: [], safetyProfileAvailable: false };

  const safetyProfile = safetyProfileFromOnboarding({
    highBloodPressure: draft.medical.hasHighBloodPressure,
    cardiacHistory: draft.medical.hasCardiacHistory,
    physicianRestrictions: draft.medical.physicianRestrictions,
    generalLimitations: draft.injuries.generalLimitations,
    painDuringExercise: draft.injuries.painDuringExercise,
    painScale: draft.injuries.painScale,
    injuries: draft.injuries.areas,
  });
  const equipment = availableEquipment(draft);
  const candidates = searchExerciseRegistry(message, 4).map((exercise) => ({
    id: exercise.id,
    nameFa: exercise.nameFa,
    nameEn: exercise.nameEn,
    movementPattern: exercise.movementPattern,
    equipment: exercise.equipment,
    decision: evaluateExerciseSafety(exercise, safetyProfile),
    safeSubstitutes: selectSafeSubstitutes(exercise.id, safetyProfile, equipment, 2).map((item) => ({
      id: item.exercise.id,
      nameFa: item.exercise.nameFa,
      reason: item.relationship.reason,
    })),
  }));

  return {
    authority,
    version: EXERCISE_REGISTRY_VERSION,
    safetyProfileAvailable: true,
    candidates,
  };
}
