import assert from 'node:assert/strict';
import test from 'node:test';
import {
  buildBalancedBatches,
  classifyGenericRecord,
  classifyIranianRecord,
  parseCsvRecords,
} from '../scripts/audit-full-nutrition-catalog';

test('generic readiness uses fail-closed precedence', () => {
  assert.equal(classifyGenericRecord({ macroCompleteness: 1, portionCount: 1, conceptId: null }), 'missing_concept_mapping');
  assert.equal(classifyGenericRecord({ macroCompleteness: 0, portionCount: 1, conceptId: 'concept' }), 'macro_incomplete');
  assert.equal(classifyGenericRecord({ macroCompleteness: 1, portionCount: 0, conceptId: 'concept' }), 'macro_ready_no_official_portion');
  assert.equal(classifyGenericRecord({ macroCompleteness: 1, portionCount: 2, conceptId: 'concept' }), 'macro_and_portion_ready');
});

test('DS2 identity consensus overrides legacy estimate but never enables promotion', () => {
  const result = classifyIranianRecord({
    baseProfileType: 'legacy_seed',
    hasDs2Consensus: true,
    portionGrams: null,
    confidence: 'medium',
    category: 'stew',
    canonicalPriority: 'P0',
  });
  assert.equal(result.readinessStatus, 'ds2_consensus_blocked');
  assert.equal(result.workstream, 'finish_ds2_normalization');
  assert.equal(result.evidenceTier, 'digital_consensus_identity_only');
});

test('DS0 profiles are routed to broad source acquisition', () => {
  const result = classifyIranianRecord({
    baseProfileType: 'ds0_fallback',
    hasDs2Consensus: false,
    portionGrams: null,
    confidence: 'low',
    category: 'rice',
    canonicalPriority: null,
  });
  assert.equal(result.readinessStatus, 'ds0_broad_fallback');
  assert.equal(result.workstream, 'acquire_sources_and_recipe_profile');
  assert.equal(result.dataUse, 'app_continuity_only');
});

test('balanced batching covers all records exactly once', () => {
  const rows = Array.from({ length: 261 }, (_, index) => ({
    canonId: `IFKB-CANON-${String(index + 1).padStart(5, '0')}`,
    priorityScore: 300 - index,
  }));
  const batches = buildBalancedBatches(rows, 12);
  assert.equal(batches.length, 12);
  const flattened = batches.flatMap((batch) => batch.items.map((item) => item.canonId));
  assert.equal(flattened.length, 261);
  assert.equal(new Set(flattened).size, 261);
  const sizes = batches.map((batch) => batch.items.length);
  assert.equal(Math.min(...sizes), 21);
  assert.equal(Math.max(...sizes), 22);
});

test('CSV parser preserves quoted commas and escaped quotes', () => {
  const rows = parseCsvRecords('id,name,note\n1,"Food, cooked","A ""quoted"" note"\n');
  assert.deepEqual(rows, [{ id: '1', name: 'Food, cooked', note: 'A "quoted" note' }]);
});
