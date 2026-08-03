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

test('nutrition document reseeding removes portions before replacing variants', () => {
  const repository = source('../src/db/nutrition-food-repository.ts');
  const portionDelete = repository.indexOf('DELETE FROM nutrition_portions');
  const variantDelete = repository.indexOf('DELETE FROM nutrition_food_variants');

  assert.notEqual(portionDelete, -1, 'The nutrition upsert must explicitly remove existing portions.');
  assert.notEqual(variantDelete, -1, 'The nutrition upsert must replace existing variants.');
  assert.ok(
    portionDelete < variantDelete,
    'Existing portions must be deleted before their variants so repeated seed synchronization is idempotent.',
  );
});
