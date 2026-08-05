# NeoFit Development Handoff

**Last verified:** 2026-08-05  
**Integration branch:** `web/pwa-foundation`  
**Active architecture PR:** #33 — Stage 4C, Draft/unmerged  
**Completed frontend PR:** #34 — Draft/unmerged  
**Active Supabase issue:** #25  
**Parallel Vercel issue/PR:** #16 / #28  
**Exact next after approval:** merge/close Stage 4C, then start Stage 4D test-first

## Mandatory read order

1. `docs/NEOFIT_MASTER_PLAN.md`
2. `docs/NEOFIT_PROGRESS_LOG.md`
3. `docs/NEOFIT_STAGE4_SUPABASE_FOUNDATION_PLAN.md`
4. `docs/NEOFIT_STAGE4C_IDENTITY_RLS_EVIDENCE.md`
5. `docs/NEOFIT_FRONTEND_COMPLETION_PLAN.md` on `revival/full-ui-front`
6. GitHub Issue/PR/CI state
7. Supabase and Vercel live state

Do not continue from this file alone if it conflicts with the Master Plan or live tools.

## 1. Proven architecture state

### Shared foundations

- Next.js App Router + strict TypeScript under `web/`.
- Shared deterministic Nutrition authority: `packages/nutrition-core`.
- Core parity: `52/52`.
- Web Adapter parity: `9/9`.
- IFKB/USDA/FNDDS contracts remain authoritative.
- SQL and React must not recalculate Nutrition.

### Stage 4A Project

```text
name: neofit
project ref: rjwrobltmjodfarnltal
organization: yzymkjsfqoohxbqkhzhs
region: eu-central-1
status: ACTIVE_HEALTHY
postgres: 17.6.1.155
```

No key value is committed or documented.

### Stage 4B merged

```text
implementation PR: #30
merge SHA: 17d0e8c33ed9ba6329f243dee27b8cf8de53056c
closure head: 72202f2f0ff281bf0624b9ebb933ac5afeaad8fc
```

Runtime contracts:

- fail-closed public env parsing؛
- Browser `createBrowserClient`؛
- server-only cookie-aware `createServerClient`؛
- request/response cookie synchronization؛
- `getClaims()` protected identity refresh؛
- no authorization based only on `getSession()`؛
- `private, no-store` session responses؛
- blank Supabase values in `.env.example`.

Authority:

- `docs/NEOFIT_STAGE4B_SUPABASE_SSR_FOUNDATION_EVIDENCE.md`

## 2. Stage 4C current truth

**Branch:** `stage4c/identity-schema-rls`  
**Draft PR:** #33  
**Validated implementation head:** `c5cface86f46134a4a0afcfc3c980f7ce613ee7a`

Repository migration and Remote history are aligned:

```text
20260804232149_identity_foundation.sql
remote version: 20260804232149
remote name: identity_foundation
```

Remote schema:

```text
profiles       RLS enabled
user_settings  RLS enabled
```

Remote security proof:

- exactly eight own-row policies؛
- INSERT uses `WITH CHECK`؛
- UPDATE uses `USING` + `WITH CHECK`؛
- policies target `authenticated` only؛
- authenticated has SELECT/INSERT/UPDATE/DELETE؛
- anon and PUBLIC have no table grant؛
- secure `updated_at` triggers exist؛
- Security advisors: 0؛
- Performance advisors: 0.

Runtime denial proof passed:

```text
anon_read_denied
user_a_reads_own
user_a_cannot_read_b
user_a_cannot_update_b
user_a_cannot_delete_b
user_a_cannot_insert_as_b
ownership_change_denied
```

Post-test cleanup:

```text
profiles: 0
user_settings: 0
auth.users: 0
```

Generated types:

```text
web/lib/supabase/database.types.ts
```

CI:

```text
Identity CI 30996283909 — success
Artifact 8926287946
Digest sha256:192ae440dfb98fb2329249fb3b1f0c881841b5774d2ec642c63efdd6f34fcfe9

Foundation CI 30996283993 — success
Artifact 8926292359
Digest sha256:528deb7235762d631751f5a6d8b469fe6a7291e49900b6e2f30c7c4f0ee9b549

Web CI 30996283899 — success
Artifact 8926312456
Digest sha256:60064bab80150fcb72c0952d29a2466625d4b11d1dcd667ee2d628d617deecc2

Vercel Build Contract 30996283903 — success
```

Authority:

- `docs/NEOFIT_STAGE4C_IDENTITY_RLS_EVIDENCE.md`

Important: Stage 4C is implemented and remotely proven, but it is not merged. Do not call it Integration-complete before PR #33 merges.

## 3. Completed frontend branch

**Branch:** `revival/full-ui-front`  
**Draft PR:** #34

Frontend contract is complete and browser-proven:

```text
runtime head: d36a67b001a280fefbba6c676e69fb4f22ff20b2
UI Revival CI: 30994858208 — success
Public Static Export: 30994858276 — success
Public RawGitHack Preview: 30994858167 — success
routes: 42/42
```

It includes:

- 15-step Onboarding and 73-region injury Body Map؛
- Today, Workout, Nutrition and Progress؛
- Profile, Settings and Notifications؛
- local Coach with safety boundary؛
- PWA/offline/system/accessibility hardening.

This branch is not the current monorepo Web architecture. It must not be merged directly into `web/pwa-foundation`.

Correct later migration:

1. create a focused integration branch from current architecture;
2. port UI routes/components into `web/`;
3. retain Supabase SSR and Shared Nutrition Core;
4. retain local adapter as deterministic demo fixture;
5. replace adapters incrementally with real persistence;
6. run the same browser matrix after every slice.

## 4. Stage 4D after Stage 4C merge

Scope:

- `nutrition_goals`؛
- `nutrition_entries`؛
- RLS before Application use؛
- Shared Core output persistence only؛
- no SQL arithmetic؛
- preserve missing nutrients and `grams: null`؛
- `client_mutation_id` idempotency؛
- generated types؛
- round-trip and cross-user denial evidence؛
- Advisors.

Stage 4D must start with red migration/RLS tests before new Remote DDL.

## 5. Locked contracts

- Shared Core remains Nutrition calculation authority.
- Provider-created Nutrition is rejected.
- Canonical IDs/fingerprints change only through versioned migration/freeze.
- Every exposed user-owned table has RLS before use.
- privileged credentials never enter Browser, logs or artifacts.
- Schema changes are migration-driven, not Dashboard-only.
- Server authorization is not based only on `getSession()`.
- PR #33 and PR #34 remain Draft/unmerged until explicit approval.

## 6. Exact continuation point

1. Synchronize Issue #25 and PR #33 with Stage 4C evidence.
2. Verify CI on the final documentation head.
3. Do not merge PR #33 without explicit user approval.
4. After approval, merge PR #33 and create Stage 4C closure evidence.
5. Start Stage 4D in a new focused branch with red contracts.
6. Plan the complete-frontend port separately; no direct merge of PR #34 into the architecture branch.
7. Keep Stage 2B Issue #16 / PR #28 independent and open.
