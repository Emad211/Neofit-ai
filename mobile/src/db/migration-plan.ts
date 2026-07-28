import { migrations as baseMigrations, type Migration } from '@/db/migrations';

export const FOOD_CATALOG_PROVENANCE_MIGRATION_V5: Migration = {
  version: 5,
  name: 'food-catalog-evidence-provenance-and-promotion',
  sql: `
    ALTER TABLE food_catalog
    ADD COLUMN evidence_tier TEXT NOT NULL DEFAULT 'legacy_estimate'
    CHECK (evidence_tier IN (
      'verified_source','digital_consensus','legacy_estimate','broad_fallback','user_entered'
    ));

    ALTER TABLE food_catalog
    ADD COLUMN source_record_id TEXT;

    ALTER TABLE food_catalog
    ADD COLUMN source_version TEXT;

    UPDATE food_catalog
    SET evidence_tier = 'user_entered'
    WHERE source_type = 'custom';

    UPDATE food_catalog
    SET evidence_tier = 'broad_fallback'
    WHERE source_label LIKE '%DS0%'
       OR lower(source_label) LIKE '%broad-fallback%'
       OR lower(source_label) LIKE '%broad fallback%';

    UPDATE food_catalog
    SET source_record_id = id
    WHERE source_record_id IS NULL OR trim(source_record_id) = '';

    CREATE INDEX IF NOT EXISTS idx_food_catalog_source_evidence
    ON food_catalog(source_type, evidence_tier, updated_at DESC);
  `,
};

export const migrations: readonly Migration[] = [
  ...baseMigrations,
  FOOD_CATALOG_PROVENANCE_MIGRATION_V5,
];

export type { Migration } from '@/db/migrations';
