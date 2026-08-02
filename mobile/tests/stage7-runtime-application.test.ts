import assert from 'node:assert/strict';
import test from 'node:test';
import type * as SQLite from 'expo-sqlite';
import { STAGE7_LEGACY_PORTION_OVERRIDES } from '../src/data/stage7-legacy-portion-overrides.generated';
import { applyStage7LegacyPortionOverrides } from '../src/db/apply-stage7-legacy-portions';

function mockDatabase(skippedIds: ReadonlySet<string>) {
  const seenIds: string[] = [];
  const database = {
    async withExclusiveTransactionAsync(
      callback: (transaction: { runAsync: (sql: string, ...args: unknown[]) => Promise<{ changes: number }> }) => Promise<void>,
    ) {
      await callback({
        async runAsync(sql: string, ...args: unknown[]) {
          assert.match(sql, /source_type = 'seeded'/);
          const id = String(args.at(-1));
          seenIds.push(id);
          return { changes: skippedIds.has(id) ? 0 : 1 };
        },
      });
    },
  } as unknown as SQLite.SQLiteDatabase;
  return { database, seenIds };
}

test('applies all 30 corrections when every target is still seeded', async () => {
  const { database, seenIds } = mockDatabase(new Set());
  const updated = await applyStage7LegacyPortionOverrides(database);
  assert.equal(updated, 30);
  assert.deepEqual(seenIds, STAGE7_LEGACY_PORTION_OVERRIDES.map((row) => row.appProfileId));
});

test('preserves imported precedence without turning skipped seeded updates into an error', async () => {
  const skippedIds = new Set([
    STAGE7_LEGACY_PORTION_OVERRIDES[0]!.appProfileId,
    STAGE7_LEGACY_PORTION_OVERRIDES[12]!.appProfileId,
  ]);
  const { database, seenIds } = mockDatabase(skippedIds);
  const updated = await applyStage7LegacyPortionOverrides(database);
  assert.equal(updated, 28);
  assert.equal(seenIds.length, 30);
});
