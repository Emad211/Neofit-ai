# NeoFit Stage 11 — Account / Nutrition Data Truth

Status: implementation / Draft QA

## Goal

Remove fabricated Nutrition targets from real accounts and stop loading the Nutrition diary on every authenticated page.

This stage does not invent a new calorie formula. `@neofit/nutrition-core` remains the arithmetic authority, while target creation is deliberately left unconfigured until NeoFit has a deterministic, evidence-backed personalization contract.

## Problem 1: synthetic account targets

The Guest/demo fixture contains:

- 2200 kcal
- 140 g protein
- 250 g carbohydrate
- 70 g fat

The old first-account bootstrap copied those demo values into `nutrition_goals`. That made a real account look personalized when it was not.

Stage 11 changes the rule:

- Guest mode may use clearly labeled demo targets for UI testing.
- Account mode receives no Nutrition target during identity bootstrap.
- If an account has no valid four-macro target row, Today shows real consumed totals plus `target not configured`.
- Coach reports `goalsConfigured: false` and does not fabricate remaining/target values.
- A future target-creation feature must have its own deterministic source and provenance.

The single known bootstrap-generated fixture row from the 2026-08-08 Auth incident was deleted with a narrow guard: exact fixture payload, exact incident time window, untouched row, and no Nutrition entries for that user.

## Problem 2: global Nutrition over-fetch

Before Stage 11, the `(main)` layout called `loadAccountSnapshot()` on every route. That snapshot loaded:

- verified claims
- profile
- Nutrition goals
- the full Nutrition diary

Therefore Profile, Workout and Progress paid Nutrition read cost even when they did not use the diary.

Stage 11 separates the contracts.

### Shared shell

`loadAccountIdentity()` reads only:

- verified auth claims
- profile display name/timezone

The result is provided through `AccountStateProvider`.

### Today

`loadNutritionSnapshot()` is called only by Today. It reads:

- Nutrition goals
- Nutrition entries for the account's current local date only

The diary query explicitly filters by `user_id` and `local_date`.

### Food search / add-food route

`/nutrition` does not preload the diary or goals. It needs only shared account identity; adding food writes directly to `nutrition_entries`, then navigation returns to Today where the current-day snapshot is read.

### Non-Nutrition routes

AppShell, Profile, Progress and Coach UI use AccountState and do not hydrate the Nutrition diary from the shared layout.

Coach server context remains independently selective: Nutrition rows are queried only when the deterministic local intent router enables the Nutrition domain.

## Request budget

For an authenticated navigation:

- shared main shell: auth claims + profile only;
- Profile / Workout / Progress UI: zero Nutrition diary reads from the shell;
- Today: goals + current-local-date entries in parallel;
- Nutrition catalog: zero diary preload;
- Coach: only domain-specific context queries plus one provider request.

There is no polling, subscription or background diary synchronization added by this stage.

## Nutrition truth contract

`WebDiarySummary` now supports an unconfigured target state:

- `targets = null`
- `remainingCalories = null`
- `calorieProgressPercent = null`
- `targetsConfigured = false`

Consumed calories/macros still come from deterministic Nutrition Core calculations over real diary entries.

When valid persisted goals exist, progress continues to use `calculateGoalProgress()` from `@neofit/nutrition-core`.

## Current known limitation

The weekly Nutrition plan is still fixture-backed. Stage 11 makes that status explicit but does not replace it with a fake persisted plan. A real plan needs a separate versioned plan source plus catalog/Core resolution.

## QA checklist

1. sign in with an account that has no `nutrition_goals` row;
2. Today shows real consumed totals and `target not configured` instead of 2200/140/250/70;
3. Guest Today still renders the explicit demo contract;
4. Profile navigation does not query `nutrition_entries`;
5. Progress navigation does not query `nutrition_entries`;
6. Workout navigation does not query `nutrition_entries`;
7. Today reads only entries matching the user's current local date;
8. adding a food creates one account entry and returns to Today;
9. Today refresh includes the new entry;
10. Coach Nutrition question reports goals unconfigured when no real goals exist;
11. no Production deployment.

## Next

After runtime proof, the next high-value slice is AI request auditing/budgeting plus body-measurement Progress context for Coach. Persisted Nutrition/Workout plan sources come after that source-of-truth and observability layer is stable.
