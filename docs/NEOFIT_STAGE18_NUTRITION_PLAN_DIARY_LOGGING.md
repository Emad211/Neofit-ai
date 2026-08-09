# NeoFit Stage 18 — Nutrition Plan Meal → Diary Logging

Status: implementation / Preview-only; stacked on Stage 17.

## Goal

Turn a resolved account Nutrition Plan meal into real diary entries without trusting Browser nutrition payloads, without bypassing the Shared Nutrition Core and without producing duplicate rows on repeat clicks/retries.

The UI action is intentionally small: `ثبت برای امروز`.

## Trust boundary

The Browser sends only:

- `plan_id`
- `plan_version`
- `meal_id`
- Browser-local `local_date`

The Browser does **not** submit:

- food definitions;
- calories/macros;
- Core estimates;
- plan JSON;
- user id.

The Server Action creates the Supabase server client and requires `activeAuthSession()` before any diary write.

## Server-side revalidation

`persistActiveNutritionPlanMeal()` re-reads the exact active plan under the authenticated user context:

```text
plan id + user id + version + status=active
```

It then:

1. parses the stored plan document again;
2. resolves every food id against the current catalog;
3. requires exact `sourceVersion` match;
4. locates the globally unique `meal_id`;
5. resolves each item to the catalog food record;
6. calls `createWebDiaryEntry()` for each item;
7. stores `NUTRITION_CORE_SCHEMA_VERSION` and the Core-produced `estimate`.

If any of those checks fail, no replacement estimate is invented.

## Global meal identity

Stage 17 originally guaranteed unique meal ids only within each day. Stage 18 strengthens the plan parser: meal ids must be unique across the **entire plan**.

This makes `nutrition_plan_meal_id` unambiguous for diary provenance.

## One plan meal → ordinary diary entries

A meal can contain several catalog foods. Stage 18 deliberately reuses the existing `nutrition_entries` model rather than inventing another meal-entry table.

One planned meal therefore becomes one normal diary row per planned food item. Every row shares:

- plan id;
- plan version;
- plan meal id;
- local date;
- meal type.

This keeps the current diary summarization and Nutrition Core contracts intact.

## Deterministic idempotency

Each item gets a deterministic SHA-256-derived `client_mutation_id` from:

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

The value is stored as `plan:<sha256>`.

All rows for the meal are sent in **one bulk upsert** with:

```text
onConflict = user_id,client_mutation_id
ignoreDuplicates = true
```

Consequences:

- double click does not duplicate diary rows;
- retry after a network ambiguity does not duplicate rows;
- no duplicate pre-read query is required;
- the meal write is one PostgREST write request, not N item requests.

The UI also disables the submit button while the Server Action is pending. Database idempotency remains the real safety boundary.

## Local date

The action is called `ثبت برای امروز`, so the date is generated in the Browser using `localDateKey(new Date())` rather than the Vercel server timezone.

The server validates strict `YYYY-MM-DD` calendar shape before use.

A malicious user can alter their own date field, but cannot inject another user id, plan payload or nutrition estimate. Historical/future diary editing remains a product-policy concern rather than an authorization boundary.

## Provenance integrity hardening

Stage 17 initially added a simple foreign key from `nutrition_entries.nutrition_plan_id` to `nutrition_plans.id`.

Stage 18 found that insufficient as a relational integrity contract: plan ownership/version were not part of the FK itself.

The hardening migration replaces it with:

```text
(nutrition_plan_id, user_id, nutrition_plan_version)
  -> nutrition_plans(id, user_id, version)
```

It also requires, whenever `nutrition_plan_id` is present:

- positive plan version;
- non-empty plan meal id (1–160 chars).

This means a diary row cannot claim provenance from a different user or a different plan version even if a plan UUID were known.

## DB QA

A transaction/rollback QA under an authenticated user context:

1. created a temporary active Nutrition Plan;
2. inserted a matching provenance diary row;
3. forced deferred constraints immediate;
4. attempted a wrong-version provenance row and required a foreign-key violation;
5. rolled everything back.

No QA diary or plan rows remain.

## Request budget

Healthy account click:

- existing Server Action / live Auth validation;
- one active-plan SELECT;
- in-process catalog/Core resolution;
- one bulk `nutrition_entries` upsert.

There is:

- no duplicate-check SELECT;
- no AI call;
- no request per food item;
- no service-role hop;
- no background sync queue.

## UI behavior

Account plan meals expose `ثبت برای امروز`.

Guest demo does not expose plan logging because its labels are not a versioned authenticated Nutrition Plan.

Success copy is explicit about idempotency. Failures distinguish invalid date, missing/stale plan, invalid catalog/version resolution, missing meal and write failure without surfacing raw database errors.

## Privilege boundary

The logging path uses the ordinary authenticated Supabase session and RLS. It does not add:

- `service_role`;
- `sb_secret_*`;
- an admin client;
- a privileged Edge Function.

The Server Action never accepts a user id from the form.

## Validation contract

`Nutrition Plan Diary Logging CI` runs:

- Stage 18 logging contracts;
- Nutrition Core adapter regression;
- Nutrition persistence regression;
- complete Supabase app regression;
- TypeScript;
- Next production build;
- Core/provenance/idempotency boundary checks.

The gate rejects:

- estimate/macro/food payload trust in the Server Action;
- loss of live Auth validation;
- loss of composite owner/version FK;
- loss of deterministic idempotency;
- multiple `nutrition_entries` requests per meal;
- loss of Shared Nutrition Core adapter use;
- privileged Supabase keys in the path.

## Hosted proof required

After the latest stacked branch can deploy to the existing Preview Lab:

1. activate a deliberate versioned Nutrition Plan;
2. click `ثبت برای امروز` on one meal;
3. verify one diary row per planned item;
4. verify every estimate matches Shared Nutrition Core output;
5. verify plan id/version/meal id provenance;
6. click again and prove row count does not increase;
7. refresh `/today` and `/nutrition` and prove the logged meal contributes exactly once.

## Release rule

Preview only. This write path is deterministic user-initiated logging, not an autonomous Coach mutation. No Production promotion or write-agent expansion is authorized by Stage 18 alone.
