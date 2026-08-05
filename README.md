# NeoFit AI

NeoFit AI is a Persian-first fitness and nutrition product built around versioned IFKB data, deterministic TypeScript nutrition rules and a secure Supabase persistence foundation.

## Active product direction

The target product is a mobile-first installable PWA:

- Next.js App Router + strict TypeScript
- Persian default locale and RTL-first UI
- `packages/nutrition-core` as the deterministic Nutrition authority
- Supabase Auth/Postgres/RLS for account and personal-data persistence
- IFKB + USDA SR Legacy + FNDDS as nutrition sources of truth
- AI/Vision restricted to identity and plan-language assistance; provider Nutrition is rejected

The Expo application under [`mobile/`](mobile/README.md) remains a frozen reference and migration source.

## Current stage state

- Stage 0 — PWA pivot: complete
- Stage 1 — Persian RTL UX: complete and accepted
- Stage 2A — local PWA foundation: complete
- Stage 2B — protected Vercel HTTPS validation: active/parallel in Issue #16 / PR #28
- Stage 3 — Shared Nutrition Core and Web parity: complete
- Stage 4A — Supabase Project: complete
- Stage 4B — SSR clients and session foundation: complete/merged in PR #30
- Stage 4C — Identity schema and RLS: implemented and remotely proven in Draft PR #33; not merged
- Stage 4D — Nutrition persistence: not started; next only after Stage 4C merge
- Complete Persian frontend: browser-proven in separate Draft PR #34; not yet ported into current `web/` architecture
- Stage 5–9: not started

## Supabase Project

```text
name: neofit
project ref: rjwrobltmjodfarnltal
region: eu-central-1
status: ACTIVE_HEALTHY
```

Current Supabase foundation:

- fail-closed Browser environment validation;
- Browser and Server Supabase clients;
- cookie-aware Proxy using `getClaims()`;
- `private, no-store` session responses;
- migration-driven schema authority;
- live `profiles` and `user_settings` tables;
- RLS enabled with own-row policies;
- generated TypeScript database types;
- zero Security and Performance advisor lints.

No key value is stored in Git. No privileged credential is exposed to Browser code.

Stage 4C evidence:

```text
migration: 20260804232149_identity_foundation.sql
Identity CI: 30996283909 — success
Foundation CI: 30996283993 — success
Web CI: 30996283899 — success
Vercel Build Contract: 30996283903 — success
Runtime RLS denial scenarios: 7/7 passed
Post-test rows/users: 0/0/0
```

## Complete frontend branch

The full Persian UI contract exists on:

```text
branch: revival/full-ui-front
Draft PR: #34
runtime head: d36a67b001a280fefbba6c676e69fb4f22ff20b2
routes: 42/42
```

It contains complete Onboarding, Today, Workout, Nutrition, Progress, Profile/Settings, Notifications, local Coach, PWA/offline and accessibility states.

It must not be merged directly into `web/pwa-foundation`. The later integration must port the proven UI into `web/` while preserving Supabase SSR and Shared Nutrition Core.

## Read first

Operational sources of truth:

- [`docs/NEOFIT_MASTER_PLAN.md`](docs/NEOFIT_MASTER_PLAN.md)
- [`docs/NEOFIT_PROGRESS_LOG.md`](docs/NEOFIT_PROGRESS_LOG.md)
- [`docs/DEVELOPMENT_HANDOFF.md`](docs/DEVELOPMENT_HANDOFF.md)
- [`docs/NEOFIT_STAGE4_SUPABASE_FOUNDATION_PLAN.md`](docs/NEOFIT_STAGE4_SUPABASE_FOUNDATION_PLAN.md)
- [`docs/NEOFIT_STAGE4A_PROJECT_PROVISIONING_EVIDENCE.md`](docs/NEOFIT_STAGE4A_PROJECT_PROVISIONING_EVIDENCE.md)
- [`docs/NEOFIT_STAGE4B_SUPABASE_SSR_FOUNDATION_EVIDENCE.md`](docs/NEOFIT_STAGE4B_SUPABASE_SSR_FOUNDATION_EVIDENCE.md)
- [`docs/NEOFIT_STAGE4C_IDENTITY_RLS_EVIDENCE.md`](docs/NEOFIT_STAGE4C_IDENTITY_RLS_EVIDENCE.md)

Frontend completion sources on `revival/full-ui-front`:

- `docs/NEOFIT_FRONTEND_COMPLETION_PLAN.md`
- `docs/NEOFIT_FRONTEND_PROGRESS_LOG.md`

Scientific/data contracts:

- [`docs/NEOFIT_WEB_PWA_ROADMAP_V1_FA.md`](docs/NEOFIT_WEB_PWA_ROADMAP_V1_FA.md)
- [`docs/NEOFIT_NUTRITION_FINAL_SCOPE_V3.md`](docs/NEOFIT_NUTRITION_FINAL_SCOPE_V3.md)
- [`docs/releases/NEOFIT_NUTRITION_RELEASE_CANDIDATE_FREEZE_V1.md`](docs/releases/NEOFIT_NUTRITION_RELEASE_CANDIDATE_FREEZE_V1.md)

## Locked rules

- Canonical IDs, mappings, fingerprints and provenance remain versioned.
- Missing nutrients are not zero; unknown serving weight remains `null`.
- Nutrition calculations live in Shared Core.
- Language and vision models may not invent calories, macronutrients, weights or portions.
- SQL and React must not duplicate Nutrition arithmetic.
- Every exposed user-owned table requires RLS before use.
- privileged credentials must never enter Browser bundles, logs or artifacts.
- Dashboard edits are not Schema authority; migrations are.
- Server authorization is not based only on `getSession()`.
- Divergent frontend and architecture branches are integrated by controlled porting, not direct merge.

## Exact next work

1. Keep PR #33 Draft/unmerged until explicit approval.
2. After approval, merge Stage 4C and record closure evidence.
3. Start Stage 4D test-first for `nutrition_goals` and `nutrition_entries`.
4. Plan a separate integration branch to port PR #34 UI into the current `web/` architecture.
5. Keep Stage 2B Vercel validation independent in Issue #16 / PR #28.
