# Source derivation and non-inference statement

`current-status.v1.json` preserves the v0.13.1 DS2 release facts:

- `IFKB-CANON-00008`: 4 source records, 4 independent groups;
- `IFKB-CANON-00010`: 4 source records, 3 independent groups;
- `IFKB-CANON-00028`: 5 source records, 5 independent groups;
- identity status: `multi_source_consensus`;
- nutrient interval status: `blocked_pending_complete_quantity_and_yield_normalization`;
- portion status: `digital_source_distribution_available`;
- DS3 still requires user grounding.

The fields `retentionFactors` and `edibleFractions` are marked `not_assessed`, not `incomplete`, because the v0.13.1 consensus release does not itself provide a completed assessment of those two recipe-calculation controls. They are nevertheless required by this project's final normalization gate before a profile can become promotion-eligible.

No calorie, macronutrient, serving-weight, cooked-yield or retention-factor value was created by this patch. Existing app-candidate centres based on the NeoFit legacy starter estimate remain classified as `legacy_estimate` and are explicitly blocked from being relabelled as normalized recipe calculations.

## Source-record work queue

The 13-row queue transcribes only the structured `quantity_json`, servings, source URL/domain, independence group and release statuses from sheet `11_DS2_Source_Records`. It does not copy recipe prose. Keys already ending in `_g` are marked mass-anchored; count/cup/tablespoon/teaspoon keys remain unresolved. The source sheet's `normalization_status=normalized` is preserved separately from `fullGramNormalizationStatus=incomplete` so those terms cannot be conflated.
