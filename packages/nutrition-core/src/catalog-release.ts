export interface CatalogMappingPolicies {
  readonly conservative_comma_parser: number;
  readonly identity_preserving_exact: number;
}

export interface CatalogReleaseContract {
  readonly format: 'ifkb-mobile-catalog-release';
  readonly version: string;
  readonly databaseFile: string;
  readonly databaseBytes: number;
  readonly databaseSha256: string;
  readonly genericFoodCount: number;
  readonly genericPortionCount: number;
  readonly macroCompleteCount: number;
  readonly calciumCoverageCount: number;
  readonly ironCoverageCount: number;
  readonly potassiumCoverageCount: number;
  readonly vitaminCCoverageCount: number;
  readonly iranianCanonCount: number;
  readonly persianAliasCount: number;
  readonly genericConceptCount: number;
  readonly genericVariantMappingCount: number;
  readonly genericVariantMappingCoverage: number;
  readonly genericClusteredConceptCount: number;
  readonly genericMultiSourceConceptCount: number;
  readonly genericMaximumVariantsPerConcept: number;
  readonly genericMappingPolicies: CatalogMappingPolicies;
}

export interface SchemaIdCandidateBaseline {
  readonly format: 'neofit-schema-id-freeze-candidate';
  readonly version: string;
  readonly status: 'candidate-not-final';
  readonly latestMigrationVersion: number;
  readonly migrationCount: number;
  readonly applicationTableCount: number;
  readonly sqliteObjectCount: number;
  readonly schemaFingerprintSha256: string;
  readonly genericFoodIdSetSha256: string;
  readonly genericConceptIdSetSha256: string;
  readonly genericMappingSetSha256: string;
  readonly iranianCanonIdSetSha256: string;
  readonly appProfileIdSetSha256: string;
  readonly legacyProfileIdSetSha256: string;
  readonly fallbackProfileIdSetSha256: string;
  readonly appToCanonMappingSetSha256: string;
  readonly persianAliasMappingSetSha256: string;
  readonly appToCanonMappingCount: number;
  readonly unresolvedProfileCount: number;
  readonly ambiguousProfileCount: number;
}

const SHA256_PATTERN = /^[a-f0-9]{64}$/;

function assertNonNegativeInteger(value: number, label: string): void {
  if (!Number.isSafeInteger(value) || value < 0) {
    throw new RangeError(`${label} must be a non-negative safe integer`);
  }
}

function assertPositiveInteger(value: number, label: string): void {
  if (!Number.isSafeInteger(value) || value <= 0) {
    throw new RangeError(`${label} must be a positive safe integer`);
  }
}

function assertSha256(value: string, label: string): void {
  if (!SHA256_PATTERN.test(value)) {
    throw new Error(`${label} must be a lowercase SHA-256 hex digest`);
  }
}

export const IFKB_CATALOG_RELEASE: CatalogReleaseContract = {
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
};

export const SCHEMA_ID_CANDIDATE_BASELINE: SchemaIdCandidateBaseline = {
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
};

