import { getDatabase } from '@/db/database';
import { importFoodCatalogItems } from '@/db/food-repository';
import { seedNutritionCoreFromFoodCatalog } from '@/db/nutrition-catalog-seed';
import {
  parseFoodProfilePromotionJson,
  type FoodProfilePromotionBundle,
} from '@/domain/food-profile-promotion';
import type { FoodCatalogItem } from '@/domain/models';

export interface FoodProfilePromotionSummary {
  readonly sourceLabel: string;
  readonly sourceVersion: string;
  readonly evidenceTier: FoodProfilePromotionBundle['source']['evidenceTier'];
  readonly promotedCount: number;
  readonly promotedIds: readonly string[];
  readonly canonicalConceptCount: number;
}

export async function applyFoodProfilePromotionBundle(
  bundle: FoodProfilePromotionBundle,
): Promise<FoodProfilePromotionSummary> {
  const now = new Date().toISOString();
  const items: FoodCatalogItem[] = bundle.records.map((record) => ({
    ...record.food,
    sourceType: 'imported',
    sourceLabel: bundle.source.label,
    updatedAt: now,
  }));

  await importFoodCatalogItems({
    items,
    sourceLabel: bundle.source.label,
    sourceVersion: bundle.source.version,
    evidenceTier: bundle.source.evidenceTier,
    replacePreviousImports: false,
  });

  const database = await getDatabase();
  await database.withExclusiveTransactionAsync(async (transaction) => {
    for (const record of bundle.records) {
      const result = await transaction.runAsync(
        `UPDATE food_catalog
         SET source_record_id = ?, source_version = ?
         WHERE id = ?
           AND source_type = 'imported'
           AND source_label = ?
           AND evidence_tier = ?;`,
        record.sourceRecordId,
        bundle.source.version,
        record.food.id,
        bundle.source.label,
        bundle.source.evidenceTier,
      );
      if (result.changes !== 1) {
        throw new Error(`Promoted food ${record.food.id} was not persisted with the expected provenance.`);
      }
    }
  });

  const canonicalConceptCount = await seedNutritionCoreFromFoodCatalog(database);
  const promotedIds = bundle.records.map((record) => record.food.id);
  return {
    sourceLabel: bundle.source.label,
    sourceVersion: bundle.source.version,
    evidenceTier: bundle.source.evidenceTier,
    promotedCount: promotedIds.length,
    promotedIds,
    canonicalConceptCount,
  };
}

export async function applyFoodProfilePromotionJson(
  text: string,
): Promise<FoodProfilePromotionSummary> {
  return applyFoodProfilePromotionBundle(parseFoodProfilePromotionJson(text));
}
