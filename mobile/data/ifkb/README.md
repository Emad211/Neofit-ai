# Iranian Food Knowledge Base (IFKB)

IFKB is the scientific master-data layer for NeoFit's Iranian food catalog. It is deliberately separate from the mobile `neofit-food-catalog` projection.

## Current research release: 0.5.0

The official USDA FoodData Central Foundation Foods archive dated 2026-04-30 has been validated and ingested.

- Archive SHA-256: `d6d4f41dcd19a46abcdd67775379cb6f0292ff08daa7e0680fdd0982830bf57b`
- 34 / 34 exact Foundation records matched
- 1,071 aggregate nutrient observations
- 253 source/sample links
- 6,766 sub-sample laboratory results
- 528 food attributes
- 60 conversion-factor records
- automated critical QA issues: 0
- source-complete research candidates: 27
- incomplete Foundation profiles excluded from projection: 7
- scientifically verified records: 0

All selected records remain `in_review`. Automation and exact source matching do not replace independent scientific review.

## Release history

### 0.1.0 — structural foundation

The original 83 NeoFit starter estimates were migrated into a quarantine-grade legacy layer. They remain evidence grade `E` and unverified.

### 0.2.1 — ingredient reference layer

- 91 canonical Iranian-cuisine ingredients
- 64 priority-P0 ingredients
- explicit preparation, processing and edible-part distinctions
- A/B/C/D/U food-match classes
- machine-readable QA and corrective-release discipline

### 0.3.0 — official coverage map

Official USDA inventory descriptions were used only to build an acquisition queue. No FDC ID or composition value was inferred from a name.

### 0.5.0 — official Foundation ingestion

The source archive was read at byte level, hashed, schema-checked and matched against `foundation_food.csv`. Potato, spinach and raisin concepts were split into explicit official variants rather than averaged.

A small source residual for lamb carbohydrate by difference (`-0.2508 g/100 g`) is retained in the raw observation layer. A normalized zero is used only in QA/projection calculations and is explicitly documented.

Seven Foundation records lack complete aggregate macro/energy profiles in this archive. Their available observations are retained, but they are excluded from the core/mobile projection and are never filled with guesses or secondary mirror values.

## Scientific principles

- Every value retains its source, source record, basis, unit and review state.
- Missing values are never silently converted to zero.
- Raw/cooked, salted/unsalted, drained/undrained and different edible portions remain distinct identities.
- Duplicate canonical nutrient observations are not silently averaged.
- Specific and general Atwater energies remain distinct observations.
- Restricted or unclear-licence data cannot enter distributable releases.
- Published releases are immutable; corrections create successor releases.
- No record becomes `verified` without independent scientific sign-off.

## Directory layout

- `schema/` — scientific exchange contracts
- `methodology/` — QA, matching and calculation policies
- `reference/` — canonical ingredients and source coverage
- `sources/` — source/licence registry
- `staging/` — quarantined and in-review source observations
- `releases/` — immutable manifests
- `pipelines/` — ingestion documentation
- `research/` — decisions and audit log

## Mobile use

The mobile catalog is a lossy product projection, not the scientific master. IFKB values may enter it only after source promotion, serving-weight definition and projection validation. The existing 83 built-in foods remain legacy estimates until replaced through that process.
