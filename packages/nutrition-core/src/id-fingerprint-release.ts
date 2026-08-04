import {
  IFKB_CATALOG_RELEASE,
  SCHEMA_ID_CANDIDATE_BASELINE,
} from './catalog-release';

export interface IdentityFreezeCandidate {
  readonly format: 'neofit-schema-id-freeze-candidate';
  readonly version: string;
  readonly status: 'candidate-not-final';
  readonly latestMigrationVersion: number;
  readonly migrationCount: number;
  readonly applicationTableCount: number;
  readonly sqliteObjectCount: number;
  readonly schemaFingerprintSha256: string;
  readonly genericFoodIdCount: number;
  readonly genericFoodIdSetSha256: string;
  readonly genericConceptIdCount: number;
  readonly genericConceptIdSetSha256: string;
  readonly genericMappingCount: number;
  readonly genericMappingCoverage: number;
  readonly genericMappingSetSha256: string;
  readonly iranianCanonIdCount: number;
  readonly iranianCanonIdSetSha256: string;
  readonly appProfileIdCount: number;
  readonly appProfileIdSetSha256: string;
  readonly legacyProfileIdCount: number;
  readonly legacyProfileIdSetSha256: string;
  readonly fallbackProfileIdCount: number;
  readonly fallbackProfileIdSetSha256: string;
  readonly appToCanonMappingCount: number;
  readonly appToCanonMappingSetSha256: string;
  readonly unresolvedProfileCount: number;
  readonly ambiguousProfileCount: number;
  readonly persianAliasRowCount: number;
  readonly persianAliasMappingSetSha256: string;
  readonly directCanonicalLegacyIdOverlap: number;
  readonly directCanonicalFallbackIdOverlap: number;
}

export interface AppProfileIdentity {
  readonly id: string;
  readonly nameFa: string;
  readonly aliasesFa: readonly string[];
}

export interface IranianCanonIdentity {
  readonly canonId: string;
  readonly nameFa: string;
  readonly aliasesFa: readonly string[];
}

export interface AppToCanonResolution {
  readonly mappings: readonly string[];
  readonly unresolved: readonly string[];
  readonly ambiguous: readonly string[];
}

export type FoodCatalogSourceType = 'seeded' | 'imported' | 'custom';

const SHA256_PATTERN = /^[a-f0-9]{64}$/;
const FALLBACK_CANON_PATTERN = /^iranian-fallback-ifkb-canon-(\d{5})$/;

function assertNonNegativeSafeInteger(value: number, label: string): void {
  if (!Number.isSafeInteger(value) || value < 0) {
    throw new RangeError(`${label} must be a non-negative safe integer`);
  }
}

function assertPositiveSafeInteger(value: number, label: string): void {
  if (!Number.isSafeInteger(value) || value <= 0) {
    throw new RangeError(`${label} must be a positive safe integer`);
  }
}

function assertSha256(value: string, label: string): void {
  if (!SHA256_PATTERN.test(value)) {
    throw new Error(`${label} must be a lowercase SHA-256 hex digest`);
  }
}

