# IFKB 0.5.0 — Official USDA Foundation ingestion

## Source

- USDA FoodData Central Foundation Foods
- Release: 2026-04-30
- Archive SHA-256: `d6d4f41dcd19a46abcdd67775379cb6f0292ff08daa7e0680fdd0982830bf57b`
- Archive size: 3,825,517 bytes
- Licence: CC0 / United States public domain

## Result

- 34 / 34 exact Foundation records
- 0 unmatched and 0 ambiguous
- 1,071 aggregate nutrient observations
- 253 source/sample links
- 6,766 sub-sample laboratory results
- 528 food attributes
- 60 conversion-factor records
- 0 automated critical QA issues
- 27 source-complete research candidates
- 7 incomplete source profiles excluded from projection
- 0 scientifically verified records

## Scientific decisions

- Foundation identity uses membership in `foundation_food.csv`; repeated acquisition/sample descriptions in `food.csv` are not treated as food candidates.
- Potato, spinach and raisins are represented as separate official variants; no cross-variant averaging is allowed.
- Missing aggregate macros or energy remain missing and block the mobile projection.
- The lamb carbohydrate-by-difference residual `-0.2508 g/100 g` remains unchanged in the source layer. A normalized zero may be used only in QA/projection calculations.
- Numeric derivation IDs are retained unresolved because the Foundation-only archive lacks the derivation lookup table.
- Exact source matching and automated QA do not confer verified status. Independent review remains mandatory.
