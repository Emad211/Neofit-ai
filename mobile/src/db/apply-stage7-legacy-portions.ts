import type * as SQLite from 'expo-sqlite';
import { STAGE7_LEGACY_PORTION_OVERRIDES } from '@/data/stage7-legacy-portion-overrides.generated';

/** Apply after Stage 6 seeded overrides and before the one final Nutrition Core sync. */
export async function applyStage7LegacyPortionOverrides(
  database: SQLite.SQLiteDatabase,
): Promise<number> {
  let updated = 0;
  await database.withExclusiveTransactionAsync(async (transaction) => {
    for (const item of STAGE7_LEGACY_PORTION_OVERRIDES) {
      const result = await transaction.runAsync(
        `UPDATE food_catalog SET
           portion_grams = ?, portion_label_fa = ?, portion_label_en = ?,
           source_label = ?, notes_fa = ?, notes_en = ?, updated_at = ?
         WHERE id = ? AND source_type = 'seeded';`,
        item.servingGrams,
        item.portionLabelFa,
        item.portionLabelEn,
        'NeoFit Iranian legacy profile v2 — Stage 7 portion basis revalidated; per-serving nutrition retained.',
        'بازبینی مرحله ۷: وزن سهم برای کاربرد محصولی اصلاح شد؛ تغذیهٔ هر سهم تغییر نکرده است.',
        `Stage 7 product serving correction. ${item.reason}`,
        '2026-08-03T00:00:00.000Z',
        item.appProfileId,
      );
      updated += result.changes;
    }
  });

  // Imported foods may intentionally occupy one of these stable IDs. In that case the
  // seeded-only UPDATE must be skipped rather than treated as a runtime failure.
  return updated;
}
