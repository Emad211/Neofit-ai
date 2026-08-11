# NeoFit Web

Active Persian-first, mobile-first PWA built with Next.js App Router, strict TypeScript and Supabase.

## Current product boundary

- Authenticated accounts use Supabase Auth/Postgres with own-row RLS.
- Guest Demo data remains Browser-local and is never presented as account truth.
- `@neofit/nutrition-core` is the only nutrition arithmetic authority.
- Onboarding v2 is a 13-step explicit self-report contract with autosave and optimistic concurrency.
- AvalAI is required for resilient real-account Onboarding; Google is optional primary.
- Program Cycle Stage 22 owns course dates, lifecycle state, idempotency and immutable plan linkage.
- Exercise Registry Stage 23 owns exercise identity, deterministic safety and validated substitutions.
- Workout/Nutrition plans are versioned and their logged history retains provenance.
- Coach and YouTube tools are read-only; no silent mutation or unrestricted SQL exists.
- Service Worker registration is Production-only. Preview and development actively remove stale PWA state.

## Run and verify

From the repository root:

```bash
npm install
npm run typecheck:web
npm run build:web
npm run check:nutrition-core
npm run check:exercise-registry
```

From this directory:

```bash
npm run test:supabase-app
npm run test:program-cycle
npm run test:exercise-registry
npm run typecheck
npm run build
npm run dev
```

Real account/provider verification requires the environment contract documented in `../docs/NEOFIT_PREVIEW_LAB.md`. Secrets are never committed.

## Current roadmap

1. Stage 21 rendered/runtime proof.
2. Stage 22 hosted Program Cycle runtime proof.
3. Stage 23 hosted database/runtime proof.
4. Stage 24 structured Training/Nutrition planners.
5. Stage 25 coordinated review and activation.
6. Stage 26 proposal/diff/confirmation.
7. Stage 27 confirmed future-plan mutation tools.

Canonical references:

- `../docs/NEOFIT_GAP_AUDIT_2026-08-08.md`
- `../docs/NEOFIT_COACH_PROGRAM_LIFECYCLE_ARCHITECTURE.md`
- `../docs/NEOFIT_STAGE21_ONBOARDING_SELF_REPORT_V2.md`
- `../docs/NEOFIT_STAGE22_PROGRAM_CYCLE.md`
- `../docs/NEOFIT_STAGE23_EXERCISE_REGISTRY.md`

Required rendered review widths are 360px, 390px, 430px and desktop. Preview-only; Production promotion remains out of scope until hosted lifecycle evidence is green.
