# NeoFit Stage 24 — Structured Program Planners

Status: **shared package purity, planner/materializer contract tests and full local web suite/build green; hosted runtime generation proof open**. Preview-only.

Stage 24 turns a `draft` Program Cycle into two immutable, validated plan versions. It is the first stage where a model contributes to a persisted program, and it is deliberately built so the model only ever *selects* from pre-screened catalog/registry identities — every number, every safety decision and every structural bound is deterministic and owned by NeoFit, not the model.

## Delivered contract

- Two bounded structured planners run per cycle — Training then Nutrition — each a single provider call with a hard output-token ceiling and no hidden classifier inference.
- A planner may only return **identities and portion counts**: exercise ids from the pre-screened safe set, food ids from the eligible catalog, and quarter-step portions. It never returns names, calories, macros or free text that becomes authority.
- Deterministic preflight runs **before** the first provider request, so a known-invalid profile never spends Training Planner budget.
- The model receives only candidates that already passed deterministic safety (`evaluateExerciseSafety` + `safetyProfileFromOnboarding`) and catalog eligibility; blocked movements and review-required profiles never reach it.
- Every planner output is re-validated on return and again at materialization. Malformed, invented, duplicated, out-of-range or truncated output fails closed with a typed error code — never a coerced default.
- Nutrition Core is the sole arithmetic authority: per-item energy and the daily total are computed by `calculateVariantNutrition`/`calculateRecipe`, and an absurd day is rejected against a Core-computed integrity ceiling. No calories or macros are computed in the planner, the materializer, SQL or a model response.
- Both plans are persisted as immutable versions and activated atomically; a stale cycle revision aborts the whole generation rather than overwriting.
- No raw prompt, API key or provider payload is stored; audit rows keep metadata only.

## Deterministic layers

Three modules, smallest trust surface first:

| Module | Boundary | Role |
|---|---|---|
| `web/lib/program-generation/planner-contract.ts` | pure, no imports | Parses and bounds raw planner text into typed selections. |
| `web/lib/program-generation/materializer.ts` | pure Node authority | Screens safe exercises + eligible foods, re-validates selections, computes energy via Core, emits immutable plan documents. |
| `web/lib/program-generation/planners.ts` | `import 'server-only'` | Preflight, prompt assembly, two provider calls with fallback, delegates all validation to the two modules above. |

### Contract parser bounds (`planner-contract.ts`)

Text over 20,000 chars, missing/!object JSON, or a non-object root are rejected (`planner_output_too_large`, `planner_json_missing`, `planner_json_invalid`). Each identity must be a 1–160 char string present in the allowed set (`planner_id_invalid`). Each portion must be a finite number in `[0.25, 3]` (`planner_portion_invalid`) that is an exact multiple of `0.25` (`planner_portion_step_invalid`). Training days/day-size/duplicates and nutrition days/meals/meal-size (1–2 items)/item-shape/duplicates each have their own typed rejection.

### Materializer safety + eligibility (`materializer.ts`)

- `safeExercisesForProgram` throws `clinical_review_required` when the deterministic safety profile has any review reason — including an **unset** cardiovascular answer (`null` is not "no") and a forged prototype-chain injury id (`constructor`), both proven fail-closed. It then filters the registry by available equipment, allowed safety status and difficulty-vs-training-level.
- Free-text equipment is affirmed only by a positive whole-token mention: `«لندماین دارم»` adds the landmine movement, `«بدون لندماین»` does not. Negation tokens are matched as whole tokens, never bare substrings.
- `eligibleFoodsForProgram` fails closed on any allergy (`allergy_review_required`), on age < 18 or any clinical flag/condition/medication (`nutrition_clinical_review_required`), and on any diet outside `balanced`/`vegetarian` (`diet_catalog_unsupported`). Disliked-food exclusion folds Arabic orthography onto Persian (Arabic yeh/kaf → Persian) before matching and requires a ≥2-char needle so it can only ever keep a food, never hide an allergen.
- `DAILY_ENERGY_SANITY_CEILING_KCAL = 8000` is a Core-computed integrity ceiling, **not** a personalized calorie target (inferring one is forbidden). A day resolving above it throws `planner_selection_invalid`; a normal day of the same foods materializes cleanly.

## Database boundary

Migration `20260811170000_program_generation.sql` adds two `security invoker` functions:

- `finalize_program_cycle_generation` inserts the immutable `public.workout_plans` and `public.nutrition_plans` versions and marks the cycle `ready`, all in one transaction;
- `activate_program_cycle_plans` moves a `ready` cycle to `active`.

Both require the expected cycle revision and raise `stale_program_cycle_revision` on mismatch, so a concurrent write can never activate a half-generated or superseded program. Historical plans are never rewritten; each generation creates new versions only.

## Generation flow

```text
draft cycle
  -> claim revision, transition to 'generating'   (before any provider spend)
  -> plannerPreflight(draft)                       deterministic blockers
  -> Training Planner call  -> parseTrainingPlannerOutput
  -> Nutrition Planner call -> parseNutritionPlannerOutput
  -> materializeProgramPlans(draft, selections)    Core-computed re-validation
  -> finalize_program_cycle_generation RPC         two immutable versions, atomically
  -> 'ready' -> explicit activate -> 'active'
```

Any provider failure collapses to `planner_unavailable`; a parse failure is `planner_invalid_output`, or `planner_output_incomplete` when the provider result was truncated. The revision is claimed *before* provider budget is spent, and a stale attempt older than `GENERATION_STALE_MS` can be recovered (`generation_stale_recovered`) rather than dead-ending the cycle.

## Local verification

Use Node 22.13.1 (`.nvmrc`). From repository root:

```bash
npm run check:nutrition-core
npm run check:exercise-registry
npm run typecheck:web
npm run test:program-cycle
npm run test:supabase-app
npm run build:web
```

`test:program-cycle` runs the Stage 22 lifecycle and Stage 24 generation files together (20 tests). `program-generation.test.ts` covers the happy-path materialization, contract rejection of invented identities / out-of-range and off-step portions / oversized meals / mismatched day sizes, allergy and clinical fail-closed, unset-medical and prototype-injury fail-closed, negated free-text equipment, Arabic→Persian disliked-food folding, the Core-computed daily-energy ceiling, the migration's atomic finalize/activate, and the claim-before-spend generation ordering.

## Remaining proof

- Run a real cycle through generation on the hosted Preview project and confirm two immutable versions + activation.
- Force a fallback-eligible Google failure mid-generation and prove AvalAI completes the same two planner calls.
- Attempt activation with a stale cycle revision and prove `stale_program_cycle_revision` aborts it.
- Confirm the deterministic clinical/allergy/diet blockers surface as truthful Persian UI states, not a partial program.
- Capture `/program` generation and activation at 360/390/430px and desktop.

## Next stage

Stage 25 adds explicit review/activation UX over these versions. Stage 26/27 add typed Coach proposal → visible diff → explicit confirmation → new immutable future-scope version. No silent mutation and no unrestricted SQL at any point.
