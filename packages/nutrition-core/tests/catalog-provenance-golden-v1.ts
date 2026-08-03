export const CATALOG_PROVENANCE_GOLDEN_PROVENANCE = {
  referenceBranch: 'agent/iranian-food-kb-foundation',
  referenceHead: '648b98cdc921beb26ccd0ff05a1f17944bb6f71d',
  mobileCatalogReleaseBlob: '1afb7266b7d456530febb5c1c49c109e3d1f3ef7',
  mobileCatalogProvenanceBlob: '1edb7e8eed151305075e634a84596db2211dffaf',
  mobileLegacyAdapterBlob: '30fcc0d774a43f0f0608bd29c342c3e20d339f58',
  mobileNutritionTestBlob: '2291e1958efe5e17010230c5864c9fadc9bc47ba',
  generatedManifestBlob: 'f6bcc7bbeeed078b2798b625591b08a11bce0b78',
  catalogWorkflowBlob: '1012754613cf99bd3c73de49830731e9cc52adcf',
  catalogBuilderBlob: '597180d6bd540bc9b8bf0fc931c030d534289f5c',
  conceptAugmenterBlob: 'b0ed12152b8a0001fedfa0c35e52ddf2fc81fcc0',
  schemaAuditBlob: 'ddcf4cfceefcecf2d1f9d8ad922e4472c212bc1c',
  schemaCandidateDocumentBlob: '0f372496cbad2ecf5cca72a6fdf7604255179be0',
  nutritionRcFreezeDocumentBlob: '3c0601f469c6d15618fcadd1179c16c581da6f6e',
} as const;

export const IFKB_CATALOG_RELEASE_1_2_0_GOLDEN = {
  format: 'ifkb-mobile-catalog-release',
  version: '1.2.0',
  databaseFile: 'ifkb-universal-v1.db',
  databaseBytes: 13_885_440,
  databaseSha256: '0164cb344c22eeec2556f9decdf13931e700078a9566bd884609edee78667247',
  genericFoodCount: 13_225,
  genericPortionCount: 36_494,
  macroCompleteCount: 13_224,
  calciumCoverageCount: 13_139,
  ironCoverageCount: 13_144,
  potassiumCoverageCount: 12_947,
  vitaminCCoverageCount: 12_763,
  iranianCanonCount: 261,
  persianAliasCount: 218,
  genericConceptCount: 9_279,
  genericVariantMappingCount: 13_225,
  genericVariantMappingCoverage: 1,
  genericClusteredConceptCount: 1_321,
  genericMultiSourceConceptCount: 209,
  genericMaximumVariantsPerConcept: 76,
  genericMappingPolicies: {
    conservative_comma_parser: 6_049,
    identity_preserving_exact: 7_176,
  },
} as const;

export const SCHEMA_ID_CANDIDATE_BASELINE_GOLDEN = {
  format: 'neofit-schema-id-freeze-candidate',
  version: '1.1.0',
  status: 'candidate-not-final',
  latestMigrationVersion: 5,
  migrationCount: 5,
  applicationTableCount: 23,
  sqliteObjectCount: 43,
  schemaFingerprintSha256: '73e67213c7b8300723ddf91195d1c07384b2b3a0198d622a7d451af90c48bcbf',
  genericFoodIdSetSha256: '8e1de257cb871260f9a13f6d8eee61c9290e73de159f3223e4841f565cbb6e3d',
  genericConceptIdSetSha256: '23aab29455cdc9af62b16756dddb8fc5fd8d5dd3b3e429b56240e2e799b50ac8',
  genericMappingSetSha256: '6a603b63c7faca46b687ca56a7087716e11d165fdfa73a1fe4488475e46559c9',
  iranianCanonIdSetSha256: '6759ea828bea201299f5f11eacc2e8ebc6247b45767357e103a39d12f02e907c',
  appProfileIdSetSha256: '0f86759cd45e9d3456cddb090e9ebd5a75c46f44a2fa9c6dc8b9fadd5c215f4a',
  legacyProfileIdSetSha256: 'b35f8936a5effab341775c3b7864aeaa5a190da8604e88c6b6e72b431b673e01',
  fallbackProfileIdSetSha256: '8dcd4aeaa07331043eeb25e47999e43956d9c78e640f220b0831fca805bf7560',
  appToCanonMappingSetSha256: 'ea66d4b2b532bff1ec2f637c136adb90fa110f00cc67ca51209bc816d08ffe71',
  persianAliasMappingSetSha256: '9dbfc998b90c0924e895942da18836046d94407dc860e7705c563a55f4ce777e',
  appToCanonMappingCount: 261,
  unresolvedProfileCount: 0,
  ambiguousProfileCount: 0,
} as const;

export const CATALOG_EVIDENCE_TIER_CASES = [
  {
    label: 'custom data is always user-entered',
    input: { sourceType: 'custom', sourceLabel: 'My custom food', evidenceTier: 'verified_source' },
    expected: 'user_entered',
  },
  {
    label: 'DS0 label is broad fallback',
    input: { sourceType: 'seeded', sourceLabel: 'DS0 generated fallback' },
    expected: 'broad_fallback',
  },
  {
    label: 'broad-fallback spelling is recognized',
    input: { sourceType: 'seeded', sourceLabel: 'broad-fallback profile' },
    expected: 'broad_fallback',
  },
  {
    label: 'explicit evidence tier is preserved',
    input: { sourceType: 'imported', sourceLabel: 'Reviewed import', evidenceTier: 'digital_consensus' },
    expected: 'digital_consensus',
  },
  {
    label: 'missing evidence tier falls back conservatively',
    input: { sourceType: 'seeded', sourceLabel: 'NeoFit starter catalog' },
    expected: 'legacy_estimate',
  },
] as const;

export const IMPORTED_EVIDENCE_ALLOWLIST_GOLDEN = {
  allowed: ['verified_source', 'digital_consensus', 'legacy_estimate'],
  rejected: ['broad_fallback', 'user_entered'],
} as const;

export const LEGACY_CATALOG_ADAPTER_CASES = {
  unknownWeight: {
    input: {
      id: 'legacy-ghormeh-sabzi',
      nameFa: 'قورمه سبزی',
      nameEn: 'Ghormeh sabzi',
      aliasesFa: ['قرمه سبزی'],
      aliasesEn: [],
      category: 'stew',
      portionLabelFa: 'یک پرس',
      portionLabelEn: 'One serving',
      portionGrams: null,
      calories: 420,
      proteinG: 24,
      carbsG: 28,
      fatG: 24,
      variabilityPct: 30,
      sourceType: 'seeded',
      sourceLabel: 'NeoFit starter catalog',
    },
    expected: {
      conceptId: 'legacy-ghormeh-sabzi',
      variantId: 'legacy-ghormeh-sabzi:default',
      nutrientBasis: 'per_serving',
      basisGrams: null,
      portionGramWeight: null,
      basisMultiplier: 1,
      energyKcal: 420,
      evidenceTier: 'legacy_estimate',
      sourceRecordId: 'legacy-ghormeh-sabzi',
      sourceVersionPresent: false,
      p10EnergyKcal: 294,
      p50EnergyKcal: 420,
      p90EnergyKcal: 546,
    },
  },
  variabilityClamp: {
    inputVariabilityPct: 250,
    expectedFraction: 0.8,
  },
  negativeVariabilityClamp: {
    inputVariabilityPct: -25,
    expectedFraction: 0,
  },
} as const;
