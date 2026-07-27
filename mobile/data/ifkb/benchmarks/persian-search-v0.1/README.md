# Persian Search Benchmark v0.1

This directory documents the first executable Persian-search regression layer for NeoFit.

## Current automated set

`mobile/tests/persian-alias-benchmark.test.ts` builds exactly 500 deterministic queries from unambiguous Iranian-food aliases stored in the immutable mobile catalog. It exercises the same pure alias index and matcher used by the Expo repository.

The perturbations cover:

- exact aliases;
- leading and trailing whitespace;
- ZWNJ versus ordinary spaces;
- Arabic versus Persian Yeh/Kaf code points;
- serving phrases;
- meal-context phrases;
- sentence-context phrases;
- Persian-digit context.

The test records Top-1 and Top-5 resolution, per-perturbation counts, and sample failures. It fails CI below Top-1 98% or Top-5 99.5%.

## Scientific limitation

This is a deterministic alias and normalization stress benchmark. It is not an independent corpus of naturally occurring user queries and must not be presented as final product search accuracy.

The final release benchmark still requires a separately curated, frozen 500-query corpus containing genuine spelling errors, colloquial names, regional terms, ambiguous foods, portions, preparation modifiers, negative cases, and queries that should abstain. Its required release thresholds remain Top-1 at least 90% and Top-5 at least 97%.
