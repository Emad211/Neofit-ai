# NeoFit Nutrition Engine — Final Locked Scope v3

This document supersedes every previous nutrition scope.

## Locked decisions

- Mobile stack: Expo / React Native / TypeScript.
- Data core: IFKB + USDA SR Legacy + USDA FNDDS.
- Nutrition calculations: deterministic TypeScript/SQLite only.
- A language or vision model must never invent calories, nutrients, weights or portions.
- Vision: remote identity recognition only; all nutrition is resolved locally.
- Storage: local-first SQLite. Cloud backend remains optional.
- Open Food Facts, barcode ingestion, Flutter migration, local ONNX vision and physical food measurement are outside the current release scope.

## Product architecture

1. Source nutrition records and provenance.
2. Stable food concepts and nutrition variants.
3. Persian search, aliases, typo handling and preparation modifiers.
4. Portion and deterministic nutrition calculation.
5. Diary, recipes, custom foods, goals, totals, history and export.
6. Expo repositories, migrations and offline persistence.
7. Vision identity adapter mapped back to IFKB.
8. Bulk source acquisition, QA, schema/ID freeze and release governance.

## Current verified implementation state — 2026-07-30

### Complete tracked catalog surface

NeoFit now tracks the complete bundled nutrition surface record-by-record:

- total tracked records: **13,486**
- generic USDA source records: **13,225**
- Iranian canonical/app profiles: **261**
- generic concepts: **9,279**
- generic source-to-concept mappings: **13,225 / 13,225**
- official household portions: **36,494**
- Persian aliases: **218**

The full audit produces one readiness row for every generic record and every Iranian profile. Progress is measured by catalog coverage and batch throughput, not by completion of one selected food.

### Generic catalog readiness

| Class | Count | Runtime use |
|---|---:|---|
| Complete macros + official portion | 12,927 | grams and official portions |
| Complete macros, no official portion | 297 | grams/per-100g only |
| Macro incomplete | 1 | excluded from selectable results |
| Missing Concept/Variant mapping | 0 | CI failure if introduced |

Additional verified counts:

- SR Legacy records: **7,793**
- FNDDS records: **5,432**
- records with official portions: **12,928**
- macro-complete records: **13,224**
- calcium coverage: **13,139**
- iron coverage: **13,144**
- potassium coverage: **12,947**
- vitamin C coverage: **12,763**

The immutable SQLite asset remains catalog version **1.2.0**, **13,885,440 bytes**, SHA-256:

`0164cb344c22eeec2556f9decdf13931e700078a9566bd884609edee78667247`

The single macro-incomplete source record is preserved for provenance but filtered out before ranking. The 297 macro-complete records without official portions remain usable by grams.

### Iranian profile readiness

All **261 Iranian identities** are present and mapped one-to-one to app profiles:

- **178** DS0 broad fallbacks requiring source acquisition and recipe/serving profiles
- **80** legacy estimates requiring revalidation and replacement
- **3** DS2 identity/recipe-consensus profiles still blocked from nutrient promotion
- promotion eligible: **0**
- known serving weights: **7**
- unknown serving weights: **254**

Category coverage:

- bread: 12
- breakfast: 9
- dairy/beverage: 14
- dessert: 41
- kebab: 20
- rice: 42
- soup: 35
- stew: 35
- street food: 53

### Twelve parallel Iranian execution batches

All 261 profiles are assigned exactly once to **12 balanced batches**:

- batch size: **21–22 foods**
- every batch mixes categories and readiness states
- no individual food can block overall progress
- batch assignment fingerprint:
  `0ad7bbbffd86862f99a2b81865703c5ed56522ba62f7f557050b8c0ad023f53d`

The frozen operational assignment CSV is stored under:

`ifkb/universal/releases/iranian-bulk-source-registry-v1/iranian-batch-assignments.csv`

This assignment is an execution order, not a scientific-verification score.

### Multilingual bulk source discovery

For every Iranian food, CI generates:

- exact-name Persian searches
- serving-weight and nutrition-source searches
- English recipe and ingredient-quantity searches
- alias-derived Persian searches when aliases exist
- minimum independent-source requirements
- required extraction outputs and rejected-evidence rules
- one complete CSV queue and 12 per-batch JSON work packs

Current generated totals:

- canonical foods covered: **261 / 261**
- Persian queries: **861**
- English queries: **783**
- foods with additional canonical aliases: **39**
- approved source records: **0**

### Multi-collection research registry

Eight broad collections are currently registered by role, authority, access and reuse boundary:

- Iranian Food Composition Table 2017
- SAMAR Iranian food-composition candidate
- Persian Mama recipe index
- FAO/USDA Food Composition Tables for the Near East
- WHO/EMRO traditional rural Iranian foods study
- FAO/INFOODS Analytical Food Composition Database 2.0
- USDA SR Legacy
- USDA FNDDS

Generated collection-plan results:

- candidate collection assignments: **2,040**
- foods with recipe-discovery assignments: **261 / 261**
- foods with nutrient-authority assignments: **261 / 261**
- exact food matches approved: **0**
- source records approved: **0**

A collection assignment means only that the collection should be searched. It does not establish exact coverage, reuse permission, source independence, nutrient authority or promotion readiness.

### Bulk URL and structured-fact pipeline

A path-scoped workflow processes broad recipe collections without blocking Mobile CI:

