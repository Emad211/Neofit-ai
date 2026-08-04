# NeoFit Development Handoff

**Last verified:** 2026-08-04  
**Integration branch:** `web/pwa-foundation`  
**Integration head before active work:** `e79df1b20b1769f4c2b4b2084510664d76bd0d72`  
**Active branch:** `stage2b/vercel-https-reactivation`  
**Active PR:** #28 — Draft  
**Active issues:** #16 Vercel HTTPS، #25 Supabase Foundation

## Read order

1. `docs/NEOFIT_MASTER_PLAN.md`
2. `docs/NEOFIT_PROGRESS_LOG.md`
3. `docs/NEOFIT_VERCEL_PREVIEW_QA.md` before Stage 2B Remote work
4. `docs/NEOFIT_STAGE4_SUPABASE_FOUNDATION_PLAN.md` before any Supabase change
5. GitHub PR/Issue/CI state
6. Vercel and Supabase connector state

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

Issue #16 and Draft PR #28 are active.

### Reconstructed failure

An old Vercel deployment was marked `READY`, but ran no install and no Next.js build. PR #28 corrected this with:

- Root `vercel.json`
- Root npm workspaces for `web` and `packages/nutrition-core`
- Next.js `16.2.12` detection
- Node `22.x`
- `npm run build:web`
- CI deployment-contract checks

### Latest deployed runtime

```text
commit: bfe3e56f18f77c717f0b31c8b36f294e9498add0
deployment: dpl_7q1AqruWVV6B6qSA1KmByH6UMSxj
state: READY
target: Preview
alias: neofit-ai-git-stage2b-vercel-htt-774980-emads-projects-41cb6447.vercel.app
Next.js: 16.2.12
bundler: Turbopack
```

Build log proves npm install، PWA icon generation، `next build`، compile، TypeScript، static routes and `/vercel/output` deployment.

### Protected Remote QA

Authority:

```text
docs/NEOFIT_VERCEL_PREVIEW_QA.md
web/scripts/verify-vercel-preview.mjs
.github/workflows/vercel-preview-qa.yml
npm run qa:vercel-preview
```

The Remote verifier checks:

1. HTTPS and same-origin navigation
2. absence of Vercel SSO challenge
3. `lang=fa` and `dir=rtl`
4. manifest and all required icons
5. Service Worker registration/control
6. API/Auth/Authorization/non-GET cache exclusions
7. real meal-log interaction
8. fresh-install offline reload

Vercel Deployment Protection requires:

```text
x-vercel-protection-bypass: VERCEL_AUTOMATION_BYPASS_SECRET
x-vercel-set-bypass-cookie: true
```

The secret must be created outside Git and stored only as GitHub repository secret `VERCEL_AUTOMATION_BYPASS_SECRET`.

### Current validated QA head

```text
12b25a8677ab276464428e87b184dff634d4087d
```

Nutrition Core:

- Run `30929824693` — success
- Artifact `8900647856`
- Digest `sha256:37bac1d174d412498eb8517c1d7a779ac77addd8aded24440de2f1ffcffa0ea2`

Web:

- Run `30929821835` — success
- Artifact `8900682338`
- Digest `sha256:a0baeeedd3ebfd508e62574618a3b63ddb47f470f2c534f9817634139439f4fd`

Verifier syntax, Shared Core, strict TypeScript, Adapter parity, Next build, icons, Visual and local PWA gates pass.

### Runtime-equivalence proof

Compare from deployed `bfe3e56…` to `12b25a…` changes only:

- Remote QA Workflow
- Remote QA authority document
- Root/Web package command exposure

No runtime App, Component, Service Worker, Public Asset or Nutrition Core file changed. The deployed Preview is valid for running Remote QA, but an exact-head Preview remains required before Merge.

### Current external blockers

Deployment Protection:

- temporary Share URL redirects through Vercel SSO;
- current fetch tools do not retain its Cookie session;
- Automation Bypass Secret is not yet configured.

Daily quota:

```text
Resource is limited - try again in 24 hours
code: api-deployments-free-per-day
more than 100 deployments
```

Therefore current head has no exact-head Vercel deployment.

Do not close Issue #16 or merge PR #28 until:

1. quota resets;
2. exact-head Preview is READY;
3. Automation Bypass is configured outside Git;
4. workflow `Vercel Preview HTTPS QA` passes;
5. Run/Artifact/Digest/Deployment/runtime evidence is recorded;
6. mandatory docs are synchronized;
7. review threads are zero.

## Stage 4 — current Supabase gate

Planning PR #26 is merged. Issue #25 remains open.

```text
Organization: Emad's Org
Organization ID: yzymkjsfqoohxbqkhzhs
Existing region: eu-central-1
NeoFit project: none
Current project cost: 0 monthly
confirm_cost: not called
Auth/Migration/Table/RLS: not started
```

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
6. add versioned migrations and RLS in focused later batches.

## Locked contracts

- Canonical IDs and fingerprints change only through versioned migration/freeze.
- Missing nutrition remains missing; unknown grams remain `null`.
- Provider-created nutrition is rejected.
- Shared Core is the calculation authority.
- SQL and React do not recalculate nutrition.
- Every user-owned exposed table has RLS before application use.
- Service Role never enters Browser code, logs or artifacts.
- Share/Bypass secrets never enter Git, comments, logs or artifacts.
- Preview validation does not authorize Production promotion.

## Exact continuation point

1. Recheck PR #28 head, CI, Vercel quota and latest deployment.
2. After quota reset, obtain exact-head Preview.
3. Configure `VERCEL_AUTOMATION_BYPASS_SECRET` outside Git.
4. Run `Vercel Preview HTTPS QA` and record evidence.
5. Close Issue #16 and merge PR #28 only after full Remote pass.
6. In parallel, wait for explicit Supabase Organization/Region/Cost acceptance.
7. After acceptance, create Project `neofit` and begin Stage 4B in a new focused PR.
