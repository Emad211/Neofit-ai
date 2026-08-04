import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import test from 'node:test';
import {
  IDENTITY_FREEZE_CANDIDATE,
  canonicalFingerprintPayload,
  canFoodCatalogSourceReplace,
  normalizeIdentityPersian,
  resolveAppProfilesToCanon,
  validateIdentityFreezeCandidate,
  type FoodCatalogSourceType,
} from '../src';
import {
  CANONICAL_FINGERPRINT_PAYLOAD_GOLDEN,
  IDENTITY_FREEZE_CANDIDATE_GOLDEN,
  IDENTITY_MAPPING_GOLDEN,
  ID_FINGERPRINT_GOLDEN_PROVENANCE,
  RELEASE_STATUS_GOLDEN,
  SOURCE_REPLACEMENT_PRECEDENCE_GOLDEN,
} from './id-fingerprint-release-golden-v1';

function sha256(value: string): string {
  return createHash('sha256').update(value, 'utf8').digest('hex');
}

test('Batch 5 fixtures identify exact audit, release, identity and precedence authorities', () => {
  assert.match(ID_FINGERPRINT_GOLDEN_PROVENANCE.referenceHead, /^[a-f0-9]{40}$/);
  for (const [key, value] of Object.entries(ID_FINGERPRINT_GOLDEN_PROVENANCE)) {
    if (key.endsWith('Blob')) assert.match(value, /^[a-f0-9]{40}$/, key);
  }
});

test('Identity freeze snapshot equals the complete candidate-not-final Golden baseline', () => {
  assert.deepEqual(IDENTITY_FREEZE_CANDIDATE, IDENTITY_FREEZE_CANDIDATE_GOLDEN);
  assert.equal(IDENTITY_FREEZE_CANDIDATE.status, RELEASE_STATUS_GOLDEN.schemaIdStatus);
  assert.equal(RELEASE_STATUS_GOLDEN.publicStableCompatibilityPromised, false);
  assert.equal(
    validateIdentityFreezeCandidate(IDENTITY_FREEZE_CANDIDATE),
    IDENTITY_FREEZE_CANDIDATE,
  );
});

test('Identity freeze validation rejects silent final promotion and broken set invariants', () => {
  assert.throws(
    () => validateIdentityFreezeCandidate({
      ...IDENTITY_FREEZE_CANDIDATE,
      status: 'final' as never,
    }),
    /candidate-not-final/,
  );
  assert.throws(
    () => validateIdentityFreezeCandidate({
      ...IDENTITY_FREEZE_CANDIDATE,
      appProfileIdCount: 260,
    }),
    /legacy.*fallback.*app profile/i,
  );
  assert.throws(
    () => validateIdentityFreezeCandidate({
      ...IDENTITY_FREEZE_CANDIDATE,
      genericMappingCoverage: 0.99,
    }),
    /mapping coverage/i,
  );
  assert.throws(
    () => validateIdentityFreezeCandidate({
      ...IDENTITY_FREEZE_CANDIDATE,
      appToCanonMappingCount: 260,
    }),
    /one-to-one/i,
  );
});

test('Canonical fingerprint payload is sorted, newline-delimited and hash-compatible', () => {
  for (const fixture of Object.values(CANONICAL_FINGERPRINT_PAYLOAD_GOLDEN)) {
    const payload = canonicalFingerprintPayload(fixture.values);
    assert.equal(payload, fixture.payload);
    assert.equal(sha256(payload), fixture.sha256);
  }

  assert.equal(canonicalFingerprintPayload([]), '\n');
  assert.equal(canonicalFingerprintPayload(['b', 'a', 'a']), 'a\na\nb\n');
});

test('Persian identity normalization matches the frozen audit algorithm', () => {
  assert.equal(
    normalizeIdentityPersian('  قُرمه\u200cسبزي!  '),
    'قرمه سبزی',
  );
  assert.equal(normalizeIdentityPersian('كبابِ كوبيده'), 'کباب کوبیده');
  assert.equal(normalizeIdentityPersian('مسألهٔ غذا'), 'مساله غذا');
  assert.equal(normalizeIdentityPersian('آش\u200f رشته'), 'آش رشته');
});

test('App-profile to Canon resolution preserves encoded, primary and alias precedence', () => {
  for (const fixture of [
    IDENTITY_MAPPING_GOLDEN.fallbackEncoded,
    IDENTITY_MAPPING_GOLDEN.primaryBeforeAlias,
    IDENTITY_MAPPING_GOLDEN.aliasOnly,
  ]) {
    assert.deepEqual(
      resolveAppProfilesToCanon(fixture.profiles, fixture.canons),
      {
        mappings: fixture.expectedMappings,
        unresolved: fixture.expectedUnresolved,
        ambiguous: fixture.expectedAmbiguous,
      },
    );
  }
});

test('App-profile to Canon resolution fails closed for unresolved and ambiguous identities', () => {
  for (const fixture of [
    IDENTITY_MAPPING_GOLDEN.unresolved,
    IDENTITY_MAPPING_GOLDEN.ambiguousAlias,
  ]) {
    assert.deepEqual(
      resolveAppProfilesToCanon(fixture.profiles, fixture.canons),
      {
        mappings: fixture.expectedMappings,
        unresolved: fixture.expectedUnresolved,
        ambiguous: fixture.expectedAmbiguous,
      },
    );
  }
});

test('App-profile mapping output is deterministic regardless of input order', () => {
  const profiles = [
    { id: 'profile-b', nameFa: 'غذای دوم', aliasesFa: [] },
    { id: 'profile-a', nameFa: 'غذای اول', aliasesFa: [] },
  ];
  const canons = [
    { canonId: 'IFKB-CANON-00002', nameFa: 'غذای دوم', aliasesFa: [] },
    { canonId: 'IFKB-CANON-00001', nameFa: 'غذای اول', aliasesFa: [] },
  ];

  assert.deepEqual(resolveAppProfilesToCanon(profiles, canons).mappings, [
    'profile-a=>IFKB-CANON-00001',
    'profile-b=>IFKB-CANON-00002',
  ]);
});

test('Source replacement decision matches the complete conservative 3×3 matrix', () => {
  for (const fixture of SOURCE_REPLACEMENT_PRECEDENCE_GOLDEN) {
    assert.equal(
      canFoodCatalogSourceReplace(
        fixture.existing as FoodCatalogSourceType,
        fixture.incoming as FoodCatalogSourceType,
      ),
      fixture.allowed,
      `${fixture.incoming} -> ${fixture.existing}`,
    );
  }
});
