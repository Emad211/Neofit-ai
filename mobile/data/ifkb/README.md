# Iranian Food Knowledge Base (IFKB)

IFKB is the scientific master-data project behind NeoFit's Iranian food catalog.

## Foundation release: 0.1.0

This release creates the normalized, auditable structure and migrates the existing 83 NeoFit starter estimates into a quarantine-grade legacy layer.

**Important:** none of the 83 legacy records is scientifically verified. They are evidence grade `E`, review status `unverified`, and must not be used for clinical, regulatory, research, or food-labelling claims.

## Current ingredient reference release: 0.2.1

Release `0.2.1` supersedes `0.2.0` and contains the first engineered ingredient layer:

- 91 canonical ingredients used in common Iranian recipes
- 64 priority-P0 ingredients
- explicit raw/cooked, drained/undrained, salted/unsalted and edible-part separation
- match quality classes `A`, `B`, `C`, `D`, and `U`
- 20 automated/manual QA rules
- six traceable staging observations used to test the pipeline
- four quarantined observations that demonstrate unit, identity, salt-state, provenance or plausibility failures
- pinned authoritative USDA target: Foundation Foods April 2026
- dependency-free Node validator for staging and release gates

Automated energy QA found that `STG-0003` had an approximately 30% discrepancy while its old status was `candidate_secondary`. Release `0.2.0` is retained as an immutable research snapshot and marked superseded. Corrective release `0.2.1` changes it to `quarantined`; no verified or mobile record was affected.

Verified ingredients remain **0**. Secondary mirrors and generic nutrition datasets are discovery sources only and may not enter a distributable release until checked against an authoritative, pinned source record and independently reviewed.

## Design principles

- Preserve every source observation instead of silently averaging values.
- Distinguish missing, zero, trace, below-detection, estimated, calculated, and analytical values.
- Keep food identity, multilingual names, portions, nutrient observations, recipes, ingredients, sources, mappings, and QA issues in separate normalized tables.
- Use per-100 g edible portion as the canonical comparison basis.
- Retain per-serving values only when a measured or defensible gram weight exists.
- Calculate mixed dishes using ingredient weights, edible portions, cooked yield, and nutrient-retention factors.
- Recalculate screening energy inside IFKB and compare it with reported energy.
- Store source release, food-data type, licence, derivation method, match quality, evidence grade, confidence, and review state.
- Treat the current `neofit-food-catalog` v1 JSON as a lossy mobile projection, not the scientific master.

## Directory layout

- `schema/ifkb.schema.json`: canonical entity contracts.
- `releases/0.1.0/manifest.json`: immutable structural foundation release.
- `releases/0.2.0/manifest.json`: superseded ingredient-layer research snapshot.
- `releases/0.2.0/SUPERSEDED.md`: correction notice.
- `releases/0.2.1/manifest.json`: current corrective ingredient-layer release.
- `reference/ingredient-catalog-core.csv`: canonical ingredient ontology.
- `staging/0.2.0/source-observations.csv`: superseded staging snapshot retained for audit.
- `staging/0.2.1/source-observations.csv`: corrected current staging snapshot.
- `methodology/qa-policy.md`: evidence grading, review gates, and calculation policy.
- `methodology/qa-rules.csv`: machine-readable QA rule registry.
- `methodology/matching-rubric.csv`: source-food matching classes and promotion limits.
- `research/research-log-v0.2.csv`: research findings and engineering decisions.
- `scripts/validate-staging.mjs`: dependency-free staging and release-gate validator.
- `sources/source-registry.csv`: source, access, licence, priority, and allowed-use registry.

## Validation

Run from the repository root:

```bash
node mobile/data/ifkb/scripts/validate-staging.mjs
```

The current `0.2.1` staging audit returns 91 ingredients, 6 staging rows, 4 quarantined rows, and zero critical validation issues. Strict release mode is intentionally expected to fail until every staged record is promoted to `verified`:

```bash
node mobile/data/ifkb/scripts/validate-staging.mjs mobile/data/ifkb --release
```

## Evidence grades

- `A`: Iranian laboratory analysis with documented sampling and analytical method.
- `B`: authoritative direct value from a licensed national/international food-composition database with an exact food match.
- `C`: reproducible recipe calculation using verified ingredients, yield, and nutrient-retention factors.
- `D`: manufacturer label or constrained secondary source suitable only for its declared product/serving.
- `E`: estimate, weak match, legacy value, or insufficiently documented value.

Evidence grade is separate from food-match quality. For example, an exact international database match may have match quality `A` but evidence grade `B`.

## Release gate

A record cannot be marked `verified` until identity, preparation state, basis, portion weight, source/licence, nutrient definitions, calculation method, automated QA, and independent review are complete. Quarantined records are structurally prevented from entering the mobile projection.
