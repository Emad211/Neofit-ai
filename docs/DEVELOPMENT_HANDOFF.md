# NeoFit Development Handoff

**Last verified:** 2026-08-05  
**Integration branch:** `web/pwa-foundation`  
**Integration HEAD:** `13a9407374d2d84d754dcf5eb7d50b8b4176bb64`  
**Active Supabase branch/PR:** `stage4b/supabase-ssr-foundation` / #30  
**Active Supabase issue:** #25  
**Parallel Vercel issue/PR:** #16 / #28  
**Exact next action:** finish Stage 4B final CI/review and merge gate

## Mandatory read order

1. `docs/NEOFIT_MASTER_PLAN.md`
2. `docs/NEOFIT_PROGRESS_LOG.md`
3. `docs/NEOFIT_STAGE4_SUPABASE_FOUNDATION_PLAN.md`
4. `docs/NEOFIT_STAGE4A_PROJECT_PROVISIONING_EVIDENCE.md`
5. `docs/NEOFIT_STAGE4B_SUPABASE_SSR_FOUNDATION_EVIDENCE.md`
6. GitHub Issue/PR/CI state
7. Supabase and Vercel connector state

Do not continue from this file alone if it conflicts with Master Plan or live tools.

## Proven product state

### Frozen Mobile/IFKB reference

The Expo application remains under `mobile/` as a frozen reference and migration source. IFKB and scientific contracts remain authoritative.

### Web/PWA completed

- Persian RTL Product/UX foundation
- Next.js PWA shell، manifest، icons and Service Worker
- local visual and offline/cache QA
- Shared `packages/nutrition-core`
- Core parity `52/52`
- Web Adapter tests `9/9`

The current Web UI remains fixture/state based. It has no live account UI، user persistence، IndexedDB catalog sync or Web AI/Vision flow.

## Stage 4A — complete

Dedicated Project:

```text
name: neofit
project ref: rjwrobltmjodfarnltal
organization: yzymkjsfqoohxbqkhzhs
region: eu-central-1
status: ACTIVE_HEALTHY
api url: https://rjwrobltmjodfarnltal.supabase.co
```

- cost accepted and confirmed at `0 monthly`.
- key values are not in Git/docs.
- privileged key was not requested or exposed.
- baseline public Application tables: 0.

Authority:

- `docs/NEOFIT_STAGE4A_PROJECT_PROVISIONING_EVIDENCE.md`.

## Stage 4B — implementation candidate green

Draft PR #30 implements:

```text
supabase/config.toml
web/lib/supabase/env.ts
web/lib/supabase/client.ts
web/lib/supabase/server.ts
web/lib/supabase/proxy.ts
web/proxy.ts
web/.env.example
web/tests/supabase-foundation.test.ts
.github/workflows/supabase-foundation-ci.yml
```

Dependencies:

```text
@supabase/supabase-js 2.110.9
@supabase/ssr 0.12.3
```

Runtime contracts:

- public env validation fails closed.
- remote URL must use HTTPS؛ local HTTP limited to localhost/127.0.0.1.
- Browser client uses `createBrowserClient`.
- Server client imports `server-only` and uses async cookie store.
- Proxy mirrors refreshed cookies onto request and response.
- protected identity refresh uses `auth.getClaims()`.
- authorization does not rely on `getSession()`.
- session response is `private, no-store`.
- Proxy currently matches only future `/auth/*` and `/account/*` paths.
- existing PWA/public routes remain unaffected before environment rollout.
- `.env.example` keeps existing App/Vercel contract and blank Supabase values.
- no remote migration، table or RLS policy exists.

### Test-first red proof

```text
Head: dc8e718d4a95f0cdf271840578157bf599de3183
Web CI: 30957552355 — failure
Foundation CI: 30957552028 — failure
First error: missing web/lib/supabase/env.ts
```

### Green proof

```text
Candidate head: d796ff66469be062602cc08c11be4f7da6e9279f
```

Supabase Foundation:

```text
Run: 30958021239 — success
Artifact: 8911823269
Digest: sha256:72ea57192d121d72474611a65d3a50ea31975336f76f45c6bbdc0f6471d772d5
```

Web:

```text
Run: 30958021241 — success
Artifact: 8911836376
Digest: sha256:f9b43059040787f990a601c2be559958adda963660d0d15b2fc5a4611cabbb97
```

Vercel Build Contract:

```text
Run: 30958021244 — success
```

Passed:

- Stage 4B contracts `10/10`.
- strict TypeScript.
- Shared Core boundary/typecheck/`52/52`.
- secret scan.
- Web Adapter parity.
- Next build.
- Visual/PWA/offline/cache gates.
- repository-root Vercel workspace/build contract.

### Base sync

Integration advanced with Vercel repair commit:

```text
13a9407374d2d84d754dcf5eb7d50b8b4176bb64
```

Stage 4B synchronized conflict-free through:

```text
e36b5310fc443afbc4f69ca6bf73ca921c050a5c
```

Branch is behind Integration by zero commits.

### Corrections

- preserved existing App/Vercel `.env.example` assignments.
- fixed TypeScript-only dynamic import suffix without removing Assertions.
- narrowed secret grep from explanatory docs to runtime/config; Browser source boundary remains separately tested.

### Remote boundary

Supabase recheck after implementation:

```text
public schema Application tables: 0
```

No migration، table، policy or remote schema mutation ran.

Authority:

- `docs/NEOFIT_STAGE4B_SUPABASE_SSR_FOUNDATION_EVIDENCE.md`.

## Stage 4C after Stage 4B merge

Start only in a new focused Branch/PR:

- versioned migration for `profiles` and `user_settings`.
- RLS enable and owner policies.
- generated database types.
- security/performance advisors.
- anon and cross-user denial tests.

Do not use Dashboard-only Schema changes.

## Stage 4D after Stage 4C

- `nutrition_goals` and `nutrition_entries`.
- persist versioned Shared Core output without SQL recalculation.
- preserve absent nutrients and `grams: null`.
- idempotency foundation.
- round-trip tests.

## Parallel Vercel state

Stage 2B protected HTTPS validation remains independent in Issue #16 / Draft PR #28. Stage 4B does not close or merge that work.

## Locked contracts

- Shared Core remains Nutrition calculation authority.
- SQL and React do not recalculate Nutrition.
- Provider-created Nutrition is rejected.
- Canonical IDs/fingerprints change only through versioned migration/freeze.
- Every exposed user-owned table has RLS before use.
- privileged credentials never enter Browser code، logs or artifacts.
- Schema changes are migration-driven، not Dashboard-only.
- Server authorization is not based only on `getSession()`.

## Exact continuation point

1. Run Foundation/Web/Vercel CI on the final documentation head.
2. Inspect PR #30 changed files and review threads.
3. Keep PR Draft until all final gates are green.
4. Mark PR #30 Ready and merge with expected head.
5. Record post-merge SHA، CI، artifacts and Issue #25 state in mandatory docs.
6. Create a new Stage 4C branch/PR and begin migration/RLS tests before DDL application.
7. Keep Stage 2B Vercel independent and open.
