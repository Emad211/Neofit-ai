# NeoFit Nutrition — Stage 1 of 10

## Goal

Create the complete, reproducible execution foundation for all nutrition records and all Iranian-food image classes. This stage does not attempt to finish one food; it makes every later stage measurable and parallel.

## Locked scope

- 13,225 generic USDA records remain under the immutable IFKB 1.2.0 catalog contract.
- 261 Iranian canonical foods remain assigned exactly once to 12 balanced nutrition/image batches.
- Image acquisition uses only openly licensed internet candidates or consented field capture.
- Internet images are identity/retrieval candidates only. They cannot become Nutrition Gold without a measured serving and locked recipe provenance.

## Stage 1 deliverables

1. Deterministic 261-row image-class ledger.
2. Deterministic query pack for Wikimedia Commons and Openverse.
3. Twelve per-batch image acquisition packs aligned with the nutrition batches.
4. Explicit row-level reconstruction audit for the historical 58-asset release aggregate.
5. Metadata-only network discovery with CC0/PDM/CC BY/CC BY-SA filtering.
6. Rejection of NC, ND, unknown licence, mature, undersized and negative-term results.
7. No automatic identity approval, no automatic download and no Nutrition Gold promotion.
8. Mobile CI artifact and a separate path-scoped external discovery workflow.

## Existing image baseline before Stage 1

- Prepared-food canon: 261 classes.
- Historical P0 scope: 60 classes.
- Licensed image release aggregate: 58 assets.
- P0 classes with any accepted role: 43.
- P0 unresolved classes: 17.
- Nutrition Gold internet images: 0.
- Consented images actually captured: 0.

The 58-asset aggregate is not sufficient for final release unless every accepted asset is reconstructable as a row containing canon id, source landing page, author, licence, image role, review status and asset hash. Stage 1 therefore treats missing artifact-only rows as a release-blocking ledger reconstruction gap rather than silently trusting aggregate counts.

## Completion rule

Stage 1 is complete when:

- all 261 classes appear once in the image ledger;
- all 261 classes have Commons and Openverse query routes;
- all 12 batches have image work packs;
- the historical P0 set reconstructs to exactly 60 classes;
- external search only produces pending metadata candidates;
- Mobile CI, strict TypeScript and Android export remain green.

## Next stage

Stage 2 performs broad metadata review and exact-source verification in batches, restores missing row-level manifests from retained workflow artifacts, and selects download-eligible originals. Ambiguous classes and classes with no licensable internet source are moved to consented field capture without blocking the remaining batches.
