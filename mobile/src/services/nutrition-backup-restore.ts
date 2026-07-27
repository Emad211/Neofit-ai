import { z } from 'zod';
import { getDatabase } from '@/db/database';
import {
  FavoriteFoodSchema,
  MAX_NUTRITION_FAVORITES,
  NUTRITION_FAVORITES_SETTING_KEY,
  listFavoriteFoods,
  type FavoriteFood,
} from '@/db/nutrition-favorite-repository';
import {
  listNutritionRecipes,
  type PersistedRecipe,
} from '@/db/nutrition-recipe-repository';
import { IFKB_CATALOG_RELEASE } from '@/nutrition-core';

const MAX_BACKUP_BYTES = 20_000_000;
const IsoTimestampSchema = z.string().datetime();
const LocalDateSchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);
const NonNegativeFiniteSchema = z.number().finite().nonnegative();
const PositiveFiniteSchema = z.number().finite().positive();

const NutritionVectorSchema = z.object({
  energyKcal: NonNegativeFiniteSchema.optional(),
  proteinG: NonNegativeFiniteSchema.optional(),
  carbsG: NonNegativeFiniteSchema.optional(),
  fatG: NonNegativeFiniteSchema.optional(),
  fiberG: NonNegativeFiniteSchema.optional(),
  sugarsG: NonNegativeFiniteSchema.optional(),
  sodiumMg: NonNegativeFiniteSchema.optional(),
  cholesterolMg: NonNegativeFiniteSchema.optional(),
  calciumMg: NonNegativeFiniteSchema.optional(),
  ironMg: NonNegativeFiniteSchema.optional(),
  potassiumMg: NonNegativeFiniteSchema.optional(),
  vitaminCMg: NonNegativeFiniteSchema.optional(),
}).strict();

const NutritionRangeSchema = z.object({
  p10: NutritionVectorSchema,
  p50: NutritionVectorSchema,
  p90: NutritionVectorSchema,
}).strict();

const DiaryEntrySchema = z.object({
  id: z.string().trim().min(1).max(240),
  localDate: LocalDateSchema,
  mealType: z.enum(['breakfast', 'lunch', 'dinner', 'snack']),
  label: z.string().trim().min(1).max(500),
  sourceType: z.enum(['food', 'recipe', 'custom']),
  sourceId: z.string().trim().min(1).max(500),
  estimate: z.object({
    grams: NonNegativeFiniteSchema.nullable(),
    center: NutritionVectorSchema,
    range: NutritionRangeSchema.optional(),
  }).strict(),
  createdAt: IsoTimestampSchema,
  updatedAt: IsoTimestampSchema,
}).strict();

const RecipeIngredientSchema = z.object({
  id: z.string().trim().min(1).max(240),
  sourceType: z.enum(['food', 'custom', 'recipe']),
  sourceId: z.string().trim().min(1).max(500),
  grams: NonNegativeFiniteSchema.nullable(),
  basisMultiplier: PositiveFiniteSchema.nullable(),
  consumedFraction: z.number().finite().min(0).max(1),
  sortOrder: z.number().int().min(0).max(100_000),
}).strict().superRefine((value, context) => {
  if (value.grams === null && value.basisMultiplier === null) {
    context.addIssue({
      code: 'custom',
      message: 'Recipe ingredient requires grams or basisMultiplier.',
    });
  }
});

const RecipeSchema = z.object({
  id: z.string().trim().min(1).max(240),
  name: z.string().trim().min(1).max(500),
  servingCount: PositiveFiniteSchema,
  cookedYieldGrams: PositiveFiniteSchema.nullable(),
  ingredients: z.array(RecipeIngredientSchema).min(1).max(2_000),
  createdAt: IsoTimestampSchema,
  updatedAt: IsoTimestampSchema,
}).strict();

const NutritionGoalSchema = z.object({
  id: z.string().trim().min(1).max(240),
  activeFrom: LocalDateSchema,
  goals: z.object({ daily: NutritionVectorSchema }).strict(),
  createdAt: IsoTimestampSchema,
  updatedAt: IsoTimestampSchema,
}).strict();

const CatalogReferenceSchema = z.object({
  format: z.literal('ifkb-mobile-catalog-release'),
  version: z.string().min(1),
  databaseSha256: z.string().regex(/^[0-9a-f]{64}$/i),
}).passthrough();

const NutritionBackupSchema = z.object({
  format: z.literal('neofit-nutrition-backup'),
  schemaVersion: z.literal(1),
  exportedAt: IsoTimestampSchema,
  publicCatalogReference: CatalogReferenceSchema,
  personalData: z.object({
    diaryEntries: z.array(DiaryEntrySchema).max(50_000),
    recipes: z.array(RecipeSchema).max(1_000),
    goals: z.array(NutritionGoalSchema).max(10_000),
    favorites: z.array(FavoriteFoodSchema).max(MAX_NUTRITION_FAVORITES),
  }).strict(),
  exclusions: z.array(z.string().max(1_000)).max(20),
}).strict();

