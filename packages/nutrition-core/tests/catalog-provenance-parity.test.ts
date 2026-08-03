import assert from 'node:assert/strict';
import test from 'node:test';
import {
  IFKB_CATALOG_RELEASE,
  SCHEMA_ID_CANDIDATE_BASELINE,
  isAllowedImportedEvidenceTier,
  legacyCatalogFoodToDocument,
  resolveCatalogEvidenceTier,
  validateCatalogRelease,
  validateSchemaIdCandidateBaseline,
  type EvidenceTier,
  type LegacyCatalogFood,
} from '../src';
import {
  CATALOG_EVIDENCE_TIER_CASES,
  CATALOG_PROVENANCE_GOLDEN_PROVENANCE,
  IFKB_CATALOG_RELEASE_1_2_0_GOLDEN,
  IMPORTED_EVIDENCE_ALLOWLIST_GOLDEN,
  LEGACY_CATALOG_ADAPTER_CASES,
  SCHEMA_ID_CANDIDATE_BASELINE_GOLDEN,
} from './catalog-provenance-golden-v1';

function legacyCase(overrides: Partial<LegacyCatalogFood> = {}): LegacyCatalogFood {
  return {
    ...LEGACY_CATALOG_ADAPTER_CASES.unknownWeight.input,
    ...overrides,
  };
}

test('Batch 3 fixtures identify the exact Catalog, Manifest, audit and Mobile authorities', () => {
  assert.match(CATALOG_PROVENANCE_GOLDEN_PROVENANCE.referenceHead, /^[a-f0-9]{40}$/);
  for (const [key, value] of Object.entries(CATALOG_PROVENANCE_GOLDEN_PROVENANCE)) {
    if (key.endsWith('Blob')) assert.match(value, /^[a-f0-9]{40}$/);
  }
});

test('runtime Catalog release projection equals the frozen Manifest 1.2.0 contract', () => {
  assert.deepEqual(IFKB_CATALOG_RELEASE, IFKB_CATALOG_RELEASE_1_2_0_GOLDEN);
  assert.equal(validateCatalogRelease(IFKB_CATALOG_RELEASE), IFKB_CATALOG_RELEASE);
});

test('Catalog release validation rejects broken immutable-asset invariants', () => {
  assert.throws(
    () => validateCatalogRelease({
      ...IFKB_CATALOG_RELEASE,
      databaseSha256: 'not-a-sha256',
    }),
    /databaseSha256/,
  );
  assert.throws(
    () => validateCatalogRelease({
      ...IFKB_CATALOG_RELEASE,
      genericVariantMappingCoverage: 0.99,
    }),
    /mapping coverage/i,
  );
  assert.throws(
    () => validateCatalogRelease({
      ...IFKB_CATALOG_RELEASE,
      genericMappingPolicies: {
        ...IFKB_CATALOG_RELEASE.genericMappingPolicies,
        conservative_comma_parser: 1,
      },
    }),
    /mapping policies/i,
  );
});

test('Schema and ID baseline remains explicitly candidate-not-final', () => {
  assert.deepEqual(SCHEMA_ID_CANDIDATE_BASELINE, SCHEMA_ID_CANDIDATE_BASELINE_GOLDEN);
  assert.equal(SCHEMA_ID_CANDIDATE_BASELINE.status, 'candidate-not-final');
  assert.equal(
    validateSchemaIdCandidateBaseline(SCHEMA_ID_CANDIDATE_BASELINE),
    SCHEMA_ID_CANDIDATE_BASELINE,
  );
  assert.throws(
    () => validateSchemaIdCandidateBaseline({
      ...SCHEMA_ID_CANDIDATE_BASELINE,
      status: 'final' as never,
    }),
    /candidate-not-final/,
  );
});

test('Catalog evidence-tier resolution matches the frozen provenance matrix', () => {
  for (const fixture of CATALOG_EVIDENCE_TIER_CASES) {
    assert.equal(
      resolveCatalogEvidenceTier(fixture.input),
      fixture.expected,
      fixture.label,
    );
  }
});

