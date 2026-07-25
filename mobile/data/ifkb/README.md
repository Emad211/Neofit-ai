# Iranian Food Knowledge Base (IFKB)

IFKB is the scientific master-data project behind NeoFit's Iranian food catalog.

## Foundation release: 0.1.0

This release creates the normalized, auditable structure and migrates the existing 83 NeoFit starter estimates into a quarantine-grade legacy layer.

**Important:** none of the 83 legacy records is scientifically verified. They are evidence grade `E`, review status `unverified`, and must not be used for clinical, regulatory, research, or food-labelling claims.

## Ingredient reference release: 0.2.0

Release `0.2.0` adds the first engineered ingredient layer:

- 91 canonical ingredients used in common Iranian recipes
- 64 priority-P0 ingredients
- explicit raw/cooked, drained/undrained and product-state separation
- match quality classes `A`, `B`, `C`, `D`, and `U`
- 20 automated/manual QA rules
- six traceable staging observations used to test the pipeline
- three deliberately quarantined observations that demonstrate unit, identity, salt-state, or plausibility failures
- pinned authoritative USDA target: Foundation Foods April 2026

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
- `releases/0.2.0/manifest.json`: immutable ingredient-layer research release.
- `reference/ingredient-catalog-core.csv`: canonical ingredient ontology.
- `staging/0.2.0/source-observations.csv`: unpromoted source observations and quarantine examples.
- `methodology/qa-policy.md`: evidence grading, review gates, and calculation policy.
- `methodology/qa-rules.csv`: machine-readable QA rule registry.
- `methodology/matching-rubric.csv`: source-food matching classes and promotion limits.
- `research/research-log-v0.2.csv`: research findings and engineering decisions.
- `sources/source-registry.csv`: source, access, licence, priority, and allowed-use registry.

## Evidence grades

- `A`: Iranian laboratory analysis with documented sampling and analytical method.
- `B`: authoritative direct value from a licensed national/international food-composition database with an exact food match.
- `C`: reproducible recipe calculation using verified ingredients, yield, and nutrient-retention factors.
- `D`: manufacturer label or constrained secondary source suitable only for its declared product/serving.
- `E`: estimate, weak match, legacy value, or insufficiently documented value.

Evidence grade is separate from food-match quality. For example, an exact international database match may have match quality `A` but evidence grade `B`.

## Release gate

A record cannot be marked `verified` until identity, preparation state, basis, portion weight, source/licence, nutrient definitions, calculation method, automated QA, and independent review are complete. Quarantined records are structurally prevented from entering the mobile projection.