1. index same-domain recipe titles and URLs;
2. match all 261 canonical names and aliases;
3. initialize null-safe source-fact records;
4. extract only Recipe JSON-LD name, yield and ingredient labels for candidate pages;
5. store no recipe instructions, images, raw page content or provider nutrition;
6. record failures without discarding successful pages;
7. route extracted facts into the 12 pre-assigned batches.

Exact identity, reuse status, independence group, ingredient mapping, serving weight, nutrient source and promotion eligibility remain separate review dimensions. Automatic approval is forbidden and missing values are never interpreted as zero.

The reproducible broad baseline is recorded in:

`docs/releases/NEOFIT_FULL_NUTRITION_CATALOG_BULK_AUDIT_V1.md`

### DS2 normalization as an exception workstream

Three existing profiles—Ghormeh Sabzi, Fesenjan and Koobideh—have genuine multi-source identity/recipe consensus but remain nutrient-blocked.

- source records: **13**
- promotion eligible: **0 / 3**
- fail-closed DS2 tests: **45**
- raw structured quantity keys classified: **83 / 83**
- approved household-unit conversions: **0**
- calculated recipe nutrition: **0**

The DS2 gate remains valuable for ambiguous/high-impact exceptions, but it no longer defines the pace of the entire Iranian catalog. The same governance contracts will be applied in groups after broad discovery and extraction populate each batch.

### Promotion governance

Migration 5 adds:

- `evidence_tier`
- `source_record_id`
- `source_version`
- source/evidence indexing
- source precedence and provenance validation

Imported profiles cannot be downgraded by later bundled reseeds. Custom user foods remain protected.

Promotion Bundles require:

- stable app/IFKB identity
- source, version and record-level provenance
- non-null serving basis
- medium/high confidence
- complete serving calories/macros
- `verified_source` or `digital_consensus`

Passing the schema proves structural completeness and provenance linkage only; scientific adequacy still requires independent review.

## Local-first tracker and personal data

Implemented and active:

- Nutrition Diary as the source of truth
- idempotent legacy `meal_logs` import
- local search, grams and official portions
- Favorites and Recents
- nested Recipe Builder with cycle protection
- Goals and missing-aware macro/micronutrient progress
- History and CSV export
- validated JSON backup
- transactional Merge and destructive Replace restore

Backups exclude the public catalog, API keys, Vision images, caches and provider responses.

## Migration and arithmetic gates

- real SQLite upgrade coverage from v1 to v5
- Profile and legacy meal preservation
- one-time legacy Diary import
- FTS synchronization
- provenance backfill
- repeated-startup idempotence
- rollback of failed migration SQL together with `user_version`
- rejection of databases newer than the app
- direct SQLite ↔ TypeScript equivalence tests for grams, portions, fractional quantities, ranges, missing nutrients and unknown serving weights

## Vision production boundary

- explicit user trigger and upload consent
- on-device resize/compression
- maximum image dimension: 1,024 px
- maximum prepared upload: 1.5 MB
- no raw image storage in SQLite/cache
- provider/model-aware privacy-safe fingerprint cache
- provider nutrition stripped and ignored
- local IFKB identity resolution
- explicit confirmation for mixed plates, close alternatives, weak matches, low confidence and provider warnings

## Persian search evidence

- controlled 500-query alias/search regression: route 100%, Top-1 100%, Top-5 100%, zero failures
- this is a deterministic regression result, not unrestricted natural-language accuracy
- independent natural-query collection/freeze validator is implemented
- the real sanitized, double-annotated and adjudicated 500-query corpus is not yet published

## Schema and ID freeze

- current candidate: migration version 5
- application tables: 23
- audited SQLite objects: 43
- 13,225 generic records map to 9,279 concepts
- 261 app profiles map one-to-one to 261 canonical identities
- zero unresolved or ambiguous app→canonical mappings
- broad acquisition and batch files remain mutable and require a new reviewed candidate before final release freeze

## Validation and workflow governance

Mobile CI now gates:

- deterministic TypeScript/SQLite tests
- full 13,486-record bulk audit
- 261-food discovery packs
- multi-collection research plan
- DS2 fail-closed governance
- migration and recovery tests
- catalog precedence/provenance tests
- Promotion Bundle tests
- SQLite ↔ TypeScript equivalence
- schema/ID freeze-candidate generation
- Expo compatibility and Expo Doctor
- strict TypeScript
- Android export

External source discovery is isolated, path-scoped and cannot block the main product pipeline.

## Remaining release-critical path

1. Execute broad collection discovery and structured-fact extraction across all 12 Iranian batches.
2. Review exact identity and reuse status in groups; escalate only ambiguous, high-impact or source-gap records for deep review.
3. Normalize ingredient quantities, serving/yield and nutrient-source mappings batch-by-batch.
4. Produce independently reviewed Promotion Bundles in groups that progressively replace DS0 and legacy estimates.
5. Freeze and evaluate the real independent 500-query Persian corpus.
6. Run real-device Android QA for Vision and backup/recovery flows.
7. Complete accessibility, RTL/LTR, performance, privacy and release governance.
8. Generate and approve a new final schema/ID freeze after accepted catalog changes.

## Definition of done

- all 13,225 generic records remain mapped and macro-incomplete exceptions are non-selectable
- all 261 Iranian identities have stable source-reviewed profiles; broad fallbacks do not count as final profiles
- every promoted profile retains reviewable provenance and a defensible serving basis
- batch processing covers every Iranian identity exactly once and exceptions are explicit
- Persian search passes the frozen independent corpus thresholds
- Tracker, export, restore and Vision flows pass real-device QA
- the approved final freeze supersedes the mutable candidate baseline
