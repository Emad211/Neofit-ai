# NeoFit AI

NeoFit AI is a Persian-first fitness and nutrition product built around the versioned IFKB nutrition catalog and deterministic TypeScript nutrition rules.

## Active direction

NeoFit is pivoting from its current Expo/React Native application to a mobile-first, installable web application:

- Next.js App Router + TypeScript
- Persian as the default language
- RTL-first UI architecture
- PWA installation and required offline behavior
- Vercel deployment and preview environments
- Supabase Auth/Postgres/RLS for account and personal data
- IFKB + USDA SR Legacy + FNDDS as the nutrition source of truth
- AvalAI/Vision restricted to identity and plan-language assistance; provider nutrition is rejected

Read the approved roadmap:

- [`docs/NEOFIT_WEB_PWA_ROADMAP_V1_FA.md`](docs/NEOFIT_WEB_PWA_ROADMAP_V1_FA.md)
- [`docs/DEVELOPMENT_HANDOFF.md`](docs/DEVELOPMENT_HANDOFF.md)

## Existing mobile reference

The current Expo application remains under [`mobile/`](mobile/README.md) as a frozen release-candidate reference and data-migration source. It is not the active UI/product direction.

The current nutrition and scientific contract remains documented in:

- [`docs/NEOFIT_NUTRITION_FINAL_SCOPE_V3.md`](docs/NEOFIT_NUTRITION_FINAL_SCOPE_V3.md)
- [`docs/releases/NEOFIT_NUTRITION_RELEASE_CANDIDATE_FREEZE_V1.md`](docs/releases/NEOFIT_NUTRITION_RELEASE_CANDIDATE_FREEZE_V1.md)

## Locked product rules

- Canonical IFKB identifiers and provenance remain versioned.
- Nutrition calculations remain deterministic.
- Language and vision models may not invent calories, macronutrients, weights or portions.
- AI meal-plan ingredients must resolve to IFKB/FNDDS/SR before persistence.
- Imported and custom user records remain protected from bundled catalog updates.

## Next development stage

The exact next stage is **Stage 1 — Persian Product/UX Foundation**.

The first web batch must build and validate the Today, Food Search, Meal Logging, Weekly Plan and Settings flows in genuine RTL before Supabase backend work begins.
