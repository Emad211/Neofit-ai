import type * as SQLite from 'expo-sqlite';
import { getDatabase } from '@/db/database';
import { upsertNutritionFoodDocuments } from '@/db/nutrition-food-repository';
import type { FoodCatalogItem } from '@/domain/models';
import {
  legacyCatalogFoodToDocument,
  type EvidenceTier,
} from '@/nutrition-core';

interface CatalogSeedRow {
  id: string;
  name_fa: string;
  name_en: string;
  aliases_fa_json: string;
  aliases_en_json: string;
  category: FoodCatalogItem['category'];
  portion_label_fa: string;
  portion_label_en: string;
  portion_grams: number | null;
  calories: number;
  protein_g: number;
  carbs_g: number;
  fat_g: number;
  variability_pct: number;
  source_type: FoodCatalogItem['sourceType'];
  source_label: string;
  evidence_tier: EvidenceTier;
  source_record_id: string | null;
  source_version: string | null;
}

function parseStringArray(value: string): string[] {
  try {
    const parsed = JSON.parse(value) as unknown;
    return Array.isArray(parsed)
      ? parsed.filter((item): item is string => typeof item === 'string')
      : [];
  } catch {
    return [];
  }
}

export async function seedNutritionCoreFromFoodCatalog(
  database?: SQLite.SQLiteDatabase,
): Promise<number> {
  const db = database ?? await getDatabase();
  const rows = await db.getAllAsync<CatalogSeedRow>(
    'SELECT * FROM food_catalog ORDER BY id;',
  );
  await upsertNutritionFoodDocuments(
    rows.map((row) => {
      const legacy = legacyCatalogFoodToDocument({
        id: row.id,
        nameFa: row.name_fa,
        nameEn: row.name_en,
        aliasesFa: parseStringArray(row.aliases_fa_json),
        aliasesEn: parseStringArray(row.aliases_en_json),
        category: row.category,
        portionLabelFa: row.portion_label_fa,
        portionLabelEn: row.portion_label_en,
        portionGrams: row.portion_grams,
        calories: row.calories,
        proteinG: row.protein_g,
        carbsG: row.carbs_g,
        fatG: row.fat_g,
        variabilityPct: row.variability_pct,
        sourceType: row.source_type,
        sourceLabel: row.source_label,
        evidenceTier: row.evidence_tier,
        sourceRecordId: row.source_record_id,
        sourceVersion: row.source_version,
      });
      return { concept: legacy.concept, variants: [legacy.variant] };
    }),
    db,
  );
  return rows.length;
}
