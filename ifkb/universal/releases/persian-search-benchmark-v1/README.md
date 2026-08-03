# IFKB Persian Search Benchmark v1

This release freezes the first reproducible Persian search regression gate for NeoFit.

## Scope

The corpus contains exactly 500 deterministic queries generated from the controlled Persian alias registry:

- 202 exact aliases
- 202 aliases inside realistic gram/serving phrases
- Arabic-character forms
- half-space forms
- punctuation
- extra spacing
- sentence context
- joined Persian words
- trailing serving language

The evaluator uses the production TypeScript alias index, modifier resolver and universal-food ranker. Python is used only to execute FTS5 against the real bundled SQLite catalog and return source candidates.

## Result

- alias route accuracy: **100%**
- Top-1 accuracy: **100%**
- Top-5 accuracy: **100%**
- failed queries: **0 / 500**

The result passed the locked Scope thresholds of 90% Top-1 and 97% Top-5.

## Interpretation

This is a regression benchmark for the controlled alias/search surface. It does not prove unrestricted Persian language understanding. Every change to aliases, catalog contents, normalization, modifier resolution or ranking must rerun `.github/workflows/ifkb-persian-search-benchmark.yml`.
