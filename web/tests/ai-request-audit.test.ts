import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { aiRequestBudgetLimits, normalizeAiUsage } from '@/lib/ai/request-audit';

const webRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const repoRoot = resolve(webRoot, '..');

async function read(relativePath: string) {
  return readFile(resolve(webRoot, relativePath), 'utf8');
}

async function readRepo(relativePath: string) {
  return readFile(resolve(repoRoot, relativePath), 'utf8');
}

test('usage normalization reads Gemini Interactions and OpenAI-compatible response counters without guessing', () => {
  assert.deepEqual(normalizeAiUsage({
    total_input_tokens: 101,
    total_output_tokens: 37,
    total_tokens: 144,
    total_thought_tokens: 6,
  }), { inputTokens: 101, outputTokens: 37, totalTokens: 144 });

  assert.deepEqual(normalizeAiUsage({
    input_tokens: 22,
    output_tokens: 8,
    total_tokens: 30,
  }), { inputTokens: 22, outputTokens: 8, totalTokens: 30 });

  assert.deepEqual(normalizeAiUsage({ unexpected: 1 }), {
    inputTokens: null,
    outputTokens: null,
    totalTokens: null,
  });
});

test('request budget defaults are explicit and server-configurable within bounded ranges', () => {
  const beforeBurst = process.env.AI_REQUEST_BURST_PER_MINUTE;
  const beforeHourly = process.env.AI_REQUESTS_PER_HOUR;
  delete process.env.AI_REQUEST_BURST_PER_MINUTE;
  delete process.env.AI_REQUESTS_PER_HOUR;
  assert.deepEqual(aiRequestBudgetLimits(), { burstPerMinute: 12, requestsPerHour: 120 });

  process.env.AI_REQUEST_BURST_PER_MINUTE = '25';
  process.env.AI_REQUESTS_PER_HOUR = '10';
  assert.deepEqual(aiRequestBudgetLimits(), { burstPerMinute: 25, requestsPerHour: 25 });

  if (beforeBurst === undefined) delete process.env.AI_REQUEST_BURST_PER_MINUTE;
  else process.env.AI_REQUEST_BURST_PER_MINUTE = beforeBurst;
  if (beforeHourly === undefined) delete process.env.AI_REQUESTS_PER_HOUR;
  else process.env.AI_REQUESTS_PER_HOUR = beforeHourly;
});

test('audit schema is metadata-only and rate reservation is atomic', async () => {
  const migration = await readRepo('supabase/migrations/20260809131359_ai_request_audit_budget.sql');
  assert.match(migration, /create table public\.ai_request_audit/);
  assert.match(migration, /enable row level security/);
  assert.match(migration, /pg_advisory_xact_lock/);
  assert.match(migration, /created_at >= v_now - interval '60 seconds'/);
  assert.match(migration, /created_at >= v_now - interval '1 hour'/);
  assert.doesNotMatch(migration, /\b(prompt|response_text|output_text|api_key|raw_payload)\s+text\b/i);
});

test('final audit privilege model is RLS-native SECURITY INVOKER with immutable budget fields', async () => {
  const hardening = await readRepo('supabase/migrations/20260809132552_harden_ai_request_audit_rpc_invoker.sql');
  assert.match(hardening, /grant select on table public\.ai_request_audit to authenticated/);
  assert.match(hardening, /grant insert \(user_id, request_kind\)/);
  assert.match(hardening, /grant update \([\s\S]*completed_at[\s\S]*\) on table public\.ai_request_audit to authenticated/);
  assert.doesNotMatch(hardening, /grant delete/i);
  assert.doesNotMatch(hardening, /grant insert \([^)]*created_at/i);
  assert.doesNotMatch(hardening, /grant update \([^)]*created_at/i);
  assert.doesNotMatch(hardening, /grant update \([^)]*user_id/i);
  assert.match(hardening, /insert_own_pending/);
  assert.match(hardening, /complete_own_pending/);
  assert.match(hardening, /alter function public\.reserve_ai_request\([^;]+\) security invoker/);
  assert.match(hardening, /alter function public\.complete_ai_request\([^;]+\) security invoker/);
});

test('provider router reserves one user request before the fallback chain and completes one audit row', async () => {
  const router = await read('lib/ai/provider-router.ts');
  assert.match(router, /reserveAiRequest\(authContext, requestKind\)/);
  assert.equal((router.match(/reserveAiRequest\(/g) ?? []).length, 1);
  assert.match(router, /for \(const provider of eligibleProviders\)/);
  assert.match(router, /attemptCount \+= 1/);
  assert.match(router, /status: 'success'/);
  assert.match(router, /status: 'failure'/);
  assert.match(router, /fallbackFrom/);
});

test('telemetry never adds a token-count or extra provider inference request', async () => {
  const audit = await read('lib/ai/request-audit.ts');
  const google = await read('lib/ai/providers/google.ts');
  const avalai = await read('lib/ai/providers/avalai.ts');
  assert.doesNotMatch(audit, /countTokens|count_tokens|generateFromProvider|fetch\(/);
  assert.doesNotMatch(google, /countTokens|count_tokens/);
  assert.doesNotMatch(avalai, /countTokens|count_tokens/);
});

test('budget failures map to 429 + Retry-After before callers retry blindly', async () => {
  const coach = await read('app/api/ai/coach/route.ts');
  const respond = await read('app/api/ai/respond/route.ts');
  for (const route of [coach, respond]) {
    assert.match(route, /AiBudgetExceededError/);
    assert.match(route, /ai_request_budget_exceeded/);
    assert.match(route, /'Retry-After'/);
    assert.match(route, /status: 429/);
  }
});

test('generated Supabase types include the live audit table and RPC functions', async () => {
  const types = await read('lib/supabase/database.types.ts');
  assert.match(types, /ai_request_audit:/);
  assert.match(types, /complete_ai_request:/);
  assert.match(types, /reserve_ai_request:/);
  assert.match(types, /body_measurements:/);
});
