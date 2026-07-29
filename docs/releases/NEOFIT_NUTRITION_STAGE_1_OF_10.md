# NeoFit Nutrition — Stage 1 of 10

## Status

**Completed on 2026-07-30.**

Stage 1 created the reproducible execution foundation for the complete nutrition catalog and every Iranian-food image class. It deliberately worked at catalog scale rather than completing one food.

## Locked catalog scope

- Generic USDA source records: **13,225**.
- Iranian canonical foods/image classes: **261**.
- Nutrition execution batches: **12**.
- Historical image priority roster: **60 P0 classes**, defined only by the 12-class pilot manifest plus the 48-class P0 candidate queue.
- Operational image waves: **60 / 115 / 86**.
- Internet images remain identity/retrieval candidates only; they cannot become Nutrition Gold without measured serving and locked recipe provenance.

## Stage 1 outputs

1. Deterministic **261-row image-class ledger**.
2. Deterministic **261-row query pack** for Wikimedia Commons and Openverse.
3. Twelve per-batch image acquisition packs.
4. Explicit row-level reconstruction audit for the historical 58-asset release aggregate.
5. Metadata-only discovery with CC0/PDM/CC BY/CC BY-SA filtering.
6. Rejection of NC, ND, unknown licence, mature, undersized and negative-term results.
7. Zero automatic identity approvals, zero automatic downloads and zero Nutrition Gold promotions.
8. Mobile CI artifact plus a separate path-scoped external metadata-discovery workflow.

## Verified image baseline

Historical aggregate claims:

- licensed packaged assets: **58**;
- P0 classes with any accepted image role: **43**;
- unresolved P0 classes: **17**;
- Nutrition Gold internet images: **0**;
- consented captured images: **0**.

Row-level records currently reconstructable from the branch:

- accepted asset rows: **42 / 58**;
- covered classes: **33 / 43**;
- missing asset rows: **16**;
- missing covered-class rows: **10**.

The aggregate counts are therefore not sufficient for final release. The missing artifact-only manifest rows are a release-blocking reconstruction gap and must be restored from retained workflow artifacts during Stage 2.

## Complete 261-class plan

- canonical classes: **261 / 261**;
- P0 roster: **60 / 60**;
- Image Wave A: **60**;
- Image Wave B: **115**;
- Image Wave C: **86**;
- Commons query variants: **1,083**;
- Openverse query variants: **783**;
- field-capture classes already identified: **17**;
- automatic identity approvals: **0**;
- internet images approved as Nutrition Gold: **0**.

Fingerprints:

- class ledger SHA-256: `5a0c96abeecb47c7c5de48af9a73558b11f26a64ae4f1f4041d9f77501fa654c`
- query pack SHA-256: `18031e06440515ae740b78f660db5daa255f78dab8357ab0f1c5a237686cc10e`

## Batch-registry drift found

The current nutrition audit dynamically generates balanced batches of 22/21 foods. The older static registry used by external routing still ranges from 20 to 23 foods per batch. All 261 classes remain unique and covered, so this does not invalidate Stage 1, but the static registry must be regenerated from the current nutrition batch plan before Stage 2 downloads or structured source facts are finalized.

## Validation

Mobile CI run **#508** completed successfully on head `94d8fb90b6121388505e3da26354009c5a01e6de`.

Passing gates include:

- deterministic TypeScript/SQLite tests;
- full 13,486-record nutrition audit;
- Iranian source-discovery packs and collection plan;
- complete DS2 gate;
- Stage 1 image planner and offline metadata-discovery tests;
- schema/ID freeze candidate;
- Expo package check and Expo Doctor;
- strict TypeScript;
- Android export.

Stage 1 artifact:

- artifact id: `8743256828`
- artifact digest: `sha256:8c8285c5a101a33705e859d31776f1e398777a8bfba373d6798eaad92ee041fe`

## Stage 1 definition of done

- all 261 classes appear exactly once in the ledger: **passed**;
- all classes have Commons and Openverse query routes: **passed**;
- all 12 batches have image work packs: **passed**;
- historical P0 roster reconstructs to exactly 60 classes: **passed**;
- candidate metadata cannot self-approve identity or nutrition use: **passed**;
- Mobile CI, TypeScript and Android export: **passed**;
- row-level reconstruction of all 58 historical assets: **deferred to Stage 2 and explicitly release-blocking**.

## Stage 2

Stage 2 will:

1. regenerate the static image/source batch registry from the current balanced nutrition plan;
2. restore the missing 16 asset rows and 10 class-coverage rows from retained artifacts;
3. execute broad Commons/Openverse metadata discovery by batch;
4. verify landing-page licence and exact identity in groups;
5. select download-eligible originals;
6. route ambiguous or no-source classes to consented field capture without blocking other batches.
