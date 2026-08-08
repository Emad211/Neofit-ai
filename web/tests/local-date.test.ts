import assert from 'node:assert/strict';
import test from 'node:test';
import {
  DEFAULT_NEOFIT_TIME_ZONE,
  formatLocalDate,
  normalizeTimeZone,
} from '@/lib/local-date';

test('formatLocalDate uses the configured profile timezone instead of UTC slicing', () => {
  const instant = new Date('2026-08-06T20:45:00.000Z');
  assert.equal(formatLocalDate(instant, 'UTC'), '2026-08-06');
  assert.equal(formatLocalDate(instant, 'Asia/Tehran'), '2026-08-07');
});

test('invalid or missing timezones fall back to the NeoFit default', () => {
  assert.equal(normalizeTimeZone(undefined), DEFAULT_NEOFIT_TIME_ZONE);
  assert.equal(normalizeTimeZone('Not/AZone'), DEFAULT_NEOFIT_TIME_ZONE);
  assert.equal(normalizeTimeZone('Asia/Tokyo'), 'Asia/Tokyo');
});
