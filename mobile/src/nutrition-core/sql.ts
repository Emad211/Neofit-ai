export const NUTRITION_CORE_SCHEMA_VERSION = 1;

/**
 * First production schema for the canonical nutrition engine. It supports both
 * per-100-g sources and serving-based Iranian mixed dishes whose serving weight
 * may legitimately be unknown.
 */
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
  nutrient_basis TEXT NOT NULL CHECK (nutrient_basis IN ('per_100g', 'per_serving')),
  basis_grams REAL CHECK (basis_grams IS NULL OR basis_grams > 0),
  nutrients_per_basis_json TEXT NOT NULL,
  nutrient_range_per_basis_json TEXT,
  evidence_tier TEXT NOT NULL CHECK (
    evidence_tier IN ('verified_source','digital_consensus','legacy_estimate','broad_fallback','user_entered')
  ),
  source_record_id TEXT,
  source_dataset TEXT,
  source_version TEXT,
  is_default INTEGER NOT NULL DEFAULT 0 CHECK (is_default IN (0, 1)),
  CHECK (
    (nutrient_basis = 'per_100g' AND basis_grams IS NOT NULL AND basis_grams = 100)
    OR nutrient_basis = 'per_serving'
  )
);
CREATE INDEX IF NOT EXISTS nutrition_variants_concept_idx
  ON nutrition_food_variants(concept_id);
CREATE INDEX IF NOT EXISTS nutrition_variants_source_idx
  ON nutrition_food_variants(source_dataset, source_record_id);

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
  gram_weight REAL CHECK (gram_weight IS NULL OR gram_weight > 0),
  basis_multiplier REAL NOT NULL DEFAULT 1 CHECK (basis_multiplier > 0)
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
  tokenize = 'unicode61 remove_diacritics 2'
);

CREATE TABLE IF NOT EXISTS nutrition_diary_entries (
  id TEXT PRIMARY KEY NOT NULL,
  local_date TEXT NOT NULL,
  meal_type TEXT NOT NULL CHECK (meal_type IN ('breakfast','lunch','dinner','snack')),
  label TEXT NOT NULL,
  source_type TEXT NOT NULL CHECK (source_type IN ('food','recipe','custom')),
  source_id TEXT NOT NULL,
  grams REAL CHECK (grams IS NULL OR grams >= 0),
  nutrition_center_json TEXT NOT NULL,
  nutrition_range_json TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS nutrition_diary_date_meal_idx
  ON nutrition_diary_entries(local_date, meal_type, created_at);

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
  grams REAL CHECK (grams IS NULL OR grams >= 0),
  basis_multiplier REAL CHECK (basis_multiplier IS NULL OR basis_multiplier > 0),
  consumed_fraction REAL NOT NULL DEFAULT 1 CHECK (consumed_fraction >= 0 AND consumed_fraction <= 1),
  sort_order INTEGER NOT NULL,
  CHECK (grams IS NOT NULL OR basis_multiplier IS NOT NULL)
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
CREATE INDEX IF NOT EXISTS nutrition_goals_active_from_idx
  ON nutrition_goals(active_from DESC);

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
