import { getDatabase } from '@/db/database';

export interface PersistedRecipeIngredient {
  readonly id: string;
  readonly sourceType: 'food' | 'custom' | 'recipe';
  readonly sourceId: string;
  readonly grams: number | null;
  readonly basisMultiplier: number | null;
  readonly consumedFraction: number;
  readonly sortOrder: number;
}

export interface PersistedRecipe {
  readonly id: string;
  readonly name: string;
  readonly servingCount: number;
  readonly cookedYieldGrams: number | null;
  readonly ingredients: readonly PersistedRecipeIngredient[];
  readonly createdAt: string;
  readonly updatedAt: string;
}

interface RecipeRow {
  id: string;
  name: string;
  serving_count: number;
  cooked_yield_grams: number | null;
  created_at: string;
  updated_at: string;
}

interface IngredientRow {
  id: string;
  recipe_id: string;
  source_type: PersistedRecipeIngredient['sourceType'];
  source_id: string;
  grams: number | null;
  basis_multiplier: number | null;
  consumed_fraction: number;
  sort_order: number;
}

function validateRecipe(recipe: PersistedRecipe): void {
  if (!recipe.id.trim() || !recipe.name.trim()) throw new Error('Recipe id and name are required');
  if (!Number.isFinite(recipe.servingCount) || recipe.servingCount <= 0) {
    throw new RangeError('Recipe servingCount must be positive');
  }
  if (recipe.cookedYieldGrams !== null && (!Number.isFinite(recipe.cookedYieldGrams) || recipe.cookedYieldGrams <= 0)) {
    throw new RangeError('Recipe cookedYieldGrams must be positive when present');
  }
  if (recipe.ingredients.length === 0) throw new Error('Recipe requires at least one ingredient');
  for (const ingredient of recipe.ingredients) {
    if (ingredient.grams === null && ingredient.basisMultiplier === null) {
      throw new Error('Recipe ingredient requires grams or basisMultiplier');
    }
    if (ingredient.grams !== null && (!Number.isFinite(ingredient.grams) || ingredient.grams < 0)) {
      throw new RangeError('Ingredient grams must be non-negative');
    }
    if (ingredient.basisMultiplier !== null && (!Number.isFinite(ingredient.basisMultiplier) || ingredient.basisMultiplier <= 0)) {
      throw new RangeError('Ingredient basisMultiplier must be positive');
    }
    if (!Number.isFinite(ingredient.consumedFraction) || ingredient.consumedFraction < 0 || ingredient.consumedFraction > 1) {
      throw new RangeError('Ingredient consumedFraction must be between 0 and 1');
    }
  }
}

export async function saveNutritionRecipe(recipe: PersistedRecipe): Promise<void> {
  validateRecipe(recipe);
  const database = await getDatabase();
  await database.withExclusiveTransactionAsync(async (transaction) => {
    await transaction.runAsync(
      `INSERT INTO nutrition_recipes (
         id, name, serving_count, cooked_yield_grams, created_at, updated_at
       ) VALUES (?, ?, ?, ?, ?, ?)
       ON CONFLICT(id) DO UPDATE SET
         name = excluded.name,
         serving_count = excluded.serving_count,
         cooked_yield_grams = excluded.cooked_yield_grams,
         updated_at = excluded.updated_at;`,
      recipe.id,
      recipe.name.trim(),
      recipe.servingCount,
      recipe.cookedYieldGrams,
      recipe.createdAt,
      recipe.updatedAt,
    );
    await transaction.runAsync(
      'DELETE FROM nutrition_recipe_ingredients WHERE recipe_id = ?;',
      recipe.id,
    );
    for (const ingredient of [...recipe.ingredients].sort((left, right) => left.sortOrder - right.sortOrder)) {
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
  });
}

async function ingredientsForRecipe(recipeId: string): Promise<PersistedRecipeIngredient[]> {
  const database = await getDatabase();
  const rows = await database.getAllAsync<IngredientRow>(
    `SELECT * FROM nutrition_recipe_ingredients
     WHERE recipe_id = ? ORDER BY sort_order, id;`,
    recipeId,
  );
  return rows.map((row) => ({
    id: row.id,
    sourceType: row.source_type,
    sourceId: row.source_id,
    grams: row.grams,
    basisMultiplier: row.basis_multiplier,
    consumedFraction: row.consumed_fraction,
    sortOrder: row.sort_order,
  }));
}

function mapRecipe(row: RecipeRow, ingredients: readonly PersistedRecipeIngredient[]): PersistedRecipe {
  return {
    id: row.id,
    name: row.name,
    servingCount: row.serving_count,
    cookedYieldGrams: row.cooked_yield_grams,
    ingredients,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export async function getNutritionRecipe(id: string): Promise<PersistedRecipe | null> {
  const database = await getDatabase();
  const row = await database.getFirstAsync<RecipeRow>(
    'SELECT * FROM nutrition_recipes WHERE id = ?;',
    id,
  );
  if (!row) return null;
  return mapRecipe(row, await ingredientsForRecipe(id));
}

export async function listNutritionRecipes(limit = 200): Promise<PersistedRecipe[]> {
  const database = await getDatabase();
  const safeLimit = Math.min(1_000, Math.max(1, Math.round(limit)));
  const rows = await database.getAllAsync<RecipeRow>(
    'SELECT * FROM nutrition_recipes ORDER BY updated_at DESC LIMIT ?;',
    safeLimit,
  );
  return Promise.all(rows.map(async (row) => mapRecipe(row, await ingredientsForRecipe(row.id))));
}

export async function deleteNutritionRecipe(id: string): Promise<boolean> {
  const database = await getDatabase();
  const result = await database.runAsync('DELETE FROM nutrition_recipes WHERE id = ?;', id);
  return result.changes > 0;
}
