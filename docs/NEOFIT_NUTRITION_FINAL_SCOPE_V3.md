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

- The user explicitly triggers every image request and confirms the prepared-image upload.
- Images are resized/compressed on-device before upload.
- Raw images are not stored in SQLite or in the Vision cache.
- The API may return food candidates, visible components and preparation hints.
- The API may not return trusted calories, macros or portion weights.
- Candidate labels are resolved against IFKB locally.
- Strong unambiguous matches may be selected automatically; mixed plates, close alternatives, weak matches, warnings and low confidence require explicit user confirmation.
- A confirmed component from a mixed plate is calculated alone; other visible components must be logged separately.
- Portion, added fat, sauce and serving uncertainty are resolved by deterministic questions and the nutrition engine.
- Results may be cached by a privacy-safe image fingerprint; raw image bytes are not cached.
- Provider-specific networking stays behind a transport boundary.

## Historical baseline

The percentages below describe the first locked-scope implementation batch and are retained only as historical context. They must not be reported as the current project completion level:

- overall final-product completion: **42.67%**;
- core completion excluding Vision: **41.60%**;
- Vision pipeline completion: **55%**.

A new percentage has not been assigned because the remaining data-verification and real-device QA work is not equivalent in effort to the completed code paths.

## Current verified implementation state — 2026-07-28

### Catalog and deterministic engine

- IFKB mobile catalog release: **1.2.0**.
- Immutable read-only SQLite asset: **13,885,440 bytes**.
- Generic USDA records: **13,225**.
- Official portion records: **36,494**.
- Complete calorie/macronutrient records: **13,224**.
- Generic concepts: **9,279**.
- Generic Concept/Variant mappings: **13,225 / 13,225 (100%)**.
- Multi-variant concepts: **1,321**.
- Multi-source concepts: **209**.
- Iranian canonical identities: **261**.
- Persian alias rows: **218**.
- Runtime, backup metadata, manifest, database byte size and SHA-256 are protected by one shared release contract and a CI drift test.
- Nutrition arithmetic, ranges, sums and serving weights are canonicalized to prevent binary floating-point noise from leaking into persisted or displayed values.
- SQLite and TypeScript calculations are now compared directly for per-100g, named portions, fractional quantities, uncertainty ranges, missing nutrients and unknown serving weights.

### Iranian profile state and controlled promotion

- Existing prior app profiles: **83**.
- Generated DS0 broad-fallback profiles: **178**.
- Total identities visible through the app layer: **261**.
- DS0 records are intentionally marked `broad_fallback`, `low` confidence and unknown serving weight.
- DS0 records are category priors, not recipe-specific measurements and not verified nutrition records.
- The DS0 release created **zero** verified records and must be progressively replaced by source-specific profiles.
- Migration 5 adds `evidence_tier`, `source_record_id` and `source_version` to the mutable food catalog and backfills existing DS0/custom records.
- SQLite source precedence is locked as `imported > seeded`, while custom identities are protected from both seeded and imported replacement.
- A later built-in reseed cannot downgrade a promoted imported profile.
- Removing or replacing an imported overlay restores the bundled profile for the same stable id when one exists and rebuilds the affected canonical concepts.
- Canonical FoodVariant records preserve the explicit evidence tier, source dataset, source-record id and source version.
- A versioned strong-profile Promotion Bundle contract requires a non-null serving weight, medium/high confidence, record-level provenance and either `verified_source` or `digital_consensus`.
- Promotion is an internal governance path, not a consumer control that can self-assign verified evidence.
- Passing the Promotion Bundle schema proves structural completeness and provenance linkage; it does not independently prove scientific adequacy of the cited source.

### Persian search

- A reproducible 500-query controlled regression corpus is implemented against the real bundled SQLite FTS index and production TypeScript alias/ranker logic.
- The IFKB 1.2.0 run achieved route accuracy 100%, Top-1 100%, Top-5 100% and zero failures.
- This result measures the controlled alias registry and deterministic perturbations. It is not evidence of unrestricted Persian natural-language understanding and is not the final independent user-query benchmark.

