# NeoFit Nutrition Engine — Final Locked Scope v3

This document supersedes every previous nutrition scope.

## Locked decisions

- Mobile stack: Expo / React Native / TypeScript.
- Data core: IFKB + USDA SR Legacy + USDA FNDDS.
- Tracker core: clean-room TypeScript implementation inspired by public tracker behaviour, without copying GPL source code.
- Vision: remote Vision API only. No on-device vision model is planned.
- Open Food Facts and barcode integration: excluded.
- Nutrition calculations: deterministic TypeScript/SQLite only. A language or vision model must never invent calories or nutrients.
- Storage: local-first SQLite. Cloud backend remains optional.
- Physical food capture or measurement: excluded.

## Product architecture

1. Source nutrition records and provenance.
2. Canonical food concepts and nutrition variants.
3. Persian search, aliases, typo handling and modifier parsing.
4. Portion and deterministic nutrition calculation engine.
5. Clean-room tracker core: diary, recipes, custom foods, goals, totals, history, weight and export.
6. Expo repository layer, migrations and offline persistence.
7. Vision API adapter: image recognition only, mapped back to IFKB concepts.
8. QA, schema freeze, versioning and release governance.

## Vision API rules

- The user explicitly triggers every image request.
- Images are resized/compressed before upload by the app integration layer.
- Raw images are not stored in SQLite.
- The API may return food candidates, visible components and preparation hints.
- The API may not return trusted calories, macros or portion weights.
- Candidate labels are resolved against IFKB locally.
- Portion, added fat, sauce and serving uncertainty are resolved by deterministic questions and the nutrition engine.
- Results may be cached by an image fingerprint; raw image bytes are not cached.
- Provider-specific networking stays behind a transport boundary.

## Execution order

1. Freeze domain contracts.
2. Implement nutrition arithmetic.
3. Implement Persian normalization and deterministic ranking.
4. Add concept/variant/portion SQL schema.
5. Implement diary core.
6. Implement recipe and custom-food arithmetic.
7. Implement goals, daily totals and micronutrient progress.
8. Implement Vision API contracts, sanitization and IFKB matching.
9. Integrate the identity-only Vision path with the existing Expo meal-estimator.
10. Add regression tests and activate Mobile CI for the active integration PR.

## First implementation batch — completed foundation

- Pure TypeScript nutrition vectors, range arithmetic, portions and additive modifiers.
- Unicode-safe Persian normalizer and deterministic query/modifier parser.
- Food concept, nutrition variant, alias, portion, diary, recipe, goal and Vision-cache SQL schema.
- Diary day aggregation and recipe total/per-serving/per-100g calculations.
- Missing-aware nutrition goals; missing nutrients are not converted to source zero values.
- Provider-agnostic Vision domain contract and an AvalAI identity-only transport.
- Vision candidates are mapped to the local IFKB catalog before any nutrition is displayed.
- The Expo meal estimator no longer uses AI-generated calorie or macro estimates.
- Zod boundary tests strip provider-supplied calories, macros and serving weights.
- Mobile CI now runs for the active Expo integration PR and passes domain tests, Expo package checks, Expo Doctor, strict TypeScript and Android export.

## Current progress baseline

- Overall final-product completion: **42.67%**.
- Core completion excluding the Vision API workstream: **41.60%**.
- Vision API pipeline completion: **55%**.
- Main completed assets: 13,225 generic nutrition records, 36,494 portions, 261 Iranian identities, 60 app-ready Iranian records, 218 Persian aliases, 58 licensed display images, deterministic Nutrition Core, Vision identity boundary and an integrated Expo photo-to-IFKB flow.

## Remaining critical path

1. Add the Nutrition Core schema as a real `neofit.db` migration and implement repositories.
2. Package/import the 13,225 records and 36,494 portions into the app update path.
3. Build the generic concept/variant mapper and reach at least 95% mapped or explicit-unmapped coverage.
4. Produce app-ready profiles for the remaining 201 Iranian foods.
5. Build and score a 500-query Persian benchmark corpus.
6. Complete offline Diary persistence and UI.
7. Complete Recipe/custom-food persistence and UI.
8. Complete goals, micronutrients, history, favorites and export/import.
9. Harden Vision API image resizing, consent, fingerprint cache, retry and multi-component handling.
10. Run final cross-layer QA and freeze IDs/schema.

## Definition of done

- All 261 Iranian foods have stable app profiles.
- At least 95% of generic source records are mapped to a concept/variant or explicitly marked unmapped.
- Persian search achieves Top-1 >= 90% and Top-5 >= 97% on a curated query corpus.
- SQLite and TypeScript nutrition calculations produce equivalent results.
- Diary, recipes, goals and totals work offline.
- Vision API results are mapped to IFKB and cannot inject nutrition values.
- IDs and schemas are frozen and all critical tests pass.