export const IDENTITY_FREEZE_CANDIDATE: IdentityFreezeCandidate = {
  format: SCHEMA_ID_CANDIDATE_BASELINE.format,
  version: SCHEMA_ID_CANDIDATE_BASELINE.version,
  status: SCHEMA_ID_CANDIDATE_BASELINE.status,
  latestMigrationVersion: SCHEMA_ID_CANDIDATE_BASELINE.latestMigrationVersion,
  migrationCount: SCHEMA_ID_CANDIDATE_BASELINE.migrationCount,
  applicationTableCount: SCHEMA_ID_CANDIDATE_BASELINE.applicationTableCount,
  sqliteObjectCount: SCHEMA_ID_CANDIDATE_BASELINE.sqliteObjectCount,
  schemaFingerprintSha256: SCHEMA_ID_CANDIDATE_BASELINE.schemaFingerprintSha256,
  genericFoodIdCount: IFKB_CATALOG_RELEASE.genericFoodCount,
  genericFoodIdSetSha256: SCHEMA_ID_CANDIDATE_BASELINE.genericFoodIdSetSha256,
  genericConceptIdCount: IFKB_CATALOG_RELEASE.genericConceptCount,
  genericConceptIdSetSha256: SCHEMA_ID_CANDIDATE_BASELINE.genericConceptIdSetSha256,
  genericMappingCount: IFKB_CATALOG_RELEASE.genericVariantMappingCount,
  genericMappingCoverage: IFKB_CATALOG_RELEASE.genericVariantMappingCoverage,
  genericMappingSetSha256: SCHEMA_ID_CANDIDATE_BASELINE.genericMappingSetSha256,
  iranianCanonIdCount: IFKB_CATALOG_RELEASE.iranianCanonCount,
  iranianCanonIdSetSha256: SCHEMA_ID_CANDIDATE_BASELINE.iranianCanonIdSetSha256,
  appProfileIdCount: 261,
  appProfileIdSetSha256: SCHEMA_ID_CANDIDATE_BASELINE.appProfileIdSetSha256,
  legacyProfileIdCount: 83,
  legacyProfileIdSetSha256: SCHEMA_ID_CANDIDATE_BASELINE.legacyProfileIdSetSha256,
  fallbackProfileIdCount: 178,
  fallbackProfileIdSetSha256: SCHEMA_ID_CANDIDATE_BASELINE.fallbackProfileIdSetSha256,
  appToCanonMappingCount: SCHEMA_ID_CANDIDATE_BASELINE.appToCanonMappingCount,
  appToCanonMappingSetSha256: SCHEMA_ID_CANDIDATE_BASELINE.appToCanonMappingSetSha256,
  unresolvedProfileCount: SCHEMA_ID_CANDIDATE_BASELINE.unresolvedProfileCount,
  ambiguousProfileCount: SCHEMA_ID_CANDIDATE_BASELINE.ambiguousProfileCount,
  persianAliasRowCount: IFKB_CATALOG_RELEASE.persianAliasCount,
  persianAliasMappingSetSha256: SCHEMA_ID_CANDIDATE_BASELINE.persianAliasMappingSetSha256,
  directCanonicalLegacyIdOverlap: 0,
  directCanonicalFallbackIdOverlap: 0,
};

export function canonicalFingerprintPayload(values: readonly string[]): string {
  return `${values.slice().sort().join('\n')}\n`;
}

