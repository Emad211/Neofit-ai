import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

function source(path: string) {
  return readFileSync(new URL(path, import.meta.url), 'utf8');
}

test('all runtime SQLite connections disable unsafe close-time FTS finalization', () => {
  const applicationDatabase = source('../src/db/database.ts');
  const universalCatalog = source('../src/db/universal-catalog-database.ts');

  assert.match(
    applicationDatabase,
    /finalizeUnusedStatementsBeforeClosing:\s*false/,
    'The persistent application database must keep the expo-sqlite FTS close workaround.',
  );
  assert.match(
    universalCatalog,
    /finalizeUnusedStatementsBeforeClosing:\s*false/,
    'The deserialized universal catalog must keep the expo-sqlite FTS close workaround.',
  );
  assert.match(
    universalCatalog,
    /useNewConnection:\s*true/,
    'The in-memory universal catalog must not share a pooled connection.',
  );
});
