# IFKB P0 App Dataset Candidate v0.14

- 60 P0 foods
- 180 portion presets
- 200 food-specific questions
- 58 licensed local image thumbnails

The distributable bundle contains JSON, minified JSON, CSV, SQLite, TypeScript, Excel and local app thumbnails.

Evidence tiers:
- `DS2`: multi-source recipe consensus with a prior nutrition centre and broad range.
- `DS1_LEGACY`: previous NeoFit starter estimate with broad uncertainty.
- `DS0_FALLBACK`: broad category/analogue fallback for app continuity.

Recommended UI flow: photo → optional typed name → top candidates → food-specific questions → small/medium/large → p10/p50/p90 output.

This candidate is not intended for clinical or food-labelling use. Final v1.0 will freeze IDs/schema after cross-format QA.
