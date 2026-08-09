# NeoFit Stage 17 — Nutrition Plan Persistence

Status: code + live schema + CI complete / hosted runtime proof open / Preview-only; stacked on Stage 16.

## Goal

Replace the authenticated account's fixture-backed weekly Nutrition Plan with a real versioned source while preserving the Guest demo and the Shared Nutrition Core authority.

Core truth rules:

- Guest may see an explicitly labeled weekly demo.
- Account never receives that fixture as a personal plan.
- Account with no active plan sees an explicit empty state.
- Nutrition Plan stores food identity/version + portion count, not authoritative calories/macros.
- Any future logging/calculation from a plan must resolve catalog identity and use `@neofit/nutrition-core`.

## Live database source

Table: `public.nutrition_plans`

Each row is one immutable-content version:

- `id`
- `user_id`
- `version`
- `schema_version`
- `status = draft | active | archived`
- `source = manual | coach | onboarding | imported`
- `title`
- `plan` JSONB document
- activation/archive timestamps
- created timestamp

Database constraints enforce positive versions, unique `(user_id, version)`, one active plan per user, a JSON object with a `days` array and 1–14 days.

Detailed document validation stays in the application parser.

## Immutable versioning / RLS

Own-row RLS is enabled.

Authenticated users can SELECT their own plan rows. Plan definition fields are not granted UPDATE permission; only lifecycle fields can change:

- `status`
- `activated_at`
- `archived_at`

There is no authenticated DELETE grant. A definition change creates a new version instead of rewriting history.

Write RPCs are `SECURITY INVOKER`:

- `create_nutrition_plan_version(...)`
- `activate_nutrition_plan(plan_id)`

Version allocation/activation uses a per-user transaction advisory lock.

## Persisted document contract

A versioned account plan uses only identity/version/portion data:

```json
{
  "days": [
    {
      "id": "day-1",
      "day": "شنبه",
      "title": "روز اول",
      "meals": [
        {
          "id": "breakfast-1",
          "mealType": "breakfast",
          "label": "صبحانه",
          "items": [
            {
              "foodId": "boiled-egg",
              "sourceVersion": "web-stage1-fixtures-v1",
              "portionCount": 2
            }
          ]
        }
      ]
    }
  ]
}
```

The application rejects plan objects containing nutrition-claim fields such as:

- `calories`
- `macros`
- `energyKcal`
- `proteinG`
- `carbsG`
- `fatG`
- `nutrition`
- `estimate`

The same rejection applies at plan/day/meal/item levels.

This means even if a caller inserts extra macro/calorie values into its own JSON, NeoFit refuses to treat that plan as valid account data.

## Catalog reproducibility

Every account plan item stores:

- stable `foodId`
- exact `sourceVersion`
- `portionCount`

On load, NeoFit resolves the id against the current catalog and requires the source version to match exactly. A missing food or version mismatch fails closed rather than silently using a different nutritional record.

The current Web catalog remains intentionally small and fixture-backed; Stage 17 does not hide that broader catalog coverage is still a separate gap.

## Nutrition Core boundary

Stage 17 does not read calorie or macro totals from plan JSON and does not add a new nutrition formula.

Plan UI currently presents:

- day/meal labels;
- resolved food identity;
- resolved portion label;
- portion count;
- catalog-version status.

When meal logging from plan is added, `nutrition_entries` already has provenance fields and the resulting `estimate` must be computed using the Shared Nutrition Core from resolved catalog items.

## Diary provenance

`nutrition_entries` now has optional:

- `nutrition_plan_id`
- `nutrition_plan_version`
- `nutrition_plan_meal_id`

`nutrition_plan_id` is a foreign key with `ON DELETE SET NULL` and has a dedicated FK index. This prepares exact diary provenance without changing existing diary writes.

Existing entries remain valid with null plan provenance.

## UI data truth

`/nutrition/plan` now calls `loadNutritionPlanSnapshot()`.

Account behavior:

- active valid plan -> render resolved versioned catalog items;
- no active plan -> explicit empty state;
- invalid schema/catalog mismatch/query failure -> fail closed / unavailable state.

Guest behavior:

- current `weeklyPlan` labels remain only as an explicitly marked Demo.

`NutritionPlanScreen` does not import the fixture module or render calorie/macro properties.

## Request architecture

The plan page uses the existing lightweight account identity read plus one active-plan query. Resolution against the current Web catalog happens in-process and adds no database/provider request.

No AI call is made to display the plan.

## Live migration and DB QA

- `20260809140618_nutrition_plan_versioning`

Supabase Security Advisor reports no Stage 17 issue. Performance Advisor reports only unused-index INFO on empty/near-empty tables; no uncovered FK warning was introduced.

A transaction + rollback QA under an authenticated user context created two user-owned Nutrition Plan versions, activated the second version and ended with `persisted_qa_plans = 0`.

## Final code / CI evidence

- branch: `stage17/nutrition-plan-persistence`
- green code head before this documentation update: `fa3d15c149f5f929ec4baf5238bd61d7f0f0c8c3`
- `Nutrition Plan Persistence CI` run `31317881612`: **success**
- Nutrition Plan contract tests: success
- Nutrition Core adapter regression: success
- full Supabase app regression: success
- TypeScript: success
- Next.js production build: success
- Nutrition Plan authority/RLS/data-truth gate: success

## Deliberately not faked

- no account plan is seeded from the Guest weekly fixture;
- no migration creates a personalized meal plan;
- no model-generated calories/macros are accepted;
- no claim is made that the current catalog has production-complete food coverage;
- no plan-meal logging button is exposed until the provenance + Nutrition Core write path is implemented and tested.

## Runtime proof required

After the latest stack can deploy to the existing Preview Lab:

1. account with no Nutrition Plan shows the empty state;
2. a deliberate plan version containing real catalog ids/source versions becomes active;
3. `/nutrition/plan` displays exactly those resolved records;
4. source-version mismatch fails closed;
5. activating a new version archives the previous active version;
6. future logging from a plan meal must store plan id/version/meal id plus a Core-produced `estimate`.

## Release rule

Preview only. Stage 17 fixes the plan source-of-truth boundary but does not authorize autonomous Coach nutrition changes or Production promotion.
