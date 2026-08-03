# NeoFit Catalog Release, Provenance and Legacy Adapter — Authority Map

**وضعیت:** مرجع Stage 3 Batch 3  
**تاریخ ثبت:** ۴ اوت ۲۰۲۶  
**Issue:** #17  
**Branch:** `stage3/catalog-provenance-parity`  
**مبنای Branch:** Batch 2 merge `917f04e319a924dda7dfb16d079453a5e5686541`  
**مرجع Native/IFKB:** `agent/iranian-food-kb-foundation` @ `648b98cdc921beb26ccd0ff05a1f17944bb6f71d`

## ۱. اصل Authority

Catalog Release داخل Package نباید به یک Constant دستی و جدا از Asset تبدیل شود.

ترتیب Authority برای Batch 3:

1. Generatorهای IFKB و Workflow ساخت Catalog
2. SQLite asset و Manifest تولیدشده و Hash‌شده
3. Release/Freeze evidence و Schema/ID audit
4. Runtime TypeScript projection (`catalog-release.ts`)
5. Provenance/Legacy adapter behavior و Mobile tests

`catalog-release.ts` یک Projection تولیدشده از Manifest است؛ Source of Truth مستقل نیست. هر تغییر Catalog باید ابتدا در Pipeline IFKB ساخته، Audit و Freeze شود و سپس Projection مصرف‌کننده به‌روزرسانی شود.

## ۲. Source authority و Blobهای دقیق

| منبع | Blob SHA | نقش |
|---|---|---|
| `.github/workflows/ifkb-mobile-catalog-v1.yml` | `1012754613cf99bd3c73de49830731e9cc52adcf` | Build رسمی SR/FNDDS، ساخت DB/Manifest، integrity/count/search checks و Commit asset |
| `ifkb/universal/build_mobile_catalog.py` | `597180d6bd540bc9b8bf0fc931c030d534289f5c` | SQLite schema، ingest، database hash و Manifest generator |
| `ifkb/universal/augment_mobile_catalog_concepts.py` | `b0ed12152b8a0001fedfa0c35e52ddf2fc81fcc0` | Conservative Concept/Variant augmentation و mapping policy |
| `mobile/assets/ifkb/ifkb-universal-v1.manifest.json` | `f6bcc7bbeeed078b2798b625591b08a11bce0b78` | Generated bundled catalog manifest |
| `mobile/src/nutrition-core/catalog-release.ts` | `1afb7266b7d456530febb5c1c49c109e3d1f3ef7` | Runtime projection of frozen Manifest fields |
| `mobile/src/nutrition-core/catalog-provenance.ts` | `1edb7e8eed151305075e634a84596db2211dffaf` | Evidence-tier resolution and imported-tier allowlist |
| `mobile/src/nutrition-core/legacy-catalog-adapter.ts` | `30fcc0d774a43f0f0608bd29c342c3e20d339f58` | Deterministic legacy food → Concept/Variant conversion |
| `mobile/tests/nutrition-core.test.ts` | `2291e1958efe5e17010230c5864c9fadc9bc47ba` | Legacy null-weight/per-serving behavior |
| `mobile/scripts/audit-schema-freeze-candidate.ts` | `ddcf4cfceefcecf2d1f9d8ad922e4472c212bc1c` | Schema/object/ID/mapping/hash audit generator |
| `docs/releases/NEOFIT_SCHEMA_ID_FREEZE_CANDIDATE_V1.md` | `0f372496cbad2ecf5cca72a6fdf7604255179be0` | Auditable Schema/ID candidate baseline and limitations |
| `docs/releases/NEOFIT_NUTRITION_RELEASE_CANDIDATE_FREEZE_V1.md` | `3c0601f469c6d15618fcadd1179c16c581da6f6e` | Frozen Nutrition RC contract and change-control rules |

## ۳. Frozen Catalog 1.2.0 contract

Manifest and runtime projection agree on:

- format: `ifkb-mobile-catalog-release`
- version: `1.2.0`
- database file: `ifkb-universal-v1.db`
- database bytes: `13,885,440`
- database SHA-256: `0164cb344c22eeec2556f9decdf13931e700078a9566bd884609edee78667247`
- Generic foods: `13,225`
- official portions: `36,494`
- macro-complete rows: `13,224`
- calcium coverage: `13,139`
- iron coverage: `13,144`
- potassium coverage: `12,947`
- vitamin C coverage: `12,763`
- Iranian canonical identities: `261`
- Persian aliases: `218`
- Generic concepts: `9,279`
- Generic variant mappings: `13,225`
- mapping coverage: `1.0`
- clustered concepts: `1,321`
- multi-source concepts: `209`
- maximum variants per concept: `76`
- mapping policies:
  - conservative comma parser: `6,049`
  - identity-preserving exact: `7,176`

The single macro-incomplete Generic record is excluded from selectable runtime results.

## ۴. Generator and integrity contract

Official workflow:

1. Builds SR Legacy application layer.
2. Builds FNDDS 2021–2023 application layer.
3. Builds immutable Mobile SQLite Catalog.
4. Augments conservative Generic Concept/Variant mappings.
5. Verifies SQLite `integrity_check`.
6. Verifies counts, micronutrient coverage, mappings and FTS routes.
7. Verifies no orphan food/variant rows.
8. Verifies database size remains under 30 MiB.
9. Commits DB and Manifest together.

Package code must not reimplement this pipeline or derive release counts from hard-coded assumptions.

