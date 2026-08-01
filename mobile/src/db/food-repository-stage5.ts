import type * as SQLite from 'expo-sqlite';
import { IRANIAN_ARCHETYPE_FALLBACK_SEED } from '@/data/iranian-fallback-archetypes';
import { getDatabase } from '@/db/database';
import * as baseRepository from '@/db/food-repository-impl';
import { seedNutritionCoreFromFoodCatalog } from '@/db/nutrition-catalog-seed';
import type { EvidenceTier } from '@/nutrition-core';
import type { FoodCatalogItem } from '@/domain/models';

async function applyStage5Fallbacks(database: SQLite.SQLiteDatabase): Promise<number> {
  let updated = 0;
  await database.withExclusiveTransactionAsync(async (transaction) => {
    for (const item of IRANIAN_ARCHETYPE_FALLBACK_SEED) {
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
  await seedNutritionCoreFromFoodCatalog(database);
  return updated;
}

export async function seedIranianFoodCatalog(
  database?: SQLite.SQLiteDatabase,
): Promise<void> {
  const db = database ?? await getDatabase();
  await baseRepository.seedIranianFoodCatalog(db);
  const updated = await applyStage5Fallbacks(db);
  if (updated !== IRANIAN_ARCHETYPE_FALLBACK_SEED.length) {
    throw new Error(
      `Stage 5 runtime expected ${IRANIAN_ARCHETYPE_FALLBACK_SEED.length} seeded fallbacks; updated ${updated}.`,
    );
  }
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
  await applyStage5Fallbacks(database);
  return count;
}

export async function deleteImportedFoodCatalog(): Promise<number> {
  const count = await baseRepository.deleteImportedFoodCatalog();
  const database = await getDatabase();
  await applyStage5Fallbacks(database);
  return count;
}
