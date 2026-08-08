import assert from 'node:assert/strict';
import test from 'node:test';
import type { SupabaseClient } from '@supabase/supabase-js';
import { bootstrapAccount } from '@/lib/supabase/bootstrap';
import type { Database } from '@/lib/supabase/database.types';

interface UpsertCall {
  readonly table: string;
  readonly values: Record<string, unknown>;
  readonly options: { readonly onConflict?: string; readonly ignoreDuplicates?: boolean };
}

function fakeClient(errorTable?: string) {
  const calls: UpsertCall[] = [];
  const client = {
    from(table: string) {
      return {
        async upsert(
          values: Record<string, unknown>,
          options: { readonly onConflict?: string; readonly ignoreDuplicates?: boolean },
        ) {
          calls.push({ table, values, options });
          return { error: table === errorTable ? new Error(`failed:${table}`) : null };
        },
      };
    },
  } as unknown as SupabaseClient<Database>;
  return { client, calls };
}

test('bootstrapAccount creates only universally safe identity/settings rows', async () => {
  const { client, calls } = fakeClient();
  await bootstrapAccount(client, {
    userId: '11111111-1111-1111-1111-111111111111',
    email: 'person@example.com',
    displayName: '  کاربر تست  ',
  });

  assert.deepEqual(calls.map((call) => call.table), ['profiles', 'user_settings']);
  assert.deepEqual(calls.map((call) => call.options), [
    { onConflict: 'id', ignoreDuplicates: true },
    { onConflict: 'user_id', ignoreDuplicates: true },
  ]);
  assert.equal(calls[0]?.values.display_name, 'کاربر تست');
  assert.equal(calls[0]?.values.timezone, 'Asia/Tehran');
  assert.equal(calls[1]?.values.theme, 'system');
  assert.equal(calls.some((call) => call.table === 'nutrition_goals'), false);
});

test('bootstrapAccount retries then surfaces a failed safe first-account insert', async () => {
  const { client, calls } = fakeClient('user_settings');
  await assert.rejects(
    bootstrapAccount(client, {
      userId: '22222222-2222-2222-2222-222222222222',
      email: 'person@example.com',
    }),
    /failed:user_settings/,
  );
  assert.equal(calls.filter((call) => call.table === 'user_settings').length, 2);
  assert.equal(calls.some((call) => call.table === 'nutrition_goals'), false);
});
