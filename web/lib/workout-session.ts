import type { WorkoutDay } from '@/data/workout-fixtures';

export const WORKOUT_PLAYER_SCHEMA_VERSION = 1;
export const GUEST_ACTIVE_WORKOUT_PREFIX = 'neofit:active-workout:v1:';
export const GUEST_WORKOUT_HISTORY_KEY = 'neofit:workout-history:v1';
const MAX_HISTORY_ITEMS = 100;

export interface WorkoutSetState {
  readonly exerciseId: string;
  readonly exerciseName: string;
  readonly exerciseOrder: number;
  readonly setOrder: number;
  readonly targetReps: string;
  readonly reps: string;
  readonly weightKg: string;
  readonly completedAt: string | null;
}

export interface WorkoutPosition {
  readonly exerciseIndex: number;
  readonly setIndex: number;
}

export interface WorkoutPlayerState {
  readonly version: 1;
  readonly clientMutationId: string;
  readonly workoutId: string;
  readonly workoutTitle: string;
  readonly startedAt: string;
  readonly sets: readonly WorkoutSetState[];
}

export interface WorkoutHistoryItem {
  readonly clientMutationId: string;
  readonly workoutId: string;
  readonly workoutTitle: string;
  readonly startedAt: string;
  readonly completedAt: string;
  readonly durationMinutes: number;
  readonly totalVolumeKg: number;
  readonly rpe: number;
  readonly painScale: number;
  readonly notes: string;
  readonly setCount: number;
}

const persianDigits: Readonly<Record<string, string>> = {
  '۰': '0', '۱': '1', '۲': '2', '۳': '3', '۴': '4',
  '۵': '5', '۶': '6', '۷': '7', '۸': '8', '۹': '9',
};

function normalizeDigits(value: string): string {
  return value.replace(/[۰-۹]/g, (digit) => persianDigits[digit] ?? digit);
}

export function restSeconds(value: string): number {
  const parsed = Number.parseInt(normalizeDigits(value).match(/\d+/)?.[0] ?? '60', 10);
  return Number.isFinite(parsed) ? Math.min(600, Math.max(15, parsed)) : 60;
}

function createMutationId(): string {
  return globalThis.crypto?.randomUUID?.() ?? `workout-${Date.now()}-${Math.random().toString(36).slice(2, 12)}`;
}

export function createWorkoutPlayerState(
  workout: WorkoutDay,
  options?: { readonly clientMutationId?: string; readonly startedAt?: string },
): WorkoutPlayerState {
  return {
    version: WORKOUT_PLAYER_SCHEMA_VERSION,
    clientMutationId: options?.clientMutationId ?? createMutationId(),
    workoutId: workout.id,
    workoutTitle: workout.title,
    startedAt: options?.startedAt ?? new Date().toISOString(),
    sets: workout.exercises.flatMap((exercise, exerciseIndex) =>
      Array.from({ length: exercise.sets }, (_, setIndex): WorkoutSetState => ({
        exerciseId: exercise.id,
        exerciseName: exercise.name,
        exerciseOrder: exerciseIndex + 1,
        setOrder: setIndex + 1,
        targetReps: exercise.reps,
        reps: '',
        weightKg: '',
        completedAt: null,
      })),
    ),
  };
}

export function currentWorkoutPosition(
  workout: WorkoutDay,
  state: WorkoutPlayerState,
): WorkoutPosition | null {
  for (let exerciseIndex = 0; exerciseIndex < workout.exercises.length; exerciseIndex += 1) {
    const exercise = workout.exercises[exerciseIndex];
    for (let setIndex = 0; setIndex < exercise.sets; setIndex += 1) {
      const set = state.sets.find(
        (entry) => entry.exerciseOrder === exerciseIndex + 1 && entry.setOrder === setIndex + 1,
      );
      if (!set?.completedAt) return { exerciseIndex, setIndex };
    }
  }
  return null;
}

export function updateWorkoutSetDraft(
  state: WorkoutPlayerState,
  position: WorkoutPosition,
  patch: { readonly reps?: string; readonly weightKg?: string; readonly exerciseName?: string },
): WorkoutPlayerState {
  const exerciseOrder = position.exerciseIndex + 1;
  const setOrder = position.setIndex + 1;
  return {
    ...state,
    sets: state.sets.map((set) =>
      set.exerciseOrder === exerciseOrder && set.setOrder === setOrder
        ? { ...set, ...patch }
        : set,
    ),
  };
}