export type ParsedNutritionBackup = z.infer<typeof NutritionBackupSchema>;
export type NutritionBackupRestoreMode = 'merge' | 'replace';

export interface NutritionBackupRestoreSummary {
  readonly mode: NutritionBackupRestoreMode;
  readonly diaryEntries: number;
  readonly recipes: number;
  readonly goals: number;
  readonly favorites: number;
  readonly catalogCompatible: boolean;
  readonly warnings: readonly string[];
}

function assertUnique(values: readonly string[], label: string): void {
  const seen = new Set<string>();
  for (const value of values) {
    if (seen.has(value)) throw new Error(`Backup contains a duplicate ${label}: ${value}`);
    seen.add(value);
  }
}

function assertRecipeGraphAcyclic(recipes: readonly PersistedRecipe[]): void {
  const byId = new Map(recipes.map((recipe) => [recipe.id, recipe]));
  const visiting = new Set<string>();
  const visited = new Set<string>();

  const visit = (recipeId: string): void => {
    if (visited.has(recipeId)) return;
    if (visiting.has(recipeId)) throw new Error(`Backup would create a recipe cycle at ${recipeId}.`);
    const recipe = byId.get(recipeId);
    if (!recipe) return;
    visiting.add(recipeId);
    for (const ingredient of recipe.ingredients) {
      if (ingredient.sourceType === 'recipe' && byId.has(ingredient.sourceId)) visit(ingredient.sourceId);
    }
    visiting.delete(recipeId);
    visited.add(recipeId);
  };

  for (const recipe of recipes) visit(recipe.id);
}

function validateCrossRecordConstraints(backup: ParsedNutritionBackup): void {
  assertUnique(backup.personalData.diaryEntries.map((item) => item.id), 'Diary id');
  assertUnique(backup.personalData.recipes.map((item) => item.id), 'Recipe id');
  assertUnique(backup.personalData.goals.map((item) => item.id), 'Goal id');
  assertUnique(backup.personalData.favorites.map((item) => item.id), 'Favorite id');
  assertUnique(
    backup.personalData.recipes.flatMap((recipe) => recipe.ingredients.map((ingredient) => ingredient.id)),
    'Recipe ingredient id',
  );
}

export function parseNutritionBackupJson(text: string): ParsedNutritionBackup {
  if (new TextEncoder().encode(text).byteLength > MAX_BACKUP_BYTES) {
    throw new Error(`Nutrition backup exceeds ${Math.round(MAX_BACKUP_BYTES / 1_000_000)} MB.`);
  }
  let raw: unknown;
  try {
    raw = JSON.parse(text) as unknown;
  } catch {
    throw new Error('The selected file is not valid JSON.');
  }
  const parsed = NutritionBackupSchema.safeParse(raw);
  if (!parsed.success) {
    const issue = parsed.error.issues[0];
    const path = issue?.path.length ? issue.path.join('.') : 'backup';
    throw new Error(`Invalid nutrition backup at ${path}: ${issue?.message ?? 'validation failed'}`);
  }
  validateCrossRecordConstraints(parsed.data);
  return parsed.data;
}

function mergeFavorites(
  current: readonly FavoriteFood[],
  incoming: readonly FavoriteFood[],
): FavoriteFood[] {
  const merged = [...incoming, ...current.filter((item) => !incoming.some((candidate) => candidate.id === item.id))];
  return merged
    .sort((left, right) => right.savedAt.localeCompare(left.savedAt))
    .slice(0, MAX_NUTRITION_FAVORITES);
}

