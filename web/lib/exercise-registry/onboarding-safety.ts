import type { ExerciseSafetyProfile, ExerciseSafetyTag } from '@neofit/exercise-registry';

type InjurySeverity = 'mild' | 'moderate' | 'severe';
type InjuryStatus = 'current' | 'past';

export interface OnboardingSafetyInput {
  readonly highBloodPressure: boolean | null;
  readonly cardiacHistory: boolean | null;
  readonly physicianRestrictions: string;
  readonly generalLimitations: string;
  readonly painDuringExercise: boolean | null;
  readonly painScale: number | null;
  readonly injuries: readonly {
    readonly bodyPartId: string;
    readonly severity: InjurySeverity;
    readonly status: InjuryStatus;
    readonly forbiddenMovements: string;
  }[];
}

const BODY_PART_TAGS: Readonly<Record<string, readonly ExerciseSafetyTag[]>> = {
  shoulder: ['shoulder_overhead', 'shoulder_extension'],
  elbow: ['elbow_load'],
  wrist: ['wrist_extension'],
  spine: ['spinal_axial_load', 'spinal_hinge'],
  knee: ['knee_deep_flexion', 'knee_shear', 'high_impact'],
  ankle: ['balance_demand', 'high_impact'],
  hip: ['knee_deep_flexion', 'spinal_hinge', 'balance_demand'],
  torso: ['valsalva_risk'],
};

const BODY_PART_GROUPS: Readonly<Record<string, keyof typeof BODY_PART_TAGS>> = Object.fromEntries([
  ...['2', '22', '42', '58', '53', '69'].map((id) => [id, 'shoulder']),
  ...['3', '23', '43', '59'].map((id) => [id, 'elbow']),
  ...['5', '6', '18', '25', '26', '38', '44', '45', '50', '60', '61', '66'].map((id) => [id, 'wrist']),
  ...['39', '41', '55', '57', '71'].map((id) => [id, 'spine']),
  ...['7', '27', '56', '72'].map((id) => [id, 'knee']),
  ...['8', '13', '14', '28', '33', '34', '47', '49', '54', '63', '65', '70'].map((id) => [id, 'ankle']),
  ...['11', '15', '16', '31', '35', '36', '46', '52', '62', '68'].map((id) => [id, 'hip']),
  ...['0', '1', '4', '9', '20', '21', '24', '29'].map((id) => [id, 'torso']),
]) as Record<string, keyof typeof BODY_PART_TAGS>;

function unique<T>(values: readonly T[]): T[] {
  return Array.from(new Set(values));
}

export function safetyProfileFromOnboarding(input: OnboardingSafetyInput): ExerciseSafetyProfile {
  const blockedTags: ExerciseSafetyTag[] = [];
  const reviewTags: ExerciseSafetyTag[] = [];
  const reviewReasons: string[] = [];

  if (input.highBloodPressure === true || input.cardiacHistory === true) {
    blockedTags.push('valsalva_risk');
  }
  // unset != explicit "no": an unanswered cardiovascular question is not evidence
  // of safety, so fail closed into human review rather than inferring "no risk".
  if (input.highBloodPressure === null || input.cardiacHistory === null) {
    reviewReasons.push('incomplete_medical_history');
  }
  if (input.physicianRestrictions.trim()) reviewReasons.push('physician_restriction_requires_review');
  if (input.generalLimitations.trim()) reviewReasons.push('general_limitation_requires_review');
  if (input.painDuringExercise === null) {
    reviewReasons.push('incomplete_pain_report');
  } else if (input.painDuringExercise === true && (input.painScale === null || input.painScale >= 7)) {
    // Reported pain with unknown or high severity is reviewed; a null scale is
    // missing evidence, never a quiet zero.
    reviewReasons.push('severe_exercise_pain');
  }

  for (const injury of input.injuries) {
    if (injury.status !== 'current') continue;
    // Only own enumerable keys are real mappings; a prototype-chain id such as
    // 'constructor' must fail closed, never resolve to an inherited function.
    const group = Object.prototype.hasOwnProperty.call(BODY_PART_GROUPS, injury.bodyPartId)
      ? BODY_PART_GROUPS[injury.bodyPartId]
      : undefined;
    const tags = group ? BODY_PART_TAGS[group] : undefined;
    if (!tags) {
      reviewReasons.push('unmapped_current_injury');
      continue;
    }
    if (injury.severity === 'severe') blockedTags.push(...tags);
    else reviewTags.push(...tags);
    if (injury.forbiddenMovements.trim()) reviewReasons.push('reported_forbidden_movement_requires_review');
  }

  return {
    blockedTags: unique(blockedTags),
    reviewTags: unique(reviewTags.filter((tag) => !blockedTags.includes(tag))),
    reviewReasons: unique(reviewReasons),
  };
}
