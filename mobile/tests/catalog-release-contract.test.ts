import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import { IFKB_CATALOG_RELEASE } from '../src/nutrition-core';

test('catalog release contract matches the bundled manifest and database bytes', () => {
  const manifest = JSON.parse(
    readFileSync(new URL('../assets/ifkb/ifkb-universal-v1.manifest.json', import.meta.url), 'utf8'),
  ) as Record<string, unknown>;
  const database = readFileSync(new URL('../assets/ifkb/ifkb-universal-v1.db', import.meta.url));
  const digest = createHash('sha256').update(database).digest('hex');

  for (const [key, value] of Object.entries(IFKB_CATALOG_RELEASE)) {
    assert.equal(manifest[key], value, `Catalog manifest field ${key} drifted from the runtime contract.`);
  }
  assert.equal(database.byteLength, IFKB_CATALOG_RELEASE.databaseBytes);
  assert.equal(digest, IFKB_CATALOG_RELEASE.databaseSha256);
});
