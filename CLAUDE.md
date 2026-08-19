# NeoFit AI — repository instructions

Persian-first (fa/RTL), mobile-first PWA for nutrition, training and an AI coach.
**The active product is `web/`.** Everything else is a supporting authority, a data pipeline, or frozen history.

## Layout

| Path | Role |
|---|---|
| `web/` | Active product. Next.js App Router, strict TS, Supabase, PWA. |
| `packages/nutrition-core/` | Pure, deterministic **sole authority** for all nutrition arithmetic. |
| `packages/exercise-registry/` | Versioned authority for exercise identity, safety decisions, substitutions. |
| `supabase/migrations/` | 24 versioned SQL migrations. The only way schema changes. |
| `docs/` | Stage contracts + evidence. Authority order below. |
| `ifkb/` | Python food/image data pipeline. **Expansion deferred by product decision** — do not schedule catalog work. |
| `mobile/` | Frozen Expo/SQLite app, historical local-first reference. Separate deps, not an npm workspace. |

npm workspaces are `web`, `packages/nutrition-core`, `packages/exercise-registry` only. `mobile/` has its own `node_modules` and lockfile; install inside it if you ever touch it.

## Toolchain

Node **22.13.1** (`.nvmrc`, `engines: 22.x`) · Next **16.3.0** · React **19.2.8** · TypeScript **6.0.3**.

**There is no ESLint or Prettier anywhere in this repo.** Do not add one. Style is enforced by reading neighbouring files: 2-space indent, single quotes, semicolons, `readonly` on interface fields, `as const` on literal tables, short one-line guard clauses.

`web/CLAUDE.md` and `web/AGENTS.md` are **generated and re-added by `next dev`** — never hand-edit them; if they show up dirty, commit them with your work.

## Commands

Run from the repo root:

```bash
npm run typecheck:web           # tsc --noEmit
npm run build:web               # next build (real gate — CI always runs it)
npm run check:nutrition-core    # purity boundary + typecheck + 52 tests
npm run check:exercise-registry # typecheck + 5 tests
```

Feature gates live in `web/package.json` and run from `web/`:

```bash
npm run test:supabase-app    # broad regression bundle (~17 test files)
npm run test:program-cycle   # Stage22 lifecycle + Stage24 generation
npm run test:ui-truth        # source-level UI honesty contracts
npm run test:ui-polish       # accessibility regressions
```

Dev server: `cd web && npm run dev -- -p 3001` (port 3000 is taken by Docker on this machine). If every route but `/` 404s, `rm -rf web/.next` and restart. `npm run predev/prebuild` generates PWA icons automatically.

Verified green on this branch: `check:nutrition-core` 52/52, `check:exercise-registry` 5/5, `typecheck:web` clean, `test:ui-truth` 10/10, `test:program-cycle` 11/11.

## Non-negotiable product invariants

Violating one of these is a bug even if it typechecks and looks better.

1. **Nutrition Core is the only arithmetic authority.** No calories/macros computed in SQL, React, or a model response. A model may *select* a catalog identity + portion; Core computes the numbers.
2. **A model never becomes persisted authority.** Plans store catalog/exercise identity + source version + portion count. Model-authored kcal/macros are rejected, not stored.
3. **Guest and Account data never mix.** Guest is explicit browser-local Demo; it must never be presented as account truth or claim a generated program.
4. **Raw API keys stay in the server-side AES-GCM vault.** Never in onboarding JSON, browser storage, audit rows, logs, or any `NEXT_PUBLIC_*` variable.
5. **Coach is read-only.** No unrestricted SQL, no silent mutation. Writes will arrive as typed proposal → exact diff → explicit confirmation → new immutable version (Stage 26/27, not yet built).
6. **Plans are immutable and versioned.** Revisions create a new version affecting future scope only. Completed workout sessions and logged diary history are never rewritten.
7. **`unset != explicit user value != technical default`.** Onboarding must never infer a personal fact from an untouched control or `null`. No preselected personal categorical/boolean answers.
8. **`user_onboarding.draft` is untrusted JSON.** Always go through `parseOnboardingDraft` in `web/lib/onboarding/model.ts`. Never read raw draft fields in planner/generation code.
9. **Safety is deterministic, not inferential.** Medical/injury data is a hard validator input; `evaluateExerciseSafety` and `safetyProfileFromOnboarding` decide, and the model receives only pre-screened candidates.
10. **Preview only.** No Production promotion, no new Vercel project, no `--prod`, no production domain until the hosted lifecycle proofs in the gap audit are green.

## Architectural conventions

