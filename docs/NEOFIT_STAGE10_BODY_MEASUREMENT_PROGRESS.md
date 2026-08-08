# NeoFit Stage 10 — Real Body Measurement Progress

Status: implementation / Draft QA

## Goal

Remove synthetic personal progress data and make the Progress screen an honest view of user-owned measurements.

## Data contract

`public.body_measurements` stores one measurement event per row:

- `user_id`
- `client_mutation_id`
- `local_date`
- `measured_at`
- optional `weight_kg`
- optional `waist_cm`
- optional `body_fat_percent`
- optional note

At least one real measurement value is required. No row is seeded from a fixture or invented for visualization.

## Security

- own-row RLS on select/insert/update/delete
- explicit authenticated grants
- no anonymous table access
- `(user_id, client_mutation_id)` idempotency boundary
- `(user_id, measured_at desc)` trend index
- account queries explicitly filter by `user_id` in addition to RLS

## Request policy

The feature is page-scoped:

- opening other NeoFit routes causes no body-measurement request;
- opening Progress in account mode makes one bounded measurement read (latest 180 rows maximum);
- saving makes one insert;
- deleting makes one delete;
- no polling, subscription, heartbeat or background sync.

Guest mode performs no Supabase request and uses versioned localStorage.

## UI behavior

Progress now shows:

- latest real weight
- latest real waist measurement
- latest real body-fat percentage
- real first-to-last weight change over the displayed measurements
- up to eight recent weight bars
- measurement entry form
- last six measurement events with delete
- real Nutrition diary count/calories from existing Nutrition Core state

If no measurement exists, the chart renders an explicit empty state. NeoFit does not synthesize a weight trend.

## Migration

Live Supabase migration:

`20260808141651_body_measurement_progress`

The migration was transaction/rollback tested before application.

## Runtime QA

1. account page loads with zero synthetic weights;
2. first weight inserts one row and appears immediately;
3. refresh restores the row from Supabase;
4. second weight produces a real change/trend;
5. delete removes the row;
6. guest mode stores only in the browser;
7. account and guest data never mix;
8. RLS blocks other-user access;
9. no Progress runtime errors;
10. Coach progress context is intentionally a later slice after this source of truth exists.

No Production promotion in Stage 10.
