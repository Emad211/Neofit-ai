export const ID_FINGERPRINT_GOLDEN_PROVENANCE = {
  referenceBranch: 'agent/iranian-food-kb-foundation',
  referenceHead: '648b98cdc921beb26ccd0ff05a1f17944bb6f71d',
  auditGeneratorBlob: 'ddcf4cfceefcecf2d1f9d8ad922e4472c212bc1c',
  schemaIdCandidateDocumentBlob: '0f372496cbad2ecf5cca72a6fdf7604255179be0',
  nutritionRcFreezeDocumentBlob: '3c0601f469c6d15618fcadd1179c16c581da6f6e',
  catalogReleaseContractTestBlob: '73d61f35383f3acb7298ec2fa5e0c5dd2989c457',
  catalogManifestBlob: 'f6bcc7bbeeed078b2798b625591b08a11bce0b78',
  iranianCanonCsvBlob: '175b8754c1afd4f6bcd2303d8b1113f3bf211ed5',
  persianAliasCsvBlob: '94429b1937edc6234b23fc8398531b531a891cc2',
  legacySeedBlob: '6810dffaf51afdf8b7161d3c9eb8028ae5add4be',
  fallbackSeedBlob: '62be2ae9ebb1f5bf448b848bf0e502a6d1870aa0',
  baseMigrationsBlob: 'e6c9eede66f2bfe4c32a726ff010d0f96033dc02',
  migrationPlanBlob: '1176a7084784822ed012511b2b3e49ca11dd1fa4',
  sourcePrecedenceBlob: 'b68655faba8ba8f526f6c358ffd1ff06aa532edd',
  promotionTestBlob: '740432a8568f2f3f70aed69f41ec19d0da109845',
} as const;

export const IDENTITY_FREEZE_CANDIDATE_GOLDEN = {
  format: 'neofit-schema-id-freeze-candidate',
  version: '1.1.0',
  status: 'candidate-not-final',
  latestMigrationVersion: 5,
  migrationCount: 5,
  applicationTableCount: 23,
  sqliteObjectCount: 43,
  schemaFingerprintSha256: '73e67213c7b8300723ddf91195d1c07384b2b3a0198d622a7d451af90c48bcbf',
  genericFoodIdCount: 13_225,
  genericFoodIdSetSha256: '8e1de257cb871260f9a13f6d8eee61c9290e73de159f3223e4841f565cbb6e3d',
  genericConceptIdCount: 9_279,
  genericConceptIdSetSha256: '23aab29455cdc9af62b16756dddb8fc5fd8d5dd3b3e429b56240e2e799b50ac8',
  genericMappingCount: 13_225,
  genericMappingCoverage: 1,
  genericMappingSetSha256: '6a603b63c7faca46b687ca56a7087716e11d165fdfa73a1fe4488475e46559c9',
  iranianCanonIdCount: 261,
  iranianCanonIdSetSha256: '6759ea828bea201299f5f11eacc2e8ebc6247b45767357e103a39d12f02e907c',
  appProfileIdCount: 261,
  appProfileIdSetSha256: '0f86759cd45e9d3456cddb090e9ebd5a75c46f44a2fa9c6dc8b9fadd5c215f4a',
  legacyProfileIdCount: 83,
  legacyProfileIdSetSha256: 'b35f8936a5effab341775c3b7864aeaa5a190da8604e88c6b6e72b431b673e01',
  fallbackProfileIdCount: 178,
  fallbackProfileIdSetSha256: '8dcd4aeaa07331043eeb25e47999e43956d9c78e640f220b0831fca805bf7560',
  appToCanonMappingCount: 261,
  appToCanonMappingSetSha256: 'ea66d4b2b532bff1ec2f637c136adb90fa110f00cc67ca51209bc816d08ffe71',
  unresolvedProfileCount: 0,
  ambiguousProfileCount: 0,
  persianAliasRowCount: 218,
  persianAliasMappingSetSha256: '9dbfc998b90c0924e895942da18836046d94407dc860e7705c563a55f4ce777e',
  directCanonicalLegacyIdOverlap: 0,
  directCanonicalFallbackIdOverlap: 0,
} as const;

export const RELEASE_STATUS_GOLDEN = {
  nutritionRc: 'frozen-release-candidate',
  catalogVersion: '1.2.0',
  schemaIdStatus: 'candidate-not-final',
  publicStableCompatibilityPromised: false,
} as const;

