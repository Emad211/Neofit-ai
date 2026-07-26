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
- Provider-specific networking stays behind a `VisionTransport` interface.

## Execution order

1. Freeze domain contracts.
2. Implement nutrition arithmetic.
3. Implement Persian normalization and deterministic ranking.
4. Add concept/variant/portion SQL schema.
5. Implement diary core.
6. Implement recipe and custom-food arithmetic.
7. Implement goals, daily totals and micronutrient progress.
8. Implement Vision API contracts, sanitization and IFKB matching.
9. Integrate all modules through one public TypeScript barrel.
10. Add regression tests and then connect the module to the existing Expo repositories and screens.

## Definition of done

- All 261 Iranian foods have stable app profiles.
- At least 95% of generic source records are mapped to a concept/variant or explicitly marked unmapped.
- Persian search achieves Top-1 >= 90% and Top-5 >= 97% on a curated query corpus.
- SQLite and TypeScript nutrition calculations produce equivalent results.
- Diary, recipes, goals and totals work offline.
- Vision API results are mapped to IFKB and cannot inject nutrition values.
- IDs and schemas are frozen and all critical tests pass.

## Progress baseline before this implementation batch

- Overall final scope: 31.1%.
- Main completed assets: 13,225 generic nutrition records, 36,494 portions, 261 Iranian identities, 60 app-ready Iranian records, 218 Persian aliases, 58 licensed display images, SQLite candidate databases and provenance/QA infrastructure.
