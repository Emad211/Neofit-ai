# @neofit/nutrition-core

Pure, deterministic nutrition-domain package extracted from NeoFit Mobile RC and IFKB release authorities.

## Current surface

### Batch 1 — Nutrition arithmetic

- nutrient and food/portion contracts
- serving resolution
- nutrient scaling/ranges
- missing-aware aggregation
- recipe totals, servings and per-100g values
- diary summaries
- nutrition-goal progress

### Batch 2 — Controlled Persian Search and ranking

- Persian Unicode normalization
- preparation-modifier parsing
- deterministic local food-document scoring
- controlled Persian Alias index and routing
- longest-contained and compact joined-spacing matching
- modifier-aware Generic target resolution
- SR Legacy/FNDDS candidate ranking
- stable ranking tie-breaks

### Batch 3 — Catalog Release, provenance and Legacy compatibility

- typed Catalog Release contract and invariant validation
- generated IFKB Catalog `1.2.0` projection tied to the frozen Manifest
- explicit Schema/ID `candidate-not-final` comparison baseline
- Catalog evidence-tier resolution
- reviewed Imported evidence allowlist
- Legacy food to Concept/Variant adapter
- per-serving and unknown-weight preservation
- bounded legacy uncertainty range
- source-record and source-version normalization

The Catalog generator, SQLite asset and Manifest remain authoritative. `IFKB_CATALOG_RELEASE` is a checked consumer projection, not an independently edited source of truth.

## Claim boundaries

The Search surface is tied to the official controlled Persian Alias benchmark. It does not establish unrestricted natural-language understanding.

The independent Persian Natural Query corpus has a validator and governance contract, but its frozen 500-row release does not yet exist. Generated Alias queries are not relabelled as natural queries.

The Nutrition RC and Catalog `1.2.0` are frozen. The Schema/ID `1.1.0` baseline remains explicitly `candidate-not-final`; it is not a public stable-compatibility promise.

## Explicitly absent

This package has no runtime dependency on React, React Native, Expo, SQLite, filesystem, network, Vercel, Supabase or AI providers.

Universal SR/FNDDS nutrition estimates, SQLite equivalence execution, persistence precedence, migrations, SQL, backup/restore, Vision and Web adapters remain later evidence-backed batches.

## Numeric and missing-data policy

- internal arithmetic is canonicalized to 15 significant digits;
- display rounding is a separate explicit operation;
- missing nutrients remain absent and are not treated as zero;
- unknown physical weight remains `null`;
- gram calculations fail closed when basis weight is unknown;
- Legacy uncertainty is clamped to a relative fraction between `0` and `0.8`.

## Source authority

- `docs/NEOFIT_NUTRITION_CORE_AUTHORITY_MAP.md`
- `docs/NEOFIT_SEARCH_RANKING_AUTHORITY_MAP.md`
- `docs/NEOFIT_CATALOG_PROVENANCE_AUTHORITY_MAP.md`

Golden fixtures identify the frozen Mobile branch/head, exact source Blob SHAs, controlled Search release evidence, Catalog Manifest and Schema/ID candidate baseline. A parity difference must be reviewed as a behavioral change; tests must not be silently changed to accept a new result.

## Validation

```bash
npm install --no-audit --no-fund
npm run check
```
