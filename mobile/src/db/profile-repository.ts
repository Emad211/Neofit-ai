import { Profile, ProfileSchema } from '@/domain/models';
import { getDatabase } from '@/db/database';

interface ProfileRow {
  name: string;
  locale: string;
  goal: string;
  gender: string;
  age: number;
  height_cm: number;
  weight_kg: number;
  fitness_level: string;
  activity_level: string;
  training_days: number;
  session_minutes: number;
  workout_location: string;
  available_equipment_json: string;
  dietary_preferences_json: string;
  allergies_json: string;
  medical_notes: string;
  sleep_hours: number;
  stress_level: number;
  timezone: string;
}

function parseStringArray(value: string) {
  try {
    const parsed = JSON.parse(value) as unknown;
    return Array.isArray(parsed) ? parsed.filter((item): item is string => typeof item === 'string') : [];
  } catch {
    return [];
  }
}

function mapRow(row: ProfileRow): Profile {
  return ProfileSchema.parse({
    name: row.name,
    locale: row.locale,
    goal: row.goal,
    gender: row.gender,
    age: row.age,
    heightCm: row.height_cm,
    weightKg: row.weight_kg,
    fitnessLevel: row.fitness_level,
    activityLevel: row.activity_level,
    trainingDays: row.training_days,
    sessionMinutes: row.session_minutes,
    workoutLocation: row.workout_location,
    availableEquipment: parseStringArray(row.available_equipment_json),
    dietaryPreferences: parseStringArray(row.dietary_preferences_json),
    allergies: parseStringArray(row.allergies_json),
    medicalNotes: row.medical_notes,
    sleepHours: row.sleep_hours,
    stressLevel: row.stress_level,
    timezone: row.timezone,
  });
}

export async function getProfile() {
  const database = await getDatabase();
  const row = await database.getFirstAsync<ProfileRow>('SELECT * FROM profile WHERE id = 1;');
  return row ? mapRow(row) : null;
}

export async function saveProfile(input: Profile) {
  const profile = ProfileSchema.parse(input);
  const database = await getDatabase();
  const now = new Date().toISOString();

  await database.runAsync(
    `INSERT INTO profile (
      id, name, locale, goal, gender, age, height_cm, weight_kg,
      fitness_level, activity_level, training_days, session_minutes,
      workout_location, available_equipment_json, dietary_preferences_json,
      allergies_json, medical_notes, sleep_hours, stress_level, timezone,
      created_at, updated_at
    ) VALUES (
      1, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?
    )
    ON CONFLICT(id) DO UPDATE SET
      name = excluded.name,
      locale = excluded.locale,
      goal = excluded.goal,
      gender = excluded.gender,
      age = excluded.age,
      height_cm = excluded.height_cm,
      weight_kg = excluded.weight_kg,
      fitness_level = excluded.fitness_level,
      activity_level = excluded.activity_level,
      training_days = excluded.training_days,
      session_minutes = excluded.session_minutes,
      workout_location = excluded.workout_location,
      available_equipment_json = excluded.available_equipment_json,
      dietary_preferences_json = excluded.dietary_preferences_json,
      allergies_json = excluded.allergies_json,
      medical_notes = excluded.medical_notes,
      sleep_hours = excluded.sleep_hours,
      stress_level = excluded.stress_level,
      timezone = excluded.timezone,
      updated_at = excluded.updated_at;`,
    profile.name,
    profile.locale,
    profile.goal,
    profile.gender,
    profile.age,
    profile.heightCm,
    profile.weightKg,
    profile.fitnessLevel,
    profile.activityLevel,
    profile.trainingDays,
    profile.sessionMinutes,
    profile.workoutLocation,
    JSON.stringify(profile.availableEquipment),
    JSON.stringify(profile.dietaryPreferences),
    JSON.stringify(profile.allergies),
    profile.medicalNotes,
    profile.sleepHours,
    profile.stressLevel,
    profile.timezone,
    now,
    now,
  );

  return profile;
}

export async function deleteProfile() {
  const database = await getDatabase();
  await database.runAsync('DELETE FROM profile WHERE id = 1;');
}
