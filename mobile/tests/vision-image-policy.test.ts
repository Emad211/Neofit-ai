import assert from 'node:assert/strict';
import test from 'node:test';
import {
  VISION_IMAGE_MAX_BYTES,
  calculateVisionResize,
  estimateBase64ByteLength,
  validatePreparedVisionImage,
} from '../src/nutrition-core';

test('vision resize preserves aspect ratio and caps the largest side', () => {
  assert.deepEqual(calculateVisionResize(4_000, 3_000), { width: 1_024, height: 768 });
  assert.deepEqual(calculateVisionResize(900, 1_200), { width: 768, height: 1_024 });
  assert.deepEqual(calculateVisionResize(800, 600), { width: 800, height: 600 });
});

test('base64 byte length accounts for padding', () => {
  assert.equal(estimateBase64ByteLength('TQ=='), 1);
  assert.equal(estimateBase64ByteLength('TWE='), 2);
  assert.equal(estimateBase64ByteLength('TWFu'), 3);
});

test('prepared Vision image rejects oversized dimensions or payloads', () => {
  assert.doesNotThrow(() => validatePreparedVisionImage({ width: 1_024, height: 768, byteLength: 500_000 }));
  assert.throws(
    () => validatePreparedVisionImage({ width: 1_025, height: 768, byteLength: 500_000 }),
    /exceeds 1024px/,
  );
  assert.throws(
    () => validatePreparedVisionImage({ width: 1_024, height: 768, byteLength: VISION_IMAGE_MAX_BYTES + 1 }),
    /exceeds 1500000 bytes/,
  );
});
