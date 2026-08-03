# NeoFit Development Handoff

**Last verified:** 2026-08-03  
**Current source-of-truth branch:** `agent/iranian-food-kb-foundation`  
**Verified product head:** `648b98cdc921beb26ccd0ff05a1f17944bb6f71d`  
**Planning branch:** `plan/web-pwa-supabase-vercel`

## Proven current state

The Expo/React Native application is installable and starts successfully after the Android SQLite fixes merged at the verified product head. Official Mobile CI run 573 passed.

The current implementation contains the IFKB/Nutrition release candidate:

- 13,225 generic USDA/FNDDS/SR records
- 9,279 generic concepts
- 36,494 official portions
- 261 Iranian canonical identities
- deterministic nutrition calculations
- IFKB-resolved AI meal plans before persistence
- Stage 7 portion corrections
- Stage 8 licensed food images and placeholders
- Schema/ID freeze candidate

The mobile application is now a frozen reference because its UI/UX and Persian/RTL experience are not acceptable as the main product direction.

## New active direction

Read first:

`docs/NEOFIT_WEB_PWA_ROADMAP_V1_FA.md`

NeoFit will be rebuilt as a Persian-first, mobile-first PWA using Next.js, Vercel and Supabase. The platform changes; the nutrition and data contracts remain locked.

## Contracts that remain locked

Do not change these without a reviewed versioned migration:

- canonical food IDs
- IFKB/app mappings and fingerprints
- provenance fields
- deterministic nutrition arithmetic
- rejection of provider-created nutrition
- identity-only Vision boundary
- all-or-nothing AI meal-plan resolution
- imported/custom precedence
- image attribution and licence metadata

The scientific/data source of truth remains:

`docs/NEOFIT_NUTRITION_FINAL_SCOPE_V3.md`

The new roadmap supersedes only its mobile-only delivery decision.

## Repository strategy

- Keep `mobile/` as a frozen reference and migration source.
- Keep `ifkb/` as the data/research/release source of truth.
- Add the new application under `web/`.
- Extract pure nutrition logic to `packages/nutrition-core/` in Stage 3.
- Do not copy React Native UI code into the web app.
- Do not continue web implementation inside PR #3.
- After the planning PR merges, create `web/pwa-foundation` from the verified product head.
- Use one focused PR per stage.

## Infrastructure gate

Connected deployment and database tools are available, but no existing external project is automatically reused.

- Stage 1 does not create backend infrastructure.
- A new Supabase project is created only in Stage 4 after organization, region and cost confirmation.
- A NeoFit Vercel project is created in Stage 2 when the first coherent PWA preview is ready.

## Exact next action

Start **Stage 1 — Product/UX Foundation فارسی**.

The first implementation PR must:

1. create `web/`;
2. use real-shaped IFKB data without a live backend;
3. set Persian and RTL at the root;
4. define NeoFit design tokens;
5. create the mobile navigation shell;
6. implement Today, Food Search, Meal Logging, Weekly Plan and Settings;
7. include loading, empty, error and offline states;
8. validate widths 360, 390 and 412 pixels;
9. avoid Supabase schema work;
10. stop for product-owner UX approval.

## Stage 1 Definition of Done

- Persian is the default language.
- Every critical flow is genuinely RTL.
- No horizontal overflow exists on target widths.
- Five critical flows work with real-shaped IFKB data.
- A normal meal can be logged from Today in no more than two page transitions.
- Typography, spacing, color and navigation form one coherent design system.
- The product owner accepts the UX direction.

## Anti-overengineering rules

- no Supabase before the Stage 1 UX gate;
- no full offline sync before the data contract is stable;
- no extra server runtime when a Next.js route is sufficient;
- no heavy monorepo tooling before a real need exists;
- no billing, social, coach, marketplace or admin platform in the first web RC;
- no rewrite of IFKB or deterministic nutrition logic;
- no giant PR covering all web stages.

## Evidence required after each stage

- branch and exact head SHA
- changed files and scope
- tests and CI run IDs
- Preview URL when applicable
- screenshots at target mobile widths
- migration and access-policy evidence when applicable
- known limitations
- exact next stage
