import type { WorkoutLog } from "@/context/user-profile-context";
import type { WorkoutSession } from "@/components/workout/workout-player";

export type PersonalRecord = {
  id: string;
  workoutId: string;
  workoutName: string;
  exerciseId: string;
  exerciseName: string;
  kind: "max-weight" | "exercise-volume";
  value: number;
  previousValue: number;
  achievedAt: string;
};

export const WORKOUT_RECORDS_STORAGE_KEY = "neofit:workout-records:v1";
export const WORKOUT_RECORDS_EVENT = "neofit:workout-records-changed";

function validEntries(logs: Array<{ reps: string; weight: string }>) {
  return logs
    .map((log) => ({ reps: Number.parseInt(log.reps, 10), weight: Number.parseFloat(log.weight) }))
    .filter((log) => Number.isFinite(log.reps) && Number.isFinite(log.weight) && log.reps > 0 && log.weight >= 0);
}

function exerciseStats(logs: Array<{ reps: string; weight: string }>) {
  const entries = validEntries(logs);
  return {
    maxWeight: entries.length ? Math.max(...entries.map((entry) => entry.weight)) : 0,
    volume: entries.reduce((sum, entry) => sum + entry.reps * entry.weight, 0),
  };
}

export function readWorkoutRecords(): PersonalRecord[] {
  if (typeof window === "undefined") return [];
  try {
    const parsed = JSON.parse(window.localStorage.getItem(WORKOUT_RECORDS_STORAGE_KEY) || "[]");
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function persistWorkoutRecords(records: PersonalRecord[]) {
  const existing = readWorkoutRecords();
  const next = [...records, ...existing]
    .filter((record, index, all) => all.findIndex((candidate) => candidate.id === record.id) === index)
    .slice(0, 500);
  window.localStorage.setItem(WORKOUT_RECORDS_STORAGE_KEY, JSON.stringify(next));
  window.dispatchEvent(new CustomEvent(WORKOUT_RECORDS_EVENT, { detail: next }));
  return next;
}

export function detectPersonalRecords({
  session,
  previousLogs,
  achievedAt,
}: {
  session: WorkoutSession;
  previousLogs: WorkoutLog[];
  achievedAt: string;
}): PersonalRecord[] {
  const records: PersonalRecord[] = [];

  for (const exercise of session.exercises) {
    const current = exerciseStats(exercise.logs);
    const previousExercises = previousLogs.flatMap((workout) => workout.exercises).filter((entry) => entry.id === exercise.id || entry.name === exercise.name);
    const previousStats = previousExercises.map((entry) => exerciseStats(entry.logs));
    const previousMaxWeight = previousStats.length ? Math.max(...previousStats.map((entry) => entry.maxWeight)) : 0;
    const previousMaxVolume = previousStats.length ? Math.max(...previousStats.map((entry) => entry.volume)) : 0;

    if (previousMaxWeight > 0 && current.maxWeight > previousMaxWeight) {
      records.push({
        id: `${session.id}:${exercise.id}:max-weight:${achievedAt}`,
        workoutId: session.id,
        workoutName: session.title,
        exerciseId: exercise.id,
        exerciseName: exercise.name,
        kind: "max-weight",
        value: current.maxWeight,
        previousValue: previousMaxWeight,
        achievedAt,
      });
    }

    if (previousMaxVolume > 0 && current.volume > previousMaxVolume) {
      records.push({
        id: `${session.id}:${exercise.id}:exercise-volume:${achievedAt}`,
        workoutId: session.id,
        workoutName: session.title,
        exerciseId: exercise.id,
        exerciseName: exercise.name,
        kind: "exercise-volume",
        value: current.volume,
        previousValue: previousMaxVolume,
        achievedAt,
      });
    }
  }

  return records;
}

export function formatRecord(record: PersonalRecord) {
  if (record.kind === "max-weight") {
    return `رکورد وزنه: ${record.value.toLocaleString("fa-IR")} کیلوگرم`;
  }
  return `رکورد حجم حرکت: ${Math.round(record.value).toLocaleString("fa-IR")} کیلوگرم`;
}
