# IFKB USDA Foundation Foods Ingestion v0.5

This pipeline has been executed against the official archive:

- File: `FoodData_Central_foundation_food_csv_2026-04-30.zip`
- SHA-256: `d6d4f41dcd19a46abcdd67775379cb6f0292ff08daa7e0680fdd0982830bf57b`
- Release: `2026-04-30`
- Source: USDA FoodData Central Foundation Foods
- Licence: CC0 / United States public domain

## Actual schema adaptations

The April 2026 Foundation archive differs from the generic field-description workbook in several important ways:

- Foundation identity is determined using `foundation_food.csv` and `food.data_type=foundation_food`.
- `food.csv` also includes acquisition, sample and sub-sample records with repeated descriptions.
- `food_nutrient_derivation.csv` and `food_nutrient_source.csv` are not included; numeric `derivation_id` values are retained unresolved.
- `food_nutrient.csv` does not contain `standard_error` or `loq`.
- `input_food.csv` uses `fdc_of_input_food`.
- `food_component.csv` uses the misspelled field `min_year_acqured`.
- nutrient ID `2066` occurs only in blank observations and is absent from `nutrient.csv`; it remains explicitly unresolved.

## Official run result

- Exact Foundation matches: 34 / 34
- Selected Foundation foods: 34
- Aggregate nutrient observations: 1,071
- Source/sample links: 253
- Sub-sample laboratory results: 6,766
- Food attributes: 528
- Conversion-factor records: 60
- Automated critical QA issues: 0
- Source-complete mobile candidates: 27
- Scientifically verified records: 0

All selected records remain `in_review`. Automated QA is not independent scientific review.

## Key scientific rules

- Source amounts are preserved exactly.
- Missing values are never replaced by zero.
- Small negative carbohydrate-by-difference residuals are preserved; a zero-normalized value is used only for QA/projection calculations.
- Duplicate canonical nutrients are not silently averaged.
- Specific and general Atwater energies remain distinct.
- Foods with incomplete macros/energy are blocked from the mobile projection.
- No record becomes verified without independent review.
