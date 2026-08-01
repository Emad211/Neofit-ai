import type * as SQLite from 'expo-sqlite';
import { IRANIAN_ARCHETYPE_FALLBACK_SEED } from '@/data/iranian-fallback-archetypes';
import {
  IRANIAN_STAGE6_GENERIC_ANALOG_COUNT,
  IRANIAN_STAGE6_GENERIC_ANALOG_SEED,
} from '@/data/iranian-generic-analog-overrides.generated';
import { getDatabase } from '@/db/database';
import * as baseRepository from '@/db/food-repository-impl';
import { seedNutritionCoreFromFoodCatalog } from '@/db/nutrition-catalog-seed';
import type { FoodCatalogItem } from '@/domain/models';
import type { EvidenceTier } from '@/nutrition-core';

async function updateSeededFoods(
  database: SQLite.SQLiteDatabase,
  items: readonly FoodCatalogItem[],
): Promise<number> {
  let updated = 0;
  await database.withExclusiveTransactionAsync(async (transaction) => {
    for (const item of items) {
      const result = await transaction.runAsync(
        `UPDATE food_catalog SET
          category = ?,
          portion_label_fa = ?,
          portion_label_en = ?,
          portion_grams = ?,
          calories = ?,
          protein_g = ?,
          carbs_g = ?,
          fat_g = ?,
          variability_pct = ?,
          confidence = ?,
          source_label = ?,
          notes_fa = ?,
          notes_en = ?,
          updated_at = ?
        WHERE id = ? AND source_type = 'seeded';`,
        item.category,
        item.portionLabelFa,
        item.portionLabelEn,
        item.portionGrams,
        item.calories,
        item.proteinG,
        item.carbsG,
        item.fatG,
        item.variabilityPct,
        item.confidence,
        item.sourceLabel,
        item.notesFa,
        item.notesEn,
        item.updatedAt,
        item.id,
      );
      updated += result.changes;
    }
  });
  return updated;
}

async function applyBuiltInNutritionFallbacks(
  database: SQLite.SQLiteDatabase,
): Promise<void> {
  const stage5Updated = await updateSeededFoods(
    database,
    IRANIAN_ARCHETYPE_FALLBACK_SEED,
  );
  if (stage5Updated !== IRANIAN_ARCHETYPE_FALLBACK_SEED.length) {
    throw new Error(
      `Stage 5 runtime expected ${IRANIAN_ARCHETYPE_FALLBACK_SEED.length} seeded fallbacks; updated ${stage5Updated}.`,
    );
  }

  const stage6Updated = await updateSeededFoods(
    database,
    IRANIAN_STAGE6_GENERIC_ANALOG_SEED,
  );
  if (stage6Updated !== IRANIAN_STAGE6_GENERIC_ANALOG_COUNT) {
    throw new Error(
      `Stage 6 runtime expected ${IRANIAN_STAGE6_GENERIC_ANALOG_COUNT} generic analogs; updated ${stage6Updated}.`,
    );
  }

  await seedNutritionCoreFromFoodCatalog(database);
}

export async function seedIranianFoodCatalog(
  database?: SQLite.SQLiteDatabase,
): Promise<void> {
  const db = database ?? await getDatabase();
  await baseRepository.seedIranianFoodCatalog(db);
  await applyBuiltInNutritionFallbacks(db);
}

export async function importFoodCatalogItems(input: {
  items: FoodCatalogItem[];
  sourceLabel: string;
  sourceVersion?: string | null;
  evidenceTier?: EvidenceTier;
  replacePreviousImports?: boolean;
}): Promise<number> {
  const count = await baseRepository.importFoodCatalogItems(input);
  const database = await getDatabase();
  await applyBuiltInNutritionFallbacks(database);
  return count;
}

export async function deleteImportedFoodCatalog(): Promise<number> {
  const count = await baseRepository.deleteImportedFoodCatalog();
  const database = await getDatabase();
  await applyBuiltInNutritionFallbacks(database);
  return count;
}

export {
  countFoodCatalog,
  deleteCustomFood,
  getFoodById,
  listAllFoodCatalog,
  listFoodCatalog,
  normalizeFoodSearch,
  saveCustomFood,
  scaleFood,
  searchFoodCatalog,
} from '@/db/food-repository-impl';

export type { FoodCatalogRecord } from '@/db/food-repository-impl';
