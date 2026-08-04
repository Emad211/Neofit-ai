# NeoFit Development Handoff

**Last verified:** 2026-08-05  
**Integration branch:** `web/pwa-foundation`  
**Stage 4B merge:** `17d0e8c33ed9ba6329f243dee27b8cf8de53056c`  
**Active Supabase issue:** #25  
**Parallel Vercel issue/PR:** #16 / #28  
**Exact next stage:** Stage 4C — Identity schema and RLS

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

## Stage 4B — complete and merged

Implementation PR #30 added:

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

### Final proof

```text
Head: 7ed955139d51b3546b489c8f649f144f390cb8f0

Foundation CI 30958530329 — success
Artifact 8912018526
Digest sha256:1455fd4ff726ac4ee2a5cbb0a99dd09d3528becb2f86ce9dd858cbdb37e6cba7

Nutrition Core CI 30958530294 — success
Artifact 8912013429
Digest sha256:649639a40dc0b20594ea48e6534cc6cd215a170fd251699279032a5a4d68b12c

Web CI 30958530262 — success
Artifact 8912039816
Digest sha256:790d13b030e96038be394ec50108da38c601988f8bb9106b57b8153892a83c6a

Vercel Build Contract 30958530296 — success
```

Merge:

```text
PR #30
expected head: 7ed955139d51b3546b489c8f649f144f390cb8f0
merge SHA: 17d0e8c33ed9ba6329f243dee27b8cf8de53056c
```

Remote boundary after merge:

```text
public schema Application tables: 0
```

Authority:

- `docs/NEOFIT_STAGE4B_SUPABASE_SSR_FOUNDATION_EVIDENCE.md`.

## Stage 4C — exact next

Create a new focused Branch/PR:

```text
stage4c/identity-schema-rls
```

Required sequence:

1. write static migration and policy tests before DDL application.
2. define a single timestamped migration for `profiles` and `user_settings`.
3. enable RLS before any Application use.
4. prove own-row access and anon/cross-user denial.
5. apply remote migration only after static/local review.
6. generate `web/lib/supabase/database.types.ts`.
7. run Supabase security and performance advisors.
8. record migration، generated-type and RLS evidence.

Planned ownership:

- `profiles.id = auth.uid()`.
- `user_settings.user_id = auth.uid()`.
- both `using` and `with check` required for write policies.

No Dashboard-only Schema edits are allowed.

## Stage 4D after Stage 4C

- `nutrition_goals` and `nutrition_entries`.
- persist versioned Shared Core output without SQL recalculation.
- preserve absent nutrients and `grams: null`.
- idempotency foundation.
- round-trip tests.

## Parallel Vercel state

Stage 2B protected HTTPS validation remains independent in Issue #16 / PR #28.

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

1. Merge the Stage 4B closure handoff.
2. Update Issue #25 with Stage 4B complete / Stage 4C next.
3. Create `stage4c/identity-schema-rls` from closure Integration head.
4. Write migration/RLS tests before remote DDL.
5. Apply versioned migration only after review.
6. Generate types، run advisors and prove denial scenarios.
7. Keep Stage 2B Vercel independent and open.
