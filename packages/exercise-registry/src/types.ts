export const MOVEMENT_PATTERNS = [
  'squat',
  'hinge',
  'horizontal_push',
  'vertical_push',
  'horizontal_pull',
  'vertical_pull',
  'lunge',
  'isolation',
] as const;

export const EXERCISE_DIFFICULTIES = ['beginner', 'intermediate', 'advanced'] as const;

export const EXERCISE_EQUIPMENT = [
  'bodyweight',
  'dumbbell',
  'barbell',
  'cable',
  'bands',
  'bench',
  'full-gym',
  'pull-up-bar',
  'cardio-machine',
  'landmine',
] as const;

export const EXERCISE_SAFETY_TAGS = [
  'shoulder_overhead',
  'shoulder_extension',
  'elbow_load',
  'wrist_extension',
  'spinal_axial_load',
  'spinal_hinge',
  'knee_deep_flexion',
  'knee_shear',
  'balance_demand',
  'high_impact',
  'valsalva_risk',
] as const;

export type MovementPattern = (typeof MOVEMENT_PATTERNS)[number];
export type ExerciseDifficulty = (typeof EXERCISE_DIFFICULTIES)[number];
export type ExerciseEquipment = (typeof EXERCISE_EQUIPMENT)[number];
export type ExerciseSafetyTag = (typeof EXERCISE_SAFETY_TAGS)[number];

export interface ExerciseDefinition {
  readonly id: string;
  readonly nameFa: string;
  readonly nameEn: string;
  readonly aliasesFa: readonly string[];
  readonly aliasesEn: readonly string[];
  readonly movementPattern: MovementPattern;
  readonly primaryMuscles: readonly string[];
  readonly secondaryMuscles: readonly string[];
  readonly equipment: readonly ExerciseEquipment[];
  readonly difficulty: ExerciseDifficulty;
  readonly contraindicationTags: readonly ExerciseSafetyTag[];
  readonly videoSearchHints: {
    readonly fa: readonly string[];
    readonly en: readonly string[];
  };
}

export type SubstitutionReason = 'equipment' | 'skill_regression' | 'joint_friendly' | 'same_pattern';

export interface ExerciseSubstitution {
  readonly sourceId: string;
  readonly substituteId: string;
  readonly reason: SubstitutionReason;
  readonly priority: number;
}

export interface ExerciseSafetyProfile {
  readonly blockedTags: readonly ExerciseSafetyTag[];
  readonly reviewTags: readonly ExerciseSafetyTag[];
  readonly reviewReasons: readonly string[];
}

export type ExerciseSafetyStatus = 'allowed' | 'review' | 'blocked';

export interface ExerciseSafetyDecision {
  readonly exerciseId: string;
  readonly status: ExerciseSafetyStatus;
  readonly matchedTags: readonly ExerciseSafetyTag[];
  readonly reasons: readonly string[];
}
