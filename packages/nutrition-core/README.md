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

## Claim boundary

The Search surface is tied to the official controlled Persian Alias benchmark. It does not establish unrestricted natural-language understanding.

The independent Persian Natural Query corpus has a validator and governance contract, but its frozen 500-row release does not yet exist. Generated Alias queries are not relabelled as natural queries.

## Explicitly absent

This package has no runtime dependency on React, React Native, Expo, SQLite, filesystem, network, Vercel, Supabase or AI providers.

Catalog release/provenance, legacy adapters, Universal SR/FNDDS nutrition estimates, SQL, backup/restore, Vision and Web adapters remain later evidence-backed batches.

## Numeric and missing-data policy

- internal arithmetic is canonicalized to 15 significant digits;
- display rounding is a separate explicit operation;
- missing nutrients remain absent and are not treated as zero;
- unknown physical weight remains `null`;
- gram calculations fail closed when basis weight is unknown.

## Source authority

- `docs/NEOFIT_NUTRITION_CORE_AUTHORITY_MAP.md`
- `docs/NEOFIT_SEARCH_RANKING_AUTHORITY_MAP.md`

Golden fixtures identify the frozen Mobile branch/head, exact source Blob SHAs and controlled Search release evidence. A parity difference must be reviewed as a behavioral change; tests must not be silently changed to accept a new result.

## Validation

```bash
npm install --no-audit --no-fund
npm run check
```
