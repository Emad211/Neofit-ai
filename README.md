# NeoFit AI

NeoFit AI is a Persian-first fitness and nutrition product built around the versioned IFKB catalog and deterministic TypeScript nutrition rules.

## Active product direction

The active product is a mobile-first installable PWA:

- Next.js App Router + strict TypeScript
- Persian default locale and RTL-first UI
- `packages/nutrition-core` as the shared deterministic nutrition authority
- Vercel Preview deployments
- Supabase Auth/Postgres/RLS for future account and personal-data persistence
- IFKB + USDA SR Legacy + FNDDS as nutrition sources of truth
- AvalAI/Vision restricted to identity and plan-language assistance; provider nutrition is rejected

The Expo application under [`mobile/`](mobile/README.md) remains a frozen release-candidate reference and migration source. Web work must not continue inside the historical mobile PR #3.

## Current verified stage state

- Stage 0 — PWA pivot: complete
- Stage 1 — Persian RTL UX: complete and accepted
- Stage 2A — local PWA foundation: complete
- Stage 2B — Vercel Preview/HTTPS: active in Issue #16 and Draft PR #28
- Stage 3 — shared Nutrition Core and Web parity: complete
- Stage 4 — Supabase foundation: planning merged; project creation waits for explicit Organization/Region/Cost acceptance
- Stage 5–9: not started

Stage 2B has a real Next.js Preview build and a protected-browser QA workflow. The Remote suite is waiting for two external conditions:

1. Vercel daily deployment quota reset for an exact-head Preview;
2. `VERCEL_AUTOMATION_BYPASS_SECRET` configured outside Git so Playwright can access the protected Preview.

The current connected Share URL flow redirects through Vercel SSO and cannot preserve its browser cookie, so Remote HTTPS behavior is not yet claimed as passed.

## Read first

Operational sources of truth:

- [`docs/NEOFIT_MASTER_PLAN.md`](docs/NEOFIT_MASTER_PLAN.md)
- [`docs/NEOFIT_PROGRESS_LOG.md`](docs/NEOFIT_PROGRESS_LOG.md)
- [`docs/DEVELOPMENT_HANDOFF.md`](docs/DEVELOPMENT_HANDOFF.md)
- [`docs/NEOFIT_VERCEL_PREVIEW_QA.md`](docs/NEOFIT_VERCEL_PREVIEW_QA.md)

Architecture and scientific contracts:

- [`docs/NEOFIT_WEB_PWA_ROADMAP_V1_FA.md`](docs/NEOFIT_WEB_PWA_ROADMAP_V1_FA.md)
- [`docs/NEOFIT_STAGE4_SUPABASE_FOUNDATION_PLAN.md`](docs/NEOFIT_STAGE4_SUPABASE_FOUNDATION_PLAN.md)
- [`docs/NEOFIT_NUTRITION_FINAL_SCOPE_V3.md`](docs/NEOFIT_NUTRITION_FINAL_SCOPE_V3.md)
- [`docs/releases/NEOFIT_NUTRITION_RELEASE_CANDIDATE_FREEZE_V1.md`](docs/releases/NEOFIT_NUTRITION_RELEASE_CANDIDATE_FREEZE_V1.md)

## Locked product rules

- Canonical IFKB identifiers, mappings, fingerprints and provenance remain versioned.
- Missing nutrients are not zero; unknown serving weight remains `null`.
- Nutrition calculations remain deterministic and live in Shared Core.
- Language and vision models may not invent calories, macronutrients, weights or portions.
- AI meal-plan ingredients must resolve to IFKB/FNDDS/SR before persistence.
- Imported and custom user records remain protected from bundled catalog updates.
- SQL and React must not duplicate nutrition arithmetic.
- Service Role credentials must never enter Browser bundles, logs or artifacts.
- Vercel Share/Bypass tokens must never enter Git, comments, logs or artifacts.

## Exact next work

Two gates are active:

1. Finish Stage 2B:
   - wait for Vercel quota reset;
   - obtain an exact-head Preview;
   - configure `VERCEL_AUTOMATION_BYPASS_SECRET` outside Git;
   - run `Vercel Preview HTTPS QA`;
   - close Issue #16 and merge PR #28 only after all Remote checks pass.
2. Start Stage 4A only after explicit acceptance of:

```text
Organization: Emad's Org (yzymkjsfqoohxbqkhzhs)
Region: eu-central-1
Cost: 0 monthly
```

No Supabase Project, Auth, migration or RLS exists yet.
