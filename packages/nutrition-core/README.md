# @neofit/nutrition-core

Pure, deterministic nutrition-domain package extracted from NeoFit Mobile RC.

## Batch 1 surface

- nutrient and food/portion contracts
- serving resolution
- nutrient scaling/ranges
- missing-aware aggregation
- recipe totals, servings and per-100g values
- diary summaries
- nutrition-goal progress

## Explicitly absent

This package has no runtime dependency on React, React Native, Expo, SQLite, filesystem, network, Vercel, Supabase or AI providers.

Search/ranking, catalog release/provenance, legacy adapters, Universal SR/FNDDS estimates, SQL, backup/restore and Vision are intentionally deferred to later evidence-backed batches.

## Numeric policy

- internal arithmetic is canonicalized to 15 significant digits;
- display rounding is a separate explicit operation;
- missing nutrients remain absent and are not treated as zero;
- unknown physical weight remains `null`;
- gram calculations fail closed when basis weight is unknown.

## Source authority

See `docs/NEOFIT_NUTRITION_CORE_AUTHORITY_MAP.md`.

Golden fixtures identify the frozen Mobile branch/head and exact source Blob SHAs. A parity difference must be reviewed as a behavioral change; tests must not be silently changed to accept a new result.

## Validation

```bash
npm install --no-audit --no-fund
npm run check
```
