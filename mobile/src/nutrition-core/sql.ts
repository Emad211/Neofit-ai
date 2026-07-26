export const NUTRITION_CORE_SCHEMA_VERSION = 1;

export const NUTRITION_CORE_MIGRATION_V1 = `
PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS nutrition_food_concepts (
  id TEXT PRIMARY KEY NOT NULL,
  name_fa TEXT NOT NULL,
  name_en TEXT NOT NULL,
  category TEXT NOT NULL,
  region TEXT,
  default_variant_id TEXT NOT NULL,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS nutrition_food_variants (
  id TEXT PRIMARY KEY NOT NULL,
  concept_id TEXT NOT NULL REFERENCES nutrition_food_concepts(id) ON DELETE CASCADE,
  name_fa TEXT NOT NULL,
  name_en TEXT NOT NULL,
  preparation_tags_json TEXT NOT NULL,
  nutrients_per_100g_json TEXT NOT NULL,
  nutrient_range_per_100g_json TEXT,
  evidence_tier TEXT NOT NULL,
  source_record_id TEXT,
  is_default INTEGER NOT NULL DEFAULT 0 CHECK (is_default IN (0, 1))
);
CREATE INDEX IF NOT EXISTS nutrition_variants_concept_idx
  ON nutrition_food_variants(concept_id);

CREATE TABLE IF NOT EXISTS nutrition_food_aliases (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  concept_id TEXT NOT NULL REFERENCES nutrition_food_concepts(id) ON DELETE CASCADE,
  locale TEXT NOT NULL CHECK (locale IN ('fa', 'en')),
  alias_normalized TEXT NOT NULL,
  alias_display TEXT NOT NULL,
  UNIQUE(concept_id, locale, alias_normalized)
);
CREATE INDEX IF NOT EXISTS nutrition_alias_normalized_idx
  ON nutrition_food_aliases(alias_normalized);

CREATE TABLE IF NOT EXISTS nutrition_portions (
  id TEXT PRIMARY KEY NOT NULL,
  variant_id TEXT NOT NULL REFERENCES nutrition_food_variants(id) ON DELETE CASCADE,
  label_fa TEXT NOT NULL,
  label_en TEXT NOT NULL,
  gram_weight REAL NOT NULL CHECK (gram_weight > 0)
);
CREATE INDEX IF NOT EXISTS nutrition_portions_variant_idx
  ON nutrition_portions(variant_id);

CREATE VIRTUAL TABLE IF NOT EXISTS nutrition_search_fts USING fts5(
  concept_id UNINDEXED,
  variant_id UNINDEXED,
  name_fa,
  name_en,
  aliases,
  preparation_tags,
  tokenize = 'unicode61'
);

CREATE TABLE IF NOT EXISTS nutrition_diary_entries (
  id TEXT PRIMARY KEY NOT NULL,
  local_date TEXT NOT NULL,
  meal_type TEXT NOT NULL CHECK (meal_type IN ('breakfast','lunch','dinner','snack')),
  label TEXT NOT NULL,
  source_type TEXT NOT NULL CHECK (source_type IN ('food','recipe','custom')),
  source_id TEXT NOT NULL,
  grams REAL NOT NULL CHECK (grams >= 0),
  nutrition_center_json TEXT NOT NULL,
  nutrition_range_json TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS nutrition_diary_date_meal_idx
  ON nutrition_diary_entries(local_date, meal_type);

CREATE TABLE IF NOT EXISTS nutrition_recipes (
  id TEXT PRIMARY KEY NOT NULL,
  name TEXT NOT NULL,
  serving_count REAL NOT NULL CHECK (serving_count > 0),
  cooked_yield_grams REAL CHECK (cooked_yield_grams > 0),
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS nutrition_recipe_ingredients (
  id TEXT PRIMARY KEY NOT NULL,
  recipe_id TEXT NOT NULL REFERENCES nutrition_recipes(id) ON DELETE CASCADE,
  source_type TEXT NOT NULL CHECK (source_type IN ('food','custom','recipe')),
  source_id TEXT NOT NULL,
  grams REAL NOT NULL CHECK (grams >= 0),
  consumed_fraction REAL NOT NULL DEFAULT 1 CHECK (consumed_fraction >= 0 AND consumed_fraction <= 1),
  sort_order INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS nutrition_recipe_ingredients_recipe_idx
  ON nutrition_recipe_ingredients(recipe_id, sort_order);

CREATE TABLE IF NOT EXISTS nutrition_goals (
  id TEXT PRIMARY KEY NOT NULL,
  active_from TEXT NOT NULL,
  daily_goals_json TEXT NOT NULL,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS nutrition_vision_cache (
  fingerprint TEXT PRIMARY KEY NOT NULL,
  provider_key TEXT NOT NULL,
  model_key TEXT NOT NULL,
  response_json TEXT NOT NULL,
  created_at TEXT NOT NULL,
  expires_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS nutrition_vision_cache_expiry_idx
  ON nutrition_vision_cache(expires_at);
`;