export async function restoreNutritionBackup(
  backup: ParsedNutritionBackup,
  mode: NutritionBackupRestoreMode,
): Promise<NutritionBackupRestoreSummary> {
  validateCrossRecordConstraints(backup);
  const [currentRecipes, currentFavorites] = await Promise.all([
    mode === 'merge' ? listNutritionRecipes(1_000) : Promise.resolve([]),
    mode === 'merge' ? listFavoriteFoods() : Promise.resolve([]),
  ]);
  const mergedRecipeMap = new Map<string, PersistedRecipe>(currentRecipes.map((recipe) => [recipe.id, recipe]));
  for (const recipe of backup.personalData.recipes) mergedRecipeMap.set(recipe.id, recipe);
  assertRecipeGraphAcyclic([...mergedRecipeMap.values()]);

  const favorites = mode === 'merge'
    ? mergeFavorites(currentFavorites, backup.personalData.favorites)
    : [...backup.personalData.favorites];
  const catalogCompatible = backup.publicCatalogReference.version === IFKB_CATALOG_RELEASE.version
    && backup.publicCatalogReference.databaseSha256.toLowerCase() === IFKB_CATALOG_RELEASE.databaseSha256;
  const warnings = catalogCompatible
    ? []
    : [`Backup references IFKB ${backup.publicCatalogReference.version}; this app uses ${IFKB_CATALOG_RELEASE.version}. Snapshot Diary nutrition is preserved, but old catalog source ids may not resolve.`];

  const database = await getDatabase();
  await database.withExclusiveTransactionAsync(async (transaction) => {
    if (mode === 'replace') {
      await transaction.runAsync('DELETE FROM nutrition_recipe_ingredients;');
      await transaction.runAsync('DELETE FROM nutrition_recipes;');
      await transaction.runAsync('DELETE FROM nutrition_diary_entries;');
      await transaction.runAsync('DELETE FROM nutrition_goals;');
    }

    for (const entry of backup.personalData.diaryEntries) {
      await transaction.runAsync(
        `INSERT INTO nutrition_diary_entries (
           id, local_date, meal_type, label, source_type, source_id, grams,
           nutrition_center_json, nutrition_range_json, created_at, updated_at
         ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
         ON CONFLICT(id) DO UPDATE SET
           local_date=excluded.local_date, meal_type=excluded.meal_type,
           label=excluded.label, source_type=excluded.source_type,
           source_id=excluded.source_id, grams=excluded.grams,
           nutrition_center_json=excluded.nutrition_center_json,
           nutrition_range_json=excluded.nutrition_range_json,
           updated_at=excluded.updated_at;`,
        entry.id,
        entry.localDate,
        entry.mealType,
        entry.label,
        entry.sourceType,
        entry.sourceId,
        entry.estimate.grams,
        JSON.stringify(entry.estimate.center),
        entry.estimate.range === undefined ? null : JSON.stringify(entry.estimate.range),
        entry.createdAt,
        entry.updatedAt,
      );
    }

    for (const recipe of backup.personalData.recipes) {
      await transaction.runAsync(
        `INSERT INTO nutrition_recipes (
           id, name, serving_count, cooked_yield_grams, created_at, updated_at
         ) VALUES (?, ?, ?, ?, ?, ?)
         ON CONFLICT(id) DO UPDATE SET
           name=excluded.name, serving_count=excluded.serving_count,
           cooked_yield_grams=excluded.cooked_yield_grams,
           updated_at=excluded.updated_at;`,
        recipe.id,
        recipe.name,
        recipe.servingCount,
        recipe.cookedYieldGrams,
        recipe.createdAt,
        recipe.updatedAt,
      );
      await transaction.runAsync('DELETE FROM nutrition_recipe_ingredients WHERE recipe_id=?;', recipe.id);
      for (const ingredient of recipe.ingredients) {
        await transaction.runAsync(
          `INSERT INTO nutrition_recipe_ingredients (
             id, recipe_id, source_type, source_id, grams, basis_multiplier,
             consumed_fraction, sort_order
           ) VALUES (?, ?, ?, ?, ?, ?, ?, ?);`,
          ingredient.id,
          recipe.id,
          ingredient.sourceType,
          ingredient.sourceId,
          ingredient.grams,
          ingredient.basisMultiplier,
          ingredient.consumedFraction,
          ingredient.sortOrder,
        );
      }
    }

    for (const goal of backup.personalData.goals) {
      await transaction.runAsync(
        `INSERT INTO nutrition_goals (
           id, active_from, daily_goals_json, created_at, updated_at
         ) VALUES (?, ?, ?, ?, ?)
         ON CONFLICT(id) DO UPDATE SET
           active_from=excluded.active_from,
           daily_goals_json=excluded.daily_goals_json,
           updated_at=excluded.updated_at;`,
        goal.id,
        goal.activeFrom,
        JSON.stringify(goal.goals.daily),
        goal.createdAt,
        goal.updatedAt,
      );
    }

    await transaction.runAsync(
      `INSERT INTO app_settings (key, value, updated_at)
       VALUES (?, ?, ?)
       ON CONFLICT(key) DO UPDATE SET value=excluded.value, updated_at=excluded.updated_at;`,
      NUTRITION_FAVORITES_SETTING_KEY,
      JSON.stringify(favorites),
      new Date().toISOString(),
    );
  });

  return {
    mode,
    diaryEntries: backup.personalData.diaryEntries.length,
    recipes: backup.personalData.recipes.length,
    goals: backup.personalData.goals.length,
    favorites: favorites.length,
    catalogCompatible,
    warnings,
  };
}

export async function restoreNutritionBackupJson(
  text: string,
  mode: NutritionBackupRestoreMode,
): Promise<NutritionBackupRestoreSummary> {
  return restoreNutritionBackup(parseNutritionBackupJson(text), mode);
}
