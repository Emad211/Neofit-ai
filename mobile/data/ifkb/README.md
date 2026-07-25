# Iranian Food Knowledge Base (IFKB)

IFKB is the scientific master-data project behind NeoFit's Iranian food catalog.

## Foundation release: 0.1.0

This release creates the normalized, auditable structure and migrates the existing 83 NeoFit starter estimates into a quarantine-grade legacy layer.

**Important:** none of the 83 legacy records is scientifically verified. They are evidence grade `E`, review status `unverified`, and must not be used for clinical, regulatory, research, or food-labelling claims.

## Design principles

- Preserve every source observation instead of silently averaging values.
- Distinguish missing, zero, trace, below-detection, estimated, calculated, and analytical values.
- Keep food identity, multilingual names, portions, nutrient observations, recipes, ingredients, sources, mappings, and QA issues in separate normalized tables.
- Use per-100 g edible portion as the canonical comparison basis.
- Retain per-serving values only when a measured or defensible gram weight exists.
- Calculate mixed dishes using ingredient weights, edible portions, cooked yield, and nutrient-retention factors.
- Store source, licence, derivation method, evidence grade, confidence score, and review state for every releasable value.
- Treat the current `neofit-food-catalog` v1 JSON as a lossy mobile projection, not the scientific master.

## Directory layout

- `schema/ifkb.schema.json`: canonical entity contracts.
- `releases/0.1.0/manifest.json`: immutable release metadata.
- `methodology/qa-policy.md`: evidence grading, review gates, and calculation policy.

## Evidence grades

- `A`: Iranian laboratory analysis with documented sampling and analytical method.
- `B`: authoritative direct value from a licensed national/international food-composition database with an exact food match.
- `C`: reproducible recipe calculation using verified ingredients, yield, and nutrient-retention factors.
- `D`: manufacturer label or constrained secondary source suitable only for its declared product/serving.
- `E`: estimate, weak match, legacy value, or insufficiently documented value.

## Release gate

A record cannot be marked `verified` until identity, preparation state, basis, portion weight, source/licence, nutrient definitions, calculation method, and QA checks are complete.
