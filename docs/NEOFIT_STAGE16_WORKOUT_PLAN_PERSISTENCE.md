# NeoFit Stage 16 — Workout Plan Persistence

Status: implementation / Preview-only; stacked on Stage 15.

## Goal

Replace the authenticated account's fixture-backed workout plan with a real, versioned, user-owned plan source while preserving the existing Guest demo and Workout Player behavior.

The core truth rule is:

- Guest may use an explicitly labeled demo fixture.
- An authenticated account never treats that fixture as the user's prescribed plan.
- If an account has no active plan, NeoFit shows an explicit empty state.

## Live database source

Table: `public.workout_plans`

Each row is one immutable-content plan version:

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

Constraints enforce:

- positive versions;
- one `(user_id, version)` pair;
- at most one active plan per user;
- plan must be a JSON object with a `days` array;
- 1–14 days per persisted plan.

Detailed exercise/day validation stays in the versioned application parser so malformed account data fails closed rather than partially rendering.

## Immutable content / append-only versions

Authenticated users can read their own rows under RLS.

Plan content/title/version are not granted authenticated UPDATE permission. Only lifecycle fields can change:

- `status`
- `activated_at`
- `archived_at`

Changing a plan definition therefore means creating a new version instead of mutating historical plan JSON in place.

Authenticated DELETE is not granted. Archived versions remain available as history/provenance until account deletion cascades them.

## Plan write RPCs

Both functions are `SECURITY INVOKER`, use `auth.uid()`, RLS and caller privileges:

- `create_workout_plan_version(...)`
- `activate_workout_plan(plan_id)`

Creation uses a per-user advisory transaction lock to allocate the next version atomically. Optional activation archives the previous active version in the same transaction.

## Active-session guard

A plan cannot be activated while the user has an active `workout_sessions` row.

This prevents a Player opened from one immutable plan version from being silently reconstructed against a different active plan midway through the session.

To change the active plan, the user must first finish or cancel the current workout session.

## Workout session provenance

`workout_sessions` now stores:

- `workout_plan_id`
- `workout_plan_version`

When an authenticated account starts a Player session, both values are required from the active plan view and are persisted with the session.

On resume, NeoFit checks that the active session belongs to the same plan id/version. A mismatch fails closed instead of mixing definitions.

Guest sessions remain local and have no Supabase plan provenance.

## Persisted document schema

Database JSON uses stable, locale-neutral values:

```json
{
  "days": [
    {
      "id": "day-1",
      "day": "شنبه",
      "title": "قدرت A",
      "focus": "حرکات اصلی",
      "durationMinutes": 55,
      "exercises": [
        {
          "id": "squat",
          "name": "اسکوات",
          "sets": 3,
          "targetReps": "۵–۸",
          "restSeconds": 120
        }
      ]
    }
  ]
}
```

Numbers such as duration and rest are numeric in storage. Persian strings such as `۱۲۰ ثانیه` are presentation-only adapter output.

Current parser bounds:

- up to 14 days;
- up to 30 exercises/day;
- up to 20 sets/exercise;
- rest 15–600 seconds;
- duration 5–360 minutes;
- unique day ids.

## UI data truth

Routes now resolve through one `loadWorkoutPlanSnapshot()` source:

- `/workout`
- `/workout/[id]`
- `/workout-player/[id]`

They no longer import the workout fixture directly.

For Account:

- active persisted plan -> normal workout UI;
- no active plan -> explicit empty state;
- invalid/unavailable account plan -> fail closed / unavailable state.

For Guest:

- the existing three-day fixture is retained but clearly labeled `برنامه نمونه مهمان`.

The authenticated Workout UI no longer displays the synthetic fixture calorie-burn estimate. Duration, exercise count and set count are shown instead.

## Request budget

The Player route reuses the account identity already loaded for the active plan snapshot. It does not perform the previous separate workout identity read.

Account `/workout` performs the identity read plus one bounded active-plan query. Detail and Player use the same snapshot contract.

## Live migrations

- `20260809133914_workout_plan_versioning`
- `20260809133953_index_workout_session_plan_fk`
- `20260809134603_guard_workout_plan_activation_during_session`

Supabase Security Advisor reports no Stage 16 issue. Performance Advisor initially identified the new session-plan FK as uncovered; the second migration added a dedicated `workout_plan_id` index and removed that warning.

Unused-index INFO notices on empty/near-empty tables are not treated as removal candidates before real traffic proves their query patterns.

## Deliberately not faked

Stage 16 does **not** automatically insert the Guest fixture into a real account.

It also does not claim that Onboarding or Coach already generates a scientific personalized workout plan. Those are separate future write/proposal flows and must create validated new versions through the plan contract.

No synthetic plan row is inserted by migration or by assistant QA.

## Runtime proof required

After the latest stack can deploy to the existing Preview Lab:

1. a real account with no plan must show the empty state;
2. a deliberately created test plan version must become active under that account;
3. `/workout` and detail must reflect exactly that persisted plan;
4. Player start must store `workout_plan_id/version`;
5. refresh must resume the same version;
6. activating another version during an active session must be rejected;
7. after completing/cancelling the session, activating the next plan version must succeed.

## Release rule

Preview only. Stage 16 fixes the source-of-truth boundary but does not by itself authorize Coach write tools or Production promotion.