test('Imported evidence allowlist accepts only reviewed non-fallback tiers', () => {
  for (const tier of IMPORTED_EVIDENCE_ALLOWLIST_GOLDEN.allowed) {
    assert.equal(isAllowedImportedEvidenceTier(tier), true, tier);
  }
  for (const tier of IMPORTED_EVIDENCE_ALLOWLIST_GOLDEN.rejected) {
    assert.equal(isAllowedImportedEvidenceTier(tier), false, tier);
  }

  const allTiers: readonly EvidenceTier[] = [
    'verified_source',
    'digital_consensus',
    'legacy_estimate',
    'broad_fallback',
    'user_entered',
  ];
  assert.deepEqual(
    allTiers.filter(isAllowedImportedEvidenceTier),
    IMPORTED_EVIDENCE_ALLOWLIST_GOLDEN.allowed,
  );
});

test('Legacy adapter preserves per-serving basis, null weight and source fallback', () => {
  const fixture = LEGACY_CATALOG_ADAPTER_CASES.unknownWeight;
  const document = legacyCatalogFoodToDocument(legacyCase());
  const portion = document.variant.portions[0];

  assert.equal(document.concept.id, fixture.expected.conceptId);
  assert.equal(document.variant.id, fixture.expected.variantId);
  assert.equal(document.variant.nutrientBasis, fixture.expected.nutrientBasis);
  assert.equal(document.variant.basisGrams, fixture.expected.basisGrams);
  assert.equal(portion?.gramWeight, fixture.expected.portionGramWeight);
  assert.equal(portion?.basisMultiplier, fixture.expected.basisMultiplier);
  assert.equal(document.variant.nutrientsPerBasis.energyKcal, fixture.expected.energyKcal);
  assert.equal(document.variant.evidenceTier, fixture.expected.evidenceTier);
  assert.equal(document.variant.sourceRecordId, fixture.expected.sourceRecordId);
  assert.equal('sourceVersion' in document.variant, fixture.expected.sourceVersionPresent);
  assert.equal(document.variant.nutrientRangePerBasis?.p10.energyKcal, fixture.expected.p10EnergyKcal);
  assert.equal(document.variant.nutrientRangePerBasis?.p50.energyKcal, fixture.expected.p50EnergyKcal);
  assert.equal(document.variant.nutrientRangePerBasis?.p90.energyKcal, fixture.expected.p90EnergyKcal);
});

test('Legacy uncertainty is clamped to zero and eighty percent', () => {
  const high = legacyCatalogFoodToDocument(legacyCase({
    variabilityPct: LEGACY_CATALOG_ADAPTER_CASES.variabilityClamp.inputVariabilityPct,
  }));
  const low = legacyCatalogFoodToDocument(legacyCase({
    variabilityPct: LEGACY_CATALOG_ADAPTER_CASES.negativeVariabilityClamp.inputVariabilityPct,
  }));

  const center = LEGACY_CATALOG_ADAPTER_CASES.unknownWeight.input.calories;
  const highFraction = LEGACY_CATALOG_ADAPTER_CASES.variabilityClamp.expectedFraction;
  const lowFraction = LEGACY_CATALOG_ADAPTER_CASES.negativeVariabilityClamp.expectedFraction;

  assert.equal(high.variant.nutrientRangePerBasis?.p10.energyKcal, center * (1 - highFraction));
  assert.equal(high.variant.nutrientRangePerBasis?.p90.energyKcal, center * (1 + highFraction));
  assert.equal(low.variant.nutrientRangePerBasis?.p10.energyKcal, center * (1 - lowFraction));
  assert.equal(low.variant.nutrientRangePerBasis?.p90.energyKcal, center * (1 + lowFraction));
});

test('Legacy adapter trims source metadata and omits a blank source version', () => {
  const blank = legacyCatalogFoodToDocument(legacyCase({
    sourceRecordId: '   ',
    sourceVersion: '   ',
  }));
  assert.equal(blank.variant.sourceRecordId, LEGACY_CATALOG_ADAPTER_CASES.unknownWeight.input.id);
  assert.equal('sourceVersion' in blank.variant, false);

  const explicit = legacyCatalogFoodToDocument(legacyCase({
    sourceType: 'imported',
    sourceLabel: 'Reviewed import v2',
    evidenceTier: 'verified_source',
    sourceRecordId: '  source-record-42  ',
    sourceVersion: '  2026.08  ',
  }));
  assert.equal(explicit.variant.sourceDataset, 'Reviewed import v2');
  assert.equal(explicit.variant.sourceRecordId, 'source-record-42');
  assert.equal(explicit.variant.sourceVersion, '2026.08');
  assert.equal(explicit.variant.evidenceTier, 'verified_source');
});
