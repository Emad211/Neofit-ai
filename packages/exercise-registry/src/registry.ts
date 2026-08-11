import { EXERCISES, EXERCISE_SUBSTITUTIONS } from './catalog';
import type {
  ExerciseDefinition,
  ExerciseEquipment,
  ExerciseSafetyDecision,
  ExerciseSafetyProfile,
  ExerciseSafetyTag,
  ExerciseSubstitution,
} from './types';

const BY_ID = new Map(EXERCISES.map((exercise) => [exercise.id, exercise]));
const SEARCH_STOP_WORDS = new Set(['آموزش', 'حرکت', 'برای', 'فرم', 'صحیح', 'exercise', 'tutorial', 'proper', 'form']);

function normalize(value: string): string {
  return value
    .normalize('NFKC')
    .replace(/[يى]/g, 'ی')
    .replace(/ك/g, 'ک')
    .replace(/[\u064B-\u065F\u0670]/g, '')
    .replace(/[‌_-]+/g, ' ')
    .replace(/[^\p{L}\p{N}\s]/gu, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase();
}

function unique<T>(values: readonly T[]): T[] {
  return Array.from(new Set(values));
}

function containsPhrase(value: string, phrase: string): boolean {
  return ` ${value} `.includes(` ${phrase} `);
}

export function findExerciseById(id: string): ExerciseDefinition | null {
  return BY_ID.get(id) ?? null;
}

export function searchExerciseRegistry(query: string, limit = 6): readonly ExerciseDefinition[] {
  const boundedLimit = Math.min(Math.max(Math.trunc(limit), 1), 8);
  const normalizedQuery = normalize(query).slice(0, 160);
  const tokens = normalizedQuery.split(' ').filter((token) => token.length >= 2 && !SEARCH_STOP_WORDS.has(token));
  if (tokens.length === 0) return [];

  return EXERCISES
    .map((exercise, index) => {
      const names = [exercise.nameFa, exercise.nameEn, ...exercise.aliasesFa, ...exercise.aliasesEn].map(normalize);
      const exact = names.some((name) => containsPhrase(normalizedQuery, name));
      const tokenMatches = tokens.filter((token) => names.some((name) => name.includes(token))).length;
      return { exercise, index, score: (exact ? 100 : 0) + tokenMatches * 10 };
    })
    .filter((item) => item.score > 0)
    .sort((left, right) => right.score - left.score || left.index - right.index)
    .slice(0, boundedLimit)
    .map((item) => item.exercise);
}

export function evaluateExerciseSafety(
  exercise: ExerciseDefinition,
  profile: ExerciseSafetyProfile,
): ExerciseSafetyDecision {
  const blocked = exercise.contraindicationTags.filter((tag) => profile.blockedTags.includes(tag));
  if (blocked.length > 0) {
    return { exerciseId: exercise.id, status: 'blocked', matchedTags: unique(blocked), reasons: ['hard_contraindication'] };
  }
  const review = exercise.contraindicationTags.filter((tag) => profile.reviewTags.includes(tag));
  const reasons = unique(profile.reviewReasons);
  if (review.length > 0 || reasons.length > 0) {
    return { exerciseId: exercise.id, status: 'review', matchedTags: unique(review), reasons };
  }
  return { exerciseId: exercise.id, status: 'allowed', matchedTags: [], reasons: [] };
}

function equipmentAvailable(exercise: ExerciseDefinition, available: ReadonlySet<ExerciseEquipment>): boolean {
  return exercise.equipment.every((equipment) => available.has(equipment));
}

export interface SafeExerciseSubstitute {
  readonly exercise: ExerciseDefinition;
  readonly relationship: ExerciseSubstitution;
  readonly decision: ExerciseSafetyDecision;
}

export function selectSafeSubstitutes(
  sourceId: string,
  profile: ExerciseSafetyProfile,
  availableEquipment: readonly ExerciseEquipment[],
  limit = 3,
): readonly SafeExerciseSubstitute[] {
  const boundedLimit = Math.min(Math.max(Math.trunc(limit), 1), 5);
  const equipment = new Set(availableEquipment);
  return EXERCISE_SUBSTITUTIONS
    .filter((relationship) => relationship.sourceId === sourceId)
    .sort((left, right) => left.priority - right.priority || left.substituteId.localeCompare(right.substituteId))
    .flatMap((relationship) => {
      const exercise = findExerciseById(relationship.substituteId);
      if (!exercise || !equipmentAvailable(exercise, equipment)) return [];
      const decision = evaluateExerciseSafety(exercise, profile);
      return decision.status === 'allowed' ? [{ exercise, relationship, decision }] : [];
    })
    .slice(0, boundedLimit);
}

export function registryIntegrityErrors(): readonly string[] {
  const errors: string[] = [];
  if (BY_ID.size !== EXERCISES.length) errors.push('duplicate_exercise_id');
  for (const exercise of EXERCISES) {
    if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(exercise.id)) errors.push(`invalid_exercise_id:${exercise.id}`);
    if (new Set(exercise.contraindicationTags).size !== exercise.contraindicationTags.length) errors.push(`duplicate_safety_tag:${exercise.id}`);
  }
  for (const relationship of EXERCISE_SUBSTITUTIONS) {
    if (relationship.sourceId === relationship.substituteId) errors.push(`self_substitution:${relationship.sourceId}`);
    if (!BY_ID.has(relationship.sourceId)) errors.push(`missing_source:${relationship.sourceId}`);
    if (!BY_ID.has(relationship.substituteId)) errors.push(`missing_substitute:${relationship.substituteId}`);
  }
  return errors;
}

export function safetyTagsForExercises(exercises: readonly ExerciseDefinition[]): readonly ExerciseSafetyTag[] {
  return unique(exercises.flatMap((exercise) => exercise.contraindicationTags));
}
