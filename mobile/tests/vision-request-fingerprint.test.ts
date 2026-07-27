import assert from 'node:assert/strict';
import test from 'node:test';
import { createVisionRequestFingerprint } from '../src/nutrition-core';

const firstImage = 'data:image/jpeg;base64,aGVsbG8=';
const secondImage = 'data:image/jpeg;base64,d29ybGQ=';

test('Vision request fingerprints are stable and never expose image bytes', () => {
  const first = createVisionRequestFingerprint({
    imageDataUrl: firstImage,
    description: '  قورمه‌سبزی  ',
    locale: 'fa',
  });
  const repeated = createVisionRequestFingerprint({
    imageDataUrl: firstImage,
    description: 'قورمه‌سبزی',
    locale: 'fa',
  });

  assert.equal(first, repeated);
  assert.match(first, /^vision-fnv1a128-v1:[0-9a-f]{32}$/);
  assert.doesNotMatch(first, /aGVsbG8|data:image|قورمه/);
});

test('Vision request fingerprints separate image, locale and typed context', () => {
  const baseline = createVisionRequestFingerprint({
    imageDataUrl: firstImage,
    description: 'rice',
    locale: 'en',
  });
  const changedImage = createVisionRequestFingerprint({
    imageDataUrl: secondImage,
    description: 'rice',
    locale: 'en',
  });
  const changedLocale = createVisionRequestFingerprint({
    imageDataUrl: firstImage,
    description: 'rice',
    locale: 'fa',
  });
  const changedDescription = createVisionRequestFingerprint({
    imageDataUrl: firstImage,
    description: 'rice and salad',
    locale: 'en',
  });

  assert.notEqual(baseline, changedImage);
  assert.notEqual(baseline, changedLocale);
  assert.notEqual(baseline, changedDescription);
});

test('Vision request fingerprint rejects non-image data URLs', () => {
  assert.throws(
    () => createVisionRequestFingerprint({
      imageDataUrl: 'https://example.com/food.jpg',
      description: undefined,
      locale: 'en',
    }),
    /image data URL/,
  );
});