## ۵. Catalog provenance contract

`resolveCatalogEvidenceTier` behavior:

- `sourceType=custom` always becomes `user_entered`.
- Source labels containing `DS0` or `broad fallback` become `broad_fallback`.
- Otherwise explicit `evidenceTier` is preserved.
- If explicit tier is absent, fallback is `legacy_estimate`.

Imported rows may accept only:

- `verified_source`
- `digital_consensus`
- `legacy_estimate`

`broad_fallback` and `user_entered` are not accepted as imported evidence tiers.

## ۶. Legacy adapter contract

`legacyCatalogFoodToDocument` must preserve:

- Concept ID equal to legacy food ID.
- Variant ID `${foodId}:default`.
- nutrient basis `per_serving`.
- `portionGrams=null` as `basisGrams=null` and portion `gramWeight=null`.
- one Standard portion with `basisMultiplier=1`.
- calories/protein/carbs/fat exactly as provided.
- uncertainty fraction clamped to `0..0.8` from `variabilityPct/100`.
- p50 equal to center.
- `sourceRecordId` fallback to food ID when blank/missing.
- blank `sourceVersion` omitted from the resulting Variant.
- evidence tier resolved through the provenance contract above.

This adapter preserves legacy readability; it does not promote legacy estimates into verified evidence.

## ۷. Imported and Custom precedence

Frozen Nutrition RC requires:

- Stage 7 portion corrections update only bundled `seeded` rows.
- Imported and Custom user foods remain authoritative.
- Seed/release updates never overwrite or downgrade Imported/Custom records.
- Nutrition-value refinements preserve provenance, confidence and source precedence.

Batch 3 Pure Core may encode validation/decision rules, but persistence precedence remains an Adapter/Repository responsibility and must be tested in its own layer.

## ۸. Schema and ID baseline distinction

Two different statuses must not be conflated:

### Nutrition Release Candidate

`NEOFIT_NUTRITION_RELEASE_CANDIDATE_FREEZE_V1.md` freezes the Nutrition RC behavior and Catalog contract.

### Schema/ID Freeze Candidate

`NEOFIT_SCHEMA_ID_FREEZE_CANDIDATE_V1.md` is explicitly `candidate-not-final`.

It is an auditable baseline, not a public stable compatibility promise. Final promotion remains blocked by:

- source-reviewed DS0 replacement/acceptance;
- independent Natural Query corpus;
- real-device recovery and Vision QA;
- accessibility/performance/privacy and release governance.

## ۹. Auditable hash baseline

Candidate baseline records:

- latest migration: `5`
- migration count: `5`
- application tables: `23`
- audited SQLite objects: `43`
- personal schema fingerprint:
  `73e67213c7b8300723ddf91195d1c07384b2b3a0198d622a7d451af90c48bcbf`
- Generic food ID-set:
  `8e1de257cb871260f9a13f6d8eee61c9290e73de159f3223e4841f565cbb6e3d`
- Generic Concept ID-set:
  `23aab29455cdc9af62b16756dddb8fc5fd8d5dd3b3e429b56240e2e799b50ac8`
- Generic source→Concept mapping set:
  `6a603b63c7faca46b687ca56a7087716e11d165fdfa73a1fe4488475e46559c9`
- Iranian Canon ID-set:
  `6759ea828bea201299f5f11eacc2e8ebc6247b45767357e103a39d12f02e907c`
- combined app-profile ID-set:
  `0f86759cd45e9d3456cddb090e9ebd5a75c46f44a2fa9c6dc8b9fadd5c215f4a`
- app-profile→Canonical mapping set:
  `ea66d4b2b532bff1ec2f637c136adb90fa110f00cc67ca51209bc816d08ffe71`
- Persian Alias mapping set:
  `9dbfc998b90c0924e895942da18836046d94407dc860e7705c563a55f4ce777e`

The audit hashes sorted exact sets, not only row counts.

## ۱۰. App-profile to Canonical mapping order

Audit algorithm order:

1. Encoded fallback ID (`iranian-fallback-ifkb-canon-*`).
2. Exact normalized primary Persian name.
3. Aliases only when no primary-name match exists.

Required result:

- mapping count: `261`
- unresolved: `0`
- ambiguous: `0`
- one-to-one coverage of all Canonical IDs

Broad aliases must never override a more specific primary identity.

## ۱۱. Batch 3 extraction boundary

Batch 3 may extract into Pure Core:

- Catalog Release contract type and validation.
- Generated Release snapshot projection for 1.2.0 with provenance metadata.
- Evidence-tier resolution and imported-tier validation.
- Legacy food adapter and uncertainty behavior.
- Golden tests for exact Manifest projection and adapter semantics.
- Hash-baseline data contract for comparison only.

Batch 3 must not move into Pure Core:

- Python Catalog generators.
- SQLite schema/build/audit execution.
- filesystem/hash computation.
- migrations or repositories.
- persistence overwrite rules.
- bundled database bytes.
- declaration that Schema/ID candidate is a final public freeze.

## ۱۲. Golden-first continuation

Before implementation:

1. Build fixtures from Manifest 1.2.0 and Candidate hash baseline.
2. Add tests proving runtime projection equals Manifest fields.
3. Add provenance matrix tests.
4. Add legacy adapter tests for null weight, uncertainty clamps and source metadata.
5. Add explicit test that Candidate status remains non-final.
6. Only then extract the three Pure TypeScript modules.

Supabase, Web adapter, repositories and SQLite execution remain out of scope.
