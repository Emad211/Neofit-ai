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

## Current verified implementation state — 2026-07-30

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
- SQLite and TypeScript calculations are compared directly for per-100g, named portions, fractional quantities, uncertainty ranges, missing nutrients and unknown serving weights.

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

### DS2 recipe normalization gate

- The first DS2 release contains three genuine multi-source identity/recipe-consensus profiles: Ghormeh Sabzi, Fesenjan and Koobideh.
- Source coverage is **13 records** across **12 independent groups**: 4/4 for Ghormeh Sabzi, 4/3 for Fesenjan and 5/5 for Koobideh.
- Current promotion state is **0 eligible / 3 blocked**. Identity consensus is not interpreted as nutrient readiness.
- The fail-closed DS2 gate runs **45 tests** and is executed inside Mobile CI as well as its path-scoped workflow.
- Every one of the **83 raw structured quantity keys** across all 13 sources has exactly one semantic role.
- Quantity semantics contain 69 independent ingredient keys, two derived aggregates, four ingredient intervals, two recipe-output keys and one recipe-output interval.
- Total-meat aggregates cannot be added again to their beef/lamb components; low/high interval bounds cannot be summed as separate ingredients; skewer counts cannot be treated as ingredient mass.
- The official SR Legacy/FNDDS portion audit covers **26 unresolved unit families**. Eighteen families have exact-form/measure candidates, four have catalog/measure gaps and four require a non-catalog protocol. Approved conversion count remains zero.
- Unit evidence is staged in an independent-review queue. No conversion factor, interval or source form is automatically approved.
- Source work is ranked by normalization effort only—not evidence quality. `DS2-KB-03` is the first and only Tier-A source because its seven independent ingredient quantities are already mass-anchored and servings are known.
- `DS2-KB-03` is still not nutrient-ready: ingredient source selection, cooked yield, edible fractions and retention factors remain unresolved.
- The seven independent `DS2-KB-03` ingredient keys now have complete candidate IFKB identity-target coverage.
- Four candidate extension identities are reserved for black pepper, sumac, baking soda and onion of unspecified variety.
- The source does not specify onion colour/variety. CI forbids silently specializing it to white, red or yellow onion.
- Nutrient-source approval remains **0 / 7** and the candidate extension is not yet part of the frozen core ingredient catalog.
- The bundled Concept/Variant audit yields single candidates for lamb, salt, black pepper and baking soda; one-concept variant ambiguity for onion; multi-concept/fat-class ambiguity for beef; and a catalog gap for sumac.
- Raw ground-beef candidate values span approximately 121–332 kcal and 3–30 g fat per 100 g. Blind averaging across fat classes is forbidden.
- Candidate nutrient vectors are compared only per 100 g. They are not multiplied by recipe mass and no recipe nutrition is calculated before mapping approval.
- The reproducible status and remaining path are recorded in `docs/releases/NEOFIT_DS2_NORMALIZATION_GATE_V1.md`.

### Persian search

- A reproducible 500-query controlled regression corpus is implemented against the real bundled SQLite FTS index and production TypeScript alias/ranker logic.
- The IFKB 1.2.0 run achieved route accuracy 100%, Top-1 100%, Top-5 100% and zero failures.
- This result measures the controlled alias registry and deterministic perturbations. It is not evidence of unrestricted Persian natural-language understanding and is not the final independent user-query benchmark.
- The collection/freeze validator for the independent natural-query corpus is implemented, but the real sanitized/adjudicated 500-query release is not yet published.

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
- A real SQLite upgrade test executes v1 → v5 with legacy Profile and `meal_logs` data present.
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

### Schema and ID freeze candidate

- Mobile CI generates a deterministic schema/ID freeze candidate, not a final compatibility promise.
- Current personal-database candidate: migration version 5, 23 application tables and 43 audited SQLite objects.
- All 13,225 generic source records map to 9,279 concepts.
- The 83 legacy app ids and 178 fallback app ids map one-to-one to all 261 IFKB canonical ids with zero unresolved or ambiguous mappings.
- Post-candidate DS2 normalization files remain mutable and require a new reviewed candidate before final freeze.

### Validation and workflow governance

- Mobile CI runs deterministic tests, Nutrition SQLite schema validation, DS2 normalization governance, Expo package checks, Expo Doctor, strict TypeScript and Android export.
- Deterministic tests include v1 → v5 upgrade, migration rollback, future-version rejection, SQLite ↔ TypeScript equivalence, catalog precedence, provenance validation and Promotion Bundle validation.
- The DS2 gate additionally covers consensus alignment, source queues, quantity semantics, official portion auditing, independent-review queues, work prioritization, ingredient identity targets, Concept/Variant candidate mapping and per-100-g candidate comparison.
- Expensive catalog builds, media acquisition and source rebuilds are manual or path-scoped to relevant branch pushes.
- Generic concept audit, fallback-profile generation and Persian benchmark no longer rerun for unrelated app changes in the long-lived PR.

## Remaining release-critical path

1. Complete independent nutrient-source review for `DS2-KB-03`, including beef fat-class governance and a defensible sumac source.
2. Resolve `DS2-KB-03` edible fractions, cooked yield and nutrient-retention model; calculate and independently review p10/p50/p90 serving nutrition before creating a Promotion Bundle.
3. Apply the same fail-closed normalization process to the remaining two DS2 profiles.
4. Produce and independently review source-specific Promotion Bundles that replace the 178 DS0 broad fallbacks with defensible recipe profiles and serving weights.
5. Freeze and evaluate the real independent 500-query Persian corpus.
6. Run real-device Android QA for camera/gallery permissions, image manipulation, provider failures, cache behaviour and mixed-plate confirmation.
7. Run real-device and large-data QA for backup selection, validation, transactional Merge/Replace, rollback behaviour and post-restore UI refresh.
8. Generate and formally approve a new final schema/ID freeze after all accepted DS2/catalog changes.
9. Perform final accessibility, RTL/LTR, performance, privacy and release-governance review before taking the PR out of Draft.

## Definition of done

- All 261 Iranian foods have stable profiles; broad category fallbacks are not counted as final verified profiles.
- Every promoted profile retains reviewable source/version/record provenance and a defensible serving basis.
- Every recipe-derived DS2 profile has frozen ingredient identities, approved nutrient sources or governed intervals, cooked yield, edible fractions, retention factors and independent review.
- All 13,225 generic source records remain mapped to a stable Concept/Variant or an explicitly governed exception.
- Persian search meets Top-1 >= 90% and Top-5 >= 97% on the frozen independent user-query corpus, not only the generated alias regression set.
- SQLite and TypeScript nutrition calculations produce equivalent results across the release corpus.
- Diary, recipes, goals, totals, history, export and restore work offline and pass real-device recovery tests.
- Vision API results are locally resolved, cannot inject nutrition values and abstain or request confirmation when identity is unsafe.
- IDs and schemas are frozen and every release-critical test passes.
