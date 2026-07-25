export type Migration = {
  version: number;
  name: string;
  sql: string;
};

export const migrations: Migration[] = [
  {
    version: 1,
    name: 'initial-local-first-schema',
    sql: `
      CREATE TABLE IF NOT EXISTS app_settings (
        key TEXT PRIMARY KEY NOT NULL,
        value TEXT NOT NULL,
        updated_at TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS profile (
        id INTEGER PRIMARY KEY NOT NULL CHECK (id = 1),
        name TEXT NOT NULL,
        locale TEXT NOT NULL CHECK (locale IN ('fa', 'en')),
        goal TEXT NOT NULL CHECK (goal IN ('lose_weight', 'gain_muscle', 'improve_fitness')),
        gender TEXT NOT NULL CHECK (gender IN ('male', 'female', 'other')),
        age INTEGER NOT NULL CHECK (age BETWEEN 16 AND 100),
        height_cm REAL NOT NULL CHECK (height_cm BETWEEN 100 AND 250),
        weight_kg REAL NOT NULL CHECK (weight_kg BETWEEN 30 AND 300),
        fitness_level TEXT NOT NULL CHECK (fitness_level IN ('beginner', 'intermediate', 'advanced')),
        activity_level TEXT NOT NULL CHECK (activity_level IN ('sedentary', 'lightly_active', 'moderately_active', 'very_active')),
        training_days INTEGER NOT NULL CHECK (training_days BETWEEN 2 AND 7),
        session_minutes INTEGER NOT NULL CHECK (session_minutes BETWEEN 15 AND 180),
        workout_location TEXT NOT NULL CHECK (workout_location IN ('home', 'gym', 'outdoor')),
        available_equipment_json TEXT NOT NULL,
        dietary_preferences_json TEXT NOT NULL,
        allergies_json TEXT NOT NULL,
        medical_notes TEXT NOT NULL,
        sleep_hours REAL NOT NULL CHECK (sleep_hours BETWEEN 0 AND 24),
        stress_level INTEGER NOT NULL CHECK (stress_level BETWEEN 1 AND 10),
        timezone TEXT NOT NULL,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS plans (
        id TEXT PRIMARY KEY NOT NULL,
        kind TEXT NOT NULL CHECK (kind IN ('workout', 'nutrition')),
        title TEXT NOT NULL,
        summary TEXT NOT NULL,
        payload_json TEXT NOT NULL,
        source TEXT NOT NULL CHECK (source IN ('ai', 'manual', 'imported')),
        is_active INTEGER NOT NULL DEFAULT 1 CHECK (is_active IN (0, 1)),
        created_at TEXT NOT NULL
      );

      CREATE INDEX IF NOT EXISTS idx_plans_kind_active
      ON plans(kind, is_active, created_at DESC);

      CREATE TABLE IF NOT EXISTS meal_logs (
        id TEXT PRIMARY KEY NOT NULL,
        eaten_at TEXT NOT NULL,
        meal_type TEXT NOT NULL CHECK (meal_type IN ('breakfast', 'lunch', 'dinner', 'snack')),
        description TEXT NOT NULL,
        calories INTEGER NOT NULL CHECK (calories >= 0),
        protein_g REAL NOT NULL CHECK (protein_g >= 0),
        carbs_g REAL NOT NULL CHECK (carbs_g >= 0),
        fat_g REAL NOT NULL CHECK (fat_g >= 0),
        source TEXT NOT NULL CHECK (source IN ('manual', 'plan', 'ai_photo', 'ai_text')),
        created_at TEXT NOT NULL
      );

      CREATE INDEX IF NOT EXISTS idx_meal_logs_eaten_at
      ON meal_logs(eaten_at DESC);

      CREATE TABLE IF NOT EXISTS activity_logs (
        id TEXT PRIMARY KEY NOT NULL,
        started_at TEXT NOT NULL,
        activity_type TEXT NOT NULL,
        duration_minutes INTEGER NOT NULL CHECK (duration_minutes > 0),
        intensity TEXT NOT NULL CHECK (intensity IN ('low', 'medium', 'high')),
        calories_burned INTEGER NOT NULL CHECK (calories_burned >= 0),
        source TEXT NOT NULL CHECK (source IN ('manual', 'met')),
        created_at TEXT NOT NULL
      );

      CREATE INDEX IF NOT EXISTS idx_activity_logs_started_at
      ON activity_logs(started_at DESC);

      CREATE TABLE IF NOT EXISTS weight_logs (
        id TEXT PRIMARY KEY NOT NULL,
        measured_at TEXT NOT NULL,
        weight_kg REAL NOT NULL CHECK (weight_kg BETWEEN 20 AND 500),
        created_at TEXT NOT NULL
      );

      CREATE INDEX IF NOT EXISTS idx_weight_logs_measured_at
      ON weight_logs(measured_at DESC);

      CREATE TABLE IF NOT EXISTS workout_sessions (
        id TEXT PRIMARY KEY NOT NULL,
        workout_plan_id TEXT,
        workout_title TEXT NOT NULL,
        started_at TEXT NOT NULL,
        completed_at TEXT NOT NULL,
        duration_minutes INTEGER NOT NULL CHECK (duration_minutes >= 0),
        total_volume_kg REAL NOT NULL CHECK (total_volume_kg >= 0),
        created_at TEXT NOT NULL
      );

      CREATE INDEX IF NOT EXISTS idx_workout_sessions_completed_at
      ON workout_sessions(completed_at DESC);

      CREATE TABLE IF NOT EXISTS workout_set_logs (
        id TEXT PRIMARY KEY NOT NULL,
        session_id TEXT NOT NULL,
        exercise_order INTEGER NOT NULL CHECK (exercise_order >= 0),
        exercise_name TEXT NOT NULL,
        set_number INTEGER NOT NULL CHECK (set_number > 0),
        reps INTEGER NOT NULL CHECK (reps > 0),
        weight_kg REAL NOT NULL CHECK (weight_kg >= 0),
        FOREIGN KEY (session_id) REFERENCES workout_sessions(id) ON DELETE CASCADE
      );

      CREATE INDEX IF NOT EXISTS idx_workout_set_logs_session
      ON workout_set_logs(session_id, exercise_order, set_number);

      CREATE TABLE IF NOT EXISTS ai_requests (
        id TEXT PRIMARY KEY NOT NULL,
        kind TEXT NOT NULL,
        model TEXT NOT NULL,
        request_id TEXT,
        status TEXT NOT NULL CHECK (status IN ('success', 'failed')),
        duration_ms INTEGER NOT NULL CHECK (duration_ms >= 0),
        error_code TEXT,
        created_at TEXT NOT NULL
      );

      CREATE INDEX IF NOT EXISTS idx_ai_requests_created_at
      ON ai_requests(created_at DESC);

      CREATE TABLE IF NOT EXISTS ai_cache (
        cache_key TEXT PRIMARY KEY NOT NULL,
        kind TEXT NOT NULL,
        response_json TEXT NOT NULL,
        expires_at TEXT NOT NULL,
        created_at TEXT NOT NULL
      );

      CREATE INDEX IF NOT EXISTS idx_ai_cache_expires_at
      ON ai_cache(expires_at);
    `,
  },
];
