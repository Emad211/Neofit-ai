# NeoFit Stage 15 — AI Request Audit, Budget and Observability

Status: implementation / Preview-only; stacked on Stage 14.

## Goal

Make every provider-backed NeoFit AI request observable and bounded **without** adding a hidden LLM call, storing sensitive content, or introducing a privileged Supabase key into the Web runtime.

Stage 15 is a prerequisite for write-agent proposals. It does not make the Coach more autonomous.

## Request path

```text
Browser
  -> same-origin NeoFit Route Handler
  -> live Auth validation (existing Stage 13 boundary)
  -> load encrypted BYOK metadata/key under RLS
  -> find an eligible provider
  -> reserve one NeoFit AI request in Postgres
  -> Google first
       -> success: complete one audit row
       -> fallback-eligible failure: AvalAI
            -> success/failure: complete the same audit row
```

A Google -> AvalAI fallback is **one user request** with `attempt_count=2`, not two budget reservations.

If there is no active provider credential, NeoFit does not reserve/consume AI request budget because no provider request will be made.

## Request limits

Server-only defaults:

- burst: `12` requests / rolling 60 seconds per user;
- hourly: `120` requests / rolling 1 hour per user.

Optional server environment overrides:

- `AI_REQUEST_BURST_PER_MINUTE`
- `AI_REQUESTS_PER_HOUR`

The values are bounded in application code. The hourly value can never be lower than the burst value.

When the limit is exceeded, the AI route returns HTTP `429` plus `Retry-After`. NeoFit does not blindly retry provider inference.

## Atomic reservation

`public.reserve_ai_request(...)` uses a transaction advisory lock keyed by `auth.uid()` before counting and inserting. This prevents parallel requests from racing past the same budget boundary.

The count includes `pending`, `success` and `failure` rows. A process crash after reservation therefore remains conservative: the reserved request still counts rather than becoming a rate-limit bypass.

## Database source of truth

Table: `public.ai_request_audit`

Stored metadata:

- request kind: `coach | respond`;
- state: `pending | success | failure`;
- final/last provider;
- model id;
- fallback provider;
- attempt count;
- total router latency;
- input/system/output character counts;
- provider-reported input/output/total token counts when present;
- short normalized failure code;
- created/completed timestamps.

Never stored:

- user prompt;
- Coach history;
- system instruction text;
- model output text;
- Google/AvalAI API key;
- encrypted credential material;
- raw provider request/response payload;
- health/body/nutrition context payload.

Character counts are metadata only; they are not reversible content storage.

## Token accounting

NeoFit does **not** issue a preflight token-count request.

The primary provider call already returns usage metadata when available. Stage 15 normalizes common response fields:

- Gemini Interactions: `total_input_tokens`, `total_output_tokens`, `total_tokens`;
- OpenAI-compatible Responses providers: `input_tokens`, `output_tokens`, `total_tokens`;
- compatible legacy aliases are accepted when present.

If the provider does not return a supported usage field, NeoFit stores `null`. It does not estimate tokens from characters and does not make another inference/token-count call.

## RLS and privilege model

The initial migration created the table and RPCs. Supabase Security Advisor then correctly warned that authenticated users could execute `SECURITY DEFINER` functions.

Stage 15 hardened that design instead of suppressing the warning:

- both RPCs are `SECURITY INVOKER`;
- authenticated users can SELECT only their own rows via RLS;
- authenticated INSERT privilege is column-scoped to only `(user_id, request_kind)`;
- `created_at`, status and audit metadata cannot be supplied on direct insert;
- authenticated UPDATE privilege is limited to completion metadata only;
- `user_id`, `request_kind`, `id` and `created_at` are not updateable;
- UPDATE RLS only allows an owned `pending` row to become `success` or `failure`;
- DELETE is not granted;
- all ownership checks use `auth.uid()`.

A user could directly create extra own pending rows and therefore consume their **own** budget. They cannot backdate a row, delete one, modify another user's row, reduce the count, or bypass the fixed budget reservation performed by the NeoFit route.

Completion metadata is operational observability, not a financial/billing ledger. The authoritative abuse control is the immutable request reservation/count.

## No privileged Web key

Stage 15 does not add:

- `SUPABASE_SERVICE_ROLE_KEY`;
- `sb_secret_*`;
- an admin Supabase client;
- an Edge Function hop just for logging.

The same authenticated Supabase session already used by the AI route performs the budget RPCs under RLS/column grants.

## Request cost

Healthy provider path:

- existing Auth validation;
- existing credential lookup;
- one Postgres reservation RPC;
- one Google provider request;
- one Postgres audit completion RPC.

No AvalAI call occurs on Google success.
No count-token request occurs.
No classifier LLM request occurs.
No logging webhook/Edge Function hop occurs.

The second provider request exists only when Google fails with a fallback-eligible provider error.

## Failure semantics

- no configured/eligible provider -> no budget reservation, existing `ai_not_configured` behavior;
- budget exceeded -> `429 ai_request_budget_exceeded` + `Retry-After`;
- budget database unavailable -> fail closed with `503 ai_request_budget_unavailable`, avoiding unbounded provider calls;
- provider failure -> same provider error semantics as before, plus best-effort metadata completion;
- audit completion failure never replaces an otherwise successful model answer.

## Schema/type synchronization

Stage 15 regenerates `web/lib/supabase/database.types.ts` from the live Supabase schema. This also repairs older type drift by bringing `body_measurements`, `ai_request_audit`, `reserve_ai_request` and `complete_ai_request` into the generated contract.

## Live database evidence

Migrations:

- `20260809131359_ai_request_audit_budget`
- `20260809132552_harden_ai_request_audit_rpc_invoker`

After the hardening migration, Supabase Security Advisor no longer reports either AI audit RPC. The remaining project-level security warning is only leaked-password protection, which is plan-gated on the current Free project.

The audit table currently has zero rows, so the new index is expected to appear as unused until real provider traffic is tested.

## CI contract

`AI Request Audit Budget CI` runs:

- request-audit unit/source contracts;
- complete Supabase app regression;
- TypeScript;
- Next production build;
- privacy/request-budget boundary checks.

The gate rejects:

- prompt/output/key columns in the audit schema;
- direct Web `insert/update/delete/upsert` against `ai_request_audit`;
- provider `countTokens` / `count_tokens` calls;
- privileged Supabase keys in the AI runtime;
- loss of the final SECURITY INVOKER/RLS privilege model.

## Hosted proof still required

After the Preview deployment quota is available, one real Google Coach request must prove:

1. one `ai_request_audit` row is created;
2. status becomes `success`;
3. provider is Google;
4. attempt count is 1;
5. no prompt/output content is stored;
6. token counts populate only if Google returns usage;
7. no AvalAI request occurs.

Then one controlled Google failure with AvalAI configured must prove one row with `attempt_count=2` and the expected fallback metadata.

## Release rule

Preview only. Do not enable write-agent actions or Production promotion merely because Stage 15 code is green. Real BYOK/fallback runtime proof remains required.
