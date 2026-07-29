# NeoFit IFKB DS2 Normalization Gate v1

## Status

**Fail-closed normalization infrastructure is implemented and passing. No DS2 profile is nutrient-promotion ready.**

This document records the repository state after the first DS2 recipe-consensus release was connected to source-level normalization, quantity semantics, official-portion evidence staging and the first ingredient-mapping work item.

## Reproducible reference

- repository: `Emad211/Neofit-ai`
- pull request: `#3`
- head commit: `f66162f2558c570714a204cb4a509a8f8c10a27c`
- Mobile CI run: `30494511830` (`#484`)
- DS2 artifact: `ifkb-ds2-normalization-gate-report`
- artifact id: `8741050180`
- artifact digest: `sha256:4fcfb75845db45dfb9c4d8e9429544d4c685bbe814805a837f5635521ed9127a`
- gate fingerprint: `1a1b1805b799bb0fd884355bef2fa84a9bd700b3987251a25f64f931c1efa34f`

Mobile CI passed the complete DS2 gate, schema/ID freeze-candidate generation, Expo compatibility, Expo Doctor, strict TypeScript and Android export.

## DS2 profile state

The current release contains three real multi-source identity/recipe-consensus profiles:

| Canonical food | Source records | Independent source groups | Nutrient promotion |
|---|---:|---:|---|
| IFKB-CANON-00008 — قورمه‌سبزی | 4 | 4 | blocked |
| IFKB-CANON-00010 — فسنجان | 4 | 3 | blocked |
| IFKB-CANON-00028 — کباب کوبیده | 5 | 5 | blocked |

Current totals:

- profiles: **3**
- promotion eligible: **0**
- blocked: **3**
- source records: **13**
- gate tests: **45**

Identity consensus is not treated as nutrient readiness. Legacy nutrition centres cannot be relabelled as normalized recipe calculations.

## Quantity semantics

All 13 source records now have an explicit semantic role for every structured quantity key:

- raw quantity keys: **83**
- independent ingredient keys: **69**
- derived aggregate keys: **2**
- ingredient interval pairs: **4**
- recipe-output keys: **2**
- recipe-output interval pairs: **1**
- unclassified keys: **0**
- multiply classified keys: **0**

The two derived aggregates are the total-meat fields in `DS2-KB-01` and `DS2-KB-03`. They equal their beef/lamb component sums and are forbidden from being added again as independent ingredients.

Low/high source fields are interval bounds, not two separate ingredients. Skewer counts are recipe outputs, not ingredient masses.

## Household-unit normalization evidence

The bundled IFKB 1.2.0 SQLite catalog was audited read-only against all unresolved household-unit families.

- unit families: **26**
- searched in official SR Legacy/FNDDS portions: **22**
- explicitly non-catalog protocols: **4**
- families with raw candidates: **20**
- families with qualified exact-form/measure candidates: **18**
- approved conversions: **0**

Review queue:

| Status | Count |
|---|---:|
| ready for independent review | 10 |
| convergent official records, still requiring review | 2 |
| source-specific adjudication required | 6 |
| catalog or exact-measure gap | 4 |
| non-catalog protocol required | 4 |

Known catalog/measure gaps:

- fresh chives by cup;
- fresh fenugreek leaves by cup;
- pomegranate molasses by tablespoon;
- granulated sugar by exact tablespoon.

Non-catalog protocols remain required for:

- dried fenugreek leaves;
- whole dried Persian lime count;
- dried Persian lime cup volume;
- skewer count/output yield.

No conversion factor is automatically inserted. Every factor, interval or source-form choice remains unapproved until independent review and adjudication.

## Source work priority

Priority is based only on remaining normalization work. It is not an evidence-quality score and not nutrient readiness.

| Tier | Meaning | Source count |
|---|---|---:|
| A | independent ingredient quantities already mass-anchored and servings known | 1 |
| B | at most two household-unit families remain | 3 |
| C | multiple household-unit families remain | 8 |
| D | serving count is missing | 1 |

The first work item is `DS2-KB-03`, the six-serving Zaffaron koobideh source. Its seven independent ingredient quantities are already expressed in grams. It is still blocked by ingredient source selection, cooked yield, edible fractions and retention factors.

## DS2-KB-03 ingredient identities

Seven independent ingredient keys have complete candidate IFKB identity-target coverage:

| Quantity key | Candidate IFKB identity |
|---|---|
| lamb_total_g | IFKB-ING-0029 — Lamb, ground, raw |
| beef_total_g | IFKB-ING-0030 — Beef, ground, raw |
| onion_total_g | IFKB-ING-0095 — Onion, raw, unspecified variety |
| salt_total_g | IFKB-ING-0089 — Salt, table |
| black_pepper_total_g | IFKB-ING-0092 — Black pepper, ground |
| sumac_total_g | IFKB-ING-0093 — Sumac, ground |
| baking_soda_total_g | IFKB-ING-0094 — Baking soda |

The last four identities are maintained in a candidate extension and are not yet merged into the frozen core ingredient reference.

The source specifies onion without a colour/variety. Therefore it is explicitly forbidden to silently specialize the identity to white, red or yellow onion.

Identity-target coverage does not approve a nutrient source:

- independent ingredients: **7**
- identity targets: **7**
- candidate extension identities: **4**
- approved nutrient sources: **0**
- promotion eligible: **false**

## DS2-KB-03 nutrient-source candidates

The bundled generic Concept/Variant layer produced the following review state:

| Mapping state | Count |
|---|---:|
| single source-food candidate ready for independent review | 4 |
| multiple variants within one concept | 1 |
| multiple concepts and variants | 1 |
| catalog gap | 1 |

Current interpretation:

- lamb: one raw-ground-lamb source candidate;
- salt: one table-salt source candidate;
- black pepper: one black-pepper source candidate;
- baking soda: one baking-soda source candidate;
- onion: two source records within one generic raw-onion concept;
- beef: nine raw ground-beef candidates across fat classes/concepts;
- sumac: no generic nutrient source in the bundled catalog.

The beef candidates demonstrate why blind averaging is forbidden. Across current raw ground-beef candidates, per-100-g values span approximately:

- energy: **121–332 kcal**;
- protein: **14.35–21.41 g**;
- fat: **3–30 g**.

These are candidate-source vectors only. They have not been multiplied by recipe mass. No recipe contribution, cooked yield, retained nutrient value, serving weight or final koobideh nutrition has been calculated.

## Remaining path for the first normalized DS2 profile

For `DS2-KB-03`:

1. independently review the four single-candidate nutrient sources;
2. adjudicate raw onion source-variant handling;
3. select or interval-govern the beef lean/fat class using defensible recipe evidence;
4. acquire or govern a nutrient source for culinary ground sumac;
5. freeze ingredient mappings and their content hash;
6. determine edible fractions;
7. obtain or calculate cooked batch yield;
8. select a reviewed retention-factor model;
9. calculate p10/p50/p90 batch and serving nutrition;
10. perform two independent reviews and a distinct adjudication;
11. only then produce a Promotion Bundle.

Until those steps pass, `DS2-KB-03`, the other two DS2 profiles and all DS0 profiles remain non-verified nutrition profiles.