- **Server boundary:** any module reaching credentials, providers, or the vault starts with `import 'server-only'` (`lib/ai/*`, `lib/program-generation/planners.ts`). Mutations are Server Actions in `actions.ts` next to their route.
- **Path alias:** `@/*` → `web/*`. Cross-package imports use `@neofit/nutrition-core` / `@neofit/exercise-registry` (file: deps, listed in `transpilePackages`).
- **Concurrency:** every account write carries an expected revision or `updated_at`. Stale writes must fail loudly, never overwrite. Generation claims its revision *before* spending provider budget (see `web/app/(main)/program/actions.ts`).
- **Fail closed:** parsers bound length/shape and throw typed error codes (`ProgramMaterializationError`, `ProgramPlannerError`, `planner_id_invalid`, …). Never coerce malformed persisted data into a plausible default.
- **Provider routing:** normal request → Google only; eligible failure → AvalAI fallback. Never add a probe/classifier request just to route. Budgets and cooldowns are in `lib/ai/config.ts`; audit rows store metadata only, never prompts or keys.
- **Migrations:** `security invoker`, `set search_path = ''`, fully-qualified `public.*`, advisory locks for per-user serialization, own-row RLS on every user table. Never edit an applied migration — add a new timestamped one.
- **CSS:** global stylesheets are imported in a deliberate cascade order in `web/app/layout.tsx` (`product-ui-v3*.css` last, as overrides). Preserve that order; add new overrides at the end rather than editing earlier layers.
- **Copy is Persian and user-facing.** No implementation vocabulary in the UI — no "fixture", "Demo", "versioned catalog", "persistence", "schema". `test:ui-truth` asserts this by grepping components.

## Testing model

`node --import tsx --test` with `node:assert/strict`. Two distinct kinds:

- **Behavioural** — golden-file parity (`*-golden-v1.ts`) and logic tests. Regenerating a golden file to make a test pass is a data-truth change, not a test fix.
- **Source-assertion** — `ui-truth-audit.test.ts` and `ui-polish-accessibility.test.ts` read component source and assert on exact Persian strings, `aria-*` attributes and hit targets. **Renaming or rewording a screen will break these**; update the test in the same commit and keep the rule it protects intact.

CI workflows are narrow and path-filtered (`.github/workflows/*`); several also grep source for contract markers. Match the surrounding workflow shape when adding one.

## Secrets and environment

`.env*` and `.vercel` are gitignored. Contract lives in `web/.env.example`. Server-only: `AI_CREDENTIAL_ENCRYPTION_KEY`, `AUTH_RECOVERY_INTENT_KEY` (each base64 of exactly 32 bytes), `AI_REQUEST_*` budgets. Browser gets only `NEXT_PUBLIC_SUPABASE_URL` / `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` / `NEXT_PUBLIC_APP_URL` / `NEXT_PUBLIC_VERCEL_ENV`. Never print a key value into a file, a doc, or a commit.

Service Worker registration is Production-only; Preview and dev actively clear stale PWA state.

## Where the project stands

Stage-based roadmap. Current branch: `stage24/structured-program-planners`.

- Stage 21 Onboarding v2 (13 steps, autosave, optimistic concurrency) — code + DB green; rendered/runtime QA open.
- Stage 22 Program Cycle (state machine, idempotent generation, plan linkage) — code + hosted DB green; adversarial hosted proofs open.
- Stage 23 Exercise Registry / deterministic safety — code + local DB + live benchmark green; hosted runtime proof open.
- **Stage 24 structured planners — implemented on this branch** (`web/lib/program-generation/*`, migration `20260811170000_program_generation.sql`, `tests/program-generation.test.ts`) but **has no `docs/NEOFIT_STAGE24_*.md` yet**, unlike every prior stage. Write one when the stage is closed.
- Stage 25 review/activation, Stage 26 proposal/diff/confirmation, Stage 27 confirmed future-version mutation — not started.

Open non-code decisions worth surfacing rather than silently fixing: minor-user policy (current minimum age 10), start-date timezone (hardcoded `Asia/Tehran` default instead of profile timezone), history pagination.

## Doc authority order

On conflict, earlier wins. Stage docs below the top four are historical evidence for their moment, not current truth.

1. `docs/NEOFIT_GAP_AUDIT_2026-08-08.md` — current backlog, severity-ranked.
2. `docs/NEOFIT_COACH_PROGRAM_LIFECYCLE_ARCHITECTURE.md` — canonical product contract.
3. `docs/NEOFIT_STAGE21_ONBOARDING_SELF_REPORT_V2.md`, `..._STAGE22_PROGRAM_CYCLE.md`, `..._STAGE23_EXERCISE_REGISTRY.md`.
4. `docs/NEOFIT_PREVIEW_LAB.md` — runtime/deployment boundary.

`NEOFIT_MASTER_PLAN.md`, `DEVELOPMENT_HANDOFF.md` and the branch/PR/deployment IDs inside them are **stale snapshots**; read them for history only.

## Working style here

- One coherent product slice per commit. Commit subjects are lowercase-typed: `ux:`, `test:`, `fix:`, `ci:`.
- Claim nothing as proven without evidence. "Code green" and "hosted runtime proven" are separate states throughout this repo — preserve that distinction in docs and commit messages.
- Do not create branches, Vercel projects, or deployments unless asked.
