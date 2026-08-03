import { getDatabase } from '@/db/database';
import {
  NUTRITION_FAVORITES_SETTING_KEY,
  listFavoriteFoods,
} from '@/db/nutrition-favorite-repository';
import { listNutritionRecipes } from '@/db/nutrition-recipe-repository';
import {
  IFKB_CATALOG_RELEASE,
  assertNutritionRecipeGraphAcyclic,
  isNutritionBackupCatalogCompatible,
  mergeNutritionBackupFavorites,
  parseNutritionBackupJson,
  validateNutritionBackupCrossRecords,
  type NutritionBackupRestoreMode,
  type ParsedNutritionBackup,
} from '@/nutrition-core';

export { parseNutritionBackupJson };
export type { NutritionBackupRestoreMode, ParsedNutritionBackup };

export interface NutritionBackupRestoreSummary {
  readonly mode: NutritionBackupRestoreMode;
  readonly diaryEntries: number;
  readonly recipes: number;
  readonly goals: number;
  readonly favorites: number;
  readonly catalogCompatible: boolean;
  readonly warnings: readonly string[];
}

export async function restoreNutritionBackup(
  backup: ParsedNutritionBackup,
  mode: NutritionBackupRestoreMode,
): Promise<NutritionBackupRestoreSummary> {
  validateNutritionBackupCrossRecords(backup);
  const [currentRecipes, currentFavorites] = await Promise.all([
    mode === 'merge' ? listNutritionRecipes(1_000) : Promise.resolve([]),
    mode === 'merge' ? listFavoriteFoods() : Promise.resolve([]),
  ]);
  const mergedRecipeMap = new Map(currentRecipes.map((recipe) => [recipe.id, recipe]));
  for (const recipe of backup.personalData.recipes) mergedRecipeMap.set(recipe.id, recipe);
  assertNutritionRecipeGraphAcyclic([...mergedRecipeMap.values()]);

  const favorites = mode === 'merge'
    ? mergeNutritionBackupFavorites(currentFavorites, backup.personalData.favorites)
    : [...backup.personalData.favorites];
  const catalogCompatible = isNutritionBackupCatalogCompatible(backup);
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