export function validateCatalogRelease(
  value: CatalogReleaseContract,
): CatalogReleaseContract {
  if (value.format !== 'ifkb-mobile-catalog-release') {
    throw new Error('Unexpected Catalog release format');
  }
  if (!/^\d+\.\d+\.\d+$/.test(value.version)) {
    throw new Error('Catalog release version must be semantic');
  }
  if (!value.databaseFile.endsWith('.db')) {
    throw new Error('Catalog databaseFile must identify a SQLite .db asset');
  }
  assertPositiveInteger(value.databaseBytes, 'databaseBytes');
  assertSha256(value.databaseSha256, 'databaseSha256');

  const countFields: readonly (keyof CatalogReleaseContract)[] = [
    'genericFoodCount',
    'genericPortionCount',
    'macroCompleteCount',
    'calciumCoverageCount',
    'ironCoverageCount',
    'potassiumCoverageCount',
    'vitaminCCoverageCount',
    'iranianCanonCount',
    'persianAliasCount',
    'genericConceptCount',
    'genericVariantMappingCount',
    'genericClusteredConceptCount',
    'genericMultiSourceConceptCount',
    'genericMaximumVariantsPerConcept',
  ];
  for (const field of countFields) {
    const fieldValue = value[field];
    if (typeof fieldValue !== 'number') {
      throw new TypeError(`${field} must be numeric`);
    }
    assertNonNegativeInteger(fieldValue, field);
  }

  if (value.genericVariantMappingCoverage !== 1) {
    throw new Error('Generic mapping coverage must equal 1 for the frozen release');
  }
  if (value.genericVariantMappingCount !== value.genericFoodCount) {
    throw new Error('Every Generic food must have exactly one source-to-Concept mapping');
  }
  if (value.macroCompleteCount > value.genericFoodCount) {
    throw new Error('macroCompleteCount cannot exceed genericFoodCount');
  }
  for (const coverage of [
    value.calciumCoverageCount,
    value.ironCoverageCount,
    value.potassiumCoverageCount,
    value.vitaminCCoverageCount,
  ]) {
    if (coverage > value.genericFoodCount) {
      throw new Error('Micronutrient coverage cannot exceed genericFoodCount');
    }
  }

  const policyTotal = value.genericMappingPolicies.conservative_comma_parser
    + value.genericMappingPolicies.identity_preserving_exact;
  assertNonNegativeInteger(
    value.genericMappingPolicies.conservative_comma_parser,
    'genericMappingPolicies.conservative_comma_parser',
  );
  assertNonNegativeInteger(
    value.genericMappingPolicies.identity_preserving_exact,
    'genericMappingPolicies.identity_preserving_exact',
  );
  if (policyTotal !== value.genericVariantMappingCount) {
    throw new Error('Generic mapping policies must cover the complete mapping set');
  }

  return value;
}

export function validateSchemaIdCandidateBaseline(
  value: SchemaIdCandidateBaseline,
): SchemaIdCandidateBaseline {
  if (value.format !== 'neofit-schema-id-freeze-candidate') {
    throw new Error('Unexpected Schema/ID candidate format');
  }
  if (value.status !== 'candidate-not-final') {
    throw new Error('Schema/ID baseline must remain candidate-not-final');
  }
  if (!/^\d+\.\d+\.\d+$/.test(value.version)) {
    throw new Error('Schema/ID candidate version must be semantic');
  }

  for (const [label, digest] of [
    ['schemaFingerprintSha256', value.schemaFingerprintSha256],
    ['genericFoodIdSetSha256', value.genericFoodIdSetSha256],
    ['genericConceptIdSetSha256', value.genericConceptIdSetSha256],
    ['genericMappingSetSha256', value.genericMappingSetSha256],
    ['iranianCanonIdSetSha256', value.iranianCanonIdSetSha256],
    ['appProfileIdSetSha256', value.appProfileIdSetSha256],
    ['legacyProfileIdSetSha256', value.legacyProfileIdSetSha256],
    ['fallbackProfileIdSetSha256', value.fallbackProfileIdSetSha256],
    ['appToCanonMappingSetSha256', value.appToCanonMappingSetSha256],
    ['persianAliasMappingSetSha256', value.persianAliasMappingSetSha256],
  ] as const) {
    assertSha256(digest, label);
  }

  assertPositiveInteger(value.latestMigrationVersion, 'latestMigrationVersion');
  assertPositiveInteger(value.migrationCount, 'migrationCount');
  assertPositiveInteger(value.applicationTableCount, 'applicationTableCount');
  assertPositiveInteger(value.sqliteObjectCount, 'sqliteObjectCount');
  assertPositiveInteger(value.appToCanonMappingCount, 'appToCanonMappingCount');
  assertNonNegativeInteger(value.unresolvedProfileCount, 'unresolvedProfileCount');
  assertNonNegativeInteger(value.ambiguousProfileCount, 'ambiguousProfileCount');

  return value;
}

validateCatalogRelease(IFKB_CATALOG_RELEASE);
validateSchemaIdCandidateBaseline(SCHEMA_ID_CANDIDATE_BASELINE);
