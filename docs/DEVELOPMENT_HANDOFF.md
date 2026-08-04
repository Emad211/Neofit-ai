# NeoFit Development Handoff

**Last verified:** 2026-08-05  
**Integration branch:** `web/pwa-foundation`  
**Active Supabase issue:** #25  
**Parallel Vercel issue/PR:** #16 / #28  
**Exact next stage:** Stage 4B — Supabase local config and SSR client foundation

## Mandatory read order

1. `docs/NEOFIT_MASTER_PLAN.md`
2. `docs/NEOFIT_PROGRESS_LOG.md`
3. `docs/NEOFIT_STAGE4_SUPABASE_FOUNDATION_PLAN.md`
4. `docs/NEOFIT_STAGE4A_PROJECT_PROVISIONING_EVIDENCE.md`
5. GitHub Issue/PR/CI state
6. Supabase and Vercel connector state

Do not continue from this file alone if it conflicts with the Master Plan or live tools.

## Proven product state

### Frozen Mobile/IFKB reference

The Expo application remains under `mobile/` as a frozen reference and migration source. The IFKB and scientific contracts remain authoritative.

### Web/PWA completed

- Persian RTL Product/UX foundation
- Next.js PWA shell، manifest، icons and Service Worker
- local visual and offline/cache QA
- Shared `packages/nutrition-core`
- Core parity `52/52`
- Web Adapter tests `9/9`

The current Web UI is still fixture/state based. It has no account persistence، real user database، full Auth UI، IndexedDB catalog sync or Web AI/Vision flow.

## Stage 4A — completed

The user explicitly accepted:

```text
Organization: Emad's Org (yzymkjsfqoohxbqkhzhs)
Region: eu-central-1
Cost: 0 monthly
Project name: neofit
```

Supabase Cost was re-read as `0 monthly`; `confirm_cost` ran; then a dedicated Project was created:

```text
name: neofit
project ref: rjwrobltmjodfarnltal
organization: yzymkjsfqoohxbqkhzhs
region: eu-central-1
status: ACTIVE_HEALTHY
api url: https://rjwrobltmjodfarnltal.supabase.co
```

Baseline:

- modern publishable key exists but its value is not in Git or docs.
- Service Role was not requested or exposed.
- `public` schema contains zero Application tables.
- no migration، RLS، generated types، Auth UI or user persistence exists.

Evidence authority:

- `docs/NEOFIT_STAGE4A_PROJECT_PROVISIONING_EVIDENCE.md`

## Process correction recorded

The Stage 4A Evidence file was initially created directly on Integration with placeholder content because the intended branch had not been created. It was immediately replaced with complete Evidence. A temporary `docs/.tmp` file was also immediately removed.

Impact:

- no Application code change.
- no Schema/Auth change.
- no Key entered Git.
- no Migration ran.
- no Runtime behavior changed.

Stage 4B must use a focused Branch/PR.

## Stage 4B exact scope

Create:

```text
stage4b/supabase-ssr-foundation
```

Target files:

```text
supabase/config.toml
web/lib/supabase/env.ts
web/lib/supabase/client.ts
web/lib/supabase/server.ts
web/lib/supabase/proxy.ts
web/proxy.ts
web/.env.example
web/tests/supabase-foundation.test.ts
```

Dependencies:

```text
@supabase/supabase-js
@supabase/ssr
supabase CLI only if required for config/type workflow
```

Required test-first contracts:

1. missing or malformed env fails clearly.
2. Browser client uses only Browser-safe variables.
3. Server client is cookie-aware.
4. Proxy synchronizes response cookies.
5. protected identity helper uses `getClaims()`.
6. Session-bearing routes are not shared/public cached.
7. Browser files contain no Service Role identifier/value.
8. `.env.example` contains names only.
9. no user table or remote migration is introduced in Stage 4B.
10. Web and Nutrition Core CI remain green.

## Stage 4C after 4B

Only after Stage 4B review/merge:

- versioned migration for `profiles` and `user_settings`.
- RLS enable and owner policies.
- generated database types.
- security/performance advisors.
- anon and cross-user denial tests.

## Stage 4D after 4C

- `nutrition_goals` and `nutrition_entries`.
- persist versioned Shared Core output without SQL recalculation.
- preserve absent nutrients and `grams: null`.
- idempotency foundation.
- round-trip tests.

## Parallel Vercel state

Stage 2B remains independent in Issue #16 / Draft PR #28. Supabase Project creation does not close or merge Vercel work.

## Locked contracts

- Shared Core remains Nutrition calculation authority.
- SQL and React do not recalculate Nutrition.
- Provider-created Nutrition is rejected.
- Canonical IDs/fingerprints change only through versioned migration/freeze.
- Every exposed user-owned table has RLS before use.
- Service Role never enters Browser code، logs or artifacts.
- Schema changes are migration-driven، not Dashboard-only.
- Server authorization is not based only on `getSession()`.

## Exact continuation point

1. Verify Integration HEAD and Core/Web CI after Stage 4A documentation updates.
2. Update Issue #25 with Project ref، URL، region، status and empty baseline schema.
3. Create `stage4b/supabase-ssr-foundation` from the verified Integration HEAD.
4. Open a focused Draft PR.
5. Implement tests/contracts before clients.
6. Add env/config/Browser/Server/Proxy foundation without tables.
7. Run CI، inspect review threads and update mandatory docs.
8. Do not begin Stage 4C until Stage 4B is reviewed and merged.
