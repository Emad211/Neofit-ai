# NeoFit Nutrition — Stage 2 of 10

## Status

**Historical image recovery and batch synchronization completed. Broad metadata
review remains in progress.**

## Completed checkpoint

Stage 2 has now closed both infrastructure gaps found in Stage 1:

1. the static image/source registry is synchronized to the current nutrition
   plan with 261 unique foods in 12 balanced batches;
2. every one of the historical 58 licensed-image aggregate rows is represented
   by an explicit, reviewable row.

## Batch synchronization

- canonical rows: **261 / 261**;
- batches: **12**;
- batch sizes: **22 × 9, 21 × 3**;
- historical row moves applied: **187**;
- assignment SHA-256:
  `72eeea2f4be20ea3a60873ddd80d104cc6b23132fef8d441e1e5a0e72db76c24`.

Nutrition source routing, image routing and structured-fact routing now share
the same assignment release.

## Image-evidence recovery

Historical baseline:

- licensed aggregate: **58 assets / 43 classes**;
- branch-reconstructable before Stage 2: **42 assets / 33 classes**.

Stage 2 evidence:

- Retry artifact `8634119409`: 61 candidates reviewed, 11 rows accepted across
  seven classes;
- Wave 3 artifact `8634114609`: 18 candidates reviewed, five rows accepted
  across three classes;
- row-level ledger after Stage 2: **58 / 58 assets, 43 / 43 classes**;
- historical row gap: **0 assets, 0 classes**.

The 16 rows are explicitly described as Stage 2 re-adjudications from retained
candidate bytes. They are not falsely represented as recovery of an
uncommitted historical final-candidate list.

## Wave 3 decisions

- Chicken Tahchin: accepted only as preparation-process context because the
  frame is not a formed served Tahchin;
- Shishlik: two served-final references, locked to one session/split group;
- Stone-pot Dizi: restaurant and vessel context only, not served-food identity;
- Plain Persian Rice false positives: rejected;
- Adasi camera/landscape false positives: rejected;
- unrelated Akbar Joojeh result: rejected;
- duplicate Gheimeh Nesar candidate: rejected.

## Safety boundary

- automatic identity approvals: **0**;
- internet images promoted to Nutrition Gold: **0**;
- every accepted row retains author, licence, licence URL, Commons page,
  Commons SHA1, downloaded SHA-256, role and split group;
- context images cannot silently become served-food identity references.

## Remaining Stage 2 work

1. execute broad metadata discovery across all 12 batches;
2. verify source landing pages and exact identity in groups;
3. select download-eligible originals and licence-compliant thumbnail
   fallbacks;
4. route ambiguous or no-source classes to consented field capture;
5. publish the Stage 2 acquisition-candidate release with zero unreviewed
   promotions.
