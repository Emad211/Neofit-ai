# NeoFit full nutrition catalog bulk audit v1

## Status

**Operational bulk baseline — not a claim that all Iranian profiles are scientifically verified.**

This release replaces food-by-food progress tracking with record-level coverage for the complete bundled nutrition catalog and a 12-batch execution plan for all Iranian identities.

## Reproducible references

- repository: `Emad211/Neofit-ai`
- pull request: `#3`
- full-audit head: `d152a2ce279ca3257e08008d0ae13ea2f3f0616f`
- Mobile CI run: `30495859013` (`#487`)
- full-audit artifact id: `8741543686`
- full-audit artifact digest: `sha256:3204fb5b5990d1d38726c1a5b3499d2845b904f24cd05957af6a07a44a29d78a`
- discovery/collection head: `22df2dfce8f86dea55925aae6773249ca1c27b9f`
- Mobile CI run: `30496705406` (`#491`)
- discovery artifact id: `8741869716`
- discovery artifact digest: `sha256:413af77953ff21a8767be5b6e0d18fd3c7f3dce2e928cf8d89fd6f0f65cf2e66`

## Complete tracked surface

- total records tracked: **13,486**
- generic source records: **13,225**
- Iranian canonical/app profiles: **261**
- generic concepts: **9,279**
- generic source-to-concept mappings: **13,225 / 13,225**
- official household portions: **36,494**

Every generic record and every Iranian profile has an individual row in the generated audit artifacts.

## Generic catalog readiness

| Readiness class | Count | Runtime interpretation |
|---|---:|---|
| Complete macros + official portion | 12,927 | grams and official portions |
| Complete macros, no official portion | 297 | grams/per-100g only |
| Macro incomplete | 1 | excluded from selectable runtime results |
| Missing Concept/Variant mapping | 0 | CI failure if introduced |

Additional counts:

- generic records with official portions: **12,928**
- SR Legacy records: **7,793**
- FNDDS records: **5,432**
- macro-complete records: **13,224**

The single macro-incomplete record is `fndds-2705383` (`Milk, human`). It is retained in the immutable source artifact for provenance but filtered from universal search/detail selection. Records with complete macros and no official portion remain available for gram-based calculation.

Micronutrient coverage:

- calcium: **13,139**
- iron: **13,144**
- potassium: **12,947**
- vitamin C: **12,763**

Generic readiness fingerprint:

`250e27a6a88e66a8ad8e69f769cc8f58d9051ad6634c06113f627ec816f7282e`

## Iranian profile readiness

| Current class | Count | Bulk workstream |
|---|---:|---|
| DS0 broad fallback | 178 | acquire sources and recipe/serving profile |
| DS2 consensus, nutrient blocked | 3 | finish normalization, yield, retention and nutrient review |
| Legacy estimate | 80 | revalidate and replace legacy centre |

- known serving weights: **7**
- unknown serving weights: **254**
- promotion eligible: **0**

Category counts:

- bread: 12
- breakfast: 9
- dairy/beverage: 14
- dessert: 41
- kebab: 20
- rice: 42
- soup: 35
- stew: 35
- street food: 53

Iranian readiness fingerprint:

`ee13220111c8814a080694a1f7be3e83ae6d89bd297e65efffafaef52453cb32`

## Parallel batch plan

All 261 Iranian profiles are assigned exactly once to **12 balanced execution batches**:

- batch size: **21–22 foods**
- each batch mixes DS0, legacy and, where applicable, DS2 work
- one food cannot block the remaining catalog
- batch assignment fingerprint:
  `0ad7bbbffd86862f99a2b81865703c5ed56522ba62f7f557050b8c0ad023f53d`

The batch plan is an operational order, not a scientific verification score.

## Multilingual source-discovery packs

For all 261 Iranian foods, CI generates:

- Persian exact-name, serving-weight and nutrition-source queries
- English recipe, ingredient-quantity and serving-weight queries
- alias-derived Persian queries when aliases exist
- required extraction outputs and rejected-evidence rules
- 12 per-batch JSON work packs
- one complete CSV queue

Current generated totals:

- canonical foods covered: **261 / 261**
- Persian queries: **861**
- English queries: **783**
- foods with additional canonical aliases: **39**
- approved source records: **0**

## Multi-collection research registry

Eight broad source collections are registered by role, access and reuse boundary:

- Iranian Food Composition Table 2017
- SAMAR Iranian food-composition candidate
- Persian Mama recipe index
- FAO/USDA Food Composition Tables for the Near East
- WHO/EMRO traditional rural Iranian foods study
- FAO/INFOODS Analytical Food Composition Database 2.0
- USDA SR Legacy
- USDA FNDDS

The generated collection plan contains:

- candidate collection assignments: **2,040**
- foods with recipe-discovery assignments: **261 / 261**
- foods with nutrient-authority assignments: **261 / 261**
- exact food matches approved: **0**
- source records approved: **0**

A collection assignment identifies where to search. It does not claim that the exact food is present, that reuse is permitted, that the source is independent, or that nutrition may be promoted.

## Runtime and governance guards

- macro-incomplete generic records are not selectable;
- macro-complete records without official portions remain usable by grams;
- public recipe prose and images are not redistributed;
- model-generated recipes or nutrition are rejected;
- recipe identity, ingredient mapping, serving weight and nutrient evidence remain separate review dimensions;
- every Promotion Bundle still requires record-level provenance, serving basis and independent review.

## Next bulk gate

The next execution gate is not another single-food deep dive. It is:

1. run collection-level URL discovery against the 261 canonical names and aliases;
2. retain strong title/URL candidates without copying recipe content;
3. route candidate links into the 12 batches;
4. extract structured facts in parallel;
5. escalate only ambiguous, high-impact or source-gap records for deep review;
6. produce Promotion Bundles in groups rather than one at a time.
