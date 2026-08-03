# NeoFit Nutrition — Stage 3 of 10

## Status

Stage 3 creates the first complete app-ready Iranian-food dataset release.

## Outputs

- 261 canonical Iranian foods.
- JSON and CSV formats.
- Persian and English names and aliases.
- A usable serving weight for every row.
- Central calories/macros plus explicit low/high ranges.
- Central per-100g values for gram-based scaling.
- Confidence, evidence tier, source label and user-confirmation flag.
- Simple image status: licensed reference available or application placeholder.

## Serving-weight policy

Existing declared serving weights are preserved. Missing weights receive a
deterministic category-default estimate so the application remains usable.
These rows are explicitly labelled `category_default_estimate`; they are not
presented as measured or authoritative portions.

## Evidence tiers

- `broad_fallback`: broad category estimate, 178 rows.
- `curated_estimate`: existing NeoFit curated serving estimate, 80 rows.
- `multi_source_identity_with_curated_nutrition`: three foods with multi-source
  recipe identity evidence while the current nutrition centre remains curated.

## Image policy

Images no longer block nutrition readiness. The dataset records whether a
licensed reference exists. Foods without one use a standard application
placeholder until a suitable image is added.

## Safety boundary

- No missing nutrition value is silently converted to zero.
- No provider or LLM calories/macros are accepted.
- Low-confidence or estimated-serving rows require user confirmation.
- This dataset is intended for food logging and coaching, not laboratory,
  clinical, or food-labelling use.

## Next stage

Stage 4 improves the 178 broad fallbacks in bulk using category- and
ingredient-aware estimates, prioritising large calorie/macronutrient errors
rather than researching every food individually.
