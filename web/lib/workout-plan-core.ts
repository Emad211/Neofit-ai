import type { Json } from '@/lib/supabase/database.types';
import type { WorkoutDay, WorkoutExercise } from '@/data/workout-fixtures';

export const WORKOUT_PLAN_SCHEMA_VERSION = 1;
export const MAX_WORKOUT_PLAN_DAYS = 14;
export const MAX_WORKOUT_EXERCISES_PER_DAY = 30;
export const MAX_WORKOUT_SETS_PER_EXERCISE = 20;

export interface WorkoutPlanExerciseDocument {
  readonly id: string;
  readonly name: string;
  readonly sets: number;
  readonly targetReps: string;
  readonly restSeconds: number;
}

export interface WorkoutPlanDayDocument {
  readonly id: string;
  readonly day: string;
  readonly title: string;
  readonly focus: string;
  readonly durationMinutes: number;
  readonly exercises: readonly WorkoutPlanExerciseDocument[];
}

export interface WorkoutPlanDocument {
  readonly days: readonly WorkoutPlanDayDocument[];
}

export interface WorkoutPlanView {
  readonly planId: string | null;
  readonly version: number | null;
  readonly schemaVersion: number;
  readonly title: string | null;
  readonly source: string | null;
  readonly mode: 'account' | 'guest';
  readonly days: readonly WorkoutDay[];
  readonly loadError: string | null;
}

function object(value: Json | undefined): { [key: string]: Json | undefined } | null {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
    ? value as { [key: string]: Json | undefined }
    : null;
}

function safeText(value: Json | undefined, maxLength: number): string | null {
  return typeof value === 'string' && value.trim().length >= 1 && value.length <= maxLength
    ? value.trim()
    : null;
}

function integer(value: Json | undefined, min: number, max: number): number | null {
  return typeof value === 'number' && Number.isInteger(value) && value >= min && value <= max
    ? value
    : null;
}

function parseExercise(value: Json): WorkoutPlanExerciseDocument | null {
  const record = object(value);
  if (!record) return null;
  const id = safeText(record.id, 160);
  const name = safeText(record.name, 160);
  const sets = integer(record.sets, 1, MAX_WORKOUT_SETS_PER_EXERCISE);
  const targetReps = safeText(record.targetReps, 40);
  const restSeconds = integer(record.restSeconds, 15, 600);
  if (!id || !name || sets === null || !targetReps || restSeconds === null) return null;
  return { id, name, sets, targetReps, restSeconds };
}

function parseDay(value: Json): WorkoutPlanDayDocument | null {
  const record = object(value);
  if (!record) return null;
  const id = safeText(record.id, 160);
  const day = safeText(record.day, 80);
  const title = safeText(record.title, 160);
  const focus = safeText(record.focus, 240);
  const durationMinutes = integer(record.durationMinutes, 5, 360);
  if (!id || !day || !title || !focus || durationMinutes === null || !Array.isArray(record.exercises)) return null;
  if (record.exercises.length < 1 || record.exercises.length > MAX_WORKOUT_EXERCISES_PER_DAY) return null;
  const exercises = record.exercises.map(parseExercise);
  if (exercises.some((exercise) => exercise === null)) return null;
  return { id, day, title, focus, durationMinutes, exercises: exercises as WorkoutPlanExerciseDocument[] };
}

export function parseWorkoutPlanDocument(value: Json): WorkoutPlanDocument | null {
  const record = object(value);
  if (!record || !Array.isArray(record.days)) return null;
  if (record.days.length < 1 || record.days.length > MAX_WORKOUT_PLAN_DAYS) return null;
  const days = record.days.map(parseDay);
  if (days.some((day) => day === null)) return null;
  const parsed = days as WorkoutPlanDayDocument[];
  const dayIds = new Set(parsed.map((day) => day.id));
  if (dayIds.size !== parsed.length) return null;
  return { days: parsed };
}

function fa(value: number): string {
  return new Intl.NumberFormat('fa-IR', { maximumFractionDigits: 0 }).format(value);
}

function exerciseView(exercise: WorkoutPlanExerciseDocument): WorkoutExercise {
  return {
    id: exercise.id,
    name: exercise.name,
    sets: exercise.sets,
    reps: exercise.targetReps,
    rest: `${fa(exercise.restSeconds)} ثانیه`,
  };
}

export function workoutDayView(day: WorkoutPlanDayDocument): WorkoutDay {
  return {
    id: day.id,
    day: day.day,
    title: day.title,
    focus: day.focus,
    duration: `${fa(day.durationMinutes)} دقیقه`,
    exercises: day.exercises.map(exerciseView),
  };
}

export function workoutPlanViews(document: WorkoutPlanDocument): readonly WorkoutDay[] {
  return document.days.map(workoutDayView);
}
