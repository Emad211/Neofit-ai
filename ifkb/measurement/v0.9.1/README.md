# IFKB v0.9.1 — Measurement-Ready Kit

This release turns the P0 recipe-grounding layer into an executable measurement campaign.

## Included

- 35 household-measure concepts
- 30 vessel-calibration slots
- 120 food-specific measure-calibration slots
- 120 recipe-batch slots
- 103 ingredient-measurement slots for 12 pilot foods
- 144 yield/retention-factor rows
- 60 P0 measurement-campaign records
- 180 image-to-recipe linkage slots
- 20 measurement QA rules
- standard-library validator with 4 passing tests

## Scientific state

No measured recipe value, verified household gram weight, locked recipe version or gold image record is included. Empty templates are not evidence.

## Execution order

1. Calibrate scales and local vessels.
2. Weigh ingredients as purchased, refuse and edible raw mass.
3. Record oil input/recovery and final cooked edible yield.
4. Weigh servings and components separately.
5. Repeat batches across cooks and kitchens.
6. Link gold images to measured batches and locked recipe versions.
7. Keep missing values blank and cite retention-factor sources.

Official methodological references:
- https://www.fao.org/infoods/infoods/recipes/en/
- https://fdc.nal.usda.gov/Foundation_Foods_Documentation/
- https://fdc.nal.usda.gov/data-documentation/