### Offline tracker and personal data

- Nutrition Core schema is installed through real `neofit.db` migrations.
- Local repositories and UI are active for Diary, Recipes, Goals, micronutrient progress, Favorites, Recents and History.
- Legacy `meal_logs` migration is idempotent and new nutrition writes use Nutrition Diary as the source of truth.
- CSV export preserves missing nutrients as blank.
- JSON backup includes Diary, Recipes, Goals and Favorites while excluding the public catalog, API keys, Vision images, caches and provider responses.
- JSON restore validates size, schema, finite/non-negative nutrition, duplicate identifiers and recipe cycles before writing.
- Restore supports transactional Merge and destructive Replace with separate user confirmation.
- Backup catalog version/SHA mismatch is disclosed while snapshot Diary nutrition remains preserved.

### Migration and recovery gates

- The migration runner validates contiguous positive versions and rejects a database newer than the application.
- A real SQLite upgrade test now executes v1 → v5 with legacy Profile and `meal_logs` data present.
- The v1 → v5 test verifies Profile preservation, one-time legacy Diary import, FTS synchronization, provenance backfill and idempotent repeated startup.
- Failed migration SQL is rolled back together with its `user_version`; partially created tables do not survive.
- Node CI uses a portable table substitute only when its SQLite build lacks FTS5. Expo/Android still exports against the actual Expo SQLite runtime and FTS schema.
- Binary database restore retains its rollback copy and validates SQLite integrity before accepting the restored database.

### Vision production boundary

- Camera/gallery images are resized to a maximum 1,024-pixel dimension and compressed before upload.
- Prepared upload size is limited to 1.5 MB.
- Explicit upload consent is required.
- Identity results use a provider/model-aware fingerprint cache without retaining image bytes.
- Provider nutrition fields are stripped and ignored.
- Mixed plates and ambiguous candidates require explicit user selection before local nutrition is shown.

### Validation and workflow governance

- Mobile CI runs deterministic tests, Nutrition SQLite schema validation, Expo package checks, Expo Doctor, strict TypeScript and Android export.
- Deterministic tests now include v1 → v5 upgrade, migration rollback, future-version rejection, SQLite ↔ TypeScript equivalence, catalog precedence, provenance validation and Promotion Bundle validation.
- Expensive catalog builds, media acquisition and source rebuilds are manual or path-scoped to relevant branch pushes.
- Generic concept audit, fallback-profile generation and Persian benchmark no longer rerun for unrelated app changes in the long-lived PR.

## Remaining release-critical path

1. Produce and independently review source-specific Promotion Bundles that replace the 178 DS0 broad fallbacks with defensible recipe profiles and serving weights.
2. Freeze an independently curated natural-user Persian corpus containing real spelling errors, colloquial and regional names, preparation/portion language, ambiguous foods, negative cases and required abstentions.
3. Run real-device Android QA for camera/gallery permissions, image manipulation, provider failures, cache behaviour and mixed-plate confirmation.
4. Run real-device and large-data QA for backup selection, validation, transactional Merge/Replace, rollback behaviour and post-restore UI refresh.
5. Review every mutable identifier and schema, then freeze release IDs, schema versions and migration policy.
6. Perform final accessibility, RTL/LTR, performance, privacy and release-governance review before taking the PR out of Draft.

## Definition of done

- All 261 Iranian foods have stable profiles; broad category fallbacks are not counted as final verified profiles.
- Every promoted profile retains reviewable source/version/record provenance and a defensible serving basis.
- All 13,225 generic source records remain mapped to a stable Concept/Variant or an explicitly governed exception.
- Persian search meets Top-1 >= 90% and Top-5 >= 97% on the frozen independent user-query corpus, not only the generated alias regression set.
- SQLite and TypeScript nutrition calculations produce equivalent results across the release corpus.
- Diary, recipes, goals, totals, history, export and restore work offline and pass real-device recovery tests.
- Vision API results are locally resolved, cannot inject nutrition values and abstain or request confirmation when identity is unsafe.
- IDs and schemas are frozen and every release-critical test passes.
