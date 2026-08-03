import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import test from 'node:test';

const mobileRoot = resolve(import.meta.dirname, '..');
const catalogPath = resolve(mobileRoot, 'src/data/iranian-food-image-catalog.ts');
const manifestPath = resolve(mobileRoot, 'data/ifkb/releases/0.19.0-stage8/manifest.json');

function runtimeRequires(source: string): string[] {
  return [...source.matchAll(/require\('([^']+)'\)/g)].map((match) => match[1]!);
}

test('Stage 8 runtime images have 24 licensed primaries and 9 explicit placeholders', () => {
  const source = readFileSync(catalogPath, 'utf8');
  assert.equal((source.match(/kind: 'licensed_primary'/g) ?? []).length, 24);
  assert.equal((source.match(/kind: 'category_placeholder'/g) ?? []).length, 9);
  assert.equal((source.match(/attributionRequired: true/g) ?? []).length, 24);
  assert.equal((source.match(/sourcePageUrl: "https?:\/\//g) ?? []).length, 24);
  assert.ok((source.match(/licenseUrl: "https?:\/\//g) ?? []).length >= 23);
  assert.ok(!source.includes("source: { uri:"), 'runtime images must be bundled, not remote');

  const requires = runtimeRequires(source);
  assert.equal(requires.length, 33);
  for (const required of requires) {
    const asset = resolve(mobileRoot, 'src/data', required);
    assert.ok(existsSync(asset), `missing Metro asset: ${asset}`);
    const bytes = readFileSync(asset);
    assert.ok(bytes.length > 1_000, `asset too small: ${asset}`);
    assert.equal(bytes[0], 0xff, `asset is not JPEG: ${asset}`);
    assert.equal(bytes[1], 0xd8, `asset is not JPEG: ${asset}`);
  }
});

test('Stage 8 manifest freezes runtime-only image policy and file hashes', () => {
  const manifest = JSON.parse(readFileSync(manifestPath, 'utf8')) as {
    primaryCount: number;
    placeholderCount: number;
    nutritionGoldAllowed: boolean;
    primary: Array<{ canonId: string; processedSha256: string; width: number; height: number }>;
    placeholders: Array<{ category: string; processedSha256: string; width: number; height: number }>;
  };
  assert.equal(manifest.primaryCount, 24);
  assert.equal(manifest.placeholderCount, 9);
  assert.equal(manifest.nutritionGoldAllowed, false);
  assert.equal(new Set(manifest.primary.map((row) => row.canonId)).size, 24);
  for (const row of [...manifest.primary, ...manifest.placeholders]) {
    assert.match(row.processedSha256, /^[a-f0-9]{64}$/);
    assert.equal(row.width, 768);
    assert.equal(row.height, 576);
  }
});