export function normalizeIdentityPersian(value: string): string {
  return value
    .normalize('NFKC')
    .toLocaleLowerCase('fa')
    .replace(/[يى]/g, 'ی')
    .replace(/ك/g, 'ک')
    .replace(/[ۀة]/g, 'ه')
    .replace(/ؤ/g, 'و')
    .replace(/[إأ]/g, 'ا')
    .replace(/[َُِّْٰـ]/g, '')
    .replace(/[\u200c\u200f\u202a-\u202e]/g, ' ')
    .replace(/[^\p{L}\p{N}\s]/gu, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function addIdentityIndex(
  index: Map<string, Set<string>>,
  rawValue: string,
  canonId: string,
): void {
  const value = normalizeIdentityPersian(rawValue);
  if (!value) return;
  const matches = index.get(value) ?? new Set<string>();
  matches.add(canonId);
  index.set(value, matches);
}

export function resolveAppProfilesToCanon(
  profiles: readonly AppProfileIdentity[],
  canons: readonly IranianCanonIdentity[],
): AppToCanonResolution {
  const canonIds = new Set(canons.map((canon) => canon.canonId));
  const primaryNames = new Map<string, Set<string>>();
  const aliasNames = new Map<string, Set<string>>();

  for (const canon of canons) {
    addIdentityIndex(primaryNames, canon.nameFa, canon.canonId);
    for (const alias of canon.aliasesFa) {
      addIdentityIndex(aliasNames, alias, canon.canonId);
    }
  }

  const mappings: string[] = [];
  const unresolved: string[] = [];
  const ambiguous: string[] = [];

  for (const profile of profiles) {
    let candidates = new Set<string>();
    const fallbackMatch = profile.id.match(FALLBACK_CANON_PATTERN);
    if (fallbackMatch?.[1]) {
      const canonId = `IFKB-CANON-${fallbackMatch[1]}`;
      if (canonIds.has(canonId)) candidates.add(canonId);
    }

    if (candidates.size === 0) {
      const primaryMatches = primaryNames.get(normalizeIdentityPersian(profile.nameFa));
      if (primaryMatches) candidates = new Set(primaryMatches);
    }

    if (candidates.size === 0) {
      for (const alias of profile.aliasesFa) {
        const matches = aliasNames.get(normalizeIdentityPersian(alias));
        if (!matches) continue;
        for (const canonId of matches) candidates.add(canonId);
      }
    }

    const sortedCandidates = [...candidates].sort();
    if (sortedCandidates.length === 1) {
      mappings.push(`${profile.id}=>${sortedCandidates[0]}`);
    } else if (sortedCandidates.length === 0) {
      unresolved.push(profile.id);
    } else {
      ambiguous.push(`${profile.id}=>${sortedCandidates.join('|')}`);
    }
  }

  return {
    mappings: mappings.sort(),
    unresolved: unresolved.sort(),
    ambiguous: ambiguous.sort(),
  };
}

export function canFoodCatalogSourceReplace(
  existing: FoodCatalogSourceType,
  incoming: FoodCatalogSourceType,
): boolean {
  if (incoming === 'seeded') return existing === 'seeded';
  if (incoming === 'imported') return existing === 'seeded' || existing === 'imported';
  return existing === 'custom';
}

export function validateIdentityFreezeCandidate(
  value: IdentityFreezeCandidate,
): IdentityFreezeCandidate {
  if (value.format !== 'neofit-schema-id-freeze-candidate') {
    throw new Error('Unexpected Identity freeze candidate format');
  }
  if (value.status !== 'candidate-not-final') {
    throw new Error('Identity freeze snapshot must remain candidate-not-final');
  }
  if (!/^\d+\.\d+\.\d+$/.test(value.version)) {
    throw new Error('Identity freeze candidate version must be semantic');
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

  for (const [label, count] of [
    ['latestMigrationVersion', value.latestMigrationVersion],
    ['migrationCount', value.migrationCount],
    ['applicationTableCount', value.applicationTableCount],
    ['sqliteObjectCount', value.sqliteObjectCount],
    ['genericFoodIdCount', value.genericFoodIdCount],
    ['genericConceptIdCount', value.genericConceptIdCount],
    ['genericMappingCount', value.genericMappingCount],
    ['iranianCanonIdCount', value.iranianCanonIdCount],
    ['appProfileIdCount', value.appProfileIdCount],
    ['legacyProfileIdCount', value.legacyProfileIdCount],
    ['fallbackProfileIdCount', value.fallbackProfileIdCount],
    ['appToCanonMappingCount', value.appToCanonMappingCount],
    ['persianAliasRowCount', value.persianAliasRowCount],
  ] as const) {
    assertPositiveSafeInteger(count, label);
  }

  for (const [label, count] of [
    ['unresolvedProfileCount', value.unresolvedProfileCount],
    ['ambiguousProfileCount', value.ambiguousProfileCount],
    ['directCanonicalLegacyIdOverlap', value.directCanonicalLegacyIdOverlap],
    ['directCanonicalFallbackIdOverlap', value.directCanonicalFallbackIdOverlap],
  ] as const) {
    assertNonNegativeSafeInteger(count, label);
  }

  if (value.genericMappingCoverage !== 1) {
    throw new Error('Generic mapping coverage must equal 1');
  }
  if (value.genericMappingCount !== value.genericFoodIdCount) {
    throw new Error('Generic mapping count must equal Generic food ID count');
  }
  if (value.legacyProfileIdCount + value.fallbackProfileIdCount !== value.appProfileIdCount) {
    throw new Error('Legacy and fallback profile counts must equal the complete app profile count');
  }
  if (
    value.appToCanonMappingCount !== value.appProfileIdCount
    || value.appToCanonMappingCount !== value.iranianCanonIdCount
  ) {
    throw new Error('App-profile to Canon mapping must remain one-to-one');
  }
  if (value.unresolvedProfileCount !== 0 || value.ambiguousProfileCount !== 0) {
    throw new Error('Frozen candidate must have zero unresolved and ambiguous profiles');
  }
  if (
    value.directCanonicalLegacyIdOverlap !== 0
    || value.directCanonicalFallbackIdOverlap !== 0
  ) {
    throw new Error('App-profile and Canon identifier namespaces must remain distinct');
  }

  return value;
}

validateIdentityFreezeCandidate(IDENTITY_FREEZE_CANDIDATE);
