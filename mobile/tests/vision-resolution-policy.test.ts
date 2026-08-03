import assert from 'node:assert/strict';
import test from 'node:test';
import { decideVisionResolution } from '../src/nutrition-core';

function candidate(input: Partial<{
  localId: string;
  label: string;
  localScore: number;
  confidence: number | null;
  visibleComponents: readonly string[];
}> = {}) {
  return {
    localId: input.localId ?? 'food-1',
    label: input.label ?? 'قورمه سبزی',
    localScore: input.localScore ?? 1_000,
    confidence: input.confidence === undefined ? 0.9 : input.confidence,
    visibleComponents: input.visibleComponents ?? [],
  };
}

test('Vision resolution abstains when no local candidate reaches the minimum score', () => {
  const decision = decideVisionResolution({
    candidates: [candidate({ localScore: 219 })],
  });
  assert.equal(decision.mode, 'no_match');
  assert.equal(decision.bestIndex, null);
  assert.deepEqual(decision.choiceIndexes, []);
});

test('Vision resolution auto-selects one strong unambiguous identity', () => {
  const decision = decideVisionResolution({
    candidates: [candidate()],
  });
  assert.equal(decision.mode, 'auto_select');
  assert.equal(decision.bestIndex, 0);
  assert.deepEqual(decision.reasons, []);
});

test('Mixed plates require explicit confirmation and preserve distinct visible components', () => {
  const decision = decideVisionResolution({
    candidates: [candidate({ visibleComponents: ['برنج', 'خورش', ' برنج '] })],
  });
  assert.equal(decision.mode, 'confirm');
  assert.ok(decision.reasons.includes('multiple_visible_components'));
  assert.deepEqual(decision.visibleComponents, ['برنج', 'خورش']);
});

test('Close alternatives require confirmation and duplicate local identities are collapsed', () => {
  const decision = decideVisionResolution({
    candidates: [
      candidate({ localId: 'food-a', label: 'کباب کوبیده', localScore: 900, confidence: 0.8 }),
      candidate({ localId: 'food-a', label: 'کوبیده', localScore: 880, confidence: 0.75 }),
      candidate({ localId: 'food-b', label: 'کباب برگ', localScore: 850, confidence: 0.8 }),
    ],
  });
  assert.equal(decision.mode, 'confirm');
  assert.ok(decision.reasons.includes('close_alternative'));
  assert.deepEqual(decision.choiceIndexes, [0, 2]);
});

test('Low confidence, weak local matches and provider warnings never auto-select', () => {
  const decision = decideVisionResolution({
    candidates: [candidate({ localScore: 350, confidence: null })],
    providerWarnings: ['poor angle'],
  });
  assert.equal(decision.mode, 'confirm');
  assert.ok(decision.reasons.includes('low_provider_confidence'));
  assert.ok(decision.reasons.includes('weak_local_match'));
  assert.ok(decision.reasons.includes('provider_warning'));
});
