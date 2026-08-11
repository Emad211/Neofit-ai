# NeoFit Stage 22 — Program Cycle Lifecycle

Status: **code + local/hosted Supabase migration green; real-account create + redirect proof green; adversarial hosted proof still open**. Preview-only.

Stage 22 introduces the first user-owned course lifecycle entity. It deliberately stops before exercise selection or nutrition planning.

## Implemented contract

- `program_cycles` is owner-scoped under RLS.
- One non-completed cycle may exist per user.
- Start date and requested duration are copied only from a parse-valid completed Onboarding v2 draft.
- End date is derived by Postgres from the inclusive 14–84 day range.
- The row stores Onboarding schema/revision provenance and a SHA-256 snapshot fingerprint, not a copied health narrative.
- `ensure_program_cycle` is idempotent and serialized per user with an advisory transaction lock.
- `transition_program_cycle` requires the expected revision and enforces the bounded state graph.
- Workout/Nutrition linkage uses owner/id/version composite foreign keys.
- No raw prompt, API key or provider response is stored.

State graph:

```text
draft -> generating -> ready -> active -> completed
                     \-> failed
failed -> generating
active -> paused -> active
paused -> completed
```

`ready`, `active`, `paused` and `completed` require both immutable plan links. Stage 22 therefore exposes only a truthful `draft` until Stage 23/24 validators and planners exist.

## Application flow

```text
completed Onboarding v2
  -> /onboarding/ready
  -> explicit “ساخت چرخهٔ دوره” Server Action
  -> parse persisted draft
  -> deterministic hashes/idempotency key
  -> ensure_program_cycle RPC
  -> /program
```

The root lifecycle route now requires active AvalAI for the real-account Onboarding gate, treats Google as optional primary and routes an existing open cycle to `/program`.

## Verification

- `npm run test:program-cycle`
- `npm run test:supabase-app`
- `npm run typecheck`
- `npm run build`
- 2026-08-11: migration `20260811120000_program_cycle_lifecycle` applied transactionally to hosted project `rjwrobltmjodfarnltal` and recorded in `supabase_migrations.schema_migrations`.
- 2026-08-11: the connected real account created a 15-day `draft` cycle from `/onboarding/ready`; the Server Action redirected to `/program`, where the persisted cycle and exact date range rendered.

Dedicated CI: `.github/workflows/program-cycle-ci.yml`.

## Remaining proof

- repeat creation and prove the same cycle is returned;
- attempt a stale transition revision and prove it fails;
- confirm a second open cycle is rejected;
- inspect RLS from a second account;
- capture `/onboarding/ready` and `/program` at 360/390/430px and desktop.

## Next domain stage

Stage 23 adds a typed Exercise Registry and deterministic safety/substitution rules. Stage 24 may then transition a cycle into generation and attach validated immutable Workout/Nutrition plan versions.
