export type FoodCatalogSourceType = 'seeded' | 'imported' | 'custom';

/**
 * SQLite ON CONFLICT precedence shared by every food-catalog upsert.
 *
 * - built-in seed updates only built-in seed rows;
 * - imported evidence may promote seeded/imported rows but never user custom rows;
 * - custom edits update only the same custom identity.
 */
export const FOOD_CATALOG_UPSERT_PRECEDENCE_SQL = `(
  (excluded.source_type = 'seeded' AND food_catalog.source_type = 'seeded')
  OR (excluded.source_type = 'imported' AND food_catalog.source_type IN ('seeded', 'imported'))
  OR (excluded.source_type = 'custom' AND food_catalog.source_type = 'custom')
)`;

export function canFoodCatalogSourceReplace(
  existing: FoodCatalogSourceType,
  incoming: FoodCatalogSourceType,
): boolean {
  if (incoming === 'seeded') return existing === 'seeded';
  if (incoming === 'imported') return existing === 'seeded' || existing === 'imported';
  return existing === 'custom';
}