export function completeWorkoutSet(
  state: WorkoutPlayerState,
  position: WorkoutPosition,
  completedAt = new Date().toISOString(),
): WorkoutPlayerState {
  const exerciseOrder = position.exerciseIndex + 1;
  const setOrder = position.setIndex + 1;
  return {
    ...state,
    sets: state.sets.map((set) =>
      set.exerciseOrder === exerciseOrder && set.setOrder === setOrder
        ? { ...set, completedAt }
        : set,
    ),
  };
}

export function workoutVolumeKg(state: WorkoutPlayerState): number {
  return state.sets.reduce((sum, set) => {
    if (!set.completedAt) return sum;
    const reps = Number.parseInt(set.reps, 10);
    const weight = Number.parseFloat(set.weightKg);
    if (!Number.isFinite(reps) || reps <= 0 || !Number.isFinite(weight) || weight < 0) return sum;
    return sum + reps * weight;
  }, 0);
}

export function completedSetCount(state: WorkoutPlayerState): number {
  return state.sets.filter((set) => Boolean(set.completedAt)).length;
}

export function parsePositiveReps(value: string): number | null {
  const reps = Number.parseInt(value, 10);
  return Number.isInteger(reps) && reps >= 1 && reps <= 1000 ? reps : null;
}

export function parseWeightKg(value: string): number | null {
  const weight = Number.parseFloat(value);
  return Number.isFinite(weight) && weight >= 0 && weight <= 10000 ? weight : null;
}

function isSafeText(value: unknown, maxLength: number): value is string {
  return typeof value === 'string' && value.length > 0 && value.length <= maxLength;
}

function isSetState(value: unknown): value is WorkoutSetState {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return false;
  const set = value as Partial<WorkoutSetState>;
  return (
    isSafeText(set.exerciseId, 160) &&
    isSafeText(set.exerciseName, 160) &&
    Number.isInteger(set.exerciseOrder) && Number(set.exerciseOrder) >= 1 && Number(set.exerciseOrder) <= 100 &&
    Number.isInteger(set.setOrder) && Number(set.setOrder) >= 1 && Number(set.setOrder) <= 100 &&
    isSafeText(set.targetReps, 40) &&
    typeof set.reps === 'string' && set.reps.length <= 8 &&
    typeof set.weightKg === 'string' && set.weightKg.length <= 16 &&
    (set.completedAt === null || (typeof set.completedAt === 'string' && Number.isFinite(Date.parse(set.completedAt))))
  );
}

export function parseStoredWorkoutState(raw: string | null, workout: WorkoutDay): WorkoutPlayerState | null {
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as Partial<WorkoutPlayerState>;
    const expectedSetCount = workout.exercises.reduce((sum, exercise) => sum + exercise.sets, 0);
    if (
      parsed.version !== WORKOUT_PLAYER_SCHEMA_VERSION ||
      parsed.workoutId !== workout.id ||
      !isSafeText(parsed.clientMutationId, 120) ||
      !isSafeText(parsed.workoutTitle, 160) ||
      typeof parsed.startedAt !== 'string' || !Number.isFinite(Date.parse(parsed.startedAt)) ||
      !Array.isArray(parsed.sets) || parsed.sets.length !== expectedSetCount ||
      parsed.sets.length > 500 || !parsed.sets.every(isSetState)
    ) {
      return null;
    }
    return parsed as WorkoutPlayerState;
  } catch {
    return null;
  }
}

export function guestWorkoutStorageKey(workoutId: string): string {
  return `${GUEST_ACTIVE_WORKOUT_PREFIX}${workoutId}`;
}

export function loadGuestWorkout(workout: WorkoutDay): WorkoutPlayerState | null {
  if (typeof window === 'undefined') return null;
  return parseStoredWorkoutState(window.localStorage.getItem(guestWorkoutStorageKey(workout.id)), workout);
}

export function persistGuestWorkout(state: WorkoutPlayerState): void {
  window.localStorage.setItem(guestWorkoutStorageKey(state.workoutId), JSON.stringify(state));
}

export function clearGuestWorkout(workoutId: string): void {
  window.localStorage.removeItem(guestWorkoutStorageKey(workoutId));
}

export function saveGuestWorkoutHistory(item: WorkoutHistoryItem): void {
  let existing: WorkoutHistoryItem[] = [];
  try {
    const parsed = JSON.parse(window.localStorage.getItem(GUEST_WORKOUT_HISTORY_KEY) ?? '[]');
    if (Array.isArray(parsed)) existing = parsed as WorkoutHistoryItem[];
  } catch {
    existing = [];
  }
  const next = [item, ...existing.filter((entry) => entry.clientMutationId !== item.clientMutationId)]
    .slice(0, MAX_HISTORY_ITEMS);
  window.localStorage.setItem(GUEST_WORKOUT_HISTORY_KEY, JSON.stringify(next));
}
