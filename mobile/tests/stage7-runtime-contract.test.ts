import assert from 'node:assert/strict';
import test from 'node:test';
import {
  STAGE7_LEGACY_PORTION_OVERRIDE_COUNT,
  STAGE7_LEGACY_PORTION_OVERRIDES,
} from '../src/data/stage7-legacy-portion-overrides.generated';

test('Stage 7 has exactly 30 unique, positive seeded portion corrections', () => {
  assert.equal(STAGE7_LEGACY_PORTION_OVERRIDE_COUNT, 30);
  assert.equal(new Set(STAGE7_LEGACY_PORTION_OVERRIDES.map((row) => row.canonId)).size, 30);
  assert.equal(new Set(STAGE7_LEGACY_PORTION_OVERRIDES.map((row) => row.appProfileId)).size, 30);
  for (const row of STAGE7_LEGACY_PORTION_OVERRIDES) {
    assert.match(row.canonId, /^IFKB-CANON-\d{5}$/);
    assert.ok(row.servingGrams > 0 && row.servingGrams <= 5_000);
    assert.ok(row.portionLabelFa.trim());
    assert.ok(row.portionLabelEn.trim());
    assert.ok(row.reason.trim());
  }
});