export const CANONICAL_FINGERPRINT_PAYLOAD_GOLDEN = {
  idSet: {
    values: ['b', 'a', 'c'],
    payload: 'a\nb\nc\n',
    sha256: '880553fca8fcea94e325ee2cfb48e5a985cc797f39a14cc6d3cedecfeb2ae4d2',
  },
  mappingSet: {
    values: [
      'app-b=>IFKB-CANON-00002',
      'app-a=>IFKB-CANON-00001',
    ],
    payload: 'app-a=>IFKB-CANON-00001\napp-b=>IFKB-CANON-00002\n',
    sha256: '186c62495b7502f7c98c984fba9d222c16737a383095d3669caed454711e0ed7',
  },
  aliasMappingSet: {
    values: [
      'alias-b=>generic:banana',
      'alias-a=>iranian_canon:IFKB-CANON-00001',
    ],
    payload: 'alias-a=>iranian_canon:IFKB-CANON-00001\nalias-b=>generic:banana\n',
    sha256: '34322a9bfc5f3a001d89ddd3e20299541f44b38fe5b8b6ea380a1dcd6251fb24',
  },
} as const;

export const IDENTITY_MAPPING_GOLDEN = {
  fallbackEncoded: {
    profiles: [{
      id: 'iranian-fallback-ifkb-canon-00084',
      nameFa: 'نام نمایشی متفاوت',
      aliasesFa: ['نام نامرتبط'],
    }],
    canons: [{
      canonId: 'IFKB-CANON-00084',
      nameFa: 'خورش غوره مسما',
      aliasesFa: ['غوره مسما'],
    }],
    expectedMappings: ['iranian-fallback-ifkb-canon-00084=>IFKB-CANON-00084'],
    expectedUnresolved: [],
    expectedAmbiguous: [],
  },
  primaryBeforeAlias: {
    profiles: [{
      id: 'legacy-khoresh-kadoo',
      nameFa: 'خورش کدو',
      aliasesFa: ['کدو'],
    }],
    canons: [
      {
        canonId: 'IFKB-CANON-00001',
        nameFa: 'خورش کدو',
        aliasesFa: ['خورشت کدو'],
      },
      {
        canonId: 'IFKB-CANON-00999',
        nameFa: 'کدو',
        aliasesFa: ['خوراک کدو'],
      },
    ],
    expectedMappings: ['legacy-khoresh-kadoo=>IFKB-CANON-00001'],
    expectedUnresolved: [],
    expectedAmbiguous: [],
  },
  aliasOnly: {
    profiles: [{
      id: 'legacy-ghormeh',
      nameFa: 'قرمه',
      aliasesFa: ['قرمه سبزی'],
    }],
    canons: [{
      canonId: 'IFKB-CANON-00008',
      nameFa: 'قورمه سبزی',
      aliasesFa: ['قرمه سبزی'],
    }],
    expectedMappings: ['legacy-ghormeh=>IFKB-CANON-00008'],
    expectedUnresolved: [],
    expectedAmbiguous: [],
  },
  unresolved: {
    profiles: [{
      id: 'unknown-profile',
      nameFa: 'غذای بدون هویت',
      aliasesFa: [],
    }],
    canons: [{
      canonId: 'IFKB-CANON-00001',
      nameFa: 'خورش کدو',
      aliasesFa: [],
    }],
    expectedMappings: [],
    expectedUnresolved: ['unknown-profile'],
    expectedAmbiguous: [],
  },
  ambiguousAlias: {
    profiles: [{
      id: 'ambiguous-profile',
      nameFa: 'نام ناموجود',
      aliasesFa: ['غذای مشترک'],
    }],
    canons: [
      {
        canonId: 'IFKB-CANON-00001',
        nameFa: 'غذای اول',
        aliasesFa: ['غذای مشترک'],
      },
      {
        canonId: 'IFKB-CANON-00002',
        nameFa: 'غذای دوم',
        aliasesFa: ['غذای مشترک'],
      },
    ],
    expectedMappings: [],
    expectedUnresolved: [],
    expectedAmbiguous: ['ambiguous-profile=>IFKB-CANON-00001|IFKB-CANON-00002'],
  },
} as const;

export const SOURCE_REPLACEMENT_PRECEDENCE_GOLDEN = [
  { existing: 'seeded', incoming: 'seeded', allowed: true },
  { existing: 'seeded', incoming: 'imported', allowed: true },
  { existing: 'seeded', incoming: 'custom', allowed: false },
  { existing: 'imported', incoming: 'seeded', allowed: false },
  { existing: 'imported', incoming: 'imported', allowed: true },
  { existing: 'imported', incoming: 'custom', allowed: false },
  { existing: 'custom', incoming: 'seeded', allowed: false },
  { existing: 'custom', incoming: 'imported', allowed: false },
  { existing: 'custom', incoming: 'custom', allowed: true },
] as const;
