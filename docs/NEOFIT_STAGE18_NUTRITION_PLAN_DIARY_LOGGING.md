# NeoFit Stage 18 — Nutrition Plan Meal → Diary Logging

Status: code/schema/CI complete; Preview-only; stacked on Stage 17. Hosted E2E remains open.

## Goal

Turn a resolved authenticated Nutrition Plan meal into real diary entries without trusting Browser nutrition payloads, bypassing the Shared Nutrition Core, or producing duplicate rows on repeat clicks/retries.

The UI action remains intentionally small: `ثبت برای امروز`.

## Trust boundary

The Browser sends only:

- `plan_id`
- `plan_version`
- `meal_id`
- Browser-local `local_date`

The Browser never sends trusted food definitions, calories/macros, Core estimates, plan JSON, or user id.

The Server Action creates the ordinary Supabase server client and requires `activeAuthSession()` before any diary write.

## Server-side revalidation

`persistActiveNutritionPlanMeal()` re-reads the exact active plan under the authenticated user context:

```text
plan id + user id + version + status=active
```

Then it:

1. parses the stored plan document again;
2. resolves every food id against the current catalog;
3. requires exact `sourceVersion` match;
4. locates the globally unique `meal_id`;
5. resolves each item to the catalog food record;
6. calls the existing `createWebDiaryEntry()` adapter for each item;
7. therefore derives nutrition through `@neofit/nutrition-core`;
8. serializes the Core `NutritionEstimate` across an explicit JSON boundary before Postgres persistence;
9. stores `NUTRITION_CORE_SCHEMA_VERSION` with the estimate.

No fallback estimate is invented when any check fails.

## Global meal identity

Stage 17 guaranteed meal-id uniqueness only within each day. Stage 18 strengthens the parser so meal ids are unique across the entire plan. This keeps `nutrition_plan_meal_id` unambiguous across diary provenance.

## One plan meal → ordinary diary entries

A meal can contain several catalog foods. Stage 18 deliberately reuses `nutrition_entries` instead of inventing a second meal-entry model.

One planned meal becomes one normal diary row per planned food item. Rows share plan id/version/meal id, local date and meal type, while each item keeps its own Core-derived estimate/source identity.

## Deterministic idempotency

Each planned item gets a deterministic SHA-256-derived `client_mutation_id` from:

```text
user id
plan id
plan version
meal id
local date
item index
food id
food source version
portion count
```

The stored form is `plan:<sha256>`.

All rows for the meal are sent in one bulk upsert:

```text
onConflict = user_id,client_mutation_id
ignoreDuplicates = true
```

Therefore duplicate click/retry is idempotent, no duplicate pre-read is needed, and the write is one PostgREST request instead of one request per food item. The UI also disables the submit control while pending; database idempotency is the real boundary.

## Local date

`ثبت برای امروز` uses Browser calendar time through `localDateKey(new Date())`, implemented from `getFullYear/getMonth/getDate` so the write never inherits Vercel server timezone.

Server code validates strict real-calendar `YYYY-MM-DD` before writing.

Account server reads still use the persisted profile timezone through `formatLocalDate()`; these are intentionally separate contracts.

## Provenance integrity

Stage 18 found the Stage 17 simple plan-id FK insufficient. The live database now enforces:

```text
(nutrition_plan_id, user_id, nutrition_plan_version)
  -> nutrition_plans(id, user_id, version)
```

Provenance shape is exact:

- either plan id/version/meal id are all NULL;
- or plan id is present, version is positive, and meal id is non-empty and bounded.

A row cannot claim another user's plan, a different version, or orphan version/meal metadata.

## Provenance FK performance

Supabase Performance Advisor then identified the new composite FK as uncovered. Stage 18 added a covering partial index:

```text
(nutrition_plan_id, user_id, nutrition_plan_version)
WHERE nutrition_plan_id IS NOT NULL
```

The old plan-id-only index was removed as redundant. The uncovered-FK Advisor finding is now gone. Remaining unused-index notices are expected before real traffic proves usage.

## Live migrations

- `20260809142519_harden_nutrition_entry_plan_provenance`
- `20260809143354_tighten_nutrition_entry_plan_provenance_shape`
- `20260809145439_cover_nutrition_plan_provenance_fk`

Repository replay files preserve the same contracts.

## DB QA

Transaction/rollback QA proved:

- correct owner/id/version provenance succeeds;
- wrong-version provenance is rejected;
- plan-id NULL with orphan version/meal metadata is rejected;
- all temporary QA rows are removed by rollback.

## Request cost

Healthy click:

- one live Auth validation;
- one exact active-plan SELECT;
- in-process catalog/Core work;
- one bulk diary upsert.

There is no AI call, duplicate-check SELECT, request per food item, service-role hop, Edge Function hop, or background queue.

## UI behavior

Account plan meals expose `ثبت برای امروز`; Guest demo never does.

Success explicitly explains idempotency. Failure copy distinguishes invalid date, missing/stale plan, invalid catalog/version, missing meal and write failure without exposing raw database errors.

## Privilege boundary

The logging path uses the ordinary authenticated Supabase session + RLS. It adds no service-role key, secret admin key, admin client or privileged Edge Function, and user id is never accepted from the form.

## Final validation

Current green implementation head before this documentation sync: `bf89c78c09638d7b919be1aab2b4cfec07b3f034`.

- Nutrition Plan Diary Logging CI run `31319808827`: success
- Nutrition Plan Provenance Integrity CI run `31319808832`: success
- plan logging contracts: success
- Nutrition Core adapter regression: success
- Nutrition persistence regression: success
- complete Supabase app regression: success
- TypeScript: success
- Next production build: success
- Core/provenance/idempotency boundary gate: success
- Supabase Security Advisor: no Stage 18 finding; plan-gated leaked-password protection is the remaining unrelated warning
- Supabase Performance Advisor: composite provenance FK is covered

Earlier CI failures were treated as useful gates and fixed: missing final UI wiring, globally ambiguous meal ids, an over-broad duplicate-read test, stale migration-count assumptions, guessed adapter signatures and the Core-to-Postgres JSON typing boundary.

## Hosted proof required

On the next single deployment to the existing Preview Lab:

1. activate a deliberate versioned Nutrition Plan;
2. click `ثبت برای امروز`;
3. verify one diary row per planned item;
4. verify each estimate matches Shared Nutrition Core output;
5. verify exact plan id/version/meal id provenance;
6. click again and prove row count does not increase;
7. refresh `/today` and `/nutrition` and prove the meal contributes exactly once.

## Release rule

Preview only. This is deterministic user-initiated logging, not autonomous Coach mutation. Stage 18 does not authorize Production promotion or write-agent plan changes.
