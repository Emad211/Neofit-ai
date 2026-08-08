import assert from 'node:assert/strict';
import test from 'node:test';
import { foodFixtures, initialDiary } from '@/data/fixtures';
import { buildInitialWebDiary } from '@/lib/nutrition-adapter';
import {
  parseStoredWebDiary,
  serializeStoredWebDiary,
} from '@/lib/web-diary-storage';

const fixture = buildInitialWebDiary({
  foods: foodFixtures,
  seeds: initialDiary,
  localDate: '2026-08-06',
  timestamp: '2026-08-06T12:00:00.000Z',
});

test('storage envelope round-trips a valid diary including an intentionally empty diary', () => {
  assert.deepEqual(parseStoredWebDiary(serializeStoredWebDiary(fixture)), fixture);
  assert.deepEqual(parseStoredWebDiary(serializeStoredWebDiary([])), []);
});

test('legacy array storage remains readable during the v1 envelope migration', () => {
  assert.deepEqual(parseStoredWebDiary(JSON.stringify(fixture)), fixture);
});

test('malformed or unsafe diary payloads fail closed', () => {
  assert.equal(parseStoredWebDiary('{'), null);
  assert.equal(parseStoredWebDiary(JSON.stringify({ version: 99, diary: [] })), null);

  const negativeCalories = structuredClone(fixture) as any;
  negativeCalories[0]!.core.estimate.center.energyKcal = -10;
  assert.equal(parseStoredWebDiary(serializeStoredWebDiary(negativeCalories)), null);

  const invalidDate = structuredClone(fixture) as any;
  invalidDate[0]!.core.localDate = 'today';
  assert.equal(parseStoredWebDiary(serializeStoredWebDiary(invalidDate)), null);
});
