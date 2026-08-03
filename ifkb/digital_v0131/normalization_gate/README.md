# IFKB DS2 Normalization Gate v1

## Why this gate exists

IFKB v0.13.1 contains three real multi-source **identity/recipe-consensus** profiles:

| Canonical identity | Sources | Independent groups | Current nutrient status |
|---|---:|---:|---|
| IFKB-CANON-00008 — قورمه‌سبزی | 4 | 4 | blocked |
| IFKB-CANON-00010 — فسنجان | 4 | 3 | blocked |
| IFKB-CANON-00028 — کباب کوبیده | 5 | 5 | blocked |

The source release explicitly reports `nutrient_intervals_ready = 0`. Complete quantity, ingredient mapping and cooked-yield coverage are still required. Therefore, the current application candidate's legacy nutrition centre plus DS2 variability must **not** be relabelled as a normalized DS2 nutrient calculation.

This package adds a fail-closed boundary. It does not calculate nutrients and it does not promote a profile.

## Required path to promotion

A profile may set `promotionEligible=true` only after all of these are complete:

1. every structured ingredient is mapped to a stable IFKB or governed USDA ingredient identity;
2. every source quantity is normalized to a defensible gram value or interval;
3. edible fractions are applied where relevant;
4. cooked batch yield and serving count/weight are resolved;
5. an explicit nutrient-retention factor set is selected for the cooking method;
6. p10/p50/p90 serving nutrition is calculated from the normalized recipe evidence rather than copied from the legacy centre;
7. ingredient mapping and calculation artifacts are content-hashed;
8. two independent reviewers and a distinct adjudicator approve the result;
9. no blocking reason remains.

A JSON Schema describes the shape, while `validate_normalization_gate.py` enforces cross-field scientific rules that JSON Schema alone cannot express.

## Current files

- `current-status.v1.json` — exact fail-closed status for the three v0.13.1 DS2 identities; no invented nutrient values.
- `gate.schema.json` — structural contract.
- `ingredient-normalization-template.csv` — row-level ingredient mapping and unit-normalization work surface.
- `profile-calculation-template.csv` — cooked-yield, serving and interval calculation work surface.
- `validate_normalization_gate.py` — standard-library validator.

## Commands

Validate the current status without pretending it is release-ready:

```bash
python ifkb/digital_v0131/normalization_gate/validate_normalization_gate.py \
  --input ifkb/digital_v0131/normalization_gate/current-status.v1.json \
  --report build/ds2-normalization/draft-report.json \
  --mode draft \
  --require-v0131-profile-set
```

Release mode is expected to fail today and must continue failing until every profile is truly ready:

```bash
python ifkb/digital_v0131/normalization_gate/validate_normalization_gate.py \
  --input ifkb/digital_v0131/normalization_gate/current-status.v1.json \
  --mode release \
  --require-v0131-profile-set
```

Run tests:

```bash
python -m unittest -v ifkb/digital_v0131/test_normalization_gate.py
```

## Scientific boundary

Passing this gate establishes internal consistency, complete provenance linkage and independent review. It does not make a laboratory-analysis claim and must not be represented as clinical or food-labelling accuracy.

## Thirteen-record source work queue

`source-record-normalization-work-queue.v1.json` preserves all 13 DS2 recipe-source records and separates:

- quantities already expressed in grams;
- count/cup/tablespoon/teaspoon quantities that still need sourced conversion factors;
- source-level `normalization_status=normalized` from full recipe-calculation readiness;
- missing cooked yield and serving weight.

`unit-conversion-work-queue.v1.json` lists every unresolved conversion family and the affected source records. Conversion factors are intentionally null until a reviewable source, preparation/form scope and reviewer are recorded.
