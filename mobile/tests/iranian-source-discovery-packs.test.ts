import assert from 'node:assert/strict';
import test from 'node:test';
import {
  buildDiscoveryQueue,
  buildDiscoveryRecord,
} from '../scripts/generate-iranian-source-discovery-packs';

const item = {
  canonId: 'IFKB-CANON-00001',
  appProfileId: 'iranian-test',
  nameFa: 'غذای تست',
  nameEn: 'Test food',
  category: 'stew',
  readinessStatus: 'ds0_broad_fallback' as const,
  workstream: 'acquire_sources_and_recipe_profile' as const,
  priorityScore: 100,
};

test('discovery records create multilingual query packs without approving evidence', () => {
  const record = buildDiscoveryRecord(item, 'IRANIAN-BATCH-01', {
    aliases_fa: 'خورش تست|تست غذا',
    region: 'Iran',
    priority: 'P0',
  });
  assert.equal(record.discoveryMode, 'new_source_acquisition');
  assert.equal(record.minimumIndependentSourceGroups, 2);
  assert.ok(record.queriesFa.some((query) => query.includes('خورش تست')));
  assert.equal(record.sourceRecords.length, 0);
  assert.equal(record.reviewStatus, 'unstarted');
});

test('existing DS2 records are routed to completion rather than new identity discovery', () => {
  const record = buildDiscoveryRecord({
    ...item,
    readinessStatus: 'ds2_consensus_blocked',
    workstream: 'finish_ds2_normalization',
  }, 'IRANIAN-BATCH-01', { aliases_fa: null, region: null, priority: null });
  assert.equal(record.discoveryMode, 'existing_ds2_completion');
  assert.equal(record.minimumIndependentSourceGroups, 3);
  assert.match(record.targetEvidencePath, /yield/);
});

test('queue validates unique coverage across every batch', () => {
  const plan = {
    format: 'neofit-iranian-profile-batch-plan',
    version: '1.0.0',
    batchCount: 2,
    totalItems: 2,
    batches: [
      { batchId: 'IRANIAN-BATCH-01', items: [item] },
      { batchId: 'IRANIAN-BATCH-02', items: [{ ...item, canonId: 'IFKB-CANON-00002', appProfileId: 'iranian-test-2' }] },
    ],
  };
  const canonRows = [
    { canon_id: 'IFKB-CANON-00001', name_fa: '', name_en: '', aliases_fa: '', category: '', region: null, priority: null },
    { canon_id: 'IFKB-CANON-00002', name_fa: '', name_en: '', aliases_fa: '', category: '', region: null, priority: null },
  ];
  const result = buildDiscoveryQueue(plan, canonRows);
  assert.equal(result.records.length, 2);
  assert.equal(new Set(result.records.map((record) => record.canonId)).size, 2);
});
