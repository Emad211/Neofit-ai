# NeoFit AI

NeoFit AI is a Persian-first fitness and nutrition product built around the versioned IFKB catalog and deterministic TypeScript nutrition rules.

## Active product direction

The active product is a mobile-first installable PWA:

- Next.js App Router + strict TypeScript
- Persian default locale and RTL-first UI
- `packages/nutrition-core` as the shared deterministic nutrition authority
- Vercel Preview deployments
- Supabase Auth/Postgres/RLS for account and personal-data persistence
- IFKB + USDA SR Legacy + FNDDS as nutrition sources of truth
- AvalAI/Vision restricted to identity and plan-language assistance; provider nutrition is rejected

The Expo application under [`mobile/`](mobile/README.md) remains a frozen release-candidate reference and migration source.

## Current stage state

- Stage 0 — PWA pivot: complete
- Stage 1 — Persian RTL UX: complete and accepted
- Stage 2A — local PWA foundation: complete
- Stage 2B — protected Vercel HTTPS validation: active in Issue #16 / PR #28
- Stage 3 — Shared Nutrition Core and Web parity: complete
- Stage 4A — Supabase Project creation: complete
- Stage 4B — local config and SSR clients: complete and merged in PR #30
- Stage 4C — Identity schema and RLS: exact next stage
- Stage 4D — Nutrition persistence: not started
- Stage 5–9: not started

## Supabase Project

```text
name: neofit
project ref: rjwrobltmjodfarnltal
region: eu-central-1
status: ACTIVE_HEALTHY
```

Stage 4B now provides:

- fail-closed public environment validation;
- Browser and Server Supabase clients;
- cookie-aware request Proxy using `getClaims()`;
- `private, no-store` session responses;
- local Supabase config;
- secret-boundary and regression tests.

No key value is stored in Git. Remote `public` schema still contains zero Application tables. No migration، RLS policy، generated database type or Auth UI exists yet.

## Read first

Operational sources of truth:

- [`docs/NEOFIT_MASTER_PLAN.md`](docs/NEOFIT_MASTER_PLAN.md)
- [`docs/NEOFIT_PROGRESS_LOG.md`](docs/NEOFIT_PROGRESS_LOG.md)
- [`docs/DEVELOPMENT_HANDOFF.md`](docs/DEVELOPMENT_HANDOFF.md)
- [`docs/NEOFIT_STAGE4_SUPABASE_FOUNDATION_PLAN.md`](docs/NEOFIT_STAGE4_SUPABASE_FOUNDATION_PLAN.md)
- [`docs/NEOFIT_STAGE4A_PROJECT_PROVISIONING_EVIDENCE.md`](docs/NEOFIT_STAGE4A_PROJECT_PROVISIONING_EVIDENCE.md)
- [`docs/NEOFIT_STAGE4B_SUPABASE_SSR_FOUNDATION_EVIDENCE.md`](docs/NEOFIT_STAGE4B_SUPABASE_SSR_FOUNDATION_EVIDENCE.md)

Scientific/data contracts:

- [`docs/NEOFIT_WEB_PWA_ROADMAP_V1_FA.md`](docs/NEOFIT_WEB_PWA_ROADMAP_V1_FA.md)
- [`docs/NEOFIT_NUTRITION_FINAL_SCOPE_V3.md`](docs/NEOFIT_NUTRITION_FINAL_SCOPE_V3.md)
- [`docs/releases/NEOFIT_NUTRITION_RELEASE_CANDIDATE_FREEZE_V1.md`](docs/releases/NEOFIT_NUTRITION_RELEASE_CANDIDATE_FREEZE_V1.md)

## Locked rules

- Canonical IDs، mappings، fingerprints and provenance remain versioned.
- Missing nutrients are not zero; unknown serving weight remains `null`.
- Nutrition calculations remain deterministic and live in Shared Core.
- Language and vision models may not invent calories، macronutrients، weights or portions.
- SQL and React must not duplicate Nutrition arithmetic.
- Every exposed user-owned table requires RLS before use.
- privileged credentials must never enter Browser bundles، logs or artifacts.
- Dashboard edits are not Schema authority; migrations are.
- server authorization is not based only on `getSession()`.

## Exact next work

1. Merge the Stage 4B closure handoff.
2. Create `stage4c/identity-schema-rls` from the updated Integration head.
3. Write migration and RLS denial tests before applying remote DDL.
4. Add versioned `profiles` and `user_settings` migration، generated types and advisor checks.
5. Keep Stage 2B Vercel HTTPS validation independent in Issue #16 / PR #28.
