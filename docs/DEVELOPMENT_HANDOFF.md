# NeoFit Development Handoff

**Last verified:** 2026-08-04  
**Integration branch:** `web/pwa-foundation`  
**Integration head before active work:** `e79df1b20b1769f4c2b4b2084510664d76bd0d72`  
**Active branch:** `stage2b/vercel-https-reactivation`  
**Active PR:** #28  
**Active issues:** #16 Vercel HTTPS، #25 Supabase Foundation

## Read order

1. `docs/NEOFIT_MASTER_PLAN.md`
2. `docs/NEOFIT_PROGRESS_LOG.md`
3. `docs/NEOFIT_STAGE4_SUPABASE_FOUNDATION_PLAN.md` before any Supabase change
4. GitHub PR/Issue/CI state
5. Vercel and Supabase connector state

Do not continue from this file alone if it conflicts with the Master Plan or live tools.

## Proven product state

### Frozen Mobile/IFKB reference

The Expo/React Native application under `mobile/` remains a frozen reference with:

- 13,225 generic USDA/FNDDS/SR records
- 9,279 generic concepts
- 36,494 official portions
- 261 Iranian canonical identities
- deterministic nutrition calculations
- IFKB-resolved AI meal plans before persistence
- Stage 7 portion corrections
- Stage 8 licensed images/placeholders
- Schema/ID freeze candidate

Mobile is not the active product UI direction.

### Active Web/PWA

Completed:

- Persian RTL Product/UX foundation
- Next.js PWA shell, manifest, icons and Service Worker
- Visual QA at 360/390/412 widths
- local offline reload and cache-boundary tests
- Shared `packages/nutrition-core`
- Web Nutrition Adapter using Shared Core
- Core parity `52/52`
- Web Adapter tests `9/9`

The Web application is still fixture/state based. It has no account persistence, Supabase Auth, RLS, real user database, Web AI/Vision, IndexedDB catalog sync or backup/recovery vertical slice.

## Stage 2B — current Vercel state

Issue #16 is active again.

A previous `READY` Vercel deployment was invalid evidence because the project cloned the repository root, ran no install and finished without a Next.js build.

PR #28 adds:

- Root `vercel.json`
- Root npm workspace for `web` and `packages/nutrition-core`
- explicit Next.js `16.2.12` detection
- Node `22.x` alignment
- CI checks for the deployment contract
- deployment bundle including root config and both workspaces

Validated code head:

```text
aeec3b0716b6f60dfe61a745ca266f69e1d640e8
```

Vercel evidence:

```text
Project: prj_U4np29NAkTqZ6QjTbXmeEBkrcDNG
Deployment: dpl_2rn2B51BZJfjDYtPPhb3VXY7swna
State: READY
Target: Preview
Alias: neofit-ai-git-stage2b-vercel-htt-774980-emads-projects-41cb6447.vercel.app
Next.js: 16.2.12
Bundler: Turbopack
```

Build log proves:

- npm install
- PWA icon generation
- `npm run build:web`
- `next build`
- successful compile
- successful TypeScript
- static generation of `/`, `/_not-found`, `/manifest.webmanifest`, `/offline`
- output deployed from `/vercel/output`

CI on that code head:

- Nutrition Core CI `30927566238` — success
- Artifact `8899755836`
- Web CI `30927566018` — success
- Artifact `8899785585`

### Remaining Vercel blocker

Preview Deployment Protection is active.

The connected tool creates a temporary share URL, but fetches redirect to Vercel SSO and the tool does not retain the required browser cookie. Therefore remote HTTPS assertions have not yet been executed.

Do not close Issue #16 or merge PR #28 until a real browser session verifies:

1. Root NeoFit page
2. `lang=fa` and `dir=rtl`
3. manifest and all icons
4. Service Worker registration/control
5. fresh-install offline reload
6. React navigation and meal logging interaction
7. API/Auth/Authorization cache exclusion
8. no unexplained build/runtime errors

Local Chromium CI already passes the equivalent local Production-build checks.

## Stage 4 — current Supabase gate

Planning PR #26 is merged. Issue #25 remains open.

Verified account state:

```text
Organization: Emad's Org
Organization ID: yzymkjsfqoohxbqkhzhs
Existing regions: eu-central-1
NeoFit project: none
Current project cost: 0 monthly
```

No `confirm_cost`, Project creation, Auth, migration, table or RLS operation has been executed.

Project creation requires explicit acceptance of:

```text
Organization: Emad's Org (yzymkjsfqoohxbqkhzhs)
Region: eu-central-1
Cost: 0 monthly
```

After acceptance only:

1. call Supabase cost confirmation;
2. create Project `neofit`;
3. record Project ref/region/status in Issue #25 and mandatory docs;
4. create a separate test-first Stage 4B branch/PR;
5. add SSR browser/server clients before user tables;
6. add versioned migrations and RLS in later focused batches.

## Locked contracts

- Canonical IDs and fingerprints change only through versioned migration/freeze.
- Missing nutrition remains missing; unknown grams remain `null`.
- Provider-created nutrition is rejected.
- Shared Core is the calculation authority.
- SQL and React do not recalculate nutrition.
- Every user-owned exposed table has RLS before application use.
- Service Role never enters Browser code, logs or artifacts.
- Preview validation does not authorize Production promotion.

## Exact continuation point

1. Recheck PR #28 head, CI and newest Vercel deployment.
2. Resolve Preview browser access through Vercel Deployment Protection/share session.
3. Run and record the remote HTTPS PWA suite.
4. Address any remote defect or remaining release-relevant build warning.
5. Close Issue #16 and merge PR #28 only after full evidence.
6. In parallel, wait for explicit Supabase Organization/Region/Cost acceptance.
7. After acceptance, create the `neofit` Project and begin Stage 4B in a new focused PR.
